# Decisions

Each entry: what I chose, what else I considered, why, and the trade-off I accept.

## Template

### <Decision title>
- **Chose:** ...
- **Considered:** ...
- **Why:** ...
- **Trade-off I accept:** ...

## Scope: what I left out and why

- ...

### Package manager: pnpm over npm
- **Chose:** pnpm, with `pnpm-lock.yaml` committed and `"packageManager": "pnpm@11.24.0"` pinned in `package.json`.
- **Considered:** npm (the scaffold default), yarn.
- **Why:** pnpm's content-addressable store and hard-linking make installs and CI noticeably faster, and its strict `node_modules` layout (packages can't silently resolve to undeclared dependencies) catches dependency mistakes npm would hide.
- **Trade-off I accept:** one more tool to have installed locally; Vercel and most CI images support it natively via corepack, so this doesn't cost anything in deployment.

## Known issues accepted as-is

### `pnpm audit` high-severity finding (eslint tooling)
- **Chose:** leave `eslint-config-next` and its dependency chain (`@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`) as installed.
- **Considered:** forcing a dependency bump, which downgrades `eslint-config-next` to `14.2.35`.
- **Why:** the flagged vulnerability is a ReDoS/stack-exhaustion issue in `braces`, reachable only through the lint tooling (`pnpm lint`), never through the app's runtime or build output. The only available fix is a major downgrade incompatible with Next.js `16.4.2`, and as of 2026-10-23 `braces` has no patched release to upgrade to instead (even the Next.js `16.5.0` canary still depends on the same vulnerable chain) — `pnpm audit` reports "Patched versions: None".
- **Trade-off I accept:** the dev-only lint toolchain carries an unpatched advisory until upstream (`braces`) ships a fix.

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

### Ops corrections are keyed by operator wording, not by shipment
- **Chose:** A correction maps an operator's exact raw text to a status. It applies to every event with that wording, on any shipment, and is checked before rules and AI.
- **Considered:** Correcting the status of a single leg.
- **Why:** A leg-level correction would hide newer events behind it. Keyed by wording, a correction fixes the interpretation once and teaches the system for every future shipment.
- **Trade-off I accept:** If an operator uses the same wording for two different situations, one correction applies to both. Production would need a way to scope or revoke corrections.
## What I would do with more time

- ...
