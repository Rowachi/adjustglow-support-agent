// Persistent storage.
//
// When DATABASE_URL is set (a Neon Postgres connection string), every
// record is stored in one Postgres table and survives restarts and
// redeploys. Without it, records fall back to JSON files in data/, which is
// fine for local development but wiped on every Render free-plan restart.
//
// Data model: one table, `records`, holding JSON documents grouped by
// collection ("bookings", "conversations", "review_queue", "feedback").
// Each collection is small enough to load into memory at startup, which lets
// the rest of the app keep its simple synchronous in-memory logic; writes go
// through to the database.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");

let pool = null;

export function usingDatabase() {
  return pool !== null;
}

/**
 * Connect and create the table if needed. Call once at startup, before
 * anything loads a collection. Retries a few times because a Neon database
 * that has scaled to zero can take a moment to wake up.
 */
export async function initDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("DATABASE_URL not set: storing data in local JSON files (wiped on Render restarts).");
    return;
  }
  const candidate = new pg.Pool({
    connectionString: url,
    ssl: url.includes("sslmode=disable") ? false : { rejectUnauthorized: true },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
  candidate.on("error", (e) => console.error("Postgres pool error:", e.message));

  let lastErr;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await candidate.query(`
        CREATE TABLE IF NOT EXISTS records (
          collection text NOT NULL,
          id text NOT NULL,
          data jsonb NOT NULL,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (collection, id)
        )`);
      pool = candidate;
      console.log("Connected to Postgres; data will persist across restarts.");
      return;
    } catch (e) {
      lastErr = e;
      console.error(`Postgres connection attempt ${attempt} failed: ${e.message}`);
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  // Refuse to start rather than silently fall back to files: running on the
  // wiped disk while believing data is safe is worse than a visible failure.
  throw new Error(`Could not connect to Postgres: ${lastErr?.message}`);
}

function filePath(collection) {
  return path.join(DATA_DIR, `${collection.replace(/_/g, "-")}.json`);
}

function readFile(collection, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath(collection), "utf8"));
  } catch {
    return fallback;
  }
}

function writeFile(collection, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2));
}

/**
 * Load every record in a collection.
 * File mode: `fileShape` says how the legacy JSON file is laid out
 * ("array" of records, or "map" of id -> record).
 * @returns {Promise<object[]>} records, oldest first
 */
export async function loadCollection(collection, fileShape = "array") {
  if (pool) {
    const { rows } = await pool.query(
      "SELECT data FROM records WHERE collection = $1 ORDER BY created_at ASC, id ASC",
      [collection]
    );
    return rows.map((r) => r.data);
  }
  const raw = readFile(collection, fileShape === "map" ? {} : []);
  return fileShape === "map" ? Object.values(raw) : raw;
}

/**
 * Insert or update one record.
 * File mode rewrites the whole collection file from `allRecords`
 * (the caller's current in-memory list/map), matching the old behaviour.
 */
export async function saveRecord(collection, id, data, allRecords) {
  if (pool) {
    await pool.query(
      `INSERT INTO records (collection, id, data) VALUES ($1, $2, $3)
       ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [collection, id, data]
    );
    return;
  }
  writeFile(collection, allRecords);
}

/** Delete records by id (used to trim capped collections like feedback). */
export async function deleteRecords(collection, ids, allRecords) {
  if (!ids.length) return;
  if (pool) {
    await pool.query("DELETE FROM records WHERE collection = $1 AND id = ANY($2)", [collection, ids]);
    return;
  }
  writeFile(collection, allRecords);
}

export async function closeDb() {
  if (pool) await pool.end();
  pool = null;
}
