# Phase 2A shadow integration audit

## Status

`MISSION_COMPOSER_TECH_STATUS = SHADOW_INTEGRATED_LOCAL`

The legacy Mission Engine remains the only authority. The V1 result is neither persisted nor returned to the user.

## Entry point

`app/api/missions/recommend/route.ts::POST`, immediately after `buildJourney()` has produced the legacy proposal and before `persist_generated_journey`. Shadow and legacy persistence run in parallel; the route awaits the safe shadow result only after the legacy RPC has succeeded. The feature flag defaults to `OFF`.

## Adapter

`lib/mission-system-v1/product-context-adapter.mjs` maps conquest, youth profile, parent development goals, computed age, legacy classification and proposal metadata into the V1 context. Missing autonomy, permissions, approved relationships, family money rules and runtime state are explicitly listed. No approval, budget, third-party response or preference is invented.

## Feature flag

- Variable: `MISSION_SYSTEM_V1_MODE`
- Controlled values: `OFF`, `SHADOW`
- Default and invalid-value fallback: `OFF`
- `LIVE` does not exist.
- No environment variable was changed in this phase.

## Error isolation

Exceptions, timeouts, invalid/no-result contexts, version incompatibility and materialization failures are converted to an audit result. They cannot alter the legacy response. Default timeout is 50 ms.

## Sanitization

The record contains a SHA-256 context fingerprint, age band, enums, counts, flags and missing-field names. It excludes raw evidence, media, address, school, detailed routine, email, phone, password, banking/card/document data and unnecessary private financial content. Error messages redact email-like values.

## Logging and persistence

Phase 2A uses only a bounded in-memory process-local audit buffer of 1,000 sanitized records. The existing `analytics_events` table was not reused because that would introduce a business database side effect and does not define appropriate shadow retention/privacy semantics.

No persistence is necessary for **local technical integration**. Durable multi-instance/staging observation will eventually require explicit approval of retention, access policy, indexes, volume and failure behavior before any migration or external sink is introduced.

## Result codes observed

The audit record preserves composition and effective runtime results, including `MISSION_SELECTED`, `NO_ELIGIBLE_MISSION`, `NEEDS_PARENT_APPROVAL`, `NEEDS_USER_INPUT`, `PREREQUISITE_MISSING`, `CONTEXT_TOO_WEAK`, `EDITORIAL_VARIANT_GAP`, `CATALOG_ENTRY_NOT_AVAILABLE`, `VERSION_INCOMPATIBLE` and `V1_ERROR`. None affect legacy.

## Manual review flags

The operational plan remains authoritative. Rules with mission IDs/ranges are flagged from the selected sequence. Sequence rules 14, 66 and 111 have deterministic candidate triggers; interest-sensitive rules 39 and 69 are flagged when interests are present. Flags contain rule ID, trigger, owner, enforcement and available evidence, but never start a real approval workflow.

## Catalog gaps and M01

Catalogs were not expanded. Blocked alternatives can include `catalogId`, `missionId` and missing coverage. For ages 13, 15 and 16, M01 remains excluded before materialization and its `EDITORIAL_VARIANT_GAP` appears in blocked alternatives when relevant.

## Semantic comparison

Automatic comparison uses mechanic, experience pattern, goal type/relevance proxy and journey role. It can emit `MATCH`, `DIFFERENT_BUT_VALID`, `V1_NO_RESULT`, `V1_ERROR` or `REQUIRES_HUMAN_REVIEW`. It never automatically emits `V1_STRONGER` or `LEGACY_STRONGER`.

## Observability

Local metrics include runs, successes, no-results, errors, result-code and mission distributions, manual-review rate, catalog-block rate, variant-gap rate, legacy/V1 match and difference rates, and p50/p95 duration. No external dashboard was created.

## Development harness

`scripts/mission-system-v1/dev-shadow-harness.mjs` runs a sanitized development-shaped payload or an explicitly supplied local JSON file. It performs no network or database operation and prints only the sanitized audit record and aggregate local metrics.

## Known limitations

- The current product does not yet persist the V1 runtime-state registry.
- Parent presence is not treated as approval; therefore real shadow contexts can legitimately return `NEEDS_PARENT_APPROVAL`.
- Several user/family inputs remain unavailable and are surfaced as missing rather than inferred.
- In-memory audit data is process-local and ephemeral, appropriate only for local integration.
- Manual editorial judgment remains human; candidate flags do not claim to automate qualitative review.

## Restrictions confirmed

NO MIGRATION · NO SUPABASE CHANGE · NO UI CHANGE · NO COMMIT · NO PUSH · NO DEPLOY
