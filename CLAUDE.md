@AGENTS.md

# Project: shipment tracking prototype (MarsBased technical test)

Read `docs/assignment.md` first. This is a frontend-only prototype with synthetic data, deployed on Vercel, plus a short write-up. The goal is judgment and polish on a focused scope, not coverage.

## Rules that come from the brief
- Frontend only: no backend, no route handlers, no database, no real integrations. Everything is mocked, with invented data.
- Never invent statuses or ETAs. Confirmed data and estimates must look different, and an unknown stays unknown.
- Each viewer only sees their own scope.
- AI features are simulated, but each one must show its basis and be justified. A person approves actions that affect a customer.

## Stack
- Next.js App Router, React 19, TypeScript (strict), Tailwind CSS v4 configured in CSS (no `tailwind.config.ts`).
- Vitest + React Testing Library. Add libraries only when the plan needs them, and say why in `DECISIONS.md`.

## Structure
- Decided in the plan, not here. Keep pure logic separate from React, and keep invented data in one place.
- Plans, research and decisions go in `docs/`.

## Code conventions (MarsBased)
- Function components with the `function` keyword and named exports. Default exports only for Next.js file conventions.
- A named `XProps` type right above each component. No `React.FC`, no `forwardRef`.
- `type`, never `interface`. Avoid `as` casts. Handle nullables early.
- Long descriptive names. No single-letter variables. Short functions. Business logic in pure functions.
- Comment the why, never the what. No TODO comments. Delete dead code. No unneeded dependencies.
- No hand-written `useMemo`, `useCallback` or `memo` without profiling.
- Never read the clock (`Date.now()`, `new Date()`) during render. Server and browser would disagree. Format dates with a fixed time zone.

## Styling and accessibility
- Components use semantic tokens only (`bg-primary`, `text-muted-foreground`). Never palette classes. Add a token in `globals.css` if a role is missing.
- Compose classes with `cn()`, variants with `cva`. No `@apply`, no `!important`, no `transition-all`. Keep focus outlines.
- Semantic HTML, a visible label for every input, keyboard support, and never convey state by colour alone.
- The ESLint JSX rules can split text and expressions across lines and silently drop spaces. For strings that mix text and values, use one template literal: `{`To ${city}, ${country}`}`. Always check the rendered page.

## Tests
- Test names say what the code does, without "should". Arrange-Act-Assert. No shared state, no Faker. Query by role and label.
- Test the rules that carry the product, not the markup.

## Git
- Commit format: `[MB-ST] type(scope): subject`. Fixed placeholder issue code, since this test has no real tracker. Types: fix, feat, deploy, chore, docs, test. Header at most 72 characters. Small commits, no feature mixed with refactor.

## Workflow with AI
- Research, then plan, then implement, with a fresh context per phase.
- Implement one plan step at a time, run `npm run check`, open the page and look at it, then commit.
- Read every generated test. Remove empty or obvious comments. Keep `docs/AI_USAGE.md` updated with what the AI did and what was changed by hand.
- Definition of done for a step: checks pass, the page was opened, empty/loading/error states considered, accessibility basics checked.
