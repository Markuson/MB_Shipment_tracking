# Scope notes: MarsBased shipment tracking test

Status: scope session of 2026-10-22, updated 2026-10-23. Input for `DECISIONS.md`, the write-up and `CLAUDE.md`.
Target delivery: Mon 2026-10-26. Hard limit: Wed 2026-10-28 (one week from 2026-10-21).
Effort target: about 7.5h. The cap is 8h, and it is not a goal to use it.

Legend: **Confirmed** = agreed in the session. **Proposed** = suggested, not objected to, still to be validated when planning.

---

## 1. Product framing

- Fictional manufacturer: **Martian Industries**. Several production/warehouse sites, shipping to external customers and subsidiaries, domestic and international, via several operators, by road and sea.
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
| Status | Plain wording: "On time", "Possible delay", "Delayed" | Normalised status + original operator wording + normalisation confidence |
| Reason for delay | One plain sentence, only if there is a problem | Historical basis and sources |
| Unknown | "Awaiting details from operator" | "No data for 26h" + suggested action |

- No jargon such as "medium confidence" in the customer view.
- Ops can correct how an event is interpreted (logged); they cannot hide data or edit facts or ETAs. The human control point for the customer is the approval of the notice (touchpoint 3).

## 3. Shipment timeline (the star of the demo)

Confirmed behaviour:

- One horizontal line of **legs**, for example road, sea, customs, final delivery.
- **Solid** = completed and confirmed, with real date. **Dashed** = in progress, with estimate. **Disabled** = not started.
- Each leg has a very short **English** phrase, generated from the normalised status (one phrase per normalised status, not written per shipment): "Departed from port", "Pending customs check", "Left destination port".
- The normalised-status vocabulary is defined **per leg type** (road, port, sea, customs, last-mile), not as one global list: "Departed" means something different on a sea leg than on a road leg.
- **Fourth case:** leg in progress with no data. Drawn dashed with the text "Awaiting details from operator". No invented progress.
- **One overall ETA** (range, labelled "estimated"). Pending legs carry no date of their own. Operations may see a per-leg breakdown when there is enough data.
- **Variable number of legs.** The component renders from an ordered list of legs, with no fixed slots. It must cope with a single leg (warehouse to customer's door) and with very complex shipments (two ports, several customs). The demo contains no extremes, but check the layout with 1 leg and 6-7 legs. With many legs, completed ones can collapse.
- A domestic road-only shipment has no customs leg (not even greyed out).
- Customs is its own leg, with its own milestones.
- The same component in compact size is used in list rows.

## 4. Roles and perimeter

- Demo role switcher implemented as **navigation** (`/ops`, `/customer`), not hidden state, so deep links work.
- Single recipient role. Account type is data (Confirmed):

```ts
type Account = { id: string; name: string; type: "customer" | "subsidiary" }
```

- Demo accounts: **one external customer and one subsidiary**, each seeing only their own shipments. Two ops users, one of them restricted to a single site.
- Visible differences: document types (commercial invoice vs internal transfer document), a "Subsidiary" label and a filter by account type in operations.
- Out of scope (goes to the write-up as next step): user hierarchy inside a subsidiary, different notification rules per account type.

### Operations view
- Exception list on top, ranked by urgency, with filters (site, operator, mode, account type).
- Each exception proposes a next action, informed by how similar past cases were solved. Three possible actions (brief): notify customer, contact operator, upload document. Only **notify customer** has the full draft-and-approve flow (AI touchpoint 3); the other two record a request on the exception, with no AI drafting.
- Below: all shipments, with the same timeline the customer sees.
- Normalised status shows the original operator wording. A low-confidence normalisation shows an alert icon; it opens a modal with a select to set the correct status; once saved, the alert disappears.
- Layout default is stacked (exceptions, then all shipments). Tabs are an option if the page feels heavy.

### Customer view
- Simplified shipment list: status, overall ETA (clearly an estimate), compact timeline.
- Detail: timeline, documents, contact to operations (phone) to resolve questions.
- Proactive alerts: if there is an incident, what it means and whether the customer needs to do something.

## 5. AI touchpoints (simulated, 3 touchpoints)

1. **Status normalisation.** Different operator vocabularies map to one vocabulary. Show confidence and provenance. *Proposed:* deterministic mapping table for known codes (confidence 100%, labelled "Rule"); the LLM handles only free text or unseen statuses (for example 87%, labelled "AI"). Below a threshold: "Needs review" state and the operator modal. Operator corrections are stored and extend the mapping table (key: operator + original text); in production they would need review before becoming rules (write-up).
2. **Delay risk and ETA.** Range with visible reasons based on history ("3 of the last 12 shipments on this route were delayed more than 24h at port"). In the write-up: a classical statistical model per route and operator produces the numbers; the LLM only explains them. Historical data in the demo is mock, and the write-up says so.
3. **Next action and drafted customer notice.** For an exception, suggest the action based on similar past cases and draft the notice. A person reviews and approves it. The drafted notice ends with a "Based on:" line citing the event(s) (type, time, operator) it relies on. Once approved, it appears as an alert in the customer view. This closes the loop between roles.

Presentation rules: AI output is always estimated or proposed, never confirmed. It always shows source or reasons. It never acts without a human approval. An event's fact (what the operator reported, when) always stays confirmed; only its interpretation (normalised status, provenance, confidence) is what the AI output qualifies.

## 6. Demo panel and freshness

- **The zustand store holds inputs only:** raw operator events, the simulated clock, and ops decisions (status corrections, approved notices, recorded action requests). Everything else (normalised status, ETA, exceptions, urgency, alerts) is derived by pure functions over those inputs. The panel injects an event and everything recalculates. No derived state is hardcoded.
- Panel can simulate: port delay, customs hold, operator going silent (advance the clock), low-confidence status arriving. Also a reset.
- **Simulated clock anchored to a fixed date** (never `Date.now()`), otherwise the demo shows everything as stale when opened later.
- **Stale threshold depends on mode:** 24h without signal is normal for a vessel, not for a truck.
- "Last updated" visible. Refresh model for production (write-up): polling or SSE/websocket for the view, push/email for notifications.

## 7. Mock data

- 12-15 shipments, 6 of them hand-written, each one proving a challenge of the brief:
  1. Domestic road, no incidents.
  2. Hero: multimodal international (road, port, vessel, port, last-mile) with a port delay.
  3. Customs hold for a missing document.
  4. Operator silent (stale).
  5. Ambiguous status, low confidence.
  6. Delivered.
- 3 fictional operators with different raw formats (codes, English text, Spanish text), 3 sites, 2 recipient accounts.
- Synthetic data only. No real names, no personal data.

## 8. Stack and engineering rules

- Next.js App Router, TypeScript, Tailwind v4, shadcn/ui, zustand for mock state, Vercel. A thin data-access layer so the write-up can say "a real API replaces it".
- **Next vs Vite defence:** the handbook says Vite for SPAs without SSR, and this prototype is effectively an SPA. Next.js App Router even though the prototype is effectively an SPA, because the real product needs a server-side data perimeter (a customer must never receive another customer's shipments), route handlers for operator webhooks, and authentication, none of which a Vite SPA provides. The prototype simulates the perimeter in a data-access layer that takes the actor as a parameter, so server enforcement replaces one module rather than the UI. Keep most components client-side under a thin layout, because App Router experience is dated.
- Handbook conventions: function components with named exports and `XProps` type, no `React.FC`, `type` not `interface`, avoid `as`, zod for validation, semantic design tokens only, no `@apply`/`!important`/`transition-all`, visible focus.
- Accessibility: semantic HTML, a label for every input, `aria-invalid` and `role="alert"` on errors, keyboard support. Original operator wording opens in a keyboard-accessible Popover (hover alone fails on touch and for keyboard users).
- Every screen has empty, loading and error states.
- **Tests (Confirmed): 2-3 Vitest tests on pure logic only:** status normaliser, ETA/urgency, perimeter filter. No Playwright.
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
| 17 | Commit issue code: fixed placeholder `[MB-ST]` | No issue code; decide later | No real issue codes for this test; a fixed code keeps the required format without inventing a tracker | None | Confirmed |
| 18 | Operator events are confirmed facts; their normalised meaning carries provenance (rule/AI, confidence). Below threshold, customers see "Awaiting details from operator" until ops corrects it. Ops corrections are stored and extend the mapping table (key: operator + original text) | Let the LLM re-guess each time; discard corrections | Corrections should make the mapping table smarter over time, not repeat the same review | Mapping table needs a durable store, even if mocked | Confirmed |
| 19 | Three next actions from the brief (notify customer, contact operator, upload document); only "notify" has the full draft-and-approve flow, the other two record a request on the exception | Build the full draft-and-approve flow for all three actions | Only "notify" reaches the customer directly, so it is the one that needs AI drafting and human approval; the other two are internal requests | Contact-operator and upload-document read as a logged request, not a finished action | Confirmed |

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

If time runs short, cut in this order: second ops user, per-leg breakdown for ops, account-type filter.

## 12. Write-up outline (max 4 pages)

1. Where AI goes and why (3 touchpoints, rules vs model, human approval, how each reaches production).
2. System approach: operator adapters (webhook/polling/EDI/email parsing), normalisation pipeline, event store, derived ETA and exceptions, notifications, auth and perimeter on the server, TanStack Query, a real database. Only claim what Marc can defend in the interview.
3. Assumptions, known limitations (mock history, 2-3 tests, no real auth), prioritised next steps.

## 13. How I used AI (for README and write-up)

Keep an honest log while working: which tool (Claude Code, planning chat), for what (research, plan, implementation, review), what was generated, what was rewritten or rejected, and what was checked by hand. Fill this in as you go, not at the end.

## 14. Open items before starting

- ~~Confirm the "Proposed" decisions above when writing the plan.~~ Done 2026-10-22 (research phase): decisions 10-14 confirmed, see §10. Cuts table (§9) reviewed and left as-is.
- ~~Decide the commit-code convention.~~ Done 2026-10-22: fixed placeholder `[MB-ST]`, see §10 decision 17. Update the README to note this.
- ~~Write the Next vs Vite defence in two sentences for the interview.~~ Done 2026-10-23, see §8.
