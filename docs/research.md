# Research: shipment tracking prototype

Source: `docs/assignment.md` (brief), `docs/scope-notes.md` (scoping session, 2026-10-22), `CLAUDE.md`.

## What the product must do

Give **Martian Industries** one consolidated, reliable view of shipment status that today is scattered across operator portals, email and phone calls. A shipment originates at one of several sites, travels by road and/or sea (often both within one international shipment), sometimes through customs, and is handled by one or more logistics operators who each report status in their own vocabulary and format. The product normalises that into one coherent timeline per shipment and tells each viewer, without them calling anyone, whether it is on time and when it will arrive — while never presenting a guess as a fact.

## The two roles and what each needs

- **Customer / subsidiary (self-service).** Sees only their own shipments. Needs: current status in plain language, one overall ETA clearly marked as an estimate, a milestone timeline, documents, and a proactive alert when something will be late or is affected by an incident. Success = "no need to call anyone."
- **Internal operations (logistics / customer support).** Sees a portfolio across sites and operators, scoped to their own site/account/role. Needs: an exception-first view (delay, hold, stale feed, low-confidence normalisation) ranked by urgency, with a suggested next action per exception, plus the same shipment detail the customer sees but with full provenance (original operator wording, confidence, reasons). Success = "stop chasing shipments one by one."

Both roles read the same underlying event data at different levels of disclosure (see `scope-notes.md` §2–3); ops can correct how an event is interpreted, never hide data or edit facts or ETAs — the human control point is approving the customer-facing notice, not filtering the data.

## Domain challenges and how each shapes the design

- **Operator heterogeneity (codes, free text, different languages).** → A normalisation step with two tiers: a deterministic rule table for known codes (100% confidence, labelled "Rule") and an LLM fallback for free text/unseen statuses (labelled "AI", with a confidence score). Below a threshold, the status is flagged "needs review" and routed to an operator-correction modal.
- **Multimodal, international shipments, with customs.** → The timeline is a variable-length ordered list of legs (not a fixed stepper), so it copes with one leg (warehouse→door) or six-plus (road→port→vessel→port→road, with customs as its own leg). A domestic shipment simply has no customs leg.
- **Multi-site origin.** → Site is a first-class filter/attribute in the operations view and in mock data generation, not an afterthought bolted on later.
- **Freshness / real time.** → A "last updated" timestamp is always visible; staleness is mode-dependent (24h silence is normal for a vessel, not for a truck). The zustand store holds inputs only: raw operator events, the simulated clock, and ops decisions (status corrections, approved notices, recorded action requests). Everything else (normalised status, ETA, exceptions, urgency, alerts) is derived by pure functions over those inputs, so there is no derived state to keep in sync by hand.
- **Reliability (never invent a status or ETA).** → Encoded as a type, not a convention: every datum is `confirmed | estimated | unknown`, each with a distinct required shape and a distinct visual treatment (solid / dashed+"estimated" / explicit unknown text). This is the one rule the compiler enforces rather than relying on discipline.

## Risks

- **Scope creep inside 8h.** The brief rewards judgment over coverage; the biggest risk is polishing extra AI features or an edge case instead of making the core timeline and the two role views airtight.
- **AI features reading as decorative rather than load-bearing.** Each of the 3 touchpoints must visibly show its basis (rule vs model, confidence, source) and route through human approval before affecting a customer — the brief explicitly asks this to be justified, not just demoed.
- **Next.js vs Vite choice needs a defensible answer in the interview** (handbook default for an SPA-shaped prototype is Vite); the stated defence is that the real product needs a server-side data perimeter, operator webhooks and auth, which a Vite SPA doesn't give for free.
- **Mock data under-covering the brief's challenges.** If the 12–15 shipments don't each stress a distinct domain challenge (stale feed, customs hold, low-confidence status, multimodal, delivered, no-incident), the demo under-proves the design.
- **Test budget is thin (2–3 Vitest tests).** Acceptable per the brief's time cap, but it means almost all correctness confidence comes from manually opening the app and checking empty/loading/error states — that discipline has to actually happen every step, not just be a checklist.

## Open questions — resolved 2026-10-22

1. **Proposed decisions (10-14 in scope-notes.md §10).** Confirmed now: rules-first normalisation with LLM fallback, statistical ETA model with LLM explaining it, citations in the customer notice, simulated fixed clock, Popover for operator wording.
2. **Touchpoint 4 scope.** Resolved 2026-10-23: touchpoint 4 cut (see `scope-notes.md` §9).
3. **Commit-code convention.** Fixed placeholder `[MB-ST]` (no real tracker for this test). `CLAUDE.md` and `scope-notes.md` updated; note it in the README too.
4. **Cuts table (§9).** Reviewed; one row added on 2026-10-23 (customer summary).
