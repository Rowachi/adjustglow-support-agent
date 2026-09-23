// Booking provider registry.
//
// Each provider implements the same functions: listServices,
// findAvailableSlots, createBooking, getBooking, cancelBooking,
// rescheduleBooking, listBookings. The AI tools in ../index.js only ever
// call these, so moving a client from one calendar system to another is a
// config change (`"provider"` in data/booking-config.json), not an AI change.
//
// Available today:
//   local       Adjustglow's own built-in scheduler (./local.js).
//
// Not available yet:
//   timecenter  TimeCenter (timecenter.se) has no public API or webhooks as
//               of Sept 2026. Its only integrations (Venturi, Zettle,
//               Klarna) are built by TimeCenter itself. A provider can be
//               added here if TimeCenter grants API access
//               (contact: 08-82 44 00).
//   calcom      Cal.com has an open REST API (availability + bookings) and
//               would fit this interface directly; needs a Cal.com account
//               and API key per client.
import * as local from "./local.js";

export const PROVIDERS = { local };

export function getProvider(name) {
  return PROVIDERS[name] || null;
}
