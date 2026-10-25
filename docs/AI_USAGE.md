# How AI was used

An honest account of which AI tools did what while building this prototype, what I changed or rejected, and where I did not trust the output. It feeds the write-up.

## Tools
- **Claude Code** for implementation. It proposes a plan in plan mode, I read and amend it, and only then does it write code and tests and run `pnpm check`.
- **A Claude chat project** for planning, review and writing support: challenging the scope, reviewing each step's plan and code against `CLAUDE.md` and the reliability principle, aligning the documents, drafting decision entries, and short comprehension questions on each step.
- **Anthropic's `frontend-design` skill** for the visual design guidance (tokens, type and layout choices recorded in `docs/design.md`).
- **Considered and dropped: BMAD.** Too heavy for an 8-hour prototype. I use my own research, plan, implement flow with a fresh context per phase, as in the MarsBased handbook.

## Workflow
- Research, plan and design were written as documents (`docs/research.md`, `scope-notes.md`, `plan.md`, `design.md`) before any code. The scope notes came out of a scoping session in the project chat.
- Each implementation step runs on its own branch: plan mode, my review and approval, implementation, `pnpm check` and `pnpm build`, a look at the page in the browser, then a commit and a pull request.
- After each step I paste the plan or the code into the project chat for a review, then answer a few short questions on the rules the step implements.
- Step 2a: Claude Code proposed the file list in plan mode, I approved it, then it wrote the domain types, vocabulary, pure logic and the four planned tests. The stylistic union formatting comes from `eslint --fix`.
- Step 2b: same flow. Claude Code wrote the six mock shipments, rule table and simulated AI guesses, the cause-to-action table and notice templates, and the data-access layer, plus two tests: the perimeter through the layer, and that each mock case raises the exception it was written for.
- Step 3: same flow. Claude Code wrote the leg view logic (line style, tone, current state, last confirmed fact, ops-only warning), the shared timeline, the shipment detail routes with their loading and not-found states, and six leg-view tests. At approval I asked for components that take data as props (no mock imports), a tone for delays and customs holds, and a test that the customer never sees the proposed status of a needs-review leg.
- After 4.5 hours, with only the app shell built, I cut scope to stay near the 8-hour cap (see `DECISIONS.md`, "Scope cut after 4.5 hours").

## What the AI did well
- It kept the conventions without being reminded: named exports, `type`, no `as`, semantic tokens only, comments on the why.
- It used the type system to carry product rules. Examples: `Reliability` makes a date impossible to show without declaring whether it is confirmed, estimated or unknown; the notice templates are typed over the causes that notify the customer only, so a cause with no customer notice has no template.
- It checked the framework documentation shipped in `node_modules` for Next's asynchronous route params instead of guessing.
- It said what it could not verify (the mobile layout) rather than claiming it worked.
- It was fast: the whole domain layer of step 2a took about 15 minutes.

## What I changed or rejected
- **Scope.** After 4.5 hours I cut to 6 mock shipments, one ops filter and a minimal correction select instead of a modal, and recorded it as a decision.
- **Contradictions between documents.** A review found the plan disagreed with `DECISIONS.md` on confidence (percentages against bands), on the last confirmed fact, on where the role switch lives and on the company name. I aligned the plan first so the AI would not implement stale text.
- **Step 2a review.** A last-mile delivery problem raised no exception, so it now raises a delay.
- **Needs-review exception.** The ambiguous case was invisible in the exception inbox. I made a status that needs review an exception with its own action, "review status".
- **Step 3 plan.** I required components that take their data as props with no mock imports, a tone for delays and customs holds (without it the hero delay would not show), a test that the customer never sees the AI's proposed status, and a production build in the verification.
- **Visual review of step 3.** Two adjacent muted legs read as one dotted line, so each leg gets a node marker and a mode icon. Ops could not judge the AI's suggestion without the operator's original wording, so showing it on every leg became a requirement of step 5.
- **A generated test removed.** `cn.test.ts` tested a library, not a product rule.
- **State management moved to step 5**, where the correction select and the approved notice first need to write state.

## Where I did not trust it
- **Plans.** The first plan for step 3 deferred shared state and had no marker for problem legs. I amended it before approving.
- **Tests.** I read the generated tests against the product rules, removed one that tested a library, and added the ones that were missing (exceptions, the customer never seeing an AI guess).
- **Layout.** Claude Code could not open the page at phone width, so I check the mobile layout by hand.
- **My own understanding.** Generated code arrives faster than I can study it, so I check my understanding rule by rule, with short question rounds, before moving on to the next step.
