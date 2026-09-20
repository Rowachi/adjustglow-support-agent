import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH = path.join(__dirname, "..", "data", "knowledge-base.md");
const ADJUSTGLOW_KB_PATH = path.join(__dirname, "..", "data", "adjustglow-knowledge-base.md");

// Loaded once at startup. Edit the relevant .md file and restart the
// server to pick up changes — good enough for a prototype; a real
// multi-client version would load per-business knowledge bases at request
// time instead of files baked in at boot.
//
// KNOWLEDGE_BASE = the Lumen Cycles demo (used by the public "Livedemo").
// ADJUSTGLOW_KNOWLEDGE_BASE = Adjustglow's own facts, used by the small
// chat widget on adjustglow.com itself (see server.js's persona handling).
export const KNOWLEDGE_BASE = fs.readFileSync(KB_PATH, "utf8");
export const ADJUSTGLOW_KNOWLEDGE_BASE = fs.readFileSync(ADJUSTGLOW_KB_PATH, "utf8");
