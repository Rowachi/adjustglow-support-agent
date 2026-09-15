import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_PATH = path.join(__dirname, "..", "data", "knowledge-base.md");

// Loaded once at startup. Edit data/knowledge-base.md and restart the
// server to pick up changes — good enough for a prototype; a real
// multi-client version would load per-business knowledge bases at request
// time instead of one file baked in at boot.
export const KNOWLEDGE_BASE = fs.readFileSync(KB_PATH, "utf8");
