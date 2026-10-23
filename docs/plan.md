# Plan: shipment tracking prototype

Source: `docs/research.md`, `docs/scope-notes.md`, `CLAUDE.md`. Confirms the build list, fixes the data model, and orders the implementation. Step 1 depends on `docs/design.md` (written next).

## 1. Scope

**Build** — each item earns its place by proving one line of the brief:

| Item | Why it's in |
|---|---|
| Timeline with a variable number of legs (1 to 7); each leg drawn solid (finished), dashed (started, in progress) or muted (no reliable status yet); ops also see a warning on a muted leg that is past its stale threshold | The brief's hero domain challenge (multimodal, customs, reliability) lives entirely here |
| `Reliability<T>` type (confirmed / estimated / unknown) | The one product principle the brief names explicitly; worth compiler enforcement |
| Normalisation: rule table + simulated-AI fallback, confidence, "needs review" | Proves AI touchpoint 1 and the operator-heterogeneity challenge together |
| Ops: exception list ranked by urgency + all-shipments list | Proves "manage by exception," ops's stated objective |
| Correction modal on low-confidence status | The human control point for touchpoint 1 |
| Customer: list + detail + proactive alert | Proves "no need to call anyone," the customer's stated objective |
| Touchpoint 2 (ETA + cited reasons) and touchpoint 3 (next action, drafted notice, approval) | Both required by the brief; 3 is the only place "a person approves actions that affect a customer" is demonstrated end to end |
| Demo panel (inject event, advance clock, reset) | Only way to show freshness/real-time without a backend |
| 12-15 mock shipments, 6 hand-written to each stress one domain challenge | The demo is only as convincing as the data behind it |
| Perimeter filter keyed by actor | "Each viewer only sees their own scope," directly testable as pure logic |
| 2-3 Vitest tests on pure logic | Budget allows this much; it's where correctness risk actually concentrates |

**Cut:**

| Cut | Reason |
|---|---|
| Real maps, document extraction, real auth, localStorage, TanStack Query, Playwright | Cost without demo value at this scope (full reasoning in `scope-notes.md` §9) |
| Free-form customer Q&A chat | Fragile with hardcoded answers |
| Customer plain-language summary | Timeline + ETA range + approved alert already say it; a summary repeats them |
| Customer "notify me" toggle, subsidiary user hierarchy | Next steps for the write-up, not needed to prove the point in a demo |
| Second ops user restricted to one site | Time; the customer perimeter already proves the principle. Ops perimeter by site is described in the write-up, not demonstrated |

**Stretch, not core** — two items from the brief's own decision log add real engineering cost for marginal demo value and are the first things to drop if a step overruns: **per-leg ETA breakdown for ops** (needs a "when is there enough data" rule) and **account-type filter**. Both are additive — nothing in steps 1-8 depends on them — so they're folded into step 7/8 as time allows, not promised.

## 2. Data model and status vocabulary

```ts
type Account  = { id: string; name: string; type: "customer" | "subsidiary" }
type Site     = { id: string; name: string; city: string; country: string }
type Operator = { id: string; name: string }

type LegType = "road" | "port" | "sea" | "customs" | "last-mile"

// What the operator actually sent — always a confirmed fact when present.
type OperatorEvent = {
  legId: string
  rawText: string          // operator's own wording, verbatim
  reportedAt: string       // ISO, operator's own clock
  operatorId: string
}

// What we think it means — a separate, weaker claim than the event itself.
type NormalisedStatus = {
  code: string              // from the per-leg-type vocabulary below
  method: "rule" | "ai" | "correction"
  confidence: number        // rule = 100; ai = whatever the mock model returns; correction = 100
  needsReview: boolean       // confidence below threshold
}

type Leg = {
  id: string
  type: LegType
  order: number
  operatorId: string                 // assigned carrier — known before any event arrives
  planned: { start: string; end: string }  // booking promise, not a fact, not our estimate; required, see assumption below
  events: OperatorEvent[]            // source of truth; empty when nothing reported yet
}

// Always derive from the latest event — a correction is never a standing
// override of the leg, or a newer event (e.g. "arrived") would stay hidden
// behind a stale correction. Corrections apply at normalisation time instead,
// keyed by operatorId + rawText, so they only match the wording they corrected.
function normalise(event: OperatorEvent, corrections: OpsDecision[]): NormalisedStatus {
  const correction = corrections.find(c => c.operatorId === event.operatorId && c.rawText === event.rawText)
  if (correction) return correction.status
  const ruleMatch = ruleTable[event.operatorId]?.[event.rawText]
  if (ruleMatch) return ruleMatch
  return aiFallback(event)
}

// Derived, never stored (decision 1). A leg with no events yet is the
// `unknown` branch, not a missing NormalisedStatus — but "no events" splits
// in two depending on `planned.start`: not due yet, or due and silent.
// With events, this returns the event-level fact as `confirmed`; whether the
// customer sees that status depends on `needsReview`: customer-facing display
// treats a `needsReview` status as unknown (decision 18).
function deriveLegStatus(leg: Leg, now: string, corrections: OpsDecision[]): Reliability<NormalisedStatus> {
  const latest = leg.events.at(-1)
  if (latest) return { kind: "confirmed", value: normalise(latest, corrections), reportedAt: latest.reportedAt, source: latest.operatorId }
  if (now < leg.planned.start) return { kind: "unknown" }            // not due yet — "Not started", no exception
  return { kind: "unknown", since: leg.planned.start }                // due, no data — text and exception depend on the stale threshold, see below
}

type Shipment = {
  id: string
  accountId: string
  originSiteId: string
  destination: { city: string; country: string }
  legs: Leg[]                       // ordered, variable length — no fixed slots
}

// The canonical shape for anything displayed to a user.
type Reliability<T> =
  | { kind: "confirmed"; value: T; reportedAt: string; source: string }
  | { kind: "estimated"; range: [T, T]; confidence: "low" | "medium" | "high"; reasons: string[] }
  | { kind: "unknown"; since?: string }
```

Two different "confidence" concepts, kept separate on purpose: whether an **event happened** is confirmed the moment an operator reports it, or `unknown` if none has arrived yet (`deriveLegStatus` above); whether we **understood what it meant** is the normalisation's `method`/`confidence`, only meaningful once an event exists. Conflating them would let a well-understood status look more certain than the underlying fact, or vice versa. `operatorId` stays mandatory on `Leg` regardless — it's who's assigned to the leg, fixed at shipment creation, independent of whether they've reported anything yet.

Assumption: `planned` is required because the manufacturer books each leg and knows its booking dates. In production it would become optional, falling back to "due when the previous leg is finished"; a default date is never invented.

**Status vocabulary is per `LegType`**, not global — "departed" on a `sea` leg and a `road` leg are different states with different phrases. Each leg type gets a small closed enum (4-6 codes) and each code maps to exactly one short English phrase, generated once, not per shipment:

- `road`: not-started · in-transit · delayed · arrived
- `sea`: not-started · departed · in-transit · delayed · arrived
- `port`: awaiting-vessel · loaded · discharged
- `customs`: pending · held · cleared
- `last-mile`: out-for-delivery · delivered · delivery-exception
- Terminal codes (a leg drawn solid): road `arrived`, sea `arrived`, port `loaded` (origin port) or `discharged` (destination port), customs `cleared`, last-mile `delivered`. Each code carries a `terminal` flag in the vocabulary, so the timeline never hardcodes a list.

**Timeline line style: one question, "what do we know for sure?"** Solid: the leg is finished, confirmed by a reliable event whose status code is terminal (`terminal: true` in the vocabulary). Dashed: the leg has started, confirmed by at least one reliable event, and is not finished; its start is a fact, its end is an estimate. Muted: no reliable status yet. The text tells the cases apart: "Not started" (`now < planned.start`) or "Awaiting details from operator" (due, but silent, or the latest event needs review). A silent leg is never drawn as "in progress", because that would assert something nobody confirmed.

A "reliable" event is one whose normalised status has `needsReview: false`. If the latest event of a leg needs review, the customer view draws the leg muted with "Awaiting details from operator", exactly as if no event existed, and never falls back to an earlier status (decision 18). Ops see the proposed status with a review alert.

Ops only: a muted leg past its stale threshold gets a warning and raises an exception ("No data for 26h"). The customer never sees the warning, "stale" or "exception" wording, only "Awaiting details from operator" and the last confirmed update time (per `scope-notes.md` §2). A warning on screen always implies an exception exists.

Ops corrections (`OpsDecision: { type: "status-correction"; operatorId; rawText; status: NormalisedStatus; correctedBy; at }`) are keyed by operator + raw wording, not by leg — matching decision 18 and the AI-touchpoint description in section 3 below — so a correction only ever overrides the exact wording it was made for, and a later, different event for the same leg normalises fresh instead of staying hidden behind it. Corrections are stored alongside raw events and the simulated clock as the zustand store's only inputs; everything else — normalised status, ETA, exceptions, urgency, alerts, which side of the stale threshold a silent leg falls on — is a pure function of those inputs, per `scope-notes.md` decision 1.

## 3. AI touchpoints

| # | Where it appears | Basis it shows | Human control |
|---|---|---|---|
| 1. Status normalisation | Status badge (both views); alert icon + correction modal when `needsReview` | "Rule" or "AI" tag + confidence %; original wording in a keyboard-accessible Popover | Ops picks the correct code in the modal; the correction is stored keyed by operator + raw text, so the same wording is never re-guessed |
| 2. Delay risk / ETA | Shipment detail, overall ETA range | Reasons list citing mock history ("3 of the last 12 shipments on this route were delayed >24h at port") + confidence tier | Informational only — it never acts, so there is nothing to approve; the range is always labelled "estimated" |
| 3. Next action + drafted notice | Ops exception card → "Notify customer" → draft modal | Draft ends with a "Based on:" line citing the specific event(s) it relies on; the suggested action comes from a fixed cause-to-action table (simulated, labelled as such) | Ops reviews, may edit, must approve before the notice becomes a customer-visible alert; the other two actions (contact operator, upload document) only log a request — no AI drafting, nothing to approve |

The suggested next action is chosen by a fixed table keyed by exception cause, not by a model: customs hold for a missing document → upload document; delay at port or on a leg → notify customer; operator silent past its stale threshold → contact operator. The UI labels it "Suggested (simulated)". In production this becomes a model ranking actions by how similar past cases were resolved.

**Delivery outlook (customer wording).** A pure function compares the overall ETA range with the promised delivery date (`planned.end` of the last leg): upper bound on or before the promise → "On time"; range straddles the promise → "Possible delay"; lower bound after the promise → "Delayed"; delivered → "Delivered". With no ETA, it shows "Awaiting details from operator", never a guess. It lives with the ETA/urgency logic and, being pure, can be unit-tested if time allows.

## 4. Screen inventory

All data goes through the data-access layer, which resolves after a short simulated delay (300-500 ms) so loading states are real and the shape matches a future API. Error states exist only where they can actually happen: an unknown shipment id.

**Ops**
- `/ops` — exception list (ranked by urgency, filters: site/operator/mode) + all-shipments list below, same compact timeline customer sees. Empty: "No exceptions — all shipments on track." Loading: skeleton rows.
- `/ops/shipments/[id]` — full timeline, per-leg detail, original-wording popovers, correction entry point, ETA with confidence + reasons, documents, action history. Empty: "No leg data yet." Loading: skeleton. Error: "Shipment not found."
- Correction modal, notify-customer draft modal (overlays, not routes).

**Customer**
- `/customer` — own shipments only: delivery outlook ("On time" / "Possible delay" / "Delayed"), ETA range, compact timeline. Empty: "No active shipments." Loading: skeleton.
- `/customer/shipments/[id]` — timeline, documents, proactive alert banner when a notice is approved, phone contact to ops. Empty states per section (e.g. no documents yet). Loading: skeleton. Error: "Shipment not found."

**Both roles**
- Demo panel (persistent drawer, labelled "Demo controls — not part of the product"): inject port delay / customs hold / advance clock / reset. Visible in both shells.

Role and account switching is a nav-level control in both shells, per `scope-notes.md` §4 (`/ops`, `/customer` as real routes, not hidden state). There is a single ops user.

## 5. Ordered steps

1. **Design tokens + app shell**, from `docs/design.md`. *Done when:* `/ops` and `/customer` render the shell with a working nav/account switcher, tokens are used consistently, `pnpm check` passes, first Vercel deploy is live.
2a. **Domain types + vocabulary + pure logic** (normaliser, leg status, ETA/exceptions, delivery outlook, perimeter filter) + 4 tests:
   1. `normalise`: an ops correction wins over the rule table, and the rule table wins over the AI fallback.
   2. `deriveLegStatus`: a leg with events is confirmed; a leg with no events before `planned.start` is unknown without `since`; a leg with no events after `planned.start` is unknown with `since`.
   3. Perimeter filter: a customer actor never receives shipments from another account.
   4. Delivery outlook: upper bound on or before the promise is "On time"; a range straddling it is "Possible delay"; a lower bound after it is "Delayed"; no ETA is "Awaiting details from operator".

   *Done when:* all four tests pass and `pnpm check` is green. No mock shipments or UI yet.
2b. **Mock data + data-access layer.** 12-15 shipments, the cause-to-action table and the drafted-notice templates (one per exception cause: port delay, customs hold, silent operator) live in mock data, never inside components. The data-access layer takes the actor as a parameter and resolves after a 300-500 ms simulated delay. *Done when:* the 6 named challenge cases exist and the layer returns only the actor's perimeter.
3. **Timeline component + shipment detail**, shared by both roles. *Done when:* a 1-leg and a 6-7-leg mock shipment both render correctly; solid (finished), dashed (started, not finished) and muted ("Not started" / "Awaiting details from operator") all render; the customer view never shows a warning; the ops view shows the warning only on a muted leg past its threshold. The overall ETA range may wait for step 7 if time is short.
4. **Ops exception list + all-shipments list + filters.** *Done when:* exceptions are ranked with a suggested action, filters narrow the list, the empty state shows with no exceptions.
5. **Normalisation provenance UI**: badges, Popover, correction modal. *Done when:* a "needs review" shipment shows the alert icon; saving a correction clears it and updates the badge in both roles' display rules.
6. **Customer list + detail + alert banner.** *Done when:* `/customer` shows only the active account's shipments, each with its delivery outlook; switching account in the nav swaps the visible set; an approved notice shows as a banner.
7. **Touchpoints 2 and 3**: ETA reasons + next-action/draft/approve flow. *Done when:* ETA shows cited reasons; each exception cause maps to its suggested action through the fixed table; approving a "notify customer" draft makes the alert appear on `/customer`; "contact operator"/"upload document" only log a request.
8a. **Demo panel.** *Done when:* the panel (labelled "Demo controls — not part of the product", visible in both roles) can inject a delay and a customs hold, advance the clock past a leg's `planned.start` plus its stale threshold (flipping it to muted-with-warning in the ops view and raising an exception), and reset; the threshold visibly differs between a vessel leg and a road leg.
8b. **States and accessibility pass.** *Done when:* every screen's empty and loading states and the "Shipment not found" error have been opened and checked; keyboard and focus checked; `pnpm check` and `pnpm build` green. If time is short, this is where to trim.