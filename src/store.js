// Conversations, review queue and feedback.
//
// Kept in memory for fast synchronous access and written through to
// storage (Postgres via DATABASE_URL, or JSON files locally; see db.js).
// Call initStore() once at startup before using anything here.

import { loadCollection, saveRecord, deleteRecords } from "./db.js";

let conversations = {}; // id -> conversation
let reviewQueue = []; // newest first
let feedback = []; // newest first
const FEEDBACK_CAP = 500;

export async function initStore() {
  conversations = Object.fromEntries(
    (await loadCollection("conversations", "map")).map((c) => [c.id, c])
  );
  reviewQueue = (await loadCollection("review_queue")).sort((a, b) => b.at.localeCompare(a.at));
  feedback = (await loadCollection("feedback")).sort((a, b) => b.at.localeCompare(a.at));
}

// Writes run in the background so a slow database never delays a chat
// reply; failures are logged.
function persist(collection, id, data, all) {
  saveRecord(collection, id, data, all).catch((e) =>
    console.error(`Saving ${collection}/${id} failed:`, e.message)
  );
}

export function getConversation(id) {
  return conversations[id] || null;
}

export function ensureConversation(id, channel, customer) {
  if (!conversations[id]) {
    conversations[id] = {
      id,
      channel,
      customer: customer || null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist("conversations", id, conversations[id], conversations);
  }
  return conversations[id];
}

export function appendTurn(id, userMessage, assistantReply) {
  const convo = conversations[id];
  if (!convo) throw new Error(`Unknown conversation ${id}`);
  const now = new Date().toISOString();
  convo.messages.push({ role: "user", content: userMessage, at: now });
  convo.messages.push({ role: "assistant", content: assistantReply, at: now });
  convo.updatedAt = now;
  persist("conversations", id, convo, conversations);
  return convo;
}

export function addReviewItem(item) {
  const record = {
    id: `flag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    resolved: false,
    ...item,
  };
  reviewQueue.unshift(record);
  persist("review_queue", record.id, record, reviewQueue);
  return record;
}

export function listReviewQueue() {
  return reviewQueue;
}

export function resolveReviewItem(id) {
  const item = reviewQueue.find((r) => r.id === id);
  if (item) {
    item.resolved = true;
    item.resolvedAt = new Date().toISOString();
    persist("review_queue", item.id, item, reviewQueue);
  }
  return item || null;
}

// ---- Feedback (thumbs up/down on individual replies) ----
// A lightweight quality signal, the same spirit as the "CSAT"/quality
// scoring most support-AI products surface (e.g. Intercom Fin's CX Score) —
// here it's just a plain log a human can skim in admin.html, not a scored
// pipeline, but it's enough to notice a reply that's landing badly.
export function addFeedback(item) {
  const record = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...item,
  };
  feedback.unshift(record);
  persist("feedback", record.id, record, feedback);
  if (feedback.length > FEEDBACK_CAP) {
    const dropped = feedback.slice(FEEDBACK_CAP).map((f) => f.id);
    feedback = feedback.slice(0, FEEDBACK_CAP);
    deleteRecords("feedback", dropped, feedback).catch((e) =>
      console.error("Trimming feedback failed:", e.message)
    );
  }
  return record;
}

export function listFeedback() {
  return feedback;
}
