# Decisions

Each entry: what I chose, what else I considered, why, and the trade-off I accept.

## Scope: what I left out and why

- **Customer Q&A and AI summary** — see "Customer summary and Q&A cut from AI scope," below.
- **Dark mode** — see "Light mode only," below.
- **Real maps** — cost without demo value for this brief.
- **Document extraction** — out of the 8h budget; a next step.
- **Real authentication** — the demo panel's role switch is enough for a prototype; there's no backend to authenticate against.

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

### Mobile leg timeline: condensed, same component
- **Chose:** at 360px, the customer timeline becomes a "Leg X of Y · Mode" label over the same leg-line glyph, scaled down.
- **Considered:** a vertical stepper-style timeline for mobile.
- **Why:** reusing the same component keeps solid/dashed/muted meaning identical at every breakpoint; a second timeline paradigm would need its own accessibility and reliability pass.
- **Trade-off I accept:** a 6-7-leg shipment shows one leg at a time on mobile rather than the full line at a glance.

## Known issues accepted as-is

### `pnpm audit` high-severity finding (eslint tooling)
- **Chose:** leave `eslint-config-next` and its dependency chain (`@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`) as installed.
- **Considered:** forcing a dependency bump, which downgrades `eslint-config-next` to `14.2.35`.
- **Why:** the flagged vulnerability is a ReDoS/stack-exhaustion issue in `braces`, reachable only through the lint tooling (`pnpm lint`), never through the app's runtime or build output. The only available fix is a major downgrade incompatible with Next.js `16.4.2`, and as of 2026-10-23 `braces` has no patched release to upgrade to instead (even the Next.js `16.5.0` canary still depends on the same vulnerable chain) — `pnpm audit` reports "Patched versions: None".
- **Trade-off I accept:** the dev-only lint toolchain carries an unpatched advisory until upstream (`braces`) ships a fix.
