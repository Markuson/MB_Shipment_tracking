# Shipment tracking prototype

Clickable frontend prototype of a consolidated shipment tracking product for Mars Industries, an industrial manufacturer. Frontend only: all data is synthetic and all AI outputs are simulated.

Live demo: https://mb-shipment-tracking.vercel.app/
Write-up: [docs/write-up.pdf](docs/write-up.pdf)

## Run it

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm check         # lint + typecheck + unit tests
pnpm build
```

Try the **Demo controls** panel at the bottom right of every page: switch between the ops and customer views, report a port delay on SHP-1002, and advance the simulated clock to watch statuses, warnings and exceptions recalculate.

## What it shows

- **Operations** (Valencia and Zaragoza sites): an exception inbox ranked by severity, each exception with a suggested next action; a site filter; every shipment's leg timeline with the operator's original wording and how it was interpreted (rule, AI with a confidence band, or ops correction). Notifying a customer opens an AI-drafted notice that a person approves before the customer sees it.
- **Customer** (Rhône Distribution, Hamburg subsidiary): only their own shipments, each with a delivery outlook (confirmed, estimated with its reasons, or unknown), a status alert for delays and customs holds, and any approved notice.

## Known limitations

- All data is synthetic and every AI output is simulated, including the route history behind the ETA estimates.
- A full page reload resets the demo controls to the start time.
- There is no authentication: the role and customer account come from the demo controls or `?account=`, and the data-access layer only simulates the perimeter.
- Tests cover the pure domain logic and one render check; there are no end-to-end tests, so layout and the notice dialog were checked by hand.
- The operator's raw wording is never shown to a customer, but it is in the page data their browser receives (see `DECISIONS.md`).

## Conventions

Commits follow `[MB-Sxx] type(scope): subject`, where `Sxx` is the plan step. The test has no real issue tracker, so the step id stands in for the issue code. See [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md).

## Decisions and AI usage

- [DECISIONS.md](./DECISIONS.md): scope, trade-offs and what I would do with more time.
- [docs/AI_USAGE.md](./docs/AI_USAGE.md): how AI tools were used while building this.
