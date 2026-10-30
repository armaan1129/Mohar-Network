-- Milestone 1 — foundations: settings, categories, businesses, users, customers, audit log.
--
-- Conventions
--   * Money is bigint paise. Rates are basis points (bps) or numeric.
--   * Timestamps are timestamptz; business dates are computed in Asia/Kolkata.
--   * Helper functions live in schema `private` (not exposed by the API).
--   * RLS policies and grants for every table are in the *_rls.sql migration.

create extension if not exists btree_gist with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.profile_role as enum ('member', 'network_admin');
create type public.business_status as enum ('active', 'suspended', 'left');
create type public.business_role as enum ('owner', 'cashier');

-- ---------------------------------------------------------------------------
-- network_settings: the single row holding every business-rule number (§2)
-- ---------------------------------------------------------------------------
create table public.network_settings (
  id smallint primary key default 1 check (id = 1),
  note_face_paise bigint not null default 10000 check (note_face_paise > 0),
  earn_min_bill_paise bigint not null default 100000 check (earn_min_bill_paise > 0),
  earn_base_notes integer not null default 2 check (earn_base_notes >= 0),
  earn_step_paise bigint not null default 50000 check (earn_step_paise > 0),
  earn_on_bills_with_redemption boolean not null default false,
  redeem_cap_bps integer not null default 5000 check (redeem_cap_bps between 0 and 10000),
  require_mobile_match boolean not null default true,
  redeem_otp boolean not null default false,
  validity_months integer not null default 12 check (validity_months between 1 and 60),
  settlement_k numeric(6, 4) not null default 0.5 check (settlement_k >= 0),
  factor_floor numeric(6, 4) not null default 0.85 check (factor_floor > 0),
  factor_cap numeric(6, 4) not null default 1.15,
  network_fee_bps integer not null default 0 check (network_fee_bps between 0 and 10000),
  low_stock_pct integer not null default 20 check (low_stock_pct between 0 and 100),
  scan_lockout_threshold integer not null default 5 check (scan_lockout_threshold > 0),
  scan_lockout_seconds integer not null default 60 check (scan_lockout_seconds > 0),
  suspension_grace_days integer not null default 15 check (suspension_grace_days >= 0),
  consent_text_version text not null default 'v1',
  updated_at timestamptz not null default now(),
  check (factor_cap >= factor_floor)
);

comment on table public.network_settings is 'Single row (id = 1) of business-rule numbers from §2 and §6.';

insert into public.network_settings (id) values (1);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 60),
  name_pa text check (name_pa is null or length(btrim(name_pa)) between 1 and 60),
  created_at timestamptz not null default now()
);

create unique index categories_name_key on public.categories (lower(btrim(name)));

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  category_id uuid not null references public.categories (id) on delete restrict,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z0-9]{10}[0-9A-Z]Z[0-9A-Z]$'),
  address text not null check (length(btrim(address)) between 5 and 300),
  lat numeric(9, 6) check (lat is null or lat between -90 and 90),
  lng numeric(9, 6) check (lng is null or lng between -180 and 180),
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  hours text check (hours is null or length(hours) <= 200),
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  status public.business_status not null default 'active',
  issuance_cap_per_quarter integer check (issuance_cap_per_quarter is null or issuance_cap_per_quarter >= 0),
  joined_at date not null default (now() at time zone 'Asia/Kolkata')::date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((lat is null) = (lng is null)),
  check ((status = 'left') = (left_at is not null))
);

comment on column public.businesses.issuance_cap_per_quarter is 'Max notes issued per IST calendar quarter; null = no cap.';

-- One business per category. A suspended business keeps its category; only `left` frees it.
create unique index businesses_one_per_category
  on public.businesses (category_id)
  where status in ('active', 'suspended');

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users) and business_users
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.profile_role not null default 'member',
  display_name text check (display_name is null or length(display_name) <= 80),
  created_at timestamptz not null default now()
);

create table public.business_users (
  business_id uuid not null references public.businesses (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.business_role not null,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (business_id, user_id),
  -- A login belongs to exactly one business, so the counter app never has to ask "which business?".
  constraint business_users_one_business_per_user unique (user_id)
);

create index business_users_business_idx on public.business_users (business_id);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  mobile_e164 text unique check (mobile_e164 is null or mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  -- Kept after DPDP erasure so a returning customer can be recognised without storing the number.
  mobile_sha256 text not null unique,
  name text check (name is null or length(btrim(name)) between 1 and 120),
  consent_records_at timestamptz,
  consent_marketing_at timestamptz,
  consent_text_version text,
  created_at timestamptz not null default now(),
  erased_at timestamptz,
  check ((erased_at is null) = (mobile_e164 is not null)),
  check (erased_at is not null or name is not null)
);

comment on table public.customers is 'Customers identified by mobile. Erasure nulls mobile/name and keeps ledger links.';

-- ---------------------------------------------------------------------------
-- audit_log (append-only)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  action text not null,
  table_name text,
  row_id text,
  before jsonb,
  after jsonb
);

create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_row_idx on public.audit_log (table_name, row_id);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS policies and RPCs)
-- ---------------------------------------------------------------------------

-- Network admin AND signed in with MFA (aal2). Without TOTP the admin has no admin rights.
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role = 'network_admin' from public.profiles p where p.user_id = (select auth.uid())),
    false
  ) and coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

create function private.my_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select bu.business_id from public.business_users bu where bu.user_id = (select auth.uid());
$$;

create function private.my_owner_business_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select bu.business_id from public.business_users bu
  where bu.user_id = (select auth.uid()) and bu.role = 'owner';
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.my_business_ids() from public;
revoke all on function private.my_owner_business_ids() from public;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.my_business_ids() to authenticated, service_role;
grant execute on function private.my_owner_business_ids() to authenticated, service_role;

-- True for the service role, migrations and SECURITY DEFINER functions (which run as their
-- owner and do their own checks); false for anon/authenticated API callers.
create function private.is_trusted_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin');
$$;

grant execute on function private.is_trusted_backend() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger businesses_touch before update on public.businesses
  for each row execute function private.touch_updated_at();
create trigger network_settings_touch before update on public.network_settings
  for each row execute function private.touch_updated_at();

-- Generic row audit for admin-managed tables.
create function private.audit_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row_id text;
begin
  v_row_id := coalesce(
    to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id',
    to_jsonb(new) ->> 'user_id', to_jsonb(old) ->> 'user_id'
  );
  insert into public.audit_log (actor_user_id, action, table_name, row_id, before, after)
  values (
    (select auth.uid()),
    lower(tg_op),
    tg_table_name,
    v_row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_network_settings after insert or update or delete on public.network_settings
  for each row execute function private.audit_row();
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function private.audit_row();
create trigger audit_businesses after insert or update or delete on public.businesses
  for each row execute function private.audit_row();
create trigger audit_business_users after insert or update or delete on public.business_users
  for each row execute function private.audit_row();
create trigger audit_profiles after update on public.profiles
  for each row when (old.role is distinct from new.role) execute function private.audit_row();

-- Append-only guard, used by audit_log, note_events and other ledgers.
create function private.forbid_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'MOHAR_APPEND_ONLY' using detail = tg_table_name || ' is append-only';
end;
$$;

create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function private.forbid_change();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.forbid_change();

-- Only an admin (or a backend job) may change a profile's role.
-- Not SECURITY DEFINER on purpose: is_trusted_backend() must see the real caller.
create function private.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not (private.is_admin() or private.is_trusted_backend()) then
    raise exception 'MOHAR_FORBIDDEN' using detail = 'only a network admin can change roles';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'MOHAR_FORBIDDEN' using detail = 'user_id is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role before update on public.profiles
  for each row execute function private.guard_profile_role();

-- Every auth user gets a profile.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- `left` stamps left_at; leaving is one-way.
create function private.guard_business_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'left' and new.status <> 'left' then
    raise exception 'MOHAR_BUSINESS_LEFT' using detail = 'a business that left cannot be reactivated; create a new one';
  end if;
  if new.status = 'left' and old.status <> 'left' then
    new.left_at := coalesce(new.left_at, (now() at time zone 'Asia/Kolkata')::date);
  end if;
  return new;
end;
$$;

create trigger businesses_guard_status before update of status on public.businesses
  for each row execute function private.guard_business_status();

-- ---------------------------------------------------------------------------
-- Public directory (anon-safe columns of active businesses)
-- ---------------------------------------------------------------------------
create function public.directory()
returns table (
  id uuid,
  name text,
  category_id uuid,
  category_name text,
  category_name_pa text,
  address text,
  lat numeric,
  lng numeric,
  phone text,
  hours text,
  logo_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.id, b.name, c.id, c.name, c.name_pa, b.address, b.lat, b.lng, b.phone, b.hours, b.logo_url
  from public.businesses b
  join public.categories c on c.id = b.category_id
  where b.status = 'active'
  order by c.name, b.name;
$$;

revoke all on function public.directory() from public;
grant execute on function public.directory() to anon, authenticated, service_role;
