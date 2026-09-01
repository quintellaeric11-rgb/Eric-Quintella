# Bootstrap prerequisite semantics

## Canonical initial state

`INITIAL` means that no Mission System V1 mission has been completed and no historical V1 output exists. It does not synthesize mission outputs, family permissions, parent approval, approved people, money rules, or youth autonomy.

Facts that follow directly from the current conquest record may be derived:

- a `DRAFT` conquest has `decision_open=true`;
- a titled `PROJECT` conquest has `project_goal_exists=true`.

## Prerequisite phases

- `ENTRY_PREREQUISITE`: must be true before mission execution. Missing entry facts block eligibility.
- `IN_MISSION_SETUP`: the canonical mission explicitly teaches the youth to produce the fact before using it. The fact is not assumed; completion must prove the setup/action required by the completion contract.

An `IN_MISSION_SETUP` rule does not make a mission a universal bootstrap. Bootstrap eligibility is explicitly allowlisted by `missionId × goalType` in `bootstrapGoalTypes`.

## Editorial audit

| Mission | Previous prerequisite | Phase | Canonical evidence | Bootstrap decision |
|---|---|---|---|---|
| M12 | `MIN_REAL_OPTIONS(2)` | `IN_MISSION_SETUP` | Section 3 instructs the youth to choose 2–3 real options and research missing information before comparing. | Not enabled. `CR_M12` requires `price`, which conflicts with some declared goal types. |
| M12 | `decision_open` | `ENTRY_PREREQUISITE` | The experience compares options to make a still-open choice. | Derived only from a current `DRAFT` conquest. |
| M22 | `project_goal_exists` | `ENTRY_PREREQUISITE` | The special editorial rule says it appears only when the conquest itself is a project. | Enabled for `PROJECT`. |
| M22 | `minimum_testable_result_can_be_defined` | `IN_MISSION_SETUP` | Sections 1–3 define the desired result, cut it to the smallest version, and define the first test. | Enabled for `PROJECT`. |
| M29 | `baseline_can_be_recorded` | `IN_MISSION_SETUP` | Sections 1–2 require the initial attempt and recording before practice begins. | Enabled for `SKILL`; not generalized to `PROJECT`. |
| M37 | `long_term_goal` | `ENTRY_PREREQUISITE` | The critical editorial rule restricts the mission to long conquests. | Not bootstrap. |
| M37 | `observable_end_state_can_be_defined` | `ENTRY_PREREQUISITE` | The experience presupposes a large goal and turns it into a verifiable 90-day result. | Not bootstrap. |
| M38 | `MIN_REAL_OPTIONS(2)` | `IN_MISSION_SETUP` | Section 4 instructs the youth to find and record at least three real options. | Enabled only for `PHYSICAL_PRODUCT`. |
| M38 | `decision_open` | `ENTRY_PREREQUISITE` | The mission exists to choose a version before a final choice. | Derived only from a current `DRAFT` conquest. |

M38 is not expanded to `TRAVEL` or `EXPERIENCE`: the Bible frames versions, models, products, courses, and equipment, while `CR_M38` requires `price`. `CAREER_EDUCATION` is not authorized as INITIAL bootstrap because a generic career choice is not necessarily a priced version/model comparison.

M43 is authorized for `TRAVEL` and `EXPERIENCE` only when its in-mission action is selected from `GOAL_PREPARATION_ACTION_CATALOG` with matching goal type, age, LOW/GUARDED safety, and no entry prerequisite. Any action requiring Parent approval, money, real transport, external contact, or another permission remains gated.

M07 is authorized for `CAREER_EDUCATION` only at ages 16–18. `city` is `IN_MISSION_SETUP`: the youth chooses it in section 1; it is never presumed.

M45 is the canonical `FINANCIAL_GOAL` bootstrap. It diagnoses declared target, purpose, desired horizon, current income including zero, adjustable spending including none, possible path categories, Parent-dependent paths, and one next safe path. It performs no financial action and never infers answers.

`EDITORIAL_GAP_CAREER_EDUCATION_UNDER_16` remains explicit.
