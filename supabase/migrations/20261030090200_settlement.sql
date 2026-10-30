-- Milestone 1 — settlement tables (§6). The computation and workflow arrive in milestone 5;
-- the tables exist now so RLS can be designed and tested as one whole.

create type public.settlement_status as enum ('open', 'draft', 'disputes', 'final', 'paid');
create type public.dispute_status as enum ('open', 'upheld', 'rejected', 'withdrawn');

create table public.settlement_periods (
  id uuid primary key default gen_random_uuid(),
  quarter_start date not null unique,
  quarter_end date not null,
  status public.settlement_status not null default 'open',
  network_ratio numeric(12, 8),
  pool_paise bigint check (pool_paise is null or pool_paise >= 0),
  draft_at timestamptz,
  final_at timestamptz,
  created_at timestamptz not null default now(),
  check (quarter_end > quarter_start),
  -- Calendar quarters only: starts on 1 Jan / 1 Apr / 1 Jul / 1 Oct, ends the day before the next.
  check (extract(day from quarter_start) = 1 and extract(month from quarter_start) in (1, 4, 7, 10)),
  check (quarter_end = (quarter_start + interval '3 months' - interval '1 day')::date)
);

create table public.settlement_lines (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.settlement_periods (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  inbound_face_paise bigint not null default 0 check (inbound_face_paise >= 0),
  inbound_bill_paise bigint not null default 0 check (inbound_bill_paise >= 0),
  ratio numeric(12, 8),
  factor numeric(12, 8),
  payout_paise bigint not null default 0 check (payout_paise >= 0),
  outbound_owed_paise bigint not null default 0 check (outbound_owed_paise >= 0),
  fee_paise bigint not null default 0 check (fee_paise >= 0),
  net_paise bigint not null default 0,
  self_redeemed_face_paise bigint not null default 0 check (self_redeemed_face_paise >= 0),
  statement_path text,
  paid_at date,
  payment_ref text check (payment_ref is null or length(payment_ref) <= 120),
  created_at timestamptz not null default now(),
  constraint settlement_lines_one_per_business unique (period_id, business_id),
  check (net_paise = payout_paise - outbound_owed_paise - fee_paise),
  check ((paid_at is null) = (payment_ref is null))
);

create index settlement_lines_business_idx on public.settlement_lines (business_id);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.settlement_periods (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  redemption_id uuid references public.redemptions (id) on delete restrict,
  reason text not null check (length(btrim(reason)) between 5 and 2000),
  status public.dispute_status not null default 'open',
  resolution text check (resolution is null or length(resolution) <= 2000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  check ((status in ('open')) = (resolved_at is null))
);

create index disputes_period_idx on public.disputes (period_id, status);

-- A finalised period is immutable, except for recording payments against its lines.
create function private.guard_final_settlement_line()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status public.settlement_status;
begin
  select p.status into v_status
  from public.settlement_periods p
  where p.id = coalesce(new.period_id, old.period_id);

  if v_status in ('final', 'paid') then
    if tg_op <> 'UPDATE'
       or (to_jsonb(new) - 'paid_at' - 'payment_ref') <> (to_jsonb(old) - 'paid_at' - 'payment_ref') then
      raise exception 'MOHAR_PERIOD_LOCKED' using detail = 'settlement period is final';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger settlement_lines_guard_final before insert or update or delete on public.settlement_lines
  for each row execute function private.guard_final_settlement_line();

create function private.guard_final_period()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.status <> 'open' then
    raise exception 'MOHAR_PERIOD_LOCKED' using detail = 'only an open period can be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status in ('final', 'paid') then
    if new.status not in ('final', 'paid')
       or (to_jsonb(new) - 'status') <> (to_jsonb(old) - 'status') then
      raise exception 'MOHAR_PERIOD_LOCKED' using detail = 'settlement period is final';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger settlement_periods_guard_final before update or delete on public.settlement_periods
  for each row execute function private.guard_final_period();

create trigger audit_settlement_periods after insert or update or delete on public.settlement_periods
  for each row execute function private.audit_row();
create trigger audit_settlement_lines after update on public.settlement_lines
  for each row execute function private.audit_row();
create trigger audit_disputes after insert or update on public.disputes
  for each row execute function private.audit_row();
