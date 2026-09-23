import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE_BASE, ADJUSTGLOW_KNOWLEDGE_BASE } from "./knowledgeBase.js";
import {
  bookingConfigFor,
  bookingPromptSection,
  bookingTools,
  executeBookingTool,
  BOOKING_TOOL_NAMES,
} from "./booking/index.js";
import { reviewConfigFor, reviewPromptSection, OFFER_REVIEW_TOOL } from "./reviews.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Some API keys are created at the organization level rather than inside
  // one specific workspace. Those keys work fine, but every request must
  // say which workspace to run under (for usage/billing attribution).
  // If ANTHROPIC_WORKSPACE_ID isn't set, this header is simply omitted,
  // which is correct for a key that's already scoped to a single workspace.
  defaultHeaders: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const BUSINESS_NAME = process.env.BUSINESS_NAME || "the business";
// A booking turn can take several tool rounds (e.g. get_booking ->
// check_availability -> reschedule_booking -> final reply).
const MAX_TOOL_ROUNDS = 6;

// Two personas share this one deployed backend:
//  - "default"    the public Livedemo (Lumen Cycles, or whatever
//                  BUSINESS_NAME/knowledge-base.md is set to) — unchanged
//                  behavior for any caller that doesn't pass a persona.
//  - "adjustglow" Adjustglow's own chat widget on adjustglow.com, answering
//                  about Adjustglow's own services/pricing/FAQ instead.
const PERSONAS = {
  default: { key: "default", businessName: BUSINESS_NAME, knowledgeBase: KNOWLEDGE_BASE },
  adjustglow: { key: "adjustglow", businessName: "Adjustglow", knowledgeBase: ADJUSTGLOW_KNOWLEDGE_BASE },
};

function resolvePersona(personaKey) {
  return PERSONAS[personaKey] || PERSONAS.default;
}

// Booking is switched on per persona in data/booking-config.json. Only the
// Livedemo (Lumen Cycles) has it for now; Adjustglow's own widget doesn't.
function toolsFor(persona) {
  const cfg = bookingConfigFor(persona.key);
  const tools = cfg ? [...TOOLS, ...bookingTools(cfg)] : [...TOOLS];
  if (reviewConfigFor(persona.key)) tools.push(OFFER_REVIEW_TOOL);
  return tools;
}

const TOOLS = [
  {
    name: "flag_for_review",
    description:
      "Log this conversation for a human specialist to look at later. Use it for refund/goodwill requests over 5000 SEK, legal threats or chargebacks, injury or safety reports, abusive language, an issue that's still unresolved after two attempts to help, or anything the knowledge base doesn't clearly cover. Flagging does NOT end the conversation — after calling this, keep responding to the customer normally.",
    input_schema: {
      type: "object",
      properties: {
        severity: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"],
          description: "How urgently a human should look at this.",
        },
        reason: {
          type: "string",
          description: "Short category, e.g. 'refund over threshold', 'safety report', 'abusive language', 'unresolved after retries'.",
        },
        summary: {
          type: "string",
          description: "2-3 sentence summary of the situation for the human reviewer, including anything they'd need to pick up the conversation.",
        },
      },
      required: ["severity", "reason", "summary"],
    },
  },
];

function buildSystemPrompt(channel, persona, now = new Date()) {
  const bookingCfg = bookingConfigFor(persona.key);
  const bookingSection = bookingCfg ? `\n\n${bookingPromptSection(bookingCfg, now)}` : "";
  const reviewCfg = reviewConfigFor(persona.key);
  const reviewSection = reviewCfg ? `\n\n${reviewPromptSection(reviewCfg)}` : "";
  const channelNote =
    channel === "email"
      ? `Du svarar via e-post. Skriv ett komplett svar: en kort hälsning, svaret, och en avslutning från "${persona.businessName} Support". Skriv ingen ämnesrad, bara brödtexten.`
      : "Du svarar i en livechatt. Håll svaren korta och samtalsvänliga — några meningar, inte en uppsats.";

  return `Du är AI-kundsupportagenten för ${persona.businessName}. Det finns inga mänskliga agenter i den här kanalen idag — du är hela supportupplevelsen för varje meddelande som kommer in här. Svara alltid på svenska, oavsett vilket språk kunden skriver på, om inte kunden uttryckligen ber om ett annat språk. Tala alltid som "${persona.businessName}", i första person plural ("vi"), varmt, rakt på sak och självsäkert. Hitta aldrig på policy: använd bara det som står i kunskapsbasen nedan. Om något inte täcks, säg det ärligt istället för att gissa, och överväg att flagga det.

${channelNote}

--- KUNSKAPSBAS (den enda källan till sanning för policy, frakt, returer, garanti, ordrar) ---
${persona.knowledgeBase}
--- SLUT PÅ KUNSKAPSBAS ---${bookingSection}${reviewSection}

Använd verktyget flag_for_review exakt enligt instruktionerna i dess beskrivning. Att flagga är en anteckning för uppföljning, inte en överlämning: fortsätt hjälpa kunden i samma svar efter att du flaggat något.

Undvik återvändsgränder: om du märker att du redan gett ett liknande svar en gång utan att det löste kundens problem, eller om kunden uttrycker tydlig frustration (t.ex. versaler, "detta fungerar inte", upprepar samma fråga), sluta omformulera samma svar en tredje gång. Flagga det istället med flag_for_review (reason: "unresolved after retries" eller "frustration") och erbjud direkt, i samma svar, att koppla kunden vidare — t.ex. maila hello@adjustglow.com eller boka ett samtal — snarare än att fortsätta i en loop.

Om en kund direkt frågar om de pratar med en människa eller en AI, eller ber om att få prata med en person, var ärlig: supporten här sköts av AI, du flaggar allt som behöver en specialist, och ge dem eskaleringskontakten från kunskapsbasen som alternativ. Berätta inte oombedd att du är en AI.`;
}

/**
 * Run one turn of the support agent.
 *
 * @param {object} args
 * @param {"chat"|"email"} args.channel
 * @param {{role: "user"|"assistant", content: string}[]} args.history - prior turns, oldest first
 * @param {string} args.userMessage - the new incoming message
 * @param {(flag: {severity: string, reason: string, summary: string}) => void} [args.onFlag]
 * @param {string} [args.persona] - "default" (the public Livedemo) or
 *   "adjustglow" (Adjustglow's own site widget); unset behaves exactly like
 *   "default" so existing callers are unaffected.
 * @param {(delta: string) => void} [args.onTextDelta] - when provided, the
 *   reply is generated via the streaming API and each new chunk of text is
 *   passed to this callback as soon as it's produced, in addition to being
 *   returned in full once the turn completes. Omit for a plain, non-streamed
 *   call (used by the email channel and any caller that doesn't need live
 *   token-by-token output).
 * @param {string} [args.conversationId] - stored on any booking made in this turn
 * @returns {Promise<{reply: string, flags: object[], bookingEvents: object[]}>}
 *   bookingEvents lists bookings created/rescheduled/cancelled in this turn,
 *   so the chat UI can show a confirmation card. offerReview is true when the
 *   assistant asked for the review form to be shown under its reply.
 */
export async function runTurn({ channel, history, userMessage, onFlag, persona, onTextDelta, conversationId }) {
  const p = resolvePersona(persona);
  const system = buildSystemPrompt(channel, p);
  const tools = toolsFor(p);
  const bookingCfg = bookingConfigFor(p.key);
  const bookingEvents = [];
  const reviewEnabled = Boolean(reviewConfigFor(p.key));
  let offerReview = false;

  // Working copy for this turn's internal tool-use loop. We deliberately do
  // NOT persist raw tool_use/tool_result blocks into long-term history —
  // only the plain text turns get stored (see server.js) — so the stored
  // conversation stays simple JSON across requests.
  let workingMessages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  const flags = [];
  let finalText = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response;

    if (onTextDelta) {
      // Streaming path: forward each text delta to the caller as it's
      // produced (real-time, token-by-token), then resolve to the same
      // shape of final Message the non-streaming call would have returned.
      //
      // If an earlier round already produced visible text (e.g. the model
      // wrote a line, then called flag_for_review, and is now continuing
      // in a fresh round after the tool result), inject the same "\n"
      // separator into the live stream that finalText's own bookkeeping
      // below uses — otherwise what streams to the client reads as one
      // run-on sentence ("...åt dig.Tack, en människa...") even though
      // the stored/final text correctly has a line break there.
      let roundFirstDelta = true;
      const stream = anthropic.messages.stream({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: workingMessages,
        tools,
      });
      stream.on("text", (delta) => {
        if (!delta) return;
        if (roundFirstDelta) {
          roundFirstDelta = false;
          if (finalText) onTextDelta("\n");
        }
        onTextDelta(delta);
      });
      response = await stream.finalMessage();
    } else {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 700,
        system,
        messages: workingMessages,
        tools,
      });
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");
    const roundText = textBlocks.map((b) => b.text).join("\n").trim();
    if (roundText) {
      // Concatenate across rounds rather than overwrite: if the model wrote
      // any text before calling a tool (round 1) and more text after the
      // tool result comes back (round 2), both were shown to the user as
      // they streamed, so both belong in what gets stored.
      finalText = finalText ? `${finalText}\n${roundText}` : roundText;
    }

    if (toolUses.length === 0) break;

    workingMessages.push({ role: "assistant", content: response.content });

    const toolResults = [];
    for (const tu of toolUses) {
      if (tu.name === "flag_for_review") {
        const flag = {
          severity: tu.input?.severity || "medium",
          reason: tu.input?.reason || "unspecified",
          summary: tu.input?.summary || "",
        };
        flags.push(flag);
        if (onFlag) {
          try {
            await onFlag(flag);
          } catch (e) {
            console.error("onFlag handler failed:", e);
          }
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: "Logged for human review. Continue helping the customer normally in your next message.",
        });
      } else if (reviewEnabled && tu.name === "offer_review") {
        offerReview = true;
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: "Omdömesformuläret visas under ditt svar. Avsluta med en kort, vänlig mening; be inte om ett visst betyg.",
        });
      } else if (bookingCfg && BOOKING_TOOL_NAMES.has(tu.name)) {
        const result = await executeBookingTool(tu.name, tu.input || {}, {
          config: bookingCfg,
          conversationId,
        });
        if (result.event) bookingEvents.push(result.event);
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: result.content,
          ...(result.isError ? { is_error: true } : {}),
        });
      } else {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: "Unknown tool.",
          is_error: true,
        });
      }
    }
    workingMessages.push({ role: "user", content: toolResults });

    if (response.stop_reason !== "tool_use") break;
  }

  if (!finalText) {
    finalText =
      "Tack för att du hör av dig — kan du berätta lite mer om vad du behöver hjälp med?";
    if (onTextDelta) onTextDelta(finalText);
  }

  return { reply: finalText, flags, bookingEvents, offerReview };
}

/**
 * Suggest 2-3 short, contextual follow-up questions a customer might ask
 * next, given the message they just sent and the reply they just got. This
 * is a small, separate, non-streamed call (cheap, low max_tokens) run right
 * after the main reply finishes — mirrors the "suggested next question"
 * pattern used by most modern support-AI products (e.g. Intercom Fin,
 * Decagon) to guide the conversation forward instead of leaving the
 * customer facing a blank input box.
 *
 * Never throws: on any failure (bad JSON, API error) it resolves to [],
 * since suggestions are a nice-to-have and must never break the main chat
 * flow if something goes wrong.
 *
 * @param {object} args
 * @param {string} args.userMessage
 * @param {string} args.reply
 * @param {string} [args.persona]
 * @returns {Promise<string[]>}
 */
export async function suggestFollowUps({ userMessage, reply, persona }) {
  try {
    const p = resolvePersona(persona);
    const system = `Du föreslår korta uppföljningsfrågor på svenska som en kund skulle kunna ställa härnäst till ${p.businessName}s supportassistent, baserat på den senaste utväxlingen nedan. Svara ENDAST med en JSON-array av 0-3 strängar, t.ex. ["Vad kostar Growth?","Hur lång är uppsägningstiden?"] — ingen annan text, ingen förklaring, inga backticks. Håll varje fråga kort (helst under 6 ord) och naturlig, som något en riktig kund skulle skriva. Om samtalet redan är avslutat eller inget naturligt uppföljningsförslag finns, svara med en tom array: [].`;

    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 150,
      system,
      messages: [
        {
          role: "user",
          content: `Kundens meddelande: ${userMessage}\n\nAssistentens svar: ${reply}`,
        },
      ],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => typeof s === "string" && s.trim()).slice(0, 3);
  } catch (e) {
    console.error("suggestFollowUps failed (non-fatal):", e?.message || e);
    return [];
  }
}
