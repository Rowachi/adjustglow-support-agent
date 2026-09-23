// Timezone helpers for the booking engine, built on Intl only (no
// dependency). Every business has an IANA timezone (e.g. Europe/Stockholm);
// opening hours and slot times are defined in that local time, while stored
// booking timestamps are UTC ISO strings. These helpers convert between the
// two and handle daylight-saving changes correctly.

const partsCache = new Map();

function formatter(tz) {
  if (!partsCache.has(tz)) {
    partsCache.set(
      tz,
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
      })
    );
  }
  return partsCache.get(tz);
}

/** Wall-clock parts of `date` as seen in `tz`. */
export function zonedParts(date, tz) {
  const out = {};
  for (const p of formatter(tz).formatToParts(date)) out[p.type] = p.value;
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: out.weekday.toLowerCase().slice(0, 3), // mon..sun
  };
}

function offsetMs(date, tz) {
  const p = zonedParts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-09-24" + "10:00" in `tz` -> the matching UTC Date. */
export function zonedToUtc(dateStr, timeStr, tz) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = offsetMs(new Date(guess), tz);
  let ts = guess - off1;
  const off2 = offsetMs(new Date(ts), tz);
  if (off2 !== off1) ts = guess - off2;
  return new Date(ts);
}

const pad = (n) => String(n).padStart(2, "0");

export function localDate(date, tz) {
  const p = zonedParts(date, tz);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function localTime(date, tz) {
  const p = zonedParts(date, tz);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Weekday key (mon..sun) for a local calendar date string. */
export function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(mins) {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}

export const isDateStr = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
export const isTimeStr = (s) => typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

/** Swedish label for a local calendar date, e.g. "torsdag 24 september". */
export function swedishDateLabel(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}
