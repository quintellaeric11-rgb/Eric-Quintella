# KONKI — Master Handoff

> Canonical product and technical context for engineering agents.
>
> Last major context update: 2026-09-02.
>
> Production: https://konki.vercel.app
>
> IMPORTANT:
> This document explains not only what currently exists in the codebase,
> but WHY several architectural and product decisions were made.
> Do not infer that disabled or removed automation should be restored.

---

# 1. Executive Summary

KONKI is a product designed to transform things young people genuinely want
into structured development journeys.

The fundamental idea is:

The young person's desire creates motivation.

The parent defines developmental priorities.

KONKI connects both through missions that move the young person toward the
desired achievement while developing useful skills and behaviors.

Example:

Youth wants:
- a new pair of sneakers.

Parent wants to develop:
- financial education;
- autonomy;
- responsibility.

KONKI can create a journey in which the young person must complete missions
related to research, planning, decision-making, discipline and financial
awareness.

The reward is not simply payment for completing arbitrary tasks.

The desired achievement is the motivational anchor around which a structured
development journey is designed.

---

# 2. Core Product Thesis

The product is based on three main inputs:

## 2.1 Youth desire

What does the young person genuinely want?

Examples:

- sneakers;
- videogame;
- trip;
- course;
- experience;
- equipment;
- project;
- personal goal.

The desire is important because the product should not begin with:

"What should adults force this young person to learn?"

Instead, it begins with:

"What does this young person already care about?"

---

## 2.2 Parent development priorities

The parent identifies what they would like the young person to develop.

Examples:

- responsibility;
- autonomy;
- financial education;
- discipline;
- communication;
- organization;
- consistency;
- decision-making;
- academic responsibility.

---

## 2.3 Youth interests/context

KONKI also considers the young person's interests, context and preferences.

The goal is to avoid generic task lists.

The journey should connect:

YOUTH DESIRE
+
PARENT DEVELOPMENT GOALS
+
YOUTH INTERESTS / CONTEXT

into:

PERSONALIZED DEVELOPMENT JOURNEY

---

# 3. The Basic KONKI Loop

The intended conceptual loop is:

Youth chooses a conquest
↓
Parent defines/has development priorities
↓
Youth provides interests/context
↓
Parent approves the conquest
↓
KONKI/Admin analyzes the family context
↓
Personalized missions are curated
↓
Youth completes missions
↓
Evidence may be submitted
↓
Progress is reviewed
↓
Skills and behaviors are developed
↓
Youth progresses toward the conquest
↓
Journey is completed
↓
Conquest becomes available according to the family agreement

The journey occurs within a defined timeframe.

---

# 4. Important Product Distinction

KONKI should NOT be reduced to:

"Parents paying children for chores."

It can superficially resemble reward systems, but the intended product thesis
is different.

The reward/conquest is used as motivational context for a structured
development journey.

The mission should ideally have developmental meaning.

Examples:

Bad mission:

"Wash the dishes 20 times and get money."

Potential KONKI mission:

"Research the price of the product you want in three stores, compare total
cost, identify the best option and justify your decision."

This can develop:

- financial awareness;
- research;
- decision-making;
- autonomy.

Another mission could involve:

- school performance;
- planning;
- communication;
- responsibility;
- project execution;
- real-world problem solving.

---

# 5. Motivation Risk

A known product risk is excessive extrinsic motivation.

The team should NOT assume that rewards automatically produce durable
behavioral development.

Important questions include:

- Does the Youth engage only because of the reward?
- Does any behavior persist after the journey?
- Does the Youth perceive missions as meaningful or as chores?
- Does the journey create autonomy or dependence on incentives?
- Does the Parent perceive actual development?

This is a hypothesis to validate during the Concierge MVP.

Do not solve this prematurely through complex product architecture.

Observe real families first.

---

# 6. Current Strategy: Concierge MVP

The current product strategy is a CONCIERGE MVP.

This is intentional.

It is NOT a temporary technical failure.

Automation has deliberately been reduced so that real families can be
observed before building a generalized automated Mission Engine.

Initial target:

approximately 5–10 families.

The founder/admin manually curates journeys.

The primary objective is learning.

---

# 7. Why Concierge

The major unknown is not:

"Can software generate missions?"

It can.

The major unknowns are:

- Do families actually want this?
- Will parents pay?
- Will Youths engage?
- Which missions work?
- Which missions feel artificial?
- How much personalization is necessary?
- How much admin effort is required?
- Which skills parents care about?
- Which conquests create strong motivation?
- How frequently should missions appear?
- What evidence is reasonable?
- What causes abandonment?
- What makes families complete a journey?

Automating before answering these questions risks scaling the wrong system.

Therefore:

MANUAL LEARNING FIRST
AUTOMATION SECOND

---

# 8. Mission System V1

A previous Mission System V1 exists in the project.

It must be preserved.

It is deliberately disabled.

Current expected configuration:

MISSION_SYSTEM_V1_MODE=OFF

DO NOT:

- reactivate Mission System V1;
- build a replacement Mission Engine;
- restore automatic mission generation;
- interpret disabled automatic generation as a bug;
- delete the preserved V1 implementation.

The V1 remains useful as historical/technical infrastructure and may inform
future decisions.

But it is NOT the current product strategy.

---

# 9. Current Actors

The main actors are:

## Parent

The adult responsible for the family relationship.

## Youth

The young person completing the journey.

## Admin

The Concierge operator.

Currently the founder/admin performs manual curation.

Admin access must remain server-authorized.

A normal Parent or Youth must not gain Admin access.

---

# 10. Parent / Youth Connection

The application supports Parent and Youth accounts.

The intended relationship includes:

- account creation;
- connection/invitation;
- family association;
- conquest creation;
- Parent approval;
- mission progression;
- evidence/review.

RLS and authorization boundaries are important.

Do not weaken them to simplify UX.

---

# 11. Conquest Creation

The Youth is the motivational center of the system.

The Youth creates/submits the conquest they want.

Submitting the conquest counts as the Youth's acceptance of that conquest.

The Parent is the party responsible for approving it.

Only Parent approval should make the conquest approved.

---

# 12. Approved Conquest Behavior

CRITICAL:

An approved conquest must NOT automatically generate missions under the
current Concierge MVP.

The intended flow is:

Youth submits conquest
↓
Parent approves
↓
Admin becomes aware of the new approved conquest
↓
Admin reviews family/context
↓
Admin manually curates missions
↓
missions remain DRAFT until publication
↓
Admin publishes
↓
Youth/Parent receive the appropriate experience/notifications

Automatic generation belongs to the frozen Mission System concept and must
not be silently restored.

---

# 13. Admin Concierge

Admin is an operational interface for the Concierge MVP.

The Admin should be able to understand:

- which families need attention;
- Youth information;
- Parent information;
- conquest;
- family agreement/context;
- journey status;
- missions;
- evidence;
- progression;
- which journey needs its next mission.

Admin creates missions manually.

---

# 14. Mission Content

A mission may include information such as:

- title;
- short description;
- didactic material;
- steps;
- technique explained;
- example;
- tip;
- challenge;
- required submission;
- allowed evidence types;
- whether evidence is mandatory;
- completion criteria;
- deadline;
- XP;
- progress contribution;
- primary competency;
- secondary competency;
- mission role.

The purpose is not to fill every field for its own sake.

The content should help the Youth understand:

WHAT TO DO
WHY IT MATTERS
HOW TO DO IT
WHAT COUNTS AS COMPLETION

---

# 15. DRAFT vs PUBLISHED

This distinction is intentional and must be preserved.

Creating a mission should not automatically send it to the Youth.

Admin must be able to:

create
↓
save draft
↓
review
↓
publish

A DRAFT must NOT trigger Youth/Parent Push.

Publication is the explicit transition that exposes the mission.

Do not "fix UX" by removing the review state or auto-publishing every mission.

Instead, make the publication path obvious.

---

# 16. Current Known UX Problem: Mission Publication

As of 2026-09-02, physical QA identified an important usability problem.

The "Adicionar missão" form prominently exposes:

"Salvar rascunho"

but the next step for publishing is not sufficiently obvious.

The correct business rule is still:

DRAFT → REVIEW → PUBLISH

The UX problem is discoverability/clarity, not the existence of DRAFT.

A good solution should make it immediately clear after saving:

- where the draft went;
- how to review it;
- how to publish it;
- how batch publication works when applicable.

Do not auto-publish merely to remove friction.

---

# 17. Current Known Safari Bug

Physical Safari QA has reproduced:

null is not an object (evaluating 'e.currentTarget.reset')

This occurred after pressing "Salvar rascunho".

A previous attempted correction preserved the form reference before an async
boundary and used form.reset() afterward.

However, physical QA still reproduced the same error.

Therefore this should NOT be treated as conclusively resolved.

Possible root causes to investigate include:

- another handler containing the same pattern;
- stale JavaScript bundle;
- service worker/PWA caching;
- incomplete deployment propagation;
- another Safari-specific async event behavior.

IMPORTANT:

The backend may still create the draft even when the UI displays the error.

Repeated testing can therefore create duplicate drafts.

Before blindly changing the same handler again:

1. determine root cause;
2. search repository-wide;
3. inspect production bundle/deployment;
4. inspect service-worker cache strategy;
5. verify whether the draft is created despite the visual error.

---

# 18. Duplicate Test Drafts

Recent QA created multiple drafts.

At least one duplicate group was previously identified.

These are test/QA artifacts.

Do not automatically delete production data.

Identify and report them first.

Deletion requires explicit authorization.

---

# 19. Cancellation

When an approved conquest is cancelled:

- active missions may be archived/cancelled as appropriate;
- historical evidence must not be destroyed;
- XP/history must not be erased merely because the conquest was cancelled.

Preserve historical integrity.

---

# 20. Evidence

Evidence is mission-specific.

Different missions may allow:

- TEXT;
- IMAGE;
- AUDIO;
- LINK;

depending on current implementation.

Evidence may be mandatory or optional.

The system should clearly communicate what the Youth needs to submit.

Do not replace mission-specific evidence with a single generic completion
mechanism without product justification.

---

# 21. XP and Progress

The project contains XP/progression infrastructure.

Preserve existing historical progress.

Do not rebuild XP logic during a UX audit.

Do not reset progress during journey changes or cancellation unless the
business rule explicitly requires it.

---

# 22. Current Technical Stack

The current production stack is based on:

- Next.js
- React
- TypeScript
- Supabase
- Vercel
- PWA / Service Worker

Known versions around the current project state include:

- Next.js 16.2.6
- React 19.2.6

The repository itself is authoritative for exact dependency versions.

Do not change the stack merely because another technology would be easier.

In particular:

DO NOT propose FlutterFlow as a default rewrite strategy.

The current objective is to improve the existing MVP.

---

# 23. Production

Production URL:

https://konki.vercel.app

Production is deployed through Vercel.

The Git repository and deployment history should be inspected before any
engineering work.

Do not assume this document supersedes the actual repository state.

For technical details:

REPOSITORY + MIGRATION LEDGER + CURRENT PRODUCTION
are the technical sources of truth.

This document is the source of truth for product intent and historical
decision context.

---

# 24. Database

Supabase is the backend/database platform.

RLS is a critical part of the architecture.

Preserve RLS.

Never solve an authorization problem by broadly disabling RLS.

Parent, Youth and Admin data access must remain properly isolated.

---

# 25. Migration State

The migration ledger has reached:

202609010024_web_push_subscriptions.sql

Migration 024 introduced the minimum infrastructure required for Web Push
subscriptions.

Any agent must inspect the actual migration files and remote ledger before
creating another migration.

Never:

- assume a migration is unapplied based only on filename;
- manually modify production schema without understanding the ledger;
- rewrite already-applied migrations;
- run destructive migrations casually.

New migrations should be additive and auditable.

---

# 26. Migration 024 Incident

During the original application of migration 024, an execution wrapper
incorrectly expanded `$1`.

The migration itself was not established as defective.

The failed attempt did not leave partial remote state.

A Node-based parameterized executor was subsequently used and migration 024
was applied atomically.

This history matters because agents should distinguish:

MIGRATION CONTENT ERROR

from:

MIGRATION EXECUTOR ERROR.

---

# 27. Admin Authorization

Admin authorization is based on server-side authorization infrastructure,
including public.admin_users.

Admin should NOT be implemented by changing a normal profile's role to ADMIN
if doing so destroys the user's normal family role.

The founder's account was authorized for Admin while preserving its normal
profile as PARENT.

This is intentional.

Normal Parent/Youth accounts should receive authorization failure for Admin
resources.

---

# 28. PWA

KONKI includes PWA functionality.

Infrastructure includes concepts such as:

- manifest;
- icons;
- service worker;
- installation UX;
- installed-app behavior.

Installation behavior differs by browser/platform.

Physical QA remains important.

Do not assume browser automation proves installation behavior on real phones.

---

# 29. Web Push

Web Push infrastructure has been implemented.

The system uses VAPID.

Required environment concepts include:

NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT

NEVER place real values in documentation.

NEVER commit private keys.

NEVER expose VAPID_PRIVATE_KEY.

Environment values belong in secure environment configuration.

---

# 30. Notification Architecture

Internal notifications and the Admin queue remain important sources of truth.

Web Push is an additional delivery channel.

Push should NOT become a transactional dependency that can break the main
business operation.

Example principle:

Publishing a mission should not fail solely because a stale Push subscription
cannot receive a notification.

Invalid subscriptions should be handled safely.

---

# 31. Push Events

The current Push implementation has been designed to support events including:

- Admin awareness of relevant new curation work;
- Admin awareness when a journey needs next missions;
- Youth notification;
- Parent notification;
- batch publication behavior;
- retry/deduplication;
- deep links.

Inspect actual code for exact event semantics.

---

# 32. Push Deduplication

Push operations have deduplication logic.

Retries should not create notification spam.

Batch publication should avoid generating unnecessary repeated notifications.

Preserve these guarantees when changing notification UX.

---

# 33. Push Permission

Push permission must be requested only after an explicit user gesture.

Do not trigger browser notification permission automatically on page load.

The UX must provide a clear path such as:

"Ativar notificações"

when appropriate.

A prior physical QA issue identified that Admin infrastructure could exist
without an obvious way for the Admin user to subscribe.

This is a real UX concern.

Infrastructure existing is not equivalent to the user being subscribed.

---

# 34. iOS Push

Physical iOS behavior matters.

For iOS/iPadOS Web Push, installed web-app behavior and explicit permission
flow must be tested on real devices.

Automated tests cannot establish real Push delivery.

Required physical QA includes:

- installation;
- opening through home-screen icon;
- explicit permission;
- subscription;
- receiving while app is closed/backgrounded;
- tapping notification;
- correct deep link.

---

# 35. Service Worker

The service worker handles PWA behavior and Push-related functionality.

Because physical QA has shown a possibly stale UI bug after deployment,
service-worker caching must be considered when debugging production version
mismatches.

Do not casually disable the service worker because Push/PWA depend on it.

Audit cache/version/update strategy instead.

---

# 36. Logout

Current intended behavior includes removing the device's Push subscription
when appropriate during logout.

Preserve user/subscription ownership boundaries.

A subscription must not be transferable or "stolen" by another authenticated
user.

---

# 37. Security

Critical security principles:

- preserve RLS;
- preserve server-side Admin authorization;
- bind Push subscriptions to the correct profile;
- prevent cross-user subscription reuse;
- never expose service role credentials;
- never expose VAPID private keys;
- never commit `.env.local`;
- never put production secrets in documentation;
- never log secrets;
- do not weaken authorization for convenience.

---

# 38. Secrets

The repository should never contain live values for:

- Supabase service role;
- VAPID private key;
- database passwords;
- GitHub tokens;
- Vercel tokens;
- API secrets;
- private environment configuration.

Before sharing the repository with another developer or coding agent, perform
a secret scan on:

1. current working tree;
2. Git history.

If a real secret was historically committed, deleting the current file is not
enough.

The credential should be considered for rotation.

---

# 39. Testing Philosophy

Tests are important, but product strategy determines expected behavior.

Some older tests were written for the automated Mission System.

Those tests may expect automatic mission generation.

Under Concierge MVP, automatic generation is intentionally disabled.

Therefore:

A Legacy test failing because it expects automatic generation is not
automatically a product regression.

Use the current Concierge/E2E tests as the relevant behavioral reference.

Do not modify product behavior merely to make obsolete Legacy expectations
pass.

---

# 40. Known Test State

Recent implementation work reported successful checks across areas including:

- Mission System V1 preservation;
- Concierge/E2E;
- invites;
- approval;
- evidence;
- XP;
- progress;
- cancellation;
- RLS;
- Admin authorization;
- Parent/Youth Admin blocking;
- Push subscription ownership;
- Push deduplication;
- batch notification behavior;
- deep links;
- lint;
- build;
- secret scan.

However:

physical device QA remains authoritative for browser/device-specific UX.

---

# 41. Physical QA Still Matters

The following should not be considered fully validated only through automated
tests:

- Safari form behavior;
- PWA installation;
- iOS Push permission;
- real Push delivery;
- app-open-from-notification;
- service-worker update behavior;
- Android browser installation;
- Samsung Internet installation.

---

# 42. Current Highest-Priority UX Issues

At handoff time, important UX/QA areas include:

## P0 candidates

- Safari mission form error after saving;
- ability to reliably activate Push on real devices if CTA is absent or
  unclear;
- any flow that prevents Admin from publishing missions;
- any flow that prevents Youth from receiving/seeing assigned missions;
- any authorization issue.

## P1 candidates

- unclear DRAFT → PUBLISH workflow;
- weak feedback after actions;
- confusing Admin workflow;
- unclear notification state;
- onboarding friction;
- unclear evidence requirements;
- mobile layout problems.

## P2 candidates

- copy polish;
- visual consistency;
- minor navigation improvements;
- secondary convenience features.

The next agent should validate these classifications rather than blindly
accept them.

---

# 43. UX Audit Objective

The next engineering agent should initially behave as an auditor, not a
feature builder.

The first objective is:

MAKE THE EXISTING MVP EASY ENOUGH TO RUN A REAL PILOT.

Not:

MAKE KONKI FEATURE-COMPLETE.

Audit separately:

PARENT EXPERIENCE
YOUTH EXPERIENCE
ADMIN EXPERIENCE

---

# 44. Parent UX Audit

Inspect at least:

- account creation;
- invitation/connection;
- understanding KONKI;
- conquest approval;
- understanding what the Youth is doing;
- mission visibility;
- notifications;
- evidence/review where applicable;
- progress;
- cancellation;
- clarity of family agreement;
- mobile usability.

Ask:

Can a normal parent understand what to do without Eric explaining every
screen?

---

# 45. Youth UX Audit

Inspect at least:

- account creation;
- connection;
- conquest creation;
- understanding the journey;
- mission discovery;
- mission instructions;
- evidence submission;
- progress;
- XP;
- deadlines;
- notifications;
- understanding what is required;
- mobile usability.

Ask:

Does this feel like a journey toward something the Youth wants, or like a
generic chore app?

---

# 46. Admin UX Audit

Inspect at least:

- Admin discovery/access;
- family queue;
- approved conquests;
- context available for curation;
- mission creation;
- DRAFT;
- reviewing drafts;
- individual publication;
- batch publication;
- next-mission needs;
- notification subscription;
- evidence/review;
- operational clarity.

Ask:

Can Eric operate 5–10 pilot families without spreadsheets, memory or
guesswork?

Also ask:

Which Admin actions consume unnecessary time?

---

# 47. UX Evaluation Framework

For each issue, report:

PROBLEM

EVIDENCE

WHO IS AFFECTED

FREQUENCY

SEVERITY

IMPACT ON PILOT

PROPOSED SOLUTION

IMPLEMENTATION EFFORT

TECHNICAL RISK

PRIORITY

Use:

P0 = pilot blocker / serious correctness issue

P1 = materially harms core experience or operations

P2 = worthwhile improvement but pilot can proceed

---

# 48. Avoid Feature Creep

During this phase, do NOT default to adding:

- social features;
- leaderboards;
- complex AI automation;
- generalized Mission Engine;
- large analytics systems;
- unnecessary dashboards;
- complex gamification;
- marketplace;
- major architecture rewrites.

The product still needs behavioral validation.

Every new feature increases:

- development time;
- QA surface;
- maintenance;
- ambiguity about what actually creates value.

---

# 49. Preferred Engineering Principle

When choosing between:

A. elegant generalized architecture for hypothetical future scale

and

B. simple robust solution that lets 5–10 families use the Concierge MVP

prefer B unless there is a strong reason otherwise.

Do not create avoidable technical debt, but do not prematurely optimize for
scale that has not been earned.

---

# 50. Pilot Success Questions

The MVP exists to answer questions such as:

1. Do Youths care enough about their conquest to engage?
2. Do Parents perceive value?
3. Will Parents pay?
4. Do missions produce meaningful behavior?
5. Do families complete journeys?
6. Which mission structures work?
7. How personalized must missions be?
8. How much manual curation is required?
9. Which notifications matter?
10. What causes drop-off?
11. Does the Youth experience development or merely reward chasing?
12. Can the Concierge operation support multiple families efficiently?

Product development should improve our ability to answer these questions.

---

# 51. Product Metrics to Eventually Observe

Useful pilot metrics include:

- conquest creation rate;
- Parent approval rate;
- time from approval to first mission;
- mission completion rate;
- evidence submission rate;
- evidence approval/rejection;
- time-to-completion;
- journey completion;
- Youth retention;
- Parent retention;
- mission abandonment;
- notification effectiveness;
- Admin minutes per family/week;
- Admin minutes per mission;
- qualitative Parent satisfaction;
- qualitative Youth satisfaction;
- willingness to pay;
- referrals.

Do not build a large analytics platform before determining which measurements
are operationally necessary.

Manual tracking is acceptable during the Concierge phase.

---

# 52. Source-of-Truth Hierarchy

When information conflicts, use this hierarchy:

## Product intent

Most recent explicit product decision wins.

This document records the current strategy as of the handoff date.

## Technical implementation

Inspect:

1. current repository;
2. current migration ledger;
3. production behavior;
4. current tests.

Do not trust an old document over current code for implementation details.

## Historical decisions

Older implementation may explain why infrastructure exists, but should not
override newer Concierge decisions.

---

# 53. Rules for Future Coding Agents

Before modifying anything:

1. Read CLAUDE.md.
2. Read this document completely.
3. Inspect repository.
4. Inspect Git status/history.
5. Inspect migrations.
6. Understand Parent/Youth/Admin boundaries.
7. Understand Concierge strategy.
8. Run relevant tests.
9. Identify current production behavior.
10. Produce an audit before implementation when requested.

Never assume a feature should exist simply because infrastructure for it
exists.

---

# 54. Git Rules

Do not begin large changes directly on main.

Use a dedicated branch for meaningful work.

Before changes:

- confirm clean/known working tree;
- record current commit;
- understand uncommitted work.

After changes:

- inspect diff;
- run relevant tests;
- run lint/build;
- scan for secrets;
- explain migrations;
- obtain approval before risky production actions.

Do not silently discard local work.

---

# 55. Database Rules

Before database changes:

- inspect current migration ledger;
- inspect latest migrations;
- understand rollback implications;
- preserve RLS;
- avoid destructive operations;
- avoid manual schema drift.

Do not change production data merely to make tests pass.

---

# 56. Deployment Rules

A successful local build is not equivalent to a successful release.

Release validation may require:

CODE
↓
TEST
↓
COMMIT
↓
PUSH
↓
VERCEL DEPLOY
↓
PRODUCTION SMOKE
↓
PHYSICAL QA

For PWA/Push/mobile behavior, physical QA is particularly important.

---

# 57. Known Production URL

Current canonical production:

https://konki.vercel.app

Do not create alternative production deployments without explicit reason.

---

# 58. Current Mission

The current goal is not to redesign KONKI from zero.

The current goal is:

MAKE THE EXISTING CONCIERGE MVP RELIABLE, UNDERSTANDABLE AND EASY ENOUGH TO
RUN WITH REAL FAMILIES.

The next agent should aggressively identify:

- broken flows;
- confusing UX;
- unnecessary steps;
- unclear copy;
- weak feedback;
- mobile issues;
- operational Admin friction.

But it should be conservative about adding product scope.

---

# 59. First Task for the Next Agent

The recommended first task is a read-only/adversarial audit.

Do NOT modify code initially.

Read:

- CLAUDE.md;
- this handoff;
- repository;
- migrations;
- tests.

Then evaluate the application as:

Parent
Youth
Admin

Produce:

P0 / P1 / P2 findings.

For every finding:

Problem
→ Evidence
→ User impact
→ Proposed solution
→ Effort
→ Risk

Only after review should implementation begin.

---

# 60. Final Principle

KONKI's greatest current risk is not lack of features.

It is building too much before proving that the core behavioral loop creates
real value.

The technology should serve the experiment.

The experiment is:

Can a young person's genuine desire be transformed into a development journey
that the Youth engages with and the Parent values enough to continue paying
for?

Everything built during the Concierge MVP should help answer that question
more reliably.