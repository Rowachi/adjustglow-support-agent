import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE_BASE, ADJUSTGLOW_KNOWLEDGE_BASE } from "./knowledgeBase.js";

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
const MAX_TOOL_ROUNDS = 4;

// Two personas share this one deployed backend:
//  - "default"    the public Livedemo (Lumen Cycles, or whatever
//                  BUSINESS_NAME/knowledge-base.md is set to) — unchanged
//                  behavior for any caller that doesn't pass a persona.
//  - "adjustglow" Adjustglow's own chat widget on adjustglow.com, answering
//                  about Adjustglow's own services/pricing/FAQ instead.
const PERSONAS = {
  default: { businessName: BUSINESS_NAME, knowledgeBase: KNOWLEDGE_BASE },
  adjustglow: { businessName: "Adjustglow", knowledgeBase: ADJUSTGLOW_KNOWLEDGE_BASE },
};

function resolvePersona(personaKey) {
  return PERSONAS[personaKey] || PERSONAS.default;
}

const TOOLS = [
  {
    name: "flag_for_review",
    description:
      "Log this conversation for a human specialist to look at later. Use it for refund/goodwill requests over 5000 SEK, legal threats or chargebacks, injury or safety reports, abusive language, an issue repeating a third time unresolved, or anything the knowledge base doesn't clearly cover. Flagging does NOT end the conversation — after calling this, keep responding to the customer normally.",
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
          description: "Short category, e.g. 'refund over threshold', 'safety report', 'abusive language'.",
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

function buildSystemPrompt(channel, persona) {
  const channelNote =
    channel === "email"
      ? `Du svarar via e-post. Skriv ett komplett svar: en kort hälsning, svaret, och en avslutning från "${persona.businessName} Support". Skriv ingen ämnesrad, bara brödtexten.`
      : "Du svarar i en livechatt. Håll svaren korta och samtalsvänliga — några meningar, inte en uppsats.";

  return `Du är AI-kundsupportagenten för ${persona.businessName}. Det finns inga mänskliga agenter i den här kanalen idag — du är hela supportupplevelsen för varje meddelande som kommer in här. Svara alltid på svenska, oavsett vilket språk kunden skriver på, om inte kunden uttryckligen ber om ett annat språk. Tala alltid som "${persona.businessName}", i första person plural ("vi"), varmt, rakt på sak och självsäkert. Hitta aldrig på policy: använd bara det som står i kunskapsbasen nedan. Om något inte täcks, säg det ärligt istället för att gissa, och överväg att flagga det.

${channelNote}

--- KUNSKAPSBAS (den enda källan till sanning för policy, frakt, returer, garanti, ordrar) ---
${persona.knowledgeBase}
--- SLUT PÅ KUNSKAPSBAS ---

Använd verktyget flag_for_review exakt enligt instruktionerna i avsnittet "När du ska flagga för en mänsklig specialist" ovan. Att flagga är en anteckning för uppföljning, inte en överlämning: fortsätt hjälpa kunden i samma svar efter att du flaggat något.

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
 * @returns {Promise<{reply: string, flags: object[]}>}
 */
export async function runTurn({ channel, history, userMessage, onFlag, persona }) {
  const system = buildSystemPrompt(channel, resolvePersona(persona));

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
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 700,
      system,
      messages: workingMessages,
      tools: TOOLS,
    });

    const toolUses = response.content.filter((b) => b.type === "tool_use");
    const textBlocks = response.content.filter((b) => b.type === "text");
    if (textBlocks.length) {
      finalText = textBlocks.map((b) => b.text).join("\n").trim();
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
  }

  return { reply: finalText, flags };
}
