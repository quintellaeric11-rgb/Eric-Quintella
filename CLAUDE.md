# CLAUDE.md — KONKI Engineering Rules

This file contains mandatory operating instructions for AI coding agents working on KONKI.

Before making changes, read:

1. `CLAUDE.md`
2. `docs/handoff/KONKI_HANDOFF_MASTER.md`
3. relevant source code
4. relevant migrations
5. relevant tests

Do not begin implementation until you understand the current product strategy.

---

# 1. Current Product Strategy

KONKI is currently validating a **Concierge MVP** with approximately 5–10 families.

The Youth's genuine desire is the motivational anchor.

The Parent defines development priorities.

KONKI/Admin manually curates missions that move the Youth toward the desired conquest while developing those skills.

The primary objective right now is **learning from real families**, not maximizing automation.

---

# 2. Mission System V1

`MISSION_SYSTEM_V1_MODE` must remain `OFF`.

The previous Mission System V1 must be preserved but must NOT be reactivated.

Do NOT:

- restore automatic mission generation;
- build a new Mission Engine;
- replace Concierge curation with AI generation;
- delete preserved V1 infrastructure;
- modify product behavior merely to satisfy Legacy tests that expect automatic generation.

Approved conquests currently go to Concierge/Admin curation.

---

# 3. Do Not Rewrite the Stack

Work with the existing architecture.

Current stack includes:

- Next.js
- React
- TypeScript
- Supabase
- Vercel
- PWA / Service Worker

Do not propose or perform a framework/platform rewrite unless explicitly requested.

Do not migrate the MVP to FlutterFlow or another stack.

Prefer small, robust improvements to the existing application.

---

# 4. Security Is Non-Negotiable

Never weaken security to simplify implementation.

Preserve:

- Supabase RLS;
- Parent/Youth isolation;
- server-side Admin authorization;
- Push subscription ownership;
- existing authorization boundaries.

Never expose, print, commit or document real secrets.

This includes:

- Supabase service-role credentials;
- database passwords;
- VAPID private keys;
- GitHub tokens;
- Vercel tokens;
- API keys;
- `.env.local` contents.

Never request that the user paste secrets into chat.

If a secret may have been exposed, stop and report it.

---

# 5. Database Rules

Before any database change:

1. inspect the migration ledger;
2. inspect recent migrations;
3. inspect relevant schema/RLS;
4. determine whether a migration is actually necessary;
5. understand rollback implications.

Never modify an already-applied migration.

Prefer additive, auditable migrations.

Never disable RLS as a shortcut.

Never delete or mutate production user data without explicit authorization.

If a migration or remote operation fails unexpectedly:

STOP.

Report:

- what succeeded;
- what failed;
- whether anything committed;
- whether partial remote state exists;
- whether rollback occurred;
- safest next step.

Do not improvise destructive fixes.

---

# 6. Git Rules

Before implementation:

- inspect `git status`;
- identify current branch;
- record current commit;
- understand existing uncommitted changes.

Never silently discard user work.

For meaningful changes, prefer a dedicated branch unless the user explicitly instructs otherwise.

Before commit:

- inspect the complete diff;
- run relevant tests;
- run lint;
- run build;
- perform a secret scan.

Do not commit secrets.

Do not force-push.

Do not rewrite Git history unless explicitly authorized.

If push fails because authentication is unavailable, stop and tell the user rather than inventing another authentication mechanism.

---

# 7. Production Rules

Production:

`https://konki.vercel.app`

Do not treat:

`local test PASS`

as equivalent to:

`production validated`.

Release validation may require:

implementation
→ tests
→ lint/build
→ commit
→ push
→ Vercel deployment
→ production smoke test
→ physical QA

For PWA, Safari and Web Push behavior, physical device testing is especially important.

---

# 8. Physical QA Overrides Assumptions

Automated tests do not prove browser/device behavior.

If automated tests pass but a real device reproduces a bug, treat the physical reproduction as real.

Investigate possibilities such as:

- stale deployment;
- stale JavaScript;
- service-worker caching;
- browser-specific behavior;
- incorrect test coverage;
- multiple code paths;
- production-only behavior.

Do not repeatedly apply the same fix simply because the automated test passes.

Find the root cause.

---

# 9. Known Safari Issue

Physical QA has reproduced:

`null is not an object (evaluating 'e.currentTarget.reset')`

after Admin uses the mission draft form.

A previous attempted fix preserved the form reference before an async boundary, but physical Safari later reproduced the problem again.

Therefore:

DO NOT assume this issue is resolved.

Before changing code:

1. reproduce/trace the relevant handler;
2. search repository-wide for similar `currentTarget` patterns;
3. determine whether the backend action succeeds despite the UI error;
4. inspect deployment/version state;
5. consider service-worker/cache behavior;
6. identify the actual root cause.

Repeated attempts may have created duplicate drafts.

Do not delete those drafts without explicit authorization.

---

# 10. Mission Lifecycle Must Be Preserved

Current intended lifecycle:

Admin creates mission
→ DRAFT
→ review
→ explicit publication
→ Youth/Parent visibility/notification

Saving a draft must NOT automatically publish it.

A DRAFT must NOT trigger Youth/Parent Push.

The current UX may make publication unclear.

Fix discoverability and workflow clarity rather than removing the DRAFT state.

---

# 11. Push Rules

Web Push is an additional delivery channel.

Internal notifications and Admin operational state remain important sources of truth.

Push failure must not normally break the core transaction.

Preserve:

- explicit user gesture before notification permission;
- subscription ownership;
- deduplication;
- batch behavior;
- deep links;
- invalid subscription handling;
- logout cleanup.

Never expose VAPID secrets.

Infrastructure existing does NOT prove that a real device is subscribed.

Physical Push QA is required.

---

# 12. Admin Authorization

Admin authorization must remain separate from the normal family role.

A user may be an authorized Admin while their normal profile remains `PARENT`.

Do not change a Parent profile to `ADMIN` merely to grant Admin access.

Normal Parent and Youth users must remain blocked from Admin resources.

---

# 13. Preserve Historical Data

Do not destroy historical information casually.

In particular:

- conquest cancellation must not erase legitimate XP/history;
- historical evidence should be preserved;
- test/user records should not be deleted without authorization;
- migration history should remain auditable.

---

# 14. Legacy Tests

Some Legacy tests may expect automatic mission generation.

That behavior conflicts with the current Concierge strategy.

A Legacy test failing for this specific reason is not automatically a product regression.

Do not reactivate automation simply to make the test green.

Use current Concierge/E2E behavior as the relevant product reference.

Still investigate failures to ensure they are actually caused by obsolete expectations.

---

# 15. Scope Control

Current objective:

**Make the existing Concierge MVP reliable, understandable and operationally efficient enough for a real pilot.**

Do not default to building:

- social features;
- leaderboards;
- marketplace functionality;
- generalized Mission Engine;
- large analytics systems;
- complex AI automation;
- unnecessary gamification;
- major architectural rewrites.

Fix the core experience first.

---

# 16. UX Priorities

Audit Parent, Youth and Admin separately.

Prioritize:

### P0

Pilot blockers, broken core flows, authorization/security issues, data integrity problems.

### P1

Major confusion or friction affecting core usage or Concierge operations.

### P2

Useful polish that does not block the pilot.

For every proposed change explain:

- problem;
- evidence;
- affected user;
- impact;
- proposed solution;
- implementation effort;
- technical risk;
- priority.

Do not confuse visual polish with product-critical work.

---

# 17. Admin Efficiency

The Concierge MVP depends on Admin operations.

When evaluating Admin UX, ask:

**Can one operator manage 5–10 pilot families reliably without spreadsheets, memory or guesswork?**

Reduce unnecessary operational friction.

But do not automate away the learning process that the Concierge MVP exists to observe.

---

# 18. Product Decision Rule

When deciding between:

A. sophisticated architecture for hypothetical future scale

and

B. a simple, robust solution that improves the 5–10 family pilot,

prefer B unless there is a strong technical reason not to.

Do not optimize prematurely.

---

# 19. Before Coding

Unless the user explicitly asks for immediate implementation, first:

1. inspect the relevant implementation;
2. reproduce or establish evidence of the problem;
3. identify root cause;
4. determine whether the issue is product, UX, frontend, backend, database, deployment or caching;
5. propose the smallest robust fix;
6. explain risks.

Do not change code based only on assumptions.

---

# 20. After Coding

Before declaring a task complete:

1. inspect diff;
2. run targeted tests;
3. run relevant regression tests;
4. run lint;
5. run build;
6. verify Mission System V1 remains OFF;
7. check RLS/security if relevant;
8. scan for secrets;
9. verify Git state.

If deployed, also perform relevant production smoke tests.

If the change involves mobile/PWA/Push/Safari, explicitly list the remaining physical QA.

Never claim physical validation unless it actually occurred.

---

# 21. Reporting Format

For implementation tasks, final reports should clearly state:

- what changed;
- files changed;
- tests executed;
- PASS/FAIL;
- migration status;
- Git status;
- commit;
- push status;
- deployment status;
- production validation;
- remaining physical QA;
- known unresolved issues.

Distinguish clearly between:

IMPLEMENTED

TESTED LOCALLY

DEPLOYED

VALIDATED IN PRODUCTION

PHYSICALLY VALIDATED

These are not equivalent states.

---

# 22. Stop Conditions

Stop and ask/report before proceeding if:

- a secret may be exposed;
- an unexpected production database state appears;
- a migration fails unexpectedly;
- rollback safety is unclear;
- destructive data changes appear necessary;
- authorization/RLS would need weakening;
- the requested change conflicts with the Concierge strategy;
- Mission System V1 would need reactivation;
- production behavior contradicts assumptions;
- existing user work may be overwritten;
- Git history would need destructive rewriting.

Do not hide uncertainty.

---

# 23. Source of Truth

For product strategy and intent:

`docs/handoff/KONKI_HANDOFF_MASTER.md`

For implementation:

current repository + migrations + current tests + production behavior.

When older code or tests conflict with a newer explicit product decision, do not blindly restore the older behavior.

---

# 24. Core Principle

KONKI does not currently need more features for their own sake.

It needs a reliable experiment.

The engineering objective is to make it possible to learn whether:

**a young person's genuine desire can become the motivational anchor for a development journey that the Youth engages with and the Parent values enough to continue using and paying for.**

Protect that experiment from unnecessary complexity.