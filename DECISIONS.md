# Decisions

Each entry: what I chose, what else I considered, why, and the trade-off I accept.

## Scope: what I left out and why

- **Customer Q&A and AI summary** — see "Customer summary and Q&A cut from AI scope," below.
- **Dark mode** — see "Light mode only," below.
- **Real maps** — cost without demo value for this brief.
- **Document extraction** — out of the 8h budget; a next step.
- **Real authentication** — the demo panel's role switch is enough for a prototype; there's no backend to authenticate against.
- **Extra mock shipments, operator and mode filters, elaborate correction modal** — see "Scope cut after 4.5 hours," below.

### Scope cut after 4.5 hours
- **Chose:** 6 mock shipments (one per challenge of the brief), a single ops filter (site), a provenance badge, popover and a minimal correction select instead of an elaborate modal, and one shared loading skeleton. The operator and mode filters and the elaborate modal are stretch, built only if time remains.
- **Considered:** keeping the full plan (about 6 more hours of work); dropping a whole role or an AI touchpoint instead.
- **Why:** 4.5 of the 8 hours were spent before the prototype had any screen beyond the app shell. The six hand-written shipments already prove every challenge, so the cuts remove volume, not a role, a touchpoint or the reliability model.
- **Trade-off I accept:** touchpoint 1 shows its basis (rule, AI band, corrected, original wording) and the needs-review state, and ops corrects it with a minimal select; in production the correction loop needs review before a correction becomes a rule. The ops portfolio looks thinner with 6 shipments.

### A status that needs review is an exception
- **Chose:** a latest event whose interpretation needs review raises a `needs-review` exception (caution), with the internal action "review status" that opens the correction select. The customer sees "Awaiting details from operator" until ops decides.
- **Considered:** an alert on the shipment only, with no exception in the inbox.
- **Why:** with an alert only, the ambiguous case is invisible in the inbox, and the human control of AI touchpoint 1 has no entry point. The exception says "review this", never "this is true", so it does not treat the guess as a fact.
- **Trade-off I accept:** a fourth next action next to the three of the brief. It is internal, so it has no customer notice and no approval flow.

### Package manager: pnpm over npm
- **Chose:** pnpm, with `pnpm-lock.yaml` committed and `"packageManager": "pnpm@11.24.0"` pinned in `package.json`.
- **Considered:** npm (the scaffold default), yarn.
- **Why:** pnpm's content-addressable store and hard-linking make installs and CI noticeably faster, and its strict `node_modules` layout (packages can't silently resolve to undeclared dependencies) catches dependency mistakes npm would hide.
- **Trade-off I accept:** one more tool to have installed locally; Vercel and most CI images support it natively via corepack, so this doesn't cost anything in deployment.

## Product model

### Variable number of legs per shipment, not a fixed template per mode
- **Chose:** A shipment is an ordered list of legs (1 to ~7). Each leg has a type (road, port, sea, customs, last-mile) with its own status vocabulary and operator.
- **Considered:** A fixed template per mode (every sea shipment gets the same steps); a flat list of milestones with no legs.
- **Why:** Real shipments combine modes unpredictably. A domestic delivery is one road leg; an international one can be road → port → sea → port → customs → last-mile. A fixed template would force empty or invented steps, which breaks the reliability principle.
- **Trade-off I accept:** The timeline component must read well at any length, including on mobile. Mock data must cover both extremes (1 leg and 6-7 legs) to prove it.

### A warning on screen always means there is something to act on
- **Chose:** A leg that is due but has no events yet stays neutral during a grace period; the warning appears only when the stale threshold is crossed, together with an ops exception.
- **Considered:** Warn as soon as a leg is due without data.
- **Why:** Operators report with delay. Warning during normal latency would train users to ignore warnings, which defeats managing by exception.
- **Trade-off I accept:** A real problem is surfaced a few hours later than it could be. The threshold is per leg type, so the delay is shorter on road than at sea.

### The customer status alert is derived; an approved notice is a separate message
- **Chose:** two separate blocks. The status alert is derived from the same exceptions as the ops inbox, appears on its own, and covers only delays and customs holds; it states what is confirmed and what is not, and never gives a new delivery date. The approved notice (step 7) is a message drafted with AI and approved by ops, shown as its own block under the alert, never merged into it.
- **Considered:** showing nothing to the customer until ops approve a notice (the earlier plan); one combined banner.
- **Why:** the alert only restates facts already on the customer's timeline ("Delayed" on the sea leg), so it is not an action that affects the customer and needs no approval. Waiting for an approval to show a fact would hide it. The notice is different: it explains what is being done, in words someone chose, so a person approves it.
- **Trade-off I accept:** a delay can show both an alert and, once approved, a notice, so the notice must add something rather than repeat the facts. Silence and statuses under review never produce an alert; a notice about a silent operator is a human decision to tell the customer something the status alert never shows.

### ETA: the promised date shifted by simulated route history
- **Chose:** a pure estimator that is confirmed once the last leg is delivered; otherwise the promised date plus an hour range taken from mock route history for the shipment's situation (on schedule, or delayed on a given leg type). The situation comes from the existing exceptions. A customs hold, a status under review, a silent operator, a route or situation with no history, or a range already in the past all give "unknown", never a default date.
- **Considered:** leaving the ETA to step 7 and showing only the promised date until then; a fixed buffer added to every promise.
- **Why:** the customer's delivery outlook needs an estimate, and an estimate must have a basis it can cite. A fixed buffer would be an invented number with nothing to cite.
- **Trade-off I accept:** the history numbers are invented, and chosen for the story the demo tells, not measured: the hero starts on time, and the berth wait the demo panel reports turns it into a possible delay rather than a certain one, because the booking leaves slack before the promised date. The ETA and its reasons are labelled as based on simulated route history wherever they appear. In production the ranges come from a statistical model per route and operator.

### Silence only counts on the leg that is next to report
- **Chose:** a silent leg can go stale (warning, "No data for Xh", `silent-operator` exception) only once every earlier leg of its shipment has a confirmed, finished status. Until then ops see it, like the customer, as "Awaiting details from operator".
- **Considered:** judging every leg by its own planned start alone (the previous rule).
- **Why:** the cargo has not reached a downstream leg, so its operator has nothing to report. Flagging it counted one problem twice (a customs hold also showed "no data" on the last mile) and pointed ops at an operator who had done nothing wrong.
- **Trade-off I accept:** a downstream operator that really fails is only flagged after the earlier legs finish. A leg whose finish is still under review also holds back the legs behind it.

### Ops corrections are keyed by operator + exact wording, not by shipment
- **Chose:** A correction maps one operator's exact raw text to a status — the key is the (operator, wording) pair, not the wording alone. It applies to every future event matching that exact pair, and is checked before rules and AI.
- **Considered:** Correcting the status of a single leg; keying the correction by raw wording alone, shared across every operator.
- **Why:** A leg-level correction would hide newer events behind it. Keying by wording alone would be wrong too — the same raw text from two different operators can mean different things, since coding conventions differ by carrier — so the key has to be the pair, fixing the interpretation precisely and teaching the system for every future shipment from that operator.
- **Trade-off I accept:** If one operator uses the same wording for two different situations, one correction applies to both. Production would need a way to scope or revoke corrections.

## Design system

### Light mode only
- **Chose:** no dark-mode tokens, no theme toggle.
- **Considered:** a dark/light pair from the start, since ops tools often run on always-on displays.
- **Why:** nothing in the brief or scope calls for a 24/7 wall-display use case, and a second theme would double every WCAG contrast check in `docs/design.md` for no demo value.
- **Trade-off I accept:** a future NOC-style dark mode would need its own contrast pass, not a simple token flip.

### One font family (Hanken Grotesk)
- **Chose:** a single typeface for display, UI and data text, varying only weight/size.
- **Considered:** a second, monospace face for shipment IDs, timestamps and coordinates — a common logistics-tool convention.
- **Why:** the content doesn't need the extra "systems" texture a mono face implies, and one family keeps the type scale small enough to stay consistent and accessible.
- **Trade-off I accept:** data fields read slightly less "tabular" than a mono-styled ops tool would.

### Last confirmed fact shown separately from the current state
- **Chose:** when a leg's current state is unknown (needs-review event, or silent past due), show "Awaiting details from operator" as the current state, and the last confirmed fact beneath it, labelled as past, with its timestamp.
- **Considered:** hide the old fact entirely, exactly as if no event had ever arrived (the prior rule).
- **Why:** an old fact presented as current would mislead; but a true fact that happened is not invented data, and hiding it threw away real information a reader could use. Showing both, clearly separated, satisfies "never invent" without discarding what is actually known.
- **Trade-off I accept:** one more line to design and test for on every leg; the timeline can look busier when several legs are mid-review at once.

### Planned/promised as a fourth data category
- **Chose:** a commitment or published schedule (promised delivery date, scheduled vessel departure) is its own category — plain labelled text, no line style, never merged with the estimated ETA.
- **Considered:** folding it into "confirmed" (it is certain, in a sense) or treating it as the baseline an estimate is compared against with no visual identity of its own.
- **Why:** a promise is neither an observed fact nor a calculated range — conflating it with either would blur exactly the distinction the reliability model exists to protect.
- **Trade-off I accept:** one more label for a reader to learn; mitigated by always pairing it with the estimate it is being compared to ("Promised 15 Nov · Estimated 14–17 Nov").

### Simulated demo clock
- **Chose:** a single simulated `now` in mock state, fixed at a chosen instant, advanced only through the demo panel; every derived value (last-updated, stale detection, delay risk, ETA) reads from it.
- **Considered:** `Date.now()` at render time.
- **Why:** with real wall-clock time, opening the demo days after the seed data was written would show every leg as stale; a fixed, advanceable clock keeps the demo reproducible whenever it's opened.
- **Trade-off I accept:** stale thresholds per leg type are modelled assumptions, not operator facts, and are labelled as such.

### Confidence shown as bands, never percentages
- **Chose:** AI inferences show only High / Medium / Low; rule matches and human corrections show no confidence at all.
- **Considered:** showing the raw score (e.g. "87%") for AI, and "100%" for rule matches and corrections to signal certainty.
- **Why:** a raw percentage implies a precision the mock model doesn't have; a rule match or a human correction isn't a confidence estimate in the first place — it's deterministic, so attaching a number to it would misrepresent it as probabilistic.
- **Trade-off I accept:** ops loses the finer-grained signal a raw score gives when triaging borderline cases; the band is coarser by design.

### Customer summary and Q&A cut from AI scope
- **Chose:** no customer-facing AI summary paragraph and no free-form Q&A chat; AI touchpoints stay at exactly three (normalisation, ETA/delay risk, suggested action + drafted notice).
- **Considered:** a chat-style Q&A over shipment data; a plain-language summary alongside the timeline.
- **Why:** keeps the demo reliable — a free-form surface risks an answer with nothing to cite, breaking the "every AI output shows its basis" rule — and keeps the scope small and auditable.
- **Trade-off I accept:** a customer with an unusual question still has to contact support; there's no self-serve fallback besides that.

### Role switch moved into the demo panel, with a perimeter banner
- **Chose:** no "Ops / Customer" links in the page header; the role switch lives in the demo panel, and a banner ("Demo: viewing as Operations · Valencia and Zaragoza sites") always states the active perimeter.
- **Considered:** a persistent header switcher, visible on every screen.
- **Why:** a header switcher reads as a real product feature (multi-role account switching), which this prototype doesn't have — the banner keeps the demo mechanism honestly labelled as demo-only, matching how the demo panel itself is already labelled.
- **Trade-off I accept:** switching role takes one more click (open the panel) than a one-click header toggle would.

### Mobile leg timeline: legs stack, same component
- **Chose:** on narrow screens the same timeline component stacks its legs vertically, each leg keeping its own line glyph, state text and last confirmed fact.
- **Considered:** a condensed "Leg X of Y · Mode" view showing one leg at a time (the original choice); a separate vertical stepper component.
- **Why:** stacking reuses one component, so solid / dashed / muted mean the same at every width, and it costs far less than a second condensed view inside the 8h budget. The condensed view was cut for time on 2026-10-25.
- **Trade-off I accept:** a 6-leg shipment is a long column on mobile instead of one leg at a glance.

### Icons: lucide-react
- **Chose:** `lucide-react`, with named imports for the few icons `docs/design.md` assigns to each status.
- **Considered:** hand-drawn inline SVGs; no icons, leaving state to text and colour.
- **Why:** every status pairs an icon with its label so colour never carries meaning alone. lucide is the icon set shadcn/ui uses by default, and named imports keep only the icons in use.
- **Trade-off I accept:** one more runtime dependency for about six icons.

### Demo state: zustand, holding inputs only
- **Chose:** `zustand` for the demo state. The store holds only inputs (the simulated clock and the operator events injected by the demo panel); everything shown is derived from them by the existing pure functions.
- **Considered:** React context with `useReducer` in the root layout, which needs no dependency.
- **Why:** the demo panel and the pages must share one clock and one event feed across route navigations. A zustand store needs no provider, and selectors let each component subscribe to the one input it reads.
- **Trade-off I accept:** one more runtime dependency, and the store lives at module level. It is only ever written from click handlers in the browser, so the server copy keeps its initial state.

### Server pages fetch, a thin client layer applies the demo state
- **Chose:** server pages keep resolving the viewer and calling the data-access layer, then pass the shipments to small client wrappers (`src/live/`). The wrappers append the injected events to those shipments and render the existing props-only components with the simulated clock.
- **Considered:** client components fetching on their own; demo state in cookies read by the server.
- **Why:** the perimeter is still applied on the server, loading states still work, and the store starts at the same instant the server renders with, so the page hydrates without a mismatch. Cookies would bring server-side state into a frontend-only prototype.
- **Trade-off I accept:** derivation now runs in the browser, so the domain logic ships in the client bundle. A full reload resets the demo, since browser storage was cut.

### The hero shipment starts on schedule; the demo panel reports its delay
- **Chose:** the seed shows the hero (shp-1002) at sea on schedule, and the demo panel's one event scenario reports the vessel waiting at anchor (`ANC`). The customs hold stays in the seed.
- **Considered:** keeping the delay in the seed and injecting a duplicate (nothing would visibly change); moving the customs hold out of the seed too.
- **Why:** the panel exists to show that a new operator report recalculates the ops exception and the customer view through the same domain functions. That needs one case that changes live; the customs hold is the only customs leg in the data, so it stays visible from the first screen.
- **Trade-off I accept:** the inbox opens with three exceptions instead of four until the delay is reported.

## Known issues accepted as-is

### Operator wording reaches the customer's browser in the page data
- **Chose:** the server passes whole shipments, raw operator events included, to the client layer, which normalises them in the browser. The customer page never renders the wording (a test checks this), but it is in the data the page receives, as are the rule table and the simulated AI guesses.
- **Considered:** normalising on the server and sending the customer only customer-safe views.
- **Why:** injected demo events must recalculate everything in the browser, which needs the raw events there. Server-side normalisation would break the demo panel.
- **Trade-off I accept:** in production the API returns customer-safe views and the wording never leaves the server; the prototype does not demonstrate that.

### `pnpm audit` high-severity finding (eslint tooling)
- **Chose:** leave `eslint-config-next` and its dependency chain (`@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`) as installed.
- **Considered:** forcing a dependency bump, which downgrades `eslint-config-next` to `14.2.35`.
- **Why:** the flagged vulnerability is a ReDoS/stack-exhaustion issue in `braces`, reachable only through the lint tooling (`pnpm lint`), never through the app's runtime or build output. The only available fix is a major downgrade incompatible with Next.js `16.4.2`, and as of 2026-10-23 `braces` has no patched release to upgrade to instead (even the Next.js `16.5.0` canary still depends on the same vulnerable chain) — `pnpm audit` reports "Patched versions: None".
- **Trade-off I accept:** the dev-only lint toolchain carries an unpatched advisory until upstream (`braces`) ships a fix.
