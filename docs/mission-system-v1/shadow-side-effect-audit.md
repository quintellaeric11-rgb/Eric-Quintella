# Shadow Mode side-effect audit

Status: **ZERO BUSINESS SIDE EFFECTS**

## Scope proved

`runMissionSystemShadow()` receives plain cloned product data and a sanitized legacy summary. Its dependency surface contains only the local adapter, Composer, Materializer, semantic comparison, in-memory observability and a replaceable audit sink.

The runner has no Supabase client, database handle, RPC client, network client, email client, notification client, Storage client or product mutation callback.

## Forbidden effects verified

| Effect | Calls from Shadow runner |
|---|---:|
| Mission persistence or mutation | 0 |
| Journey persistence or mutation | 0 |
| XP mutation | 0 |
| Goal progress mutation | 0 |
| Contract mutation | 0 |
| Evidence or completion mutation | 0 |
| Notification | 0 |
| Email/message | 0 |
| Parent approval workflow | 0 |
| UI state | 0 |

The production entry point starts the shadow promise next to the legacy generation flow, but the returned audit object is never included in mission rows, persistence payloads or the HTTP response. Shadow errors are converted to a safe audit result and a final defensive `.catch(() => null)` prevents propagation into legacy.

## OFF behavior

`OFF` returns before the adapter, Composer, Materializer and audit sink execute. The automated test verifies zero audit writes and zero V1 executor calls.

## Evidence

- `scripts/mission-system-v1/test-shadow-side-effects.mjs`
- `scripts/mission-system-v1/test-shadow-integration.mjs`
- `lib/mission-system-v1/shadow-runner.mjs`
- `app/api/missions/recommend/route.ts`

No migration, Supabase write or new persistence mechanism was used.
