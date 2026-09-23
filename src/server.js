import "dotenv/config";
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { runTurn, suggestFollowUps } from "./agent.js";
import { listBookingsForAdmin, initBooking } from "./booking/index.js";
import { initDb, usingDatabase } from "./db.js";
import {
  initStore,
  ensureConversation,
  getConversation,
  appendTurn,
  addReviewItem,
  listReviewQueue,
  resolveReviewItem,
  addFeedback,
  listFeedback,
} from "./store.js";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key, or every /api/chat and /api/email/incoming call will fail.\n"
  );
}

const app = express();
app.set("trust proxy", true); // Render sits behind a proxy; needed for req.ip to reflect the real client
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(new URL("../public", import.meta.url).pathname));

const MAX_MESSAGE_LENGTH = 4000;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

// ---- Basic per-IP rate limiting on the chat endpoints ----
// Hand-rolled instead of a dependency: our traffic is small and the need is
// simple (protect Ahmed's own Anthropic API key from a runaway loop or
// abuse, not enforce precise quotas). Fixed window, in-memory — resets on
// redeploy, same as the rest of this prototype's storage.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 40; // chat requests per IP per window
const rateLimitHits = new Map(); // ip -> { count, resetAt }

function chatRateLimit(req, res, next) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  let entry = rateLimitHits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitHits.set(ip, entry);
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
    return res.status(429).json({
      error: "För många meddelanden på kort tid. Vänta en liten stund och försök igen.",
    });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitHits) {
    if (now > entry.resetAt) rateLimitHits.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    storage: usingDatabase() ? "postgres" : "files",
  });
});

// ---- Web chat channel (non-streaming, kept for backward compatibility —
// public/agent.html and any external caller keep working unchanged) ----
app.post("/api/chat", chatRateLimit, async (req, res) => {
  try {
    const { message, conversationId: incomingId, customer, persona } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      return badRequest(res, "message is required");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return badRequest(res, `message must be under ${MAX_MESSAGE_LENGTH} characters`);
    }

    const conversationId = incomingId || nanoid();
    const convo = ensureConversation(conversationId, "chat", customer);

    const { reply, flags, bookingEvents } = await runTurn({
      channel: "chat",
      conversationId,
      history: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      userMessage: message,
      // Optional persona switch so this one deployed service can also answer
      // as Adjustglow itself (the chat widget on adjustglow.com sends
      // persona: "adjustglow"); omitted/unrecognized falls back to the
      // default Livedemo persona, so existing callers are unaffected.
      persona,
      onFlag: (flag) =>
        addReviewItem({ conversationId, channel: "chat", ...flag }),
    });

    appendTurn(conversationId, message, reply);

    res.json({ conversationId, reply, flagged: flags.length > 0, bookings: bookingEvents });
  } catch (err) {
    console.error("POST /api/chat failed:", err);
    res.status(500).json({ error: "Something went wrong generating a reply." });
  }
});

// ---- Web chat channel, streamed (Server-Sent Events) ----
// Same behavior as POST /api/chat, but the reply streams to the client
// token-by-token as it's generated — the single most-cited UX difference
// between a "chatbot" and today's best support-AI products (Fin, Decagon,
// Sierra all stream). Used by the ChatWidget on adjustglow.com; agent.html
// still uses the plain /api/chat above.
//
// Event stream shape:
//   event: open   data: { conversationId }              — sent immediately
//   event: delta  data: { text }                          — one per chunk
//   event: done   data: { conversationId, flagged, suggestions, bookings } — once, at the end
//   event: error  data: { error }                          — only on failure
app.post("/api/chat/stream", chatRateLimit, async (req, res) => {
  const { message, conversationId: incomingId, customer, persona } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return badRequest(res, "message is required");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return badRequest(res, `message must be under ${MAX_MESSAGE_LENGTH} characters`);
  }

  const conversationId = incomingId || nanoid();
  const convo = ensureConversation(conversationId, "chat", customer);

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.write(`event: open\ndata: ${JSON.stringify({ conversationId })}\n\n`);

  // NOTE: intentionally listening on `res` here, not `req`. Node's
  // IncomingMessage ('req') fires 'close' once its body has been fully
  // read — which, with express.json() already having consumed it before
  // this handler even runs, can fire essentially immediately and has
  // nothing to do with whether the client is still connected. `res`
  // ('close') correlates with the actual response/connection lifecycle
  // instead, which is what we actually want to detect here.
  let closed = false;
  res.on("close", () => {
    closed = true;
  });

  try {
    const { reply, flags, bookingEvents } = await runTurn({
      channel: "chat",
      conversationId,
      history: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      userMessage: message,
      persona,
      onFlag: (flag) => addReviewItem({ conversationId, channel: "chat", ...flag }),
      onTextDelta: (delta) => {
        if (closed) return;
        res.write(`event: delta\ndata: ${JSON.stringify({ text: delta })}\n\n`);
      },
    });

    appendTurn(conversationId, message, reply);

    // Best-effort: a short follow-up-question suggestion, generated after
    // the real reply so it never delays it. Any failure here just means no
    // chips are shown — never breaks the reply itself.
    let suggestions = [];
    try {
      suggestions = await suggestFollowUps({ userMessage: message, reply, persona });
    } catch (e) {
      console.error("suggestFollowUps failed (non-fatal):", e);
    }

    if (!closed) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          conversationId,
          flagged: flags.length > 0,
          suggestions,
          bookings: bookingEvents,
        })}\n\n`
      );
      res.end();
    }
  } catch (err) {
    console.error("POST /api/chat/stream failed:", err);
    if (!closed) {
      try {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            error: "Something went wrong generating a reply.",
          })}\n\n`
        );
      } catch (e) {
        console.error("Failed writing SSE error event:", e);
      }
      res.end();
    }
  }
});

// ---- Email channel (simulated intake for now) ----
// Wire this up for real by pointing an inbound-email provider's webhook
// (e.g. Postmark inbound, SendGrid Inbound Parse, Mailgun routes) at this
// endpoint, and using that provider's send API to actually deliver `reply`
// back to `from` — this endpoint only generates the reply text.
app.post("/api/email/incoming", async (req, res) => {
  try {
    const { from, subject, body, conversationId: incomingId } = req.body || {};
    if (typeof from !== "string" || !from.trim()) return badRequest(res, "from is required");
    if (typeof body !== "string" || !body.trim()) return badRequest(res, "body is required");
    if (body.length > MAX_MESSAGE_LENGTH) {
      return badRequest(res, `body must be under ${MAX_MESSAGE_LENGTH} characters`);
    }

    const conversationId = incomingId || nanoid();
    const convo = ensureConversation(conversationId, "email", { email: from });

    const incomingMessage = subject ? `Subject: ${subject}\n\n${body}` : body;

    const { reply, flags } = await runTurn({
      channel: "email",
      conversationId,
      history: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      userMessage: incomingMessage,
      onFlag: (flag) =>
        addReviewItem({ conversationId, channel: "email", ...flag }),
    });

    appendTurn(conversationId, incomingMessage, reply);

    res.json({ conversationId, reply, flagged: flags.length > 0 });
  } catch (err) {
    console.error("POST /api/email/incoming failed:", err);
    res.status(500).json({ error: "Something went wrong generating a reply." });
  }
});

// ---- Conversation lookup (used by the admin page for context) ----
app.get("/api/conversations/:id", (req, res) => {
  const convo = getConversation(req.params.id);
  if (!convo) return res.status(404).json({ error: "Not found" });
  res.json(convo);
});

// ---- Review queue (the "someone checks risky cases" safety net) ----
app.get("/api/review-queue", (_req, res) => {
  res.json(listReviewQueue());
});

app.post("/api/review-queue/:id/resolve", (req, res) => {
  const item = resolveReviewItem(req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// ---- Feedback (thumbs up/down on individual bot replies) ----
app.post("/api/feedback", (req, res) => {
  try {
    const { conversationId, rating, messageIndex, messageText, persona } = req.body || {};
    if (typeof conversationId !== "string" || !conversationId.trim()) {
      return badRequest(res, "conversationId is required");
    }
    if (rating !== "up" && rating !== "down") {
      return badRequest(res, "rating must be 'up' or 'down'");
    }
    const record = addFeedback({
      conversationId,
      rating,
      messageIndex: typeof messageIndex === "number" ? messageIndex : undefined,
      messageText: typeof messageText === "string" ? messageText.slice(0, 500) : undefined,
      persona: typeof persona === "string" ? persona : undefined,
    });
    res.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("POST /api/feedback failed:", err);
    res.status(500).json({ error: "Kunde inte spara feedback." });
  }
});

app.get("/api/feedback", (_req, res) => {
  res.json(listFeedback());
});

// ---- Bookings (admin view) ----
// Names and emails are masked by default, since this endpoint has no login
// (same as the review queue). Set ADMIN_TOKEN on the server and send it as
// the x-admin-token header to see full details.
app.get("/api/bookings", (req, res) => {
  const token = process.env.ADMIN_TOKEN;
  const full = Boolean(token) && req.get("x-admin-token") === token;
  res.json({ full, bookings: listBookingsForAdmin({ full }) });
});

// Connect storage and load saved data before accepting requests.
await initDb();
await initStore();
await initBooking();

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Adjustglow support agent listening on http://localhost:${PORT}`);
  console.log(`  Chat demo:  http://localhost:${PORT}/index.html`);
  console.log(`  Admin/review queue: http://localhost:${PORT}/admin.html`);
});
