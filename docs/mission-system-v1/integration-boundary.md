# Mission System V1 integration boundary

Read-only map. No production file was modified.

| Boundary | Current file/function | Input | Output / side effects | V1 equivalent | Risk |
|---|---|---|---|---|---|
| Generation entry | `app/api/missions/recommend/route.ts::POST` | authenticated conquest id | Loads product state; calls legacy engine | normalize → classify → compose | High: adapter and authorization context |
| Legacy recommendation | `lib/mission-engine.mjs::classifyGoal/complexityFor/buildJourney` | conquest/profile/archetypes | recommendation payload | Composer contracts and scoring | High: semantic schemas differ |
| Journey persistence | RPC `persist_generated_journey`, migration `202608300020_p0_lifecycle_reconciliation.sql` | conquest + generated journey | writes journeys, journey_missions, notification | none in V1 isolated | Critical: forbidden in shadow mode |
| Parent journey approval | `app/functional-app.tsx::JourneyReview`; approve-journey RPCs in migrations 015–017 | journey edits/agreement | updates journey/conquest/contract | manual-review boundary | High |
| Mission execution | `app/functional-app.tsx::MissionFlow/Missions`; RPC `start_mission` in migration 021 | mission id and authorized user | started_at/status | materialized mission payload | High |
| Evidence/completion | `app/functional-app.tsx::Review/PilotReview/PrivateFile`; submit/approve RPCs in migrations 001/008/009 | evidence and decision | evidence, status, unlock | CompletionValidator | Critical: transaction/idempotency |
| XP/progress | `approve_mission` RPCs in migrations 008/009 | approved mission | xp_events, total_xp, progress | declared state outputs only | Critical: V1 must never mutate in shadow |
| Notifications/deep link | persistence/approval RPCs and notification views | journey/mission ids | notification row + URL | audit comparison only | Medium |
