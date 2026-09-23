# Adjustglow Support Agent

An AI-only customer support backend — every reply comes from Claude, there is
no human agent in the loop. Handles two channels (web chat, email) against
one shared knowledge base, and flags anything risky for a human to check
later without ever stopping the conversation.

This is a prototype built against a **fictional demo business, Lumen
Cycles** (an online bike/e-bike shop) — see `data/knowledge-base.md`. Swap
that file for a real client's actual policies to onboard them for real.

## Setup

```bash
npm install                 # already done if you're reading this after the initial build
cp .env.example .env        # if you don't already have a .env
```

Open `.env` and set `ANTHROPIC_API_KEY` to your real Anthropic API key
(from https://console.anthropic.com). Everything else has a sensible
default.

## Run it

```bash
npm start
```

Then open:
- `http://localhost:8787/index.html` — a test console: a chat widget for the
  web-chat channel, and a form that simulates an incoming email.
- `http://localhost:8787/admin.html` — the review queue: everything the
  agent has flagged for a human, with severity, reason, a summary, and the
  full conversation for context. Mark items resolved once handled.

`npm run dev` restarts the server automatically when you edit source files.

## How it's built

- `src/agent.js` — the core: builds the system prompt (business persona +
  the knowledge base + escalation rules), calls the Claude API
  (`@anthropic-ai/sdk`), and gives the model one tool, `flag_for_review`,
  that it calls when it hits something outside safe AI-only handling
  (large refunds, legal threats, safety/injury reports, abuse, an
  unresolved issue repeating). Flagging never ends the conversation — the
  model keeps helping the customer in the same reply.
- `src/knowledgeBase.js` — loads `data/knowledge-base.md` once at startup.
  This is the *only* source of truth the agent is told to use for policy
  questions; it's instructed to admit when something isn't covered rather
  than guess.
- `src/db.js` — storage. With `DATABASE_URL` set (a Neon Postgres
  connection string) everything is saved in one Postgres table, `records`,
  and survives restarts and redeploys. Without it, data falls back to JSON
  files in `data/` (fine locally, wiped on Render's free plan). The server
  refuses to start if `DATABASE_URL` is set but the database can't be
  reached, rather than silently using the wiped disk.
- `src/store.js` — conversations, review queue and feedback, kept in memory
  and written through to storage.
- `src/server.js` — Express app exposing:
  - `POST /api/chat` — `{ message, conversationId? }` → `{ conversationId, reply, flagged }`
  - `POST /api/email/incoming` — `{ from, subject, body, conversationId? }` → `{ conversationId, reply, flagged }`
  - `GET /api/conversations/:id` — full transcript
  - `GET /api/review-queue` / `POST /api/review-queue/:id/resolve`
- `public/index.html`, `public/admin.html` — the two front-ends described
  above, plain HTML/CSS/JS, no build step.

## Wiring the email channel to a real inbox

`/api/email/incoming` only *generates* the reply text right now — it
doesn't receive real email or send anything. To make it real:

1. Pick an email provider with inbound parsing (Postmark inbound webhooks,
   SendGrid Inbound Parse, or Mailgun routes are the common choices).
2. Point that provider's inbound webhook at `/api/email/incoming` (mapping
   their payload shape to `{ from, subject, body }` — each provider's
   fields differ slightly).
3. Use that provider's *outbound* send API to actually email `reply` back
   to `from` — add that call right after `runTurn` resolves in
   `src/server.js`.

## Wiring the web chat channel to the real website

Right now the marketing site (adjustglow.com) lives as a Claude Artifact
page, which can't call an external server like this one — that's why the
marketing site's own chat bubble uses a different mechanism (Claude's
built-in `sample` capability, see `claude/customer-support-bot-v1.md` in
the project). Once the site moves to real hosting you control, its chat
widget should be pointed at this backend's `/api/chat` instead — same
UX, but backed by your own Anthropic key and a knowledge base you can
extend (order lookups, live inventory, etc.) beyond what a page-only
capability can do.

## Known limitations / next steps

- **Storage**: JSON files, single process, no auth on the admin page or the
  review-queue API — fine for development, not for handling real customers.
  Move to a real database and put auth in front of `/admin.html` and the
  `/api/review-queue*` routes before going live.
- **One knowledge base, baked in at boot**: fine for one demo business;
  supporting multiple real client businesses means loading a knowledge base
  per business/request instead of one file read at startup.
- **No rate limiting** on the public endpoints yet — add some before this is
  reachable from the open internet.
- **Review capture / Google & Trustpilot syncing** is a separate,
  not-yet-built piece — this project is support-conversation only, per the
  build order agreed with Adjustglow.
- **Model**: defaults to `claude-sonnet-4-6` via `ANTHROPIC_MODEL` in
  `.env` — check https://platform.claude.com/docs/en/about-claude/models/overview
  if you want to point it at a different model (e.g. a cheaper/faster one
  for simple chat traffic).

## Bookings in chat

The agent can check free times and book, look up, reschedule and cancel
appointments inside the conversation (currently switched on for the Lumen
Cycles Livedemo only).

- `data/booking-config.json` — per-business setup: services (duration,
  price), opening hours, closed dates, slot step, capacity (appointments that
  can run at once), lead time, how far ahead people can book, and the
  cancellation cutoff. Keys match the persona keys in `src/agent.js`.
- `src/booking/index.js` — the five AI tools (`check_availability`,
  `create_booking`, `get_booking`, `reschedule_booking`, `cancel_booking`),
  the booking section of the system prompt (including a date table so "på
  torsdag" maps to the right date), and the tool executor. Changes that
  touch a booking require `customer_confirmed: true`, and lookups need both
  the booking reference and the email it was made with.
- `src/booking/providers/` — where bookings live. `local` is the built-in
  scheduler (saved through `src/db.js`; a failed save rolls the change back). TimeCenter has no public API,
  so it can't be connected yet; Cal.com could be added as a provider with the
  same functions.
- `GET /api/bookings` — admin list. Names/emails are masked unless the
  request sends an `x-admin-token` header matching the `ADMIN_TOKEN` env var.
- Chat responses include `bookings` (created/rescheduled/cancelled in that
  turn) so the UI can show a confirmation card.

## Database (Neon)

1. Create a free project at neon.com (pick an EU region, e.g. Frankfurt).
2. Copy its connection string (`postgresql://...sslmode=require`).
3. In Render → adjustglow-support-agent → Environment, add `DATABASE_URL`
   with that value and save (Render redeploys automatically).
4. `GET /api/health` then reports `"storage": "postgres"`. The table is
   created automatically on first start.


## Reviews and sharing to Google / Trustpilot

Google and Trustpilot don't allow anyone to post a review on a customer's
behalf (neither API can create reviews), so we never do. Instead:

1. The customer writes a review here: in the chat (the AI calls the
   `offer_review` tool when a conversation wraps up, or the customer clicks
   "Lämna ett omdöme"), or on `public/review.html?b=<business>`, the page an
   NFC/QR card links to.
2. After submitting, every customer, whatever their rating, gets the same
   buttons: each copies their own text and opens the business's Google or
   Trustpilot review page, where they paste it and publish from their own
   account. Showing the buttons only to happy customers ("review gating")
   is banned by both platforms, so the widget never does that.
3. Ratings of 1–2 are also flagged in the review queue so the business can
   follow up, alongside the public buttons, never instead of them.

- `data/reviews-config.json` — per business: `googleReviewUrl` (the "Ask
  for reviews" link from the Google Business Profile) and
  `trustpilotReviewUrl` (`https://www.trustpilot.com/evaluate/<domain>`).
  `null` shows the button as unavailable (the fictional Lumen Cycles demo).
- `src/reviews.js` — storage (via `src/db.js`), low-rating flags, share-click
  counting, the `offer_review` tool and its prompt rules.
- `public/review-widget.js` — the form + share step, shared by `agent.html`
  and `review.html`.
- API: `GET /api/reviews/settings?persona=`, `POST /api/reviews`,
  `POST /api/reviews/:id/share`, `GET /api/reviews` (admin; names shortened
  unless `x-admin-token` matches `ADMIN_TOKEN`).
