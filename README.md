# Sirhind Mohar

A ₹100 reward note that customers earn and spend across a closed network of partner
businesses in Sirhind, Punjab. Each printed note has a unique serial and a QR code for
`https://sirhindmohar.in/n/<serial>`. **That URL format is printed and permanent.**

Design, agreed rules and decisions: [`docs/design.md`](docs/design.md).

## Layout

```
apps/web            Next.js 15 app: public site, /app (counter PWA), /admin
packages/core       Pure TS rules: earn, redeem cap, serials, phone, money (100% unit-tested)
supabase/           migrations, seed.sql, pgTAP tests (supabase/tests)
e2e/                Playwright tests
.github/workflows/  ci.yml, deploy-migrations.yml, e2e-preview.yml
```

## Local development

Requires Node 22, pnpm 10 and Docker.

```bash
pnpm install
pnpm db:start            # local Supabase: Postgres, Auth, API, Mailpit
cp .env.example apps/web/.env.local   # fill keys from `pnpm exec supabase status`
pnpm dev                 # http://127.0.0.1:3000
```

Use `127.0.0.1` rather than `localhost`, matching `site_url` in `supabase/config.toml`.
Sign-in emails land in Mailpit at http://127.0.0.1:54324. Demo logins are listed in
`supabase/seed.sql` (e.g. `admin@mohar.test`; the admin enrols TOTP on first visit to `/admin`).

| Command                                      | What it does                                     |
| -------------------------------------------- | ------------------------------------------------ |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | All workspaces                                   |
| `pnpm db:reset`                              | Re-apply migrations and seed                     |
| `pnpm db:test`                               | pgTAP: RLS isolation, constraints, ledger guards |
| `pnpm db:lint`                               | Lint SQL functions                               |
| `pnpm --filter @mohar/web db:types`          | Regenerate `database.types.ts` after a migration |
| `pnpm build && E2E_SUPABASE=1 pnpm e2e`      | Playwright against the built app                 |

## Rules of the codebase

- Money is integer **paise**. Business time is **Asia/Kolkata**.
- RLS is on (and forced) for every table. Clients never write `notes`, `issuances` or
  `redemptions`; only `SECURITY DEFINER` RPCs do.
- Schema changes are migrations in `supabase/migrations`, applied by CI. Never edit production by hand.
- No secrets in git. `.env.example` lists every variable.
- Never log full mobile numbers (`redactMobile` in `@mohar/core`).
- This is not a wallet: no buying, topping up, transferring or cashing out notes.

## Environments

|            | Supabase                     | Vercel                  |
| ---------- | ---------------------------- | ----------------------- |
| Local      | `supabase start`             | `pnpm dev`              |
| Preview    | staging project              | preview per PR (`bom1`) |
| Production | production project (PITR on) | `main` (`bom1`)         |

`deploy-migrations.yml` pushes migrations to staging, then to production after approval.
It needs GitHub environments `staging` and `production`, each with secrets
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`.

### Hosted Supabase settings (per project, in the dashboard)

- Auth → Sign-ups: **disabled** (people are invited by the network admin).
- Auth → MFA: TOTP enabled.
- Auth → URL configuration: site URL `https://sirhindmohar.in`; redirect URLs
  `https://sirhindmohar.in/**` and the Vercel preview domain.

### Bootstrapping the network admin (once per project)

1. Supabase dashboard → Authentication → Users → **Invite user** with the admin's email.
2. In the SQL editor (this is recorded in `audit_log`):
   ```sql
   update public.profiles set role = 'network_admin'
   where user_id = (select id from auth.users where email = '<admin email>');
   ```
3. Sign in at `/login`, open `/admin` and enrol the authenticator app.
