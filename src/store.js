// Tiny JSON-file-backed store for the prototype.
// Good enough to demo and to develop against; swap for a real database
// (Postgres, etc.) before this handles real customers at any volume —
// concurrent writes here are not safe against real production load.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const CONVERSATIONS_FILE = path.join(DATA_DIR, "conversations.json");
const REVIEW_QUEUE_FILE = path.join(DATA_DIR, "review-queue.json");

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

let conversations = loadJson(CONVERSATIONS_FILE, {}); // id -> conversation
let reviewQueue = loadJson(REVIEW_QUEUE_FILE, []); // array of flag items

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
    saveJson(CONVERSATIONS_FILE, conversations);
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
  saveJson(CONVERSATIONS_FILE, conversations);
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
  saveJson(REVIEW_QUEUE_FILE, reviewQueue);
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
    saveJson(REVIEW_QUEUE_FILE, reviewQueue);
  }
  return item || null;
}
