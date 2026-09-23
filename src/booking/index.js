// Booking: lets the support AI check free times and book, look up,
// reschedule and cancel appointments inside the chat.
//
// Pieces:
//   data/booking-config.json  per-business setup (services, hours, rules)
//   providers/                where bookings actually live (see index.js)
//   this file                 the AI tools, their executor, and the
//                             booking section of the system prompt

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getProvider, initProviders } from "./providers/index.js";
import { BookingError } from "./providers/local.js";
import { localDate, localTime, addDays, swedishDateLabel } from "./time.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE =
  process.env.BOOKING_CONFIG_FILE || path.join(__dirname, "..", "..", "data", "booking-config.json");

function loadConfigs() {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    const out = {};
    for (const [key, cfg] of Object.entries(raw)) {
      if (key.startsWith("_") || !cfg || !cfg.enabled) continue;
      if (!getProvider(cfg.provider)) {
        console.warn(`Booking disabled for "${key}": provider "${cfg.provider}" is not available.`);
        continue;
      }
      out[key] = { ...cfg, key };
    }
    return out;
  } catch (e) {
    console.warn("No booking config loaded:", e.message);
    return {};
  }
}

const CONFIGS = loadConfigs();

/** Load stored bookings. Call once at startup, after initDb(). */
export async function initBooking() {
  await initProviders();
}

/** Booking config for a persona, or null when booking isn't enabled for it. */
export function bookingConfigFor(personaKey) {
  return CONFIGS[personaKey] || null;
}

export function allBookingConfigs() {
  return Object.values(CONFIGS);
}

const WEEKDAYS_SV = { mon: "mån", tue: "tis", wed: "ons", thu: "tor", fri: "fre", sat: "lör", sun: "sön" };

function openingHoursText(cfg) {
  return Object.entries(WEEKDAYS_SV)
    .map(([k, label]) => {
      const iv = cfg.openingHours[k] || [];
      return `${label} ${iv.length ? iv.map(([a, b]) => `${a}-${b}`).join(", ") : "stängt"}`;
    })
    .join(" · ");
}

/** The booking part of the system prompt, including a date table so the model maps "på torsdag" correctly. */
export function bookingPromptSection(cfg, now = new Date()) {
  const today = localDate(now, cfg.timezone);
  const calendar = Array.from({ length: 15 }, (_, i) => {
    const d = addDays(today, i);
    const prefix = i === 0 ? "idag, " : i === 1 ? "imorgon, " : "";
    return `${prefix}${swedishDateLabel(d)} = ${d}`;
  }).join("\n");
  const services = cfg.services
    .map(
      (s) =>
        `- ${s.name} (service_id: ${s.id}): ${s.durationMinutes} min, ${s.priceSek ? `${s.priceSek} kr` : "kostnadsfritt"}. ${s.description}`
    )
    .join("\n");

  return `--- BOKNING ---
Du kan boka, visa, flytta och avboka tider direkt i chatten med bokningsverktygen. Just nu är det ${swedishDateLabel(today)} ${today}, klockan ${localTime(now, cfg.timezone)} (svensk tid).

Datum de närmaste två veckorna (använd dessa, räkna inte själv):
${calendar}

Bokningsbara tjänster:
${services}

Plats: ${cfg.location}. Öppettider: ${openingHoursText(cfg)}.
Regler: boka senast ${cfg.minLeadMinutes / 60} timmar i förväg, högst ${cfg.horizonDays} dagar framåt. Ändring och avbokning i chatten går fram till ${cfg.cancelCutoffMinutes / 60} timmar före start.

Så här bokar du:
1. Ta reda på vilken tjänst kunden vill ha. Är det oklart, föreslå den som passar bäst utifrån beskrivningarna.
2. Fråga vilken dag eller tid som passar om kunden inte redan sagt det, och anropa sedan check_availability. Erbjud bara tider som check_availability faktiskt returnerat, aldrig gissade tider. Föreslå 2 till 4 tider, inte hela listan. Finns inget ledigt, sök vidare framåt eller föreslå en annan tid på dagen.
3. Be om namn och e-postadress (telefonnummer är frivilligt). Fråga inte efter personnummer, adress eller annat som inte behövs.
4. Sammanfatta innan du bokar: tjänst, dag och datum, tid, pris, namn och e-post. Fråga "Ska jag boka det?".
5. Anropa create_booking först när kunden tydligt sagt ja, och sätt då customer_confirmed till true. Säg aldrig att något är bokat om verktyget inte svarat ok.
6. Bekräfta med bokningsnumret, dag, datum och tid, och säg att bokningsnumret och e-postadressen behövs för att ändra eller avboka.
Om create_booking svarar att tiden blivit upptagen: be om ursäkt, kör check_availability igen och erbjud närliggande tider.

Visa, flytta eller avboka: kräv både bokningsnummer och den e-postadress som bokningen gjordes med, och använd get_booking, reschedule_booking eller cancel_booking. Bekräfta med kunden innan du flyttar eller avbokar (customer_confirmed: true). Berätta aldrig något om andra kunders bokningar. Är det för sent att ändra i chatten, förklara det och flagga ärendet med flag_for_review så att någon kan hjälpa till.
--- SLUT PÅ BOKNING ---`;
}

/** Tool definitions for a booking-enabled persona. */
export function bookingTools(cfg) {
  const serviceIds = cfg.services.map((s) => s.id);
  const ref = { type: "string", description: "Bokningsnumret, t.ex. LC-7K2QX." };
  const email = { type: "string", description: "E-postadressen bokningen gjordes med." };
  const confirmed = {
    type: "boolean",
    description: "true endast om kunden uttryckligen bekräftat just den här åtgärden i chatten.",
  };
  return [
    {
      name: "check_availability",
      description:
        "Hämta lediga starttider för en tjänst. Returnerar upp till några dagar med lediga tider inom intervallet. Anropa alltid detta innan du föreslår tider.",
      input_schema: {
        type: "object",
        properties: {
          service_id: { type: "string", enum: serviceIds },
          date_from: { type: "string", description: "Första dag att söka, YYYY-MM-DD. Utelämna för idag." },
          date_to: { type: "string", description: "Sista dag att söka, YYYY-MM-DD (högst 14 dagar efter date_from)." },
          time_of_day: {
            type: "string",
            enum: ["morning", "afternoon", "evening"],
            description: "Valfritt: morning = före 12, afternoon = 12-17, evening = efter 17.",
          },
        },
        required: ["service_id"],
      },
    },
    {
      name: "create_booking",
      description:
        "Boka en tid. Anropa bara efter att kunden fått en sammanfattning och tydligt bekräftat. Tiden måste komma från check_availability.",
      input_schema: {
        type: "object",
        properties: {
          service_id: { type: "string", enum: serviceIds },
          date: { type: "string", description: "YYYY-MM-DD" },
          time: { type: "string", description: "Starttid HH:MM (24h)" },
          name: { type: "string", description: "Kundens för- och efternamn." },
          email: { type: "string" },
          phone: { type: "string", description: "Valfritt." },
          notes: { type: "string", description: "Valfritt: kort beskrivning av ärendet, t.ex. vilken cykel eller vad som krånglar." },
          customer_confirmed: confirmed,
        },
        required: ["service_id", "date", "time", "name", "email", "customer_confirmed"],
      },
    },
    {
      name: "get_booking",
      description: "Visa en befintlig bokning. Kräver bokningsnummer och e-post.",
      input_schema: {
        type: "object",
        properties: { reference: ref, email },
        required: ["reference", "email"],
      },
    },
    {
      name: "reschedule_booking",
      description:
        "Flytta en befintlig bokning till en ny tid (samma tjänst). Kontrollera den nya tiden med check_availability först och bekräfta med kunden.",
      input_schema: {
        type: "object",
        properties: {
          reference: ref,
          email,
          date: { type: "string", description: "Nytt datum YYYY-MM-DD" },
          time: { type: "string", description: "Ny starttid HH:MM" },
          customer_confirmed: confirmed,
        },
        required: ["reference", "email", "date", "time", "customer_confirmed"],
      },
    },
    {
      name: "cancel_booking",
      description: "Avboka en befintlig bokning efter att kunden bekräftat.",
      input_schema: {
        type: "object",
        properties: { reference: ref, email, customer_confirmed: confirmed },
        required: ["reference", "email", "customer_confirmed"],
      },
    },
  ];
}

export const BOOKING_TOOL_NAMES = new Set([
  "check_availability",
  "create_booking",
  "get_booking",
  "reschedule_booking",
  "cancel_booking",
]);

const NEEDS_CONFIRMATION = new Set(["create_booking", "reschedule_booking", "cancel_booking"]);

/**
 * Run one booking tool call.
 * @returns {Promise<{content: string, isError: boolean, event: object|null}>}
 *   content  JSON string handed back to the model as the tool_result
 *   event    set when a booking actually changed, so the chat UI can show a card
 */
export async function executeBookingTool(name, input = {}, { config, conversationId, now = new Date() }) {
  const provider = getProvider(config.provider);
  const ok = (data, event = null) => ({ content: JSON.stringify({ ok: true, ...data }), isError: false, event });
  const fail = (code, message) => ({
    content: JSON.stringify({ ok: false, error: code, message }),
    isError: true,
    event: null,
  });

  if (NEEDS_CONFIRMATION.has(name) && input.customer_confirmed !== true) {
    return fail(
      "not_confirmed",
      "Kunden har inte bekräftat. Sammanfatta detaljerna och fråga kunden innan du försöker igen."
    );
  }

  try {
    switch (name) {
      case "check_availability":
        return ok(
          provider.findAvailableSlots(
            config,
            {
              serviceId: input.service_id,
              dateFrom: input.date_from,
              dateTo: input.date_to,
              timeOfDay: input.time_of_day,
            },
            now
          )
        );
      case "create_booking": {
        const booking = await provider.createBooking(
          config,
          {
            serviceId: input.service_id,
            date: input.date,
            time: input.time,
            name: input.name,
            email: input.email,
            phone: input.phone,
            notes: input.notes,
            conversationId,
          },
          now
        );
        return ok({ booking }, { type: "created", booking });
      }
      case "get_booking":
        return ok({ booking: provider.getBooking(config, { reference: input.reference, email: input.email }) });
      case "reschedule_booking": {
        const booking = await provider.rescheduleBooking(
          config,
          { reference: input.reference, email: input.email, date: input.date, time: input.time },
          now
        );
        return ok({ booking }, { type: "rescheduled", booking });
      }
      case "cancel_booking": {
        const booking = await provider.cancelBooking(config, { reference: input.reference, email: input.email }, now);
        return ok({ booking }, { type: "cancelled", booking });
      }
      default:
        return fail("unknown_tool", `Okänt verktyg ${name}.`);
    }
  } catch (e) {
    if (e instanceof BookingError) return fail(e.code, e.message);
    console.error(`Booking tool ${name} failed:`, e);
    return fail("internal", "Något gick fel i bokningssystemet. Be kunden försöka igen om en stund.");
  }
}

export function listBookingsForAdmin({ full }) {
  return allBookingConfigs().flatMap((cfg) => getProvider(cfg.provider).listBookings(cfg, { full }));
}
