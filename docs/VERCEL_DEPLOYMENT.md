# KONKI on Vercel

This project keeps its ChatGPT Sites configuration as a fallback. Vercel must use the native Next.js scripts.

## Project settings

- Framework Preset: Next.js
- Root Directory: repository root
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build:vercel`
- Output Directory: leave empty (Next.js default `.next`)
- Node.js: 22.x

## Production environment variables

Configure these for Production (and Preview only when preview access is required):

- `NEXT_PUBLIC_APP_URL`: exact canonical public origin, without a trailing slash
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous/publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret

Do not configure `SUPABASE_DB_URL` in the Vercel runtime. It is only used by local migration and database test scripts. `KONKI_APP_URL` is also test tooling only.

## Supabase Auth URL configuration

After Vercel allocates the production domain, update Authentication > URL Configuration:

- Site URL: the exact Vercel production origin (later replace with the custom domain)
- Redirect URLs: add `/auth/callback` and `/auth/reset` for the production origin
- Keep `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/reset` for local development
- Add approved preview-domain patterns only if OAuth or password recovery will be tested in previews

When a custom domain is introduced, add its callback and reset URLs before changing the Site URL. Provider-side OAuth callback URLs remain the Supabase callback URL; the app redirect allowlist is managed in Supabase.

Invite links use the active browser origin and therefore follow the deployed domain automatically. Notification deep links are relative and remain portable.
