# Shadow mode design

## Contract

`MISSION_SYSTEM_V1_MODE=SHADOW` leaves the legacy engine authoritative. A sanitized, immutable context copy is passed to V1. V1 performs normalize, classify, eligibility, scoring, composition and optional canonical materialization in memory only.

## Zero-side-effect guarantees

No UI output, DB write, mission/journey creation, XP/progress mutation, notification, storage operation, network call, or fallback to free-generated pedagogy. Exceptions are converted to `V1_ERROR` audit results.

## Audit record

Record only non-sensitive semantic fields: `legacySelection`, `v1Selection`, `v1ResultCode`, `v1Score`, `v1EligibilityReasons`, `v1BlockedAlternatives`, `materializationStatus`, `manualReviewFlags`, `comparisonResult`, and the five version identifiers. Raw youth text, evidence, DOB, names and contact data are excluded.

## Semantic comparison

Compare goal relevance, mechanic, experience pattern, competency, concrete action, energy, safety and journey role. IDs are diagnostic only. No LLM decides quality. Allowed outcomes: MATCH, DIFFERENT_BUT_VALID, V1_STRONGER, LEGACY_STRONGER, V1_NO_RESULT, V1_ERROR, REQUIRES_HUMAN_REVIEW. STRONGER outcomes require human review.

## Future insertion point

After the current API has loaded and authorized context, but before legacy persistence. Run V1 in a bounded try/catch with a cloned sanitized adapter payload; write only to an explicitly approved audit sink in a later phase. This phase implements no insertion or sink.
