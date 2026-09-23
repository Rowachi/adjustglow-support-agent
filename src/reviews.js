// Reviews: customers write a review here (in the chat, or on the review
// page an NFC/QR card links to), and are then offered one-tap buttons that
// copy their own text and open the business's Google / Trustpilot review
// page, where they publish it themselves from their own account.
//
// Rules this module is built around (Google's and Trustpilot's policies):
//  - We never post a review on a customer's behalf.
//  - Everyone gets the same share options, whatever their rating
//    (no "review gating").
//  - Nothing is offered in exchange for a review.
// Low ratings are additionally flagged in the review queue so the business
// can follow up, alongside (never instead of) the public share options.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCollection, saveRecord } from "./db.js";
import { addReviewItem } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE =
  process.env.REVIEWS_CONFIG_FILE || path.join(__dirname, "..", "data", "reviews-config.json");

const MAX_TEXT = 2000;
const LOW_RATING = 2;
const SHARE_TARGETS = new Set(["copy", "google", "trustpilot"]);

function loadConfigs() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    return Object.fromEntries(
      Object.entries(raw)
        .filter(([k, v]) => !k.startsWith("_") && v && v.enabled)
        .map(([k, v]) => [k, { ...v, key: k }])
    );
  } catch (e) {
    console.warn("No reviews config loaded:", e.message);
    return {};
  }
}

const CONFIGS = loadConfigs();
let reviews = []; // oldest first

export async function initReviews() {
  reviews = await loadCollection("reviews");
}

export function reviewConfigFor(personaKey) {
  return CONFIGS[personaKey || "default"] || null;
}

/** What the review form needs to know: business name and share links. */
export function publicReviewSettings(personaKey) {
  const cfg = reviewConfigFor(personaKey);
  if (!cfg) return { enabled: false };
  return {
    enabled: true,
    businessName: cfg.businessName,
    googleReviewUrl: cfg.googleReviewUrl || null,
    trustpilotReviewUrl: cfg.trustpilotReviewUrl || null,
    demoNote: cfg.demoNote || null,
  };
}

export class ReviewError extends Error {}

export async function createReview({ persona, conversationId, rating, text, name, source }) {
  const cfg = reviewConfigFor(persona);
  if (!cfg) throw new ReviewError("Omdömen är inte aktiverade för det här företaget.");
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) throw new ReviewError("Betyget måste vara 1 till 5.");
  const cleanText = String(text || "").trim().slice(0, MAX_TEXT);
  const cleanName = String(name || "").trim().slice(0, 80);
  const now = new Date().toISOString();

  // One review per chat conversation: submitting again updates it.
  let review = conversationId
    ? reviews.find((x) => x.businessKey === cfg.key && x.conversationId === conversationId)
    : null;
  const isNew = !review;
  if (isNew) {
    review = {
      id: `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      businessKey: cfg.key,
      conversationId: conversationId || null,
      source: source === "card" ? "card" : "chat",
      shares: { copy: 0, google: 0, trustpilot: 0 },
      createdAt: now,
    };
  }
  Object.assign(review, { rating: r, text: cleanText, name: cleanName || null, updatedAt: now });

  await saveRecord("reviews", review.id, review, isNew ? [...reviews, review] : reviews);
  if (isNew) reviews.push(review);

  if (r <= LOW_RATING) {
    addReviewItem({
      conversationId: review.conversationId,
      channel: review.source,
      severity: r === 1 ? "high" : "medium",
      reason: "low rating",
      summary: `Kunden gav ${r}/5${cleanText ? `: "${cleanText.slice(0, 280)}"` : " (ingen text)"}. Hör gärna av er för att följa upp.`,
    });
  }
  return { id: review.id, settings: publicReviewSettings(cfg.key) };
}

export async function recordShare(id, target) {
  if (!SHARE_TARGETS.has(target)) throw new ReviewError("Okänt mål.");
  const review = reviews.find((x) => x.id === id);
  if (!review) throw new ReviewError("Hittade inte omdömet.");
  review.shares[target] = (review.shares[target] || 0) + 1;
  await saveRecord("reviews", review.id, review, reviews);
  return review.shares;
}

/** Admin listing, newest first. Names shortened unless `full`. */
export function listReviews({ full = false } = {}) {
  return [...reviews]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({
      id: r.id,
      businessKey: r.businessKey,
      rating: r.rating,
      text: r.text,
      name: r.name ? (full ? r.name : r.name.split(/\s+/)[0]) : null,
      source: r.source,
      shares: r.shares,
      createdAt: r.createdAt,
      conversationId: full ? r.conversationId : null,
    }));
}

// ---------------------------------------------------------------------------
// AI side: a tool the assistant calls to show the review form in the chat.
// ---------------------------------------------------------------------------

export const OFFER_REVIEW_TOOL = {
  name: "offer_review",
  description:
    "Visa kunden ett formulär där hen kan lämna ett omdöme (betyg och text) och sedan själv dela det på Google och Trustpilot. Anropa det när kundens ärende är avslutat och samtalet rundar av, oavsett om kunden verkar nöjd eller missnöjd. Högst en gång per samtal.",
  input_schema: { type: "object", properties: {}, required: [] },
};

export function reviewPromptSection(cfg) {
  return `--- OMDÖMEN ---
När kundens ärende är avslutat (frågan är besvarad, problemet löst eller hänvisat vidare) och samtalet rundar av, anropa offer_review så att ett omdömesformulär visas under ditt svar, och skriv en kort mening som "Om du vill får du gärna lämna ett omdöme om ${cfg.businessName} nedan."
- Erbjud det till alla, oavsett om kunden verkar nöjd eller missnöjd. Alla ska få exakt samma erbjudande.
- Erbjud det inte direkt efter att en ny tid bokats (tjänsten har inte ägt rum än), inte mitt i ett olöst problem, och högst en gång per samtal (har du redan erbjudit det, gör det inte igen).
- Be aldrig om ett positivt omdöme, föreslå aldrig betyg eller innehåll, och erbjud aldrig något i utbyte mot ett omdöme.
- Formuläret visar själv hur kunden kan dela sitt omdöme på Google och Trustpilot från sitt eget konto. Säg aldrig att du eller ${cfg.businessName} publicerar något på Google eller Trustpilot åt kunden.
--- SLUT PÅ OMDÖMEN ---`;
}
