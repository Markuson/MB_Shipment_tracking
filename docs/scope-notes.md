# Scope notes: MarsBased shipment tracking test

Status: scope session of 2026-10-22, updated 2026-10-24 (scope cut after 4.5h, see §9 and §11). Input for `DECISIONS.md`, the write-up and `CLAUDE.md`.
Target delivery: Mon 2026-10-26. Hard limit: Wed 2026-10-28 (one week from 2026-10-21).
Effort target: about 7.5h. The cap is 8h, and it is not a goal to use it.

Legend: **Confirmed** = agreed in the session. **Proposed** = suggested, not objected to, still to be validated when planning.

---

## 1. Product framing

- Fictional manufacturer: **Mars Industries**. Several production/warehouse sites, shipping to external customers and subsidiaries, domestic and international, via several operators, by road and sea.
- Product goal: one consolidated, reliable, end-to-end view of shipment status, replacing operator portals, email and phone calls.
- Two roles with different objectives:
  - **Customer / subsidiary:** "Is it on time, and when does it arrive?" without calling anyone. Clarity and confidence.
  - **Internal operations:** manage by exception. The system surfaces what needs attention and proposes the next action.
- **Product principle: reliability.** Never invent a status or an ETA. Confirmed data and estimates look different. An unknown is shown as unknown.

## 2. Reliability model (core of the prototype)

Every datum shown to a user is in exactly one of three states. The type makes it impossible to render a date without declaring which one.

```ts
type Reliability<T> =
  | { kind: "confirmed"; value: T; reportedAt: string; source: string }
  | { kind: "estimated"; range: [T, T]; confidence: "low" | "medium" | "high"; reasons: string[] }
  | { kind: "unknown"; since?: string }
```

| State | Meaning | Visual |
|---|---|---|
| Confirmed | Reported by an operator, with source and time | Solid |
| Estimated | Calculated by us, always a range | Dashed, labelled "estimated" |
| Unknown | No information | Explicit text, never a filled-in value |

**Same data, two levels of disclosure (Confirmed):**

| | Customer | Operations |
|---|---|---|
| Estimate | Range only ("16-19 Nov"), labelled "estimated". Uncertainty is conveyed by range width. | Range + confidence (low/medium/high) + reasons + whether it came from a rule or AI |
| Status | Plain wording: "On time", "Possible delay", "Delayed" | Normalised status + original operator wording + how it was normalised (rule, AI with a High/Medium band, or corrected) |
| Reason for delay | One plain sentence, only if there is a problem | Historical basis and sources |
| Unknown | "Awaiting details from operator" | "No data for 26h" + suggested action |

On the timeline, a leg is solid only when finished; a started leg is dashed because its end is still an estimate.

- The customer view uses plain language only: no terms like "medium confidence", "needs review", "stale" or "exception".
- Ops can correct how an event is interpreted (logged); they cannot hide data or edit facts or ETAs. The human control point for the customer is the approval of the notice (touchpoint 3).
- **Delivery outlook** ("On time" / "Possible delay" / "Delayed" / "Delivered") is a pure function comparing the overall ETA range with the promised delivery date (`planned.end` of the last leg). Upper bound on or before the promise → "On time"; range straddles it → "Possible delay"; lower bound after it → "Delayed". With no ETA: "Awaiting details from operator".

## 3. Shipment timeline (the star of the demo)

Confirmed behaviour:

- One horizontal line of **legs**, for example road, sea, customs, final delivery.
- **Solid** = finished, confirmed by a reliable event with a terminal status, with real date. **Dashed** = started and in progress: the start is confirmed, the end is estimated. **Muted** = no reliable status yet, with text "Not started" or "Awaiting details from operator" (the latter also when the latest event needs review). A silent leg is never drawn as in progress.
- Each leg has a very short **English** phrase, generated from the normalised status (one phrase per normalised status, not written per shipment): "Departed from port", "Pending customs check", "Left destination port".
- The normalised-status vocabulary is defined **per leg type** (road, port, sea, customs, last-mile), not as one global list: "Departed" means something different on a sea leg than on a road leg.
- **One overall ETA** (range, labelled "estimated"). Pending legs carry no date of their own. Operations may see a per-leg breakdown when there is enough data (stretch).
- **Variable number of legs.** The component renders from an ordered list of legs, with no fixed slots. It must cope with a single leg (warehouse to customer's door) and with very complex shipments (two ports, several customs). The demo contains no extremes, but check the layout with 1 leg and 6-7 legs. With many legs, completed ones can collapse.
- A domestic road-only shipment has no customs leg (not even greyed out).
- Customs is its own leg, with its own milestones.
- The same component in compact size is used in list rows.

## 4. Roles and perimeter

- Demo role switcher implemented as **navigation** (`/ops`, `/customer`), not hidden state, so deep links work. The switcher lives in the demo panel, with a perimeter banner (see `DECISIONS.md`), not in the page header.
- Single recipient role. Account type is data (Confirmed):

```ts
type Account = { id: string; name: string; type: "customer" | "subsidiary" }
```

- Demo accounts: **one external customer and one subsidiary**, each seeing only their own shipments. **One ops user** (a second one restricted to a single site was cut for time; the ops perimeter by site is described in the write-up, not demonstrated).
- Visible differences: document types (commercial invoice vs internal transfer document), a "Subsidiary" label, and (stretch) a filter by account type in operations.
- Out of scope (goes to the write-up as next step): user hierarchy inside a subsidiary, different notification rules per account type.

### Operations view
- Exception list on top, ranked by urgency, with a site filter (operator and mode filters and an account-type filter are stretch).
- Each exception proposes a next action, informed by how similar past cases were solved (in the prototype, a fixed cause-to-action table). Three possible actions (brief): notify customer, contact operator, upload document. Only **notify customer** has the full draft-and-approve flow (AI touchpoint 3); the other two record a request on the exception, with no AI drafting.
- Below: all shipments, with the same timeline the customer sees.
- Normalised status shows the original operator wording. A low-confidence normalisation shows an alert icon; a minimal select to set the correct status (an elaborate modal is stretch); once saved, the alert disappears.
- Layout default is stacked (exceptions, then all shipments). Tabs are an option if the page feels heavy.

### Customer view
- Simplified shipment list: delivery outlook, overall ETA (clearly an estimate), compact timeline.
- Detail: timeline, documents, contact to operations (phone) to resolve questions.
- Proactive alerts: if there is an incident, what it means and whether the customer needs to do something.
- The customer never sees an "exceptions" list: exceptions are an internal work queue. The customer sees plain-language outlook and, once ops approve it, a notice.

## 5. AI touchpoints (simulated, 3 touchpoints)

1. **Status normalisation.** Different operator vocabularies map to one vocabulary. Show confidence and provenance. *Proposed:* deterministic mapping table for known codes (no confidence shown, labelled "Rule"); the LLM handles only free text or unseen statuses (shown as a High / Medium band, labelled "AI"). In the Low band: "Needs review" state (ops) and the unknown state (customer); a minimal correction select lets ops fix it (an elaborate modal is stretch). Operator corrections are stored and extend the mapping table (key: operator + original text); in production they would need review before becoming rules (write-up).
2. **Delay risk and ETA.** Range with visible reasons based on history ("3 of the last 12 shipments on this route were delayed more than 24h at port"). In the write-up: a classical statistical model per route and operator produces the numbers; the LLM only explains them. Historical data in the demo is mock, and the write-up says so.
3. **Next action and drafted customer notice.** For an exception, suggest the action (in the prototype, from a fixed cause-to-action table) and draft the notice. A person reviews and approves it. The drafted notice ends with a "Based on:" line citing the event(s) (type, time, operator) it relies on. Once approved, it appears as an alert in the customer view. This closes the loop between roles.

Presentation rules: AI output is always estimated or proposed, never confirmed. It always shows source or reasons. It never acts without a human approval. An event's fact (what the operator reported, when) always stays confirmed; only its interpretation (normalised status, provenance, confidence) is what the AI output qualifies.

## 6. Demo panel and freshness

- **The zustand store holds inputs only:** raw operator events, the simulated clock, and ops decisions (status corrections, approved notices, recorded action requests). Everything else (normalised status, ETA, exceptions, urgency, alerts) is derived by pure functions over those inputs. The panel injects an event and everything recalculates. No derived state is hardcoded.
- The demo panel is a persistent drawer visible in **both** role views, labelled "Demo controls — not part of the product".
- Panel can simulate: port delay, customs hold, operator going silent (advance the clock), low-confidence status arriving. Also a reset.
- **Simulated clock anchored to a fixed date** (never `Date.now()`), otherwise the demo shows everything as stale when opened later.
- **Stale threshold depends on mode:** 24h without signal is normal for a vessel, not for a truck.
- "Last updated" visible. Refresh model for production (write-up): polling or SSE/websocket for the view, push/email for notifications.

## 7. Mock data

- 6 shipments, each hand-written to prove a challenge of the brief (cut from 12-15 on 2026-10-24 for time):
  1. Domestic road, no incidents.
  2. Hero: multimodal international (road, port, vessel, port, last-mile) with a port delay.
  3. Customs hold for a missing document.
  4. Operator silent (stale).
  5. Ambiguous status, low confidence.
  6. Delivered.
- 3 fictional operators with different raw formats (codes, English text, Spanish text), 3 sites, 2 recipient accounts.
- Synthetic data only. No real names, no personal data.
- The cause-to-action table and the drafted-notice templates (one per exception cause: port delay, customs hold, silent operator) live in mock data, never inside components.

## 8. Stack and engineering rules

- Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, zustand for mock state, Vercel. A thin data-access layer so the write-up can say "a real API replaces it". The layer resolves after a simulated 300-500 ms delay.
- **Next vs Vite defence:** the handbook says Vite for SPAs without SSR, and this prototype is effectively an SPA. Next.js App Router even though the prototype is effectively an SPA, because the real product needs a server-side data perimeter (a customer must never receive another customer's shipments), route handlers for operator webhooks, and authentication, none of which a Vite SPA provides. The prototype simulates the perimeter in a data-access layer that takes the actor as a parameter, so server enforcement replaces one module rather than the UI. Keep most components client-side under a thin layout, because App Router experience is dated.
- Handbook conventions: function components with named exports and `XProps` type, no `React.FC`, `type` not `interface`, avoid `as`, zod for validation, semantic design tokens only, no `@apply`/`!important`/`transition-all`, visible focus.
- Accessibility: semantic HTML, a label for every input, `aria-invalid` and `role="alert"` on errors, keyboard support. Original operator wording opens in a keyboard-accessible Popover (hover alone fails on touch and for keyboard users).
- Every screen has empty and loading states; error states only where they can really occur (unknown shipment id).
- Dates are ISO 8601 strings in UTC and are compared as strings only in that format.
- **Tests (Confirmed): 2-3 Vitest tests on pure logic only:** status normaliser, leg status derivation, perimeter filter. The delivery outlook is also pure and gets a test if time allows. No Playwright.
- Commits: `[issue-code] type(scope): subject`, header max 72 chars. There are no issue codes in this test: decide a convention (for example a fixed code) and note it in the README.
- Repo clean at delivery: no dead code, no TODOs, no empty comments.
- Workflow: Claude Code with Research, Plan, Implement, fresh context per phase, human review between phases, a `CLAUDE.md` with these rules.

## 9. Cuts

| Cut | Reason |
|---|---|
| Real maps | Cost without value for the brief |
| Document extraction | Out of the 8h scope; goes to next steps |
| Real authentication | Role switch is enough for a prototype |
| Persistence in localStorage | Panel reset is enough |
| TanStack Query | Production choice for the write-up, not needed with mock store |
| Playwright | Handbook allows few tests on pure logic |
| Free-form customer Q&A chat | Fragile with hardcoded answers |
| Customer plain-language summary (was touchpoint 4) | Timeline, ETA range and the approved alert already tell the customer what they need; a summary repeats them. Goes to the write-up as a next step. |
| Customer "notify me of changes" toggle | Only system proactive alerts are in scope. Add only if time is left on the last day |
| Subsidiary user hierarchy | Write-up, next steps |
| Second ops user restricted to one site | Time; the customer perimeter already proves the principle. Ops perimeter by site is described in the write-up, not demonstrated |
| 6 extra mock shipments (12-15 → 6) | Time (2026-10-24: 4.5h spent, step 1 of 10 done). The six hand-written cases already cover every challenge |
| Operator and mode filters (site filter kept) | Time; named as next steps in the write-up |
| Elaborate correction modal | Time. A minimal correction select stays in step 5 (decision 29) |
| One skeleton per screen | One shared skeleton component |

## 10. Decision log

| # | Decision | Alternatives | Why | Trade-off | Status |
|---|---|---|---|---|---|
| 1 | Store holds inputs only (raw events, simulated clock, ops decisions); everything else derived by pure functions | Store derived state per shipment | Demo panel injects an event and all recalculates; defendable architecture; tests land on pure logic | Needs discipline in selectors | Confirmed |
| 2 | Three data states (confirmed / estimated / unknown) as a type | Style-only convention | Reliability is the product principle; compiler enforces it | Slightly heavier mock data | Confirmed |
| 3 | Ops can correct how an event is interpreted (logged); they cannot hide data or edit facts or ETAs | Operator configures what the customer sees | Avoids accountability and configuration cost | Operators cannot hide a bad ETA | Confirmed |
| 4 | Timeline from an ordered list of variable legs | Fixed five-slot stepper | Shipments range from one leg to very complex | Layout testing with 1 and 6-7 legs | Confirmed |
| 5 | Overall ETA only for the customer; per-leg breakdown for ops when data allows | Per-leg ETA for everyone | Per-leg estimates stack uncertainty and clutter | Ops need enough data | Confirmed |
| 6 | Short English phrase per leg from normalised status | Free text per shipment | Consistent, cheap, language fixed to English | Less nuance | Confirmed |
| 7 | "Awaiting details from operator" for a leg without data | Show estimated progress | Never invent | None | Confirmed |
| 8 | One recipient role, account type as data | Two separate roles | Brief treats them as one role | Differences only in documents, label, filter | Confirmed |
| 9 | Customer alerts = proactive system alerts only | Add subscription toggle | Closes the loop between roles; toggle is an extra | Toggle only if time is left | Confirmed |
| 10 | Normalisation: rules first, LLM for the rest | LLM for everything | A mapping table solves known codes; LLM adds value on free text | Needs provenance label in UI | Confirmed |
| 11 | Customer-facing AI is limited to the approved notice with cited events; no summary or Q&A | Hardcoded Q&A chat; plain-language summary | Does not break on unexpected input; avoids repeating what the timeline and the approved alert already show | Less "wow" | Confirmed |
| 12 | ETA: statistical model, LLM explains | LLM predicts the ETA | Numbers must be reproducible and auditable | More to describe in write-up | Confirmed |
| 13 | Simulated clock on a fixed date | `Date.now()` | Demo must not rot over time | Panel needs a clock control | Confirmed |
| 14 | Popover for original operator wording | Hover tooltip only | Touch and keyboard access (handbook) | Slightly more UI | Confirmed |
| 15 | Next.js App Router | Vite SPA (handbook default for SPAs) | Production needs server perimeter, webhooks, auth | Needs defence in the interview (see §8) | Confirmed |
| 16 | 2-3 Vitest tests on pure logic | Broader coverage, Playwright | Time budget; handbook accepts it | Low coverage, stated in limitations | Confirmed |
| 17 | Commit issue code: the plan step id, `[MB-S01]`, `[MB-S02]`… (`[MB-S00]` for planning docs). Revised 2026-10-24; the first commits used `[S0]` and were not rewritten | A fixed placeholder `[MB-ST]`; no issue code | This test has no real tracker; the step id gives each commit traceability to the plan without inventing one | Early history mixes `[S0]` and `[MB-S0x]` | Confirmed |
| 18 | Operator events are confirmed facts; their normalised meaning carries provenance (rule, AI with a High/Medium/Low band, or correction). Below threshold, customers see "Awaiting details from operator" until ops corrects it. Ops corrections are stored and extend the mapping table (key: operator + original text) | Let the LLM re-guess each time; discard corrections | Corrections should make the mapping table smarter over time, not repeat the same review | Mapping table needs a durable store, even if mocked | Confirmed |
| 19 | Three next actions from the brief (notify customer, contact operator, upload document); only "notify" has the full draft-and-approve flow, the other two record a request on the exception | Build the full draft-and-approve flow for all three actions | Only "notify" reaches the customer directly, so it is the one that needs AI drafting and human approval; the other two are internal requests | Contact-operator and upload-document read as a logged request, not a finished action | Confirmed |
| 20 | Timeline line style answers "what do we know for sure?": solid = finished (terminal status), dashed = started and unfinished, muted = no reliable status (no event, or the latest event needs review). Ops only: warning on a muted leg past its stale threshold | Style as progress only (done / in progress / pending); dashed for a silent leg | A silent leg drawn as "in progress" would assert something nobody confirmed; the customer never sees the warning | Muted does not distinguish "not started" from "silent" visually, only by text | Confirmed |
| 21 | **Revised 2026-10-24.** When the latest event of a leg needs review, or a leg is silent past due, the current state is "Awaiting details from operator" and the last confirmed fact is shown beneath it, labelled as past with its timestamp | Hide the last confirmed fact entirely (the original decision); show it as the current status | An old fact presented as current would mislead, but a true fact that happened is not invented data, and hiding it threw real information away | One more line to design and test on every leg | Confirmed (supersedes the original) |
| 22 | Suggested next action comes from a fixed cause-to-action table, labelled "Suggested (simulated)" | Model or heuristics over past cases; no suggestion | No real case history exists in the prototype; a table is predictable in the demo and honest about what is simulated | Not "learning"; production would rank actions by similar past cases (write-up) | Confirmed |
| 23 | Data-access layer resolves after a simulated 300-500 ms delay; error state only for unknown shipment ids | Instant mock data; a toggle to force errors | Loading states become real and match a future API; a "mock failure" cannot be triggered honestly | Slightly slower demo | Confirmed |
| 24 | Customer delivery outlook ("On time" / "Possible delay" / "Delayed") is a pure function of ETA range vs promised date (`planned.end` of last leg) | Hardcoded labels per shipment | Same inputs-only principle as everything else; testable | Promised date is an assumption (booking date) | Confirmed |
| 25 | Single ops user; demo panel visible in both roles and labelled as demo-only | Second ops user restricted to one site; panel only in ops | Time; the customer perimeter already proves the principle; the panel must be reachable from either role to demo the loop | Ops perimeter by site is not demonstrated | Confirmed |
| 26 | AI confidence is shown as High / Medium / Low bands; rule matches and corrections show none; no percentages anywhere | Raw scores; "100%" for rules | A percentage implies precision the mock model does not have; rules are deterministic, not probabilistic | Coarser triage signal for ops | Confirmed |
| 27 | The role switch lives in the demo panel, with a perimeter banner; routes stay real | Persistent header switcher | A header switcher reads as a real multi-role feature; the banner keeps the demo mechanism honestly labelled | One more click to switch | Confirmed |
| 28 | Scope cut on 2026-10-24 after 4.5h: 6 shipments, site filter only, correction modal as stretch, one shared skeleton | Keep the full plan (about 6 more hours); drop a role or a touchpoint | The cuts remove volume, not a role, a touchpoint or the reliability model | Corrections are a minimal select, not an elaborate modal | Confirmed |
| 29 | A status that needs review raises a `needs-review` exception (caution) with the internal action "review status", which opens the correction select | Alert on the shipment only (no exception); no correction control | Case 5 would otherwise be invisible in the inbox, and the human control of touchpoint 1 needs an entry point. The exception says "review this", never "this is true" | A fourth action (internal, no customer notice) next to the three of the brief | Confirmed |

## 11. Time budget (about 7.5h)

| Block | Hours |
|---|---|
| Setup, `CLAUDE.md`, first Vercel deploy (day one) | 0.5 |
| Domain, mock data, pure logic, 3 tests | 1.25 |
| Shipment detail and timeline | 1.25 |
| Operations view | 1.25 |
| Customer view | 0.75 |
| Demo panel | 0.5 |
| Polish, states, accessibility | 0.75 |
| README and `DECISIONS.md` | 0.25 |
| Write-up (max 4 pages, aim for less) | 1.0 |

If time runs short, cut in this order: per-leg breakdown for ops, account-type filter.

**Revised 2026-10-24.** 4.5h were spent through step 1 (research, plan, design, app shell and project chat). Remaining 3.5h: 0.3h aligning docs, about 2h for steps 2a-8a with the cuts in §9, 0.8h write-up, 0.3h README, `AI_USAGE` and final checks.

## 12. Write-up outline (max 4 pages)

1. Where AI goes and why (3 touchpoints, rules vs model, human approval, how each reaches production).
2. System approach: operator adapters (webhook/polling/EDI/email parsing), normalisation pipeline, event store, derived ETA and exceptions, notifications, auth and perimeter on the server, TanStack Query, a real database. Only claim what Marc can defend in the interview.
3. Assumptions (booking dates `planned`, promised date = `planned.end` of last leg), known limitations (mock history, 2-3 tests, no real auth, ops perimeter by site not demonstrated, unreviewed low-confidence statuses shown to the customer as "Awaiting details"), prioritised next steps.

## 13. How I used AI (for README and write-up)

Keep an honest log while working: which tool (Claude Code, planning chat), for what (research, plan, implementation, review), what was generated, what was rewritten or rejected, and what was checked by hand. Fill this in as you go, not at the end.

## 14. Open items before starting

- ~~Confirm the "Proposed" decisions above when writing the plan.~~ Done  (research phase): decisions 10-14 confirmed, see §10. Cuts table (§9) reviewed and left as-is.
- ~~Decide the commit-code convention.~~ Done: step id as issue code (`[MB-S01]`), see §10 decision 17; noted in the README.
- ~~Write the Next vs Vite defence in two sentences for the interview.~~ Done, see §8.
- Still open (decide in `CLAUDE.md` or the plan): define `OpsDecision` as a union (corrections, approved notices, recorded action requests); give `aiFallback` the leg type; fix ISO-UTC dates in `CLAUDE.md`.