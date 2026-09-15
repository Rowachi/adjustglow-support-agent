import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE_BASE } from "./knowledgeBase.js";

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

const TOOLS = [
  {
    name: "flag_for_review",
    description:
      "Log this conversation for a human specialist to look at later. Use it for refund/goodwill requests over $500, legal threats or chargebacks, injury or safety reports, abusive language, an issue repeating a third time unresolved, or anything the knowledge base doesn't clearly cover. Flagging does NOT end the conversation — after calling this, keep responding to the customer normally.",
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

function buildSystemPrompt(channel) {
  const channelNote =
    channel === "email"
      ? `You are replying by email. Write a complete reply: a brief greeting, the answer, and a sign-off from "${BUSINESS_NAME} Support". Do not include a subject line, just the body.`
      : "You are replying in live chat. Keep replies short and conversational — a few sentences, not an essay.";

  return `You are the AI customer support agent for ${BUSINESS_NAME}. There are no human agents on this channel today — you are the entire support experience for every message that comes through here. Always speak as "${BUSINESS_NAME}", first person plural ("we"), warm, plain-spoken, and confident. Never invent policy: only use what's in the knowledge base below. If something isn't covered, say so honestly instead of guessing, and consider flagging it.

${channelNote}

--- KNOWLEDGE BASE (the only source of truth for policy, shipping, returns, warranty, orders) ---
${KNOWLEDGE_BASE}
--- END KNOWLEDGE BASE ---

Use the flag_for_review tool exactly as instructed in the "When to flag for a human specialist" section above. Flagging is a note for follow-up, not a hand-off: keep helping the customer in the same reply after you flag something.

If a customer directly asks whether they're talking to a human or an AI, or asks to speak to a person, be honest: support here is AI-handled, you're flagging anything that needs a specialist, and give them the escalation contact from the knowledge base as the alternative. Don't volunteer that you're an AI unprompted.`;
}

/**
 * Run one turn of the support agent.
 *
 * @param {object} args
 * @param {"chat"|"email"} args.channel
 * @param {{role: "user"|"assistant", content: string}[]} args.history - prior turns, oldest first
 * @param {string} args.userMessage - the new incoming message
 * @param {(flag: {severity: string, reason: string, summary: string}) => void} [args.onFlag]
 * @returns {Promise<{reply: string, flags: object[]}>}
 */
export async function runTurn({ channel, history, userMessage, onFlag }) {
  const system = buildSystemPrompt(channel);

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
      "Thanks for reaching out — could you tell me a bit more about what you need help with?";
  }

  return { reply: finalText, flags };
}
