// "local" booking provider: Adjustglow's own built-in scheduler.
//
// Availability is computed from each business's opening hours, service
// durations and capacity (how many appointments can run in parallel, e.g.
// the number of mechanics or chairs), minus bookings already made. Bookings
// are stored in data/bookings.json.
//
// This is what lets the AI check real free times and book them inside the
// chat today. A client that runs its calendar in an external system gets a
// separate provider with the same five functions instead (see
// providers/index.js); the AI tools and prompt don't change.
//
// Storage caveat (same as the rest of this prototype): on Render's free plan
// the disk is wiped on every redeploy/restart, so bookings here are demo
// data. Move this file's reads/writes to Postgres before real customers
// depend on it.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  zonedToUtc,
  localDate,
  localTime,
  weekdayOf,
  addDays,
  toMinutes,
  fromMinutes,
  isDateStr,
  isTimeStr,
  swedishDateLabel,
} from "../time.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOKINGS_FILE =
  process.env.BOOKINGS_FILE || path.join(__dirname, "..", "..", "..", "data", "bookings.json");

const MAX_ACTIVE_PER_EMAIL = 3; // abuse guard: future bookings per email per business
const MAX_ACTIVE_PER_BUSINESS = 500; // keeps the demo file bounded
const MAX_QUERY_DAYS = 14;
const MAX_DAYS_RETURNED = 5;
const MAX_TIMES_PER_DAY = 8;

let bookings = loadBookings();

function loadBookings() {
  try {
    const data = JSON.parse(fs.readFileSync(BOOKINGS_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  fs.mkdirSync(path.dirname(BOOKINGS_FILE), { recursive: true });
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

class BookingError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
export { BookingError };

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

function newReference(prefix) {
  for (let attempt = 0; attempt < 20; attempt++) {
    let s = "";
    for (let i = 0; i < 5; i++) s += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
    const ref = `${prefix}-${s}`;
    if (!bookings.some((b) => b.reference === ref)) return ref;
  }
  throw new BookingError("internal", "Kunde inte skapa ett bokningsnummer.");
}

const norm = (s) => String(s || "").trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getService(config, serviceId) {
  const svc = config.services.find((s) => s.id === serviceId);
  if (!svc) {
    throw new BookingError(
      "unknown_service",
      `Okänd tjänst "${serviceId}". Giltiga tjänster: ${config.services.map((s) => s.id).join(", ")}.`
    );
  }
  return svc;
}

function isActive(b, now) {
  return b.status === "confirmed" && new Date(b.end).getTime() > now.getTime();
}

function overlapping(config, startMs, endMs, ignoreId) {
  return bookings.filter(
    (b) =>
      b.businessKey === config.key &&
      b.status === "confirmed" &&
      b.id !== ignoreId &&
      new Date(b.start).getTime() < endMs &&
      new Date(b.end).getTime() > startMs
  ).length;
}

/**
 * Is `dateStr timeStr` a bookable start for `svc`? Returns the UTC
 * start/end on success, or throws a BookingError explaining why not.
 */
function validateSlot(config, svc, dateStr, timeStr, now, ignoreId) {
  if (!isDateStr(dateStr) || !isTimeStr(timeStr)) {
    throw new BookingError("bad_input", "Datum måste vara YYYY-MM-DD och tid HH:MM.");
  }
  const today = localDate(now, config.timezone);
  if (dateStr < today || dateStr > addDays(today, config.horizonDays)) {
    throw new BookingError(
      "outside_horizon",
      `Vi tar bokningar från idag och ${config.horizonDays} dagar framåt.`
    );
  }
  if ((config.closedDates || []).includes(dateStr)) {
    throw new BookingError("closed", `Vi har stängt ${swedishDateLabel(dateStr)}.`);
  }
  const intervals = config.openingHours[weekdayOf(dateStr)] || [];
  const startMin = toMinutes(timeStr);
  const endMin = startMin + svc.durationMinutes;
  const fits = intervals.some(
    ([open, close]) =>
      startMin >= toMinutes(open) &&
      endMin <= toMinutes(close) &&
      (startMin - toMinutes(open)) % config.slotStepMinutes === 0
  );
  if (!fits) {
    throw new BookingError(
      "outside_hours",
      `${timeStr} ${swedishDateLabel(dateStr)} är inte en bokningsbar starttid för ${svc.name}.`
    );
  }
  const start = zonedToUtc(dateStr, timeStr, config.timezone);
  const end = new Date(start.getTime() + svc.durationMinutes * 60000);
  if (start.getTime() < now.getTime() + config.minLeadMinutes * 60000) {
    throw new BookingError(
      "too_soon",
      `Bokningar behöver göras minst ${config.minLeadMinutes / 60} timmar i förväg.`
    );
  }
  if (overlapping(config, start.getTime(), end.getTime(), ignoreId) >= config.capacity) {
    throw new BookingError("taken", "Den tiden hann tyvärr bli upptagen.");
  }
  return { start, end };
}

function publicView(config, b) {
  return {
    reference: b.reference,
    service: b.serviceName,
    date: b.localDate,
    dateLabel: swedishDateLabel(b.localDate),
    time: b.localTime,
    durationMinutes: b.durationMinutes,
    priceSek: b.priceSek,
    name: b.name,
    status: b.status,
    location: config.location,
  };
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export function listServices(config) {
  return config.services.map((s) => ({ ...s }));
}

/**
 * Free start times for a service in a date range (inclusive), grouped by
 * day. Optional `timeOfDay`: "morning" (<12), "afternoon" (12-17),
 * "evening" (>=17).
 */
export function findAvailableSlots(config, { serviceId, dateFrom, dateTo, timeOfDay }, now = new Date()) {
  const svc = getService(config, serviceId);
  const today = localDate(now, config.timezone);
  const lastBookable = addDays(today, config.horizonDays);
  let from = isDateStr(dateFrom) ? dateFrom : today;
  if (from < today) from = today;
  let to = isDateStr(dateTo) ? dateTo : addDays(from, 6);
  if (to < from) to = from;
  if (to > addDays(from, MAX_QUERY_DAYS - 1)) to = addDays(from, MAX_QUERY_DAYS - 1);
  if (to > lastBookable) to = lastBookable;

  const days = [];
  let moreDaysAvailable = false;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if ((config.closedDates || []).includes(d)) continue;
    const times = [];
    for (const [open, close] of config.openingHours[weekdayOf(d)] || []) {
      for (
        let m = toMinutes(open);
        m + svc.durationMinutes <= toMinutes(close);
        m += config.slotStepMinutes
      ) {
        if (timeOfDay === "morning" && m >= 12 * 60) continue;
        if (timeOfDay === "afternoon" && (m < 12 * 60 || m >= 17 * 60)) continue;
        if (timeOfDay === "evening" && m < 17 * 60) continue;
        const t = fromMinutes(m);
        try {
          validateSlot(config, svc, d, t, now);
          times.push(t);
        } catch {
          /* not bookable */
        }
      }
    }
    if (times.length) {
      if (days.length >= MAX_DAYS_RETURNED) {
        moreDaysAvailable = true;
        break;
      }
      // Spread the offered times across the day instead of only the earliest.
      let shown = times;
      if (times.length > MAX_TIMES_PER_DAY) {
        const stepIdx = (times.length - 1) / (MAX_TIMES_PER_DAY - 1);
        shown = Array.from({ length: MAX_TIMES_PER_DAY }, (_, i) => times[Math.round(i * stepIdx)]);
      }
      days.push({ date: d, dateLabel: swedishDateLabel(d), times: shown, totalFreeTimes: times.length });
    }
  }
  return {
    service: { id: svc.id, name: svc.name, durationMinutes: svc.durationMinutes, priceSek: svc.priceSek },
    searchedFrom: from,
    searchedTo: to,
    days,
    moreDaysAvailable,
  };
}

export function createBooking(config, input, now = new Date()) {
  const svc = getService(config, input.serviceId);
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim();
  const phone = String(input.phone || "").trim();
  if (name.length < 2) throw new BookingError("bad_input", "Kundens namn saknas.");
  if (!EMAIL_RE.test(email)) throw new BookingError("bad_input", "E-postadressen ser inte giltig ut.");

  const activeForBusiness = bookings.filter((b) => b.businessKey === config.key && isActive(b, now));
  if (activeForBusiness.length >= MAX_ACTIVE_PER_BUSINESS) {
    throw new BookingError("full", "Bokningskalendern är full just nu.");
  }
  if (activeForBusiness.filter((b) => norm(b.email) === norm(email)).length >= MAX_ACTIVE_PER_EMAIL) {
    throw new BookingError(
      "limit",
      `Det finns redan ${MAX_ACTIVE_PER_EMAIL} kommande bokningar på den e-postadressen.`
    );
  }

  // Check-and-insert happens synchronously in one tick, so two customers
  // can't both grab the last free spot in a slot.
  const { start, end } = validateSlot(config, svc, input.date, input.time, now);
  const booking = {
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reference: newReference(config.referencePrefix || "BK"),
    businessKey: config.key,
    provider: "local",
    serviceId: svc.id,
    serviceName: svc.name,
    durationMinutes: svc.durationMinutes,
    priceSek: svc.priceSek,
    start: start.toISOString(),
    end: end.toISOString(),
    localDate: input.date,
    localTime: input.time,
    name: name.slice(0, 120),
    email: email.slice(0, 200),
    phone: phone.slice(0, 40) || null,
    notes: String(input.notes || "").trim().slice(0, 500) || null,
    status: "confirmed",
    conversationId: input.conversationId || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
  bookings.push(booking);
  saveBookings();
  return publicView(config, booking);
}

function findOwned(config, reference, email) {
  const b = bookings.find(
    (x) =>
      x.businessKey === config.key &&
      norm(x.reference) === norm(reference) &&
      norm(x.email) === norm(email)
  );
  // Same message whether the reference doesn't exist or the email doesn't
  // match, so nobody can probe for other customers' bookings.
  if (!b) {
    throw new BookingError(
      "not_found",
      "Hittade ingen bokning med det bokningsnumret och den e-postadressen."
    );
  }
  return b;
}

function assertChangeable(config, b, now) {
  if (b.status !== "confirmed") {
    throw new BookingError("not_active", "Bokningen är redan avbokad.");
  }
  const cutoff = new Date(b.start).getTime() - config.cancelCutoffMinutes * 60000;
  if (now.getTime() > cutoff) {
    throw new BookingError(
      "too_late",
      `Bokningen kan inte ändras eller avbokas i chatten mindre än ${config.cancelCutoffMinutes / 60} timmar innan start.`
    );
  }
}

export function getBooking(config, { reference, email }) {
  return publicView(config, findOwned(config, reference, email));
}

export function cancelBooking(config, { reference, email }, now = new Date()) {
  const b = findOwned(config, reference, email);
  assertChangeable(config, b, now);
  b.status = "cancelled";
  b.updatedAt = now.toISOString();
  saveBookings();
  return publicView(config, b);
}

export function rescheduleBooking(config, { reference, email, date, time }, now = new Date()) {
  const b = findOwned(config, reference, email);
  assertChangeable(config, b, now);
  const svc = getService(config, b.serviceId);
  const { start, end } = validateSlot(config, svc, date, time, now, b.id);
  b.start = start.toISOString();
  b.end = end.toISOString();
  b.localDate = date;
  b.localTime = time;
  b.updatedAt = now.toISOString();
  saveBookings();
  return publicView(config, b);
}

/** Admin listing. Personal details masked unless `full` is true. */
export function listBookings(config, { full = false } = {}) {
  const mask = (email) => {
    const [u, d] = String(email).split("@");
    return `${u.slice(0, 1)}***@${d || ""}`;
  };
  return bookings
    .filter((b) => !config || b.businessKey === config.key)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((b) => ({
      reference: b.reference,
      businessKey: b.businessKey,
      service: b.serviceName,
      date: b.localDate,
      time: b.localTime,
      status: b.status,
      name: full ? b.name : b.name.split(/\s+/)[0],
      email: full ? b.email : mask(b.email),
      phone: full ? b.phone : b.phone ? "***" : null,
      notes: full ? b.notes : null,
      createdAt: b.createdAt,
      conversationId: full ? b.conversationId : null,
    }));
}

/** Test hook: reset in-memory state. */
export function _resetForTests() {
  bookings = [];
}
