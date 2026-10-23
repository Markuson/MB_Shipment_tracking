# Design: shipment tracking prototype

Visual system for `/ops` and `/customer`. Input for plan step 1 (design tokens + app shell).

## Directions considered

Two directions were drafted: **A, "Control tower"** — one flexible leg-line row component, calm and airy, scaling from customer card to compact ops row — and **B, "Manifest"** — a dense bracketed grid modelling a bill of lading. Chose **A**: the token system has to serve both the dense ops exception queue and the reassuring customer view, and B's document-grid density reads as bureaucratic for the customer, where A's single component keeps both roles feeling like one product. B's grid stays available as a future dense mode for ops only, not adopted now.

## Tokens (light mode only)

| Token | Value | Role |
|---|---|---|
| `--background` | `#FBFAF8` | Page |
| `--surface` | `#FFFFFF` | Rows, panels, popovers, dialogs |
| `--foreground` | `#201D1B` | Body text |
| `--muted-foreground` | `#6B6560` | Secondary text; every "unknown" *text* (e.g. "Awaiting details from operator") |
| `--muted` | `#F3F1EE` | Neutral light fill — hover states, secondary surfaces |
| `--border` | `#E7E3DE` | Hairlines, dividers |
| `--brand` | `#D33B2C` | Logo, focus ring — nowhere else. Links use `--foreground` with an underline |
| `--primary` | `#201D1B` | Primary button fill (= foreground, not brand) |
| `--primary-foreground` | `#FFFFFF` | Text on primary buttons |
| `--status-confirmed` | `#0E7C73` | Teal — on time, finished/confirmed legs |
| `--status-caution` | `#8F5E00` | Amber — possible delay |
| `--status-critical` | `#8C2A4E` | Wine — delayed, incident, customs hold |
| `--status-ai` | `#4C4FD9` | Indigo — means "this depends on an AI inference": the provenance badge and the "Needs review" state, nothing else |
| `--status-unknown` | `#8A837D` | Grey — icons and leg lines only; unknown *text* always uses `--muted-foreground` |
| `--radius` | `6px` | One value everywhere |
| `--row-height` | `72px` | List row height |

Red is deliberately absent from the status palette: a delay or incident must never be mistaken for brand chrome, and vice versa.

## Contrast (WCAG AA)

Computed against the real token values with a throwaway script (relative luminance → contrast ratio; not committed). Thresholds: 4.5:1 for text, 3:1 for icons and lines.

| Token | vs `--background` | vs `--surface` | Threshold | Pass |
|---|---|---|---|---|
| `--foreground` | 16.07 | 16.76 | 4.5 | ✓ |
| `--muted-foreground` | 5.51 | 5.74 | 4.5 | ✓ |
| `--brand` (logo / focus ring) | 4.54 | 4.74 | 3.0 (non-text) | ✓ |
| `--status-confirmed` | 4.85 | 5.06 | 4.5 | ✓ |
| `--status-caution` | 5.34 | 5.57 | 4.5 | ✓ |
| `--status-critical` | 7.88 | 8.22 | 4.5 | ✓ |
| `--status-ai` | 5.87 | 6.13 | 4.5 | ✓ |
| `--status-unknown` | 3.58 | 3.73 | 3.0 (icon/line only) | ✓ |

All tokens clear their threshold at the values above — the two changes requested (caution, unknown) were the only ones below AA; nothing else needed adjusting.

**Status `-subtle` backgrounds** — a light tint of each status colour, for badge fills. The paired text token must still clear 4.5:1 against its own tint:

| Status | `-subtle` bg | Paired text token | Contrast |
|---|---|---|---|
| confirmed | `#EFF4F1` | `--status-confirmed` | 4.55 |
| caution | `#F6F2EC` | `--status-caution` | 5.00 |
| critical | `#F5F0F0` | `--status-critical` | 7.28 |
| ai | `#F2F1F6` | `--status-ai` | 5.45 |
| unknown | `#EDECE9` | `--muted-foreground` | 4.86 |

`unknown-subtle` pairs with `--muted-foreground`, not `--status-unknown`, since that token is icon/line-only.

## Typography

One family, Hanken Grotesk, weights 400/500/600/700 only.

| Role | Size / weight |
|---|---|
| Display (ETA range, big number) | 40px / 700 |
| Page title | 24px / 700 |
| Section heading | 16px / 600 |
| Body | 15px / 400 |
| Label / meta (leg phrase, timestamp) | 13px / 500 |
| Caption (`muted-foreground` only) | 12px / 400 |

## Spacing & density

4px base scale: 4 · 8 · 12 · 16 · 24 · 32 · 48. No ad-hoc values. Row height: `--row-height` in lists (generous, left-aligned). No elevation anywhere — flat surfaces separated by `--border` hairlines only; a shadow would read as a SaaS card, which this system avoids on purpose.

## shadcn/ui components used

Badge (status pills, AI marker), Button (primary = `--primary` fill; outline for secondary), Popover (original operator wording, ETA reasons — keyboard-accessible, never hover-only), Dialog (correction modal, draft-notice modal), Select (filters, status correction), Sheet (demo panel drawer), Skeleton (loading states), Separator (hairlines), Alert (customer proactive-notice banner), Input/Label (demo panel, forms). `Card` is used sparingly (e.g. delivery-outlook panel) with its default shadow stripped — border only, to match the no-elevation rule.

**Token mapping** (shadcn CSS vars → ours):

| shadcn var | Maps to |
|---|---|
| `--card` / `--card-foreground` | `--surface` / `--foreground` |
| `--popover` / `--popover-foreground` | `--surface` / `--foreground` |
| `--ring` | `--brand` |
| `--destructive` / `--destructive-foreground` | `--status-critical` / `#FFFFFF` (8.22:1) |
| `--muted` / `--muted-foreground` | `--muted` / `--muted-foreground` |
| `--accent` / `--accent-foreground` | `--muted` / `--foreground` |
| `--secondary` / `--secondary-foreground` | `--muted` / `--foreground` |
| `--input` | `--border` |

## Status visual language

Every status pairs an icon with its label — colour never carries meaning alone.

| Status | Icon (lucide) | Token | Ops label | Customer label |
|---|---|---|---|---|
| Confirmed, in progress | `arrow-right` | `--status-confirmed` | Normalised status text | "On time" |
| Finished / delivered | `check-circle-2` | `--status-confirmed` | Normalised status text | "Delivered" |
| Possible delay | `alert-triangle` | `--status-caution` | "Possible delay" + reasons | "Possible delay" |
| Delayed / incident | `alert-octagon` | `--status-critical` | Exception cause | "Delayed" |
| Needs review | `sparkles` | `--status-ai` | "Needs review" — opens Correct action | *(same as Unknown/silent, below)* |
| Unknown / silent | `circle-dashed` | `--status-unknown` | "No data for Xh" (+ warning past threshold) | "Awaiting details from operator" + "Last confirmed: …" if one exists, never confidence numbers |

Dashed is a timeline-leg line style only — no status icon uses it, so "in progress" needed its own glyph (`arrow-right`, legible at 16px). "Needs review" is not its own icon — it *is* the AI provenance marker's Low-band exception (ops only); customer-side, a Low-band inference shows as the unknown state instead.

## Data categories & current state

Four data categories, never merged:

| Category | What it means | How it looks | Example |
|---|---|---|---|
| Confirmed | Reported by an operator, with source and time | Solid leg; plain text with source + timestamp | "Departed Valencia, 14 Nov 09:10" |
| Estimated | Calculated by us, always a range | Dashed leg; range labelled "estimated" | "Estimated 16–19 Nov" |
| Planned / promised | A commitment or published schedule — not a confirmation, not an estimate | Plain text, explicit label ("Promised", "Scheduled"), no line style on the timeline | "Promised 15 Nov" / "Scheduled departure 12 Nov" |
| Unknown | No information, or the latest signal isn't trustworthy enough to show as current | Muted leg; "Awaiting details from operator" | — |

### Current state vs last confirmed fact

An old fact is never presented as the current state, but a true fact is never hidden. When the latest event needs review, or a leg is silent past its due time, the current state is "Awaiting details from operator" (muted) — and, directly beneath it, the last confirmed fact still appears with its timestamp, e.g. "Last confirmed: departed Valencia, 14 Nov 09:10." It's labelled as past, never styled as the current status.

- **Solid** leg = finished, confirmed by a reliable event with a terminal status code.
- **Dashed** leg = started and confirmed, not finished — its end is always an estimate, drawn dashed, never a bare date.
- **Muted** leg = current state unknown (not due yet, or due and silent / latest event needs review) — see above for what still shows beneath it.
- Ops-only: a muted leg past its stale threshold (mode-dependent) gets the warning icon and raises an exception; the customer never sees "stale," "exception" or confidence numbers.

## Demo clock

The prototype never reads the real clock. A simulated `now` lives in the mock state, starts at a fixed instant chosen so the seed data is coherent, and only advances through the demo panel. "Last updated," stale detection, delay risk and the ETA range all derive from it. The current demo time is always visible in the demo panel, and in the header whenever the panel is open.

**Stale thresholds** — assumed, for the write-up, not operator facts:

| Leg type | Stale after |
|---|---|
| Road | 8h |
| Port | 24h |
| Sea | 48h |
| Customs | 24h |
| Last-mile | 6h |

## AI provenance marker

Exactly three AI touchpoints, nothing else: status normalisation; ETA and delay risk with cited reasons; suggested next action with a drafted customer notice. Customer summary and free-form Q&A are cut from scope.

Delay-risk evidence (e.g. "N of last M shipments delayed >Xh here") is always computed from the mock shipment history, never a fixed string. The marker sits on the delay-risk judgement itself ("Possible delay" / "Delayed"), not on the count — the count is its cited basis, shown as plain text or inside the popover.

One component, three variants, same interaction everywhere — a button, never a static label:

| Variant | Icon | Token | Label |
|---|---|---|---|
| AI | `sparkles` | `--status-ai` | "AI" + confidence band (High / Medium) |
| Rule | none | `--muted-foreground` | "Mapped by rule" |
| Corrected | none | `--muted-foreground` | "Corrected by ops" + date |

Low is a named exception, not a third value of this label: ops sees "Needs review" (never "AI · Low"); the customer sees the unknown state instead, not the AI marker at all.

No percentages anywhere in the UI. Only the AI variant uses indigo, consistent with the `--status-ai` rule; Rule and Corrected show no icon — restraint is the signal that nothing needs attention.

**Confidence bands** (AI variant only; prototype assumptions): High ≥85%, Medium 70–84%, Low <70% (shown as "Needs review"). For the write-up: in production, bands come from calibration against historical outcomes, not the raw model score.

**Popover**, same order always: what was inferred → its basis (original operator wording, or the cited events) → method → timestamp →, ops only, a "Correct" action. No basis to cite means no inference is shown.

**Per role:**
- Ops: full component — method, band, basis, Correct action.
- Customer: a small "AI estimate" marker next to the ETA with a "Why?" control that opens the same basis/reasons — no band, no numbers.
- An approved customer notice carries one discreet line: "Drafted with AI, reviewed by operations."

**Accessibility:** the marker is a button with an accessible name describing state and action, e.g. "AI inference, medium confidence. Show basis." No decorative glyph stands in for it, in prose or in wireframes.

## States

- **Ops inbox, empty:** "No exceptions on your sites."
- **Customer, no shipments:** "No active shipments."
- **Loading:** skeleton rows matching the final row layout, for the simulated 300–500 ms data delay.
- **Error:** "Shipment not found" — the only error state that can actually occur (an unknown id) — with a link back to the shipment list.

## Conscious cuts

- **Light mode only.** No dark-mode tokens, no toggle — nothing in the brief or scope calls for one, and a second theme would double every contrast check above for no demo value.
- **One font family, Hanken Grotesk.** A second face (e.g. monospace for IDs/timestamps) was considered and dropped during the direction pitch — the content doesn't need a "systems" texture, and one family keeps the type scale small enough to stay disciplined.

## Wireframes

**Ops exception inbox** (`/ops`) — ordered by severity, then customer impact, then exception age. No role switcher in the header: role lives in the demo panel, and a banner states the active perimeter.
```
Mars Industries                                                   Demo ▾
Demo: viewing as Operations · Valencia and Zaragoza sites
────────────────────────────────────────────────────────────────────────
Exceptions · 4 need attention                    Site ▾  Operator ▾  Mode ▾
──────────────────────────────────────────────────────────────────────
⬤ Critical  Customs hold — missing commercial invoice
  SHP-2291 → Lyon, FR        road ━━●══ port ┈┈┈ customs ┈┈┈
  No data for 31h on customs leg          Suggested: Upload document  →
──────────────────────────────────────────────────────────────────────
▲ Possible delay  [AI · High]   Port congestion, Valencia — 2 days behind plan
  SHP-2284 → Hamburg, DE  road ━●══ port ▲══ sea ┈┈┈ port ┈┈┈
  3 of last 12 shipments delayed >24h here
  Suggested: Notify customer →
──────────────────────────────────────────────────────────────────────
All shipments (14)                                           View all →
```

**Shipment detail** (`/ops/shipments/[id]`, same timeline on customer side) — same shipment as above, same legs, same states.
```
SHP-2284 → Hamburg, DE              Promised 15 Nov · Estimated 14–17 Nov
road ━●══ port ▲══ sea ┈┈┈ port ┈┈┈
Arrived Valencia port · 13 Nov 06:40 · Rutasur
▲ Possible delay  [AI · High]  — port congestion, Valencia
3 of last 12 shipments delayed >24h here
```

**Customer view** (`/customer/shipments/[id]`) — same shipment, same legs, same states; banner replaces the header role switcher; actions are Documents and Details, with support reachable but secondary.
```
Demo: viewing as Customer · Hamburg subsidiary
┌──────────────────────────────────────────┐
│ ▲ Possible delay                          │
│ Promised 15 Nov · Estimated 14–17 Nov     │
│ AI estimate · Why?                        │
│                                            │
│ road ━●══ port ▲══ sea ┈┈┈ port ┈┈┈      │
│                                            │
│ Documents · Details                       │
│ Contact support                           │
└──────────────────────────────────────────┘
```
("Contact support" renders smaller, `--muted-foreground` — discreet, never competing with the two primary actions.)

**Customer view, mobile** (360px) — same shipment; the leg needing attention, not the first one, is what the compact summary shows.
```
Demo: viewing as Customer · Hamburg subsidiary
┌────────────────────────┐
│ ▲ Possible delay         │
│ Promised 15 Nov         │
│ Estimated 14–17 Nov     │
│ AI estimate · Why?      │
│                          │
│ Leg 2 of 4 · Port        │
│ ━●══▲══┈┈┈                │
│                          │
│ Documents · Details     │
└────────────────────────┘
```
(Same leg-line component at a condensed scale — chosen over a vertical timeline so mobile doesn't introduce a second timeline paradigm.)
