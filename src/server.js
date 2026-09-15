import "dotenv/config";
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { runTurn } from "./agent.js";
import {
  ensureConversation,
  getConversation,
  appendTurn,
  addReviewItem,
  listReviewQueue,
  resolveReviewItem,
} from "./store.js";

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    "\n⚠️  ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key, or every /api/chat and /api/email/incoming call will fail.\n"
  );
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(new URL("../public", import.meta.url).pathname));

const MAX_MESSAGE_LENGTH = 4000;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

// ---- Web chat channel ----
app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationId: incomingId, customer } = req.body || {};
    if (typeof message !== "string" || !message.trim()) {
      return badRequest(res, "message is required");
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return badRequest(res, `message must be under ${MAX_MESSAGE_LENGTH} characters`);
    }

    const conversationId = incomingId || nanoid();
    const convo = ensureConversation(conversationId, "chat", customer);

    const { reply, flags } = await runTurn({
      channel: "chat",
      history: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      userMessage: message,
      onFlag: (flag) =>
        addReviewItem({ conversationId, channel: "chat", ...flag }),
    });

    appendTurn(conversationId, message, reply);

    res.json({ conversationId, reply, flagged: flags.length > 0 });
  } catch (err) {
    console.error("POST /api/chat failed:", err);
    res.status(500).json({ error: "Something went wrong generating a reply." });
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

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`Adjustglow support agent listening on http://localhost:${PORT}`);
  console.log(`  Chat demo:  http://localhost:${PORT}/index.html`);
  console.log(`  Admin/review queue: http://localhost:${PORT}/admin.html`);
});
