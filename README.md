# Shipment tracking prototype

Clickable frontend prototype of a consolidated shipment tracking product for an industrial manufacturer. Frontend only: all data is synthetic and all AI outputs are simulated.

Live demo: https://mb-shipment-tracking.vercel.app/
Write-up: _add the link or file name here_

## Run it

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm check         # lint + typecheck + unit tests
pnpm build
```

Try the **Demo controls** panel at the bottom right of every page: switch between the ops and customer views, report a port delay on SHP-1002, and advance the simulated clock to watch statuses, warnings and exceptions recalculate.

## What it shows

_Describe the personas and the main flows once the scope is decided._

## Known limitations

- All data is synthetic and every AI output is simulated, including the route history behind the ETA estimates.
- A full page reload resets the demo controls to the start time.
- The operator's raw wording is never shown to a customer, but it is in the page data their browser receives (see `DECISIONS.md`).

## Conventions

Commits follow `[MB-Sxx] type(scope): subject`, where `Sxx` is the plan step. The test has no real issue tracker, so the step id stands in for the issue code. See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## Decisions and AI usage

- [DECISIONS.md](./DECISIONS.md): scope, trade-offs and what I would do with more time.
- [docs/AI_USAGE.md](./docs/AI_USAGE.md): how AI tools were used while building this.
