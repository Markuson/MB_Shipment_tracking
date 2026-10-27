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
- Step 4: same flow. Claude Code wrote the site filter (pure function and test), the ranking test on the mock exceptions, the ops exception list and all-shipments list, the compact mode of the timeline and the GET site filter form. At approval I corrected the expected ranking (critical exceptions are oldest first, so the customs hold comes before the silent operator), and asked for the ranking test and the "As of" line from the simulated clock.
- Steps 5 (reduced) and 8a: same flow, in one branch. Claude Code proposed the plan; it put the store, the client layer and the operator wording before the panel, and I reviewed those three commits before the panel was built. It added zustand holding only the simulated clock and injected events, client wrappers that apply them to what the server pages fetch, the ops-only operator wording with its method and band, the demo panel, and the "last operator update" line. Tests: the customer never gets the operator wording, injected events stay within the shipment they belong to, the store stamps the simulated time, and the port delay raises the delay and shows "Delayed" to the customer. In the browser it checked that the site filter keeps the injected event and that +1 day flips legs by their own thresholds.
- Step 6: same flow, with a review stop after the estimator. Claude Code wrote the account helper, the ETA estimator over mock route history, the derived customer alerts (with a `basis` on each exception so a delay inferred from the plan is never worded as reported), the customer list and detail, and not-found inside the shell. Tests cover the estimator's unknown cases, the alert wording (what is confirmed and what is not), and a render check that the customer never sees operator wording or ops warnings.
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
- **Steps 5 and 8a plan.** I kept the customs hold in the seed and moved only the hero's delay to the panel, kept the method and band next to the operator wording, dropped a proposed "open as its customer" link, asked for a review stop before the panel, and renamed a store type that clashed with a domain type.
- **Step 6 plan.** The plan flagged that no ETA existed; I chose to build the estimator in step 6, kept the status alert and the approved notice as two blocks, accepted operator wording in the page data as a documented limitation, dropped an account select and a loading restructure, and asked for the estimate to be labelled as simulated route history, with history numbers chosen for the demo's story.
- **Step 7 plan.** I reduced the step to the notice flow, approved a native `<dialog>` over a new dependency and a leg id on each notice, dropped the component test and its `showModal` stub in favour of checking the click-through by hand in Chrome, and asked for "review status" to log a request like the other actions so no disabled button is left in the inbox.
- **State management moved to step 5**, where the correction select and the approved notice first need to write state.

## Where I did not trust it
- **Plans.** The first plan for step 3 deferred shared state and had no marker for problem legs. I amended it before approving.
- **Tests.** I read the generated tests against the product rules, removed one that tested a library, and added the ones that were missing (exceptions, the customer never seeing an AI guess).
- **Layout.** Claude Code could not open the page at phone width, so I check the mobile layout by hand.
- **My own understanding.** Generated code arrives faster than I can study it, so I check my understanding rule by rule, with short question rounds, before moving on to the next step.
