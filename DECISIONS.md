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

## What I would do with more time

- ...
