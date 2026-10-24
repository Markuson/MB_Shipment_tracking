# Contributing

## Commit messages

```
[CODE] type(scope): subject

Optional body: why the change was made, not what the diff shows.
```

- The header is **72 characters at most**.
- **Subject:** imperative mood ("add", not "added"), lowercase, no full stop.
- **Body:** optional. Add one when the reason is not obvious. Wrap at 72.

### Code

The code links a commit to a step in `docs/plan.md`. There is no issue tracker.

| Code | Use |
|---|---|
| `S0` | Project setup, tooling and planning docs |
| `S1`…`S8` | Implementation steps, numbered as in `docs/plan.md` |
| `RV` | Fixes from the final review that span several steps |

A fix to code from one step uses that step's code.

### Type

| Type | Use |
|---|---|
| `feat` | New user-facing behaviour |
| `fix` | A bug fix |
| `refactor` | Code change with no behaviour change |
| `style` | Visual or CSS change with no logic change |
| `test` | Adding or changing tests |
| `docs` | Documentation only |
| `chore` | Tooling, config, dependencies |

### Scope

One area of the product: `ui`, `data`, `status`, `inbox`, `shipment`, `customer`, `alerts`, `ai`, `docs`, `config`. Skip the scope when a change has no single area.

### Examples

```
[MB-S00] chore(config): scaffold Next.js app with Tailwind and Vitest
[MB-S00] docs(plan): add implementation plan
[MB-S01] feat(ui): add semantic design tokens and app shell
[MB-S02] feat(data): add mock shipments across three sites
[MB-S03] feat(status): normalise operator events with provenance
[MB-S03] test(status): cover low-confidence events needing review
[MB-S04] fix(inbox): rank stale shipments below customs holds
[MB-S01] fix(ui): add visible focus to the demo switcher
```

## Branches

- `main` is always deployable; Vercel deploys it to production.
- Planning docs are committed straight to `main`.
- Each implementation step gets its own branch: `<type>/MB-Sxx-<short-name>`, for example `feat/MB-S03-status-normalisation`. A fix to an earlier step gets `fix/MB-Sxx-<short-name>`. Keep branch names to letters, digits and hyphens.
- Each branch is merged through a pull request with a merge commit, after `pnpm check` passes and the Vercel preview has been checked.
- The pull request title follows the commit header format: `[MB-S03] feat(status): normalise operator events`.

## AI attribution

Commits written with Claude Code keep the `Co-Authored-By` trailer it adds. See `docs/AI_USAGE.md`.
