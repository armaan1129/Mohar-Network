-- Milestone 1 — the notes ledger: batches, notes, allocations, events, issuances, redemptions.
--
-- Clients never write these tables. All writes go through SECURITY DEFINER RPCs
-- (milestones 2–3), which lock rows with SELECT … FOR UPDATE. The constraints and
-- triggers below are the last line of defence if an RPC has a bug:
--   * a note's columns must agree with its status;
--   * only legal status transitions are allowed, and terminal notes never change;
--   * every status change is written to note_events automatically;
--   * a note can appear in at most one issuance and at most one redemption.

create type public.note_status as enum ('printed', 'allocated', 'issued', 'redeemed', 'expired', 'void');

-- ---------------------------------------------------------------------------
-- note_batches
-- ---------------------------------------------------------------------------
create table public.note_batches (
  id uuid primary key default gen_random_uuid(),
  series text not null check (series ~ '^[A-Z]$'),
  first_seq integer not null check (first_seq between 1 and 999999),
  last_seq integer not null check (last_seq between 1 and 999999),
  stack_size integer not null check (stack_size > 0),
  printed_at date not null,
  notes text check (notes is null or length(notes) <= 1000),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (last_seq >= first_seq),
  -- Two batches can never cover the same serial.
  constraint note_batches_no_overlap exclude using gist (
    series with =,
    int4range(first_seq, last_seq, '[]') with &&
  )
);

-- ---------------------------------------------------------------------------
-- note_allocations: a range (usually one stack) handed to a business
-- ---------------------------------------------------------------------------
create table public.note_allocations (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.note_batches (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  first_seq integer not null,
  last_seq integer not null,
  stack_index integer check (stack_index is null or stack_index >= 0),
  allocated_by uuid references auth.users (id) on delete set null,
  allocated_at timestamptz not null default now(),
  check (last_seq >= first_seq)
);

create index note_allocations_business_idx on public.note_allocations (business_id);

-- ---------------------------------------------------------------------------
-- issuances and redemptions (headers)
-- ---------------------------------------------------------------------------
create table public.issuances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  cashier_id uuid not null references auth.users (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  bill_ref text not null check (length(btrim(bill_ref)) between 1 and 64),
  business_date date not null default (now() at time zone 'Asia/Kolkata')::date,
  bill_amount_paise bigint not null check (bill_amount_paise > 0),
  notes_count integer not null check (notes_count > 0),
  idempotency_key uuid not null,
  request_hash text not null,
  created_at timestamptz not null default now(),
  constraint issuances_idempotency_key unique (cashier_id, idempotency_key),
  constraint issuances_one_per_bill unique (business_id, bill_ref, business_date)
);

create index issuances_business_created_idx on public.issuances (business_id, created_at desc);
create index issuances_customer_idx on public.issuances (customer_id);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  cashier_id uuid not null references auth.users (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  bill_ref text not null check (length(btrim(bill_ref)) between 1 and 64),
  business_date date not null default (now() at time zone 'Asia/Kolkata')::date,
  bill_amount_paise bigint not null check (bill_amount_paise > 0),
  discount_paise bigint not null check (discount_paise > 0),
  -- A bill that used another offer cannot redeem Mohars; the cashier must confirm.
  no_other_offer_confirmed boolean not null check (no_other_offer_confirmed),
  idempotency_key uuid not null,
  request_hash text not null,
  created_at timestamptz not null default now(),
  check (discount_paise <= bill_amount_paise),
  constraint redemptions_idempotency_key unique (cashier_id, idempotency_key),
  constraint redemptions_one_per_bill unique (business_id, bill_ref, business_date)
);

create index redemptions_business_created_idx on public.redemptions (business_id, created_at desc);
create index redemptions_customer_idx on public.redemptions (customer_id);
create index redemptions_created_idx on public.redemptions (created_at);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  series text not null check (series ~ '^[A-Z]$'),
  seq integer not null check (seq between 1 and 999999),
  serial text generated always as (series || lpad(seq::text, 6, '0')) stored,
  batch_id uuid not null references public.note_batches (id) on delete restrict,
  status public.note_status not null default 'printed',
  allocated_business_id uuid references public.businesses (id) on delete restrict,
  allocation_id uuid references public.note_allocations (id) on delete restrict,
  issued_business_id uuid references public.businesses (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete restrict,
  issued_at timestamptz,
  expires_at timestamptz,
  issuance_id uuid references public.issuances (id) on delete restrict,
  redeemed_at timestamptz,
  redemption_id uuid references public.redemptions (id) on delete restrict,
  voided_at timestamptz,
  void_reason text check (void_reason is null or length(void_reason) <= 300),
  updated_at timestamptz not null default now(),
  constraint notes_series_seq_key unique (series, seq),
  constraint notes_serial_key unique (serial),
  constraint notes_issued_where_allocated check (
    issued_business_id is null or issued_business_id = allocated_business_id
  ),
  constraint notes_status_fields check (
    case status
      when 'printed' then
        allocated_business_id is null and issued_business_id is null and customer_id is null
        and issuance_id is null and redemption_id is null
      when 'allocated' then
        allocated_business_id is not null and allocation_id is not null
        and issued_business_id is null and customer_id is null and issuance_id is null and redemption_id is null
      when 'issued' then
        issued_business_id is not null and customer_id is not null and issued_at is not null
        and expires_at is not null and issuance_id is not null and redemption_id is null
      when 'redeemed' then
        issued_business_id is not null and customer_id is not null and issuance_id is not null
        and redeemed_at is not null and redemption_id is not null
      when 'expired' then
        issued_business_id is not null and issuance_id is not null and redemption_id is null
      when 'void' then
        voided_at is not null and void_reason is not null and redemption_id is null
    end
  )
);

comment on column public.notes.serial is 'Compact serial, e.g. A000001. The QR encodes https://sirhindmohar.in/n/<serial>.';

create index notes_batch_idx on public.notes (batch_id);
create index notes_allocated_business_idx on public.notes (allocated_business_id, status);
create index notes_issued_business_idx on public.notes (issued_business_id);
create index notes_customer_idx on public.notes (customer_id) where customer_id is not null;
create index notes_expiry_idx on public.notes (expires_at) where status = 'issued';

-- ---------------------------------------------------------------------------
-- line items (the link that makes double issue / double redemption impossible)
-- ---------------------------------------------------------------------------
create table public.issuance_items (
  issuance_id uuid not null references public.issuances (id) on delete restrict,
  note_id uuid not null references public.notes (id) on delete restrict,
  face_paise bigint not null check (face_paise > 0),
  primary key (issuance_id, note_id),
  constraint issuance_items_note_once unique (note_id)
);

create table public.redemption_items (
  redemption_id uuid not null references public.redemptions (id) on delete restrict,
  note_id uuid not null references public.notes (id) on delete restrict,
  face_paise bigint not null check (face_paise > 0),
  -- Snapshot at redemption time, so settlement never re-derives from mutable rows.
  issuer_business_id uuid not null references public.businesses (id) on delete restrict,
  is_self boolean not null,
  primary key (redemption_id, note_id),
  constraint redemption_items_note_once unique (note_id)
);

create index redemption_items_issuer_idx on public.redemption_items (issuer_business_id);

-- ---------------------------------------------------------------------------
-- note_events (append-only)
-- ---------------------------------------------------------------------------
create table public.note_events (
  id bigint generated always as identity primary key,
  note_id uuid not null references public.notes (id) on delete restrict,
  type text not null check (type in ('printed', 'allocated', 'returned', 'issued', 'redeemed', 'expired', 'voided')),
  actor_user_id uuid,
  business_id uuid references public.businesses (id) on delete restrict,
  payload jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create index note_events_note_idx on public.note_events (note_id, at);
create index note_events_business_idx on public.note_events (business_id, at desc);

create trigger note_events_append_only before update or delete on public.note_events
  for each row execute function private.forbid_change();
create trigger note_events_no_truncate before truncate on public.note_events
  for each statement execute function private.forbid_change();

-- ---------------------------------------------------------------------------
-- Ops tables: scan rejections (fraud + lockout), cashier lockout state, rate limits
-- ---------------------------------------------------------------------------
create table public.scan_rejections (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid references public.businesses (id) on delete set null,
  mode text not null check (mode in ('issue', 'redeem')),
  serial_raw text not null check (length(serial_raw) <= 128),
  serial text,
  reason text not null
);

create index scan_rejections_serial_idx on public.scan_rejections (serial, at desc);
create index scan_rejections_user_idx on public.scan_rejections (user_id, at desc);

create table public.cashier_scan_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  consecutive_rejects integer not null default 0 check (consecutive_rejects >= 0),
  locked_until timestamptz
);

create table public.rate_limit_buckets (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (user_id, bucket, window_start)
);

-- ---------------------------------------------------------------------------
-- Note integrity triggers
-- ---------------------------------------------------------------------------

create function private.guard_note_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.series <> old.series or new.seq <> old.seq or new.batch_id <> old.batch_id then
    raise exception 'MOHAR_IMMUTABLE' using detail = 'note identity cannot change: ' || old.serial;
  end if;

  if old.status in ('redeemed', 'expired', 'void') then
    raise exception 'MOHAR_NOTE_FINAL' using detail = old.serial || ' is ' || old.status;
  end if;

  if new.status <> old.status and not (
       (old.status = 'printed'   and new.status in ('allocated', 'void'))
    or (old.status = 'allocated' and new.status in ('printed', 'issued', 'void'))
    or (old.status = 'issued'    and new.status in ('redeemed', 'expired', 'void'))
  ) then
    raise exception 'MOHAR_BAD_TRANSITION'
      using detail = old.serial || ': ' || old.status || ' → ' || new.status;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger notes_guard_update before update on public.notes
  for each row execute function private.guard_note_update();

-- Writes a note_events row for every insert and every status change.
-- RPCs can attach context with: set_config('mohar.event_payload', '{"reason":"…"}', true).
create function private.log_note_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text;
  v_business uuid;
  v_extra jsonb := coalesce(nullif(current_setting('mohar.event_payload', true), '')::jsonb, '{}'::jsonb);
begin
  if tg_op = 'INSERT' then
    v_type := 'printed';
  elsif new.status = old.status then
    return new;
  else
    v_type := case new.status
      when 'allocated' then 'allocated'
      when 'printed' then 'returned'
      when 'issued' then 'issued'
      when 'redeemed' then 'redeemed'
      when 'expired' then 'expired'
      when 'void' then 'voided'
    end;
  end if;

  v_business := case
    when v_type = 'redeemed' then (select r.business_id from public.redemptions r where r.id = new.redemption_id)
    when v_type = 'returned' then old.allocated_business_id
    else coalesce(new.issued_business_id, new.allocated_business_id)
  end;

  insert into public.note_events (note_id, type, actor_user_id, business_id, payload)
  values (
    new.id,
    v_type,
    (select auth.uid()),
    v_business,
    jsonb_build_object('from', case when tg_op = 'UPDATE' then old.status end, 'to', new.status) || v_extra
  );
  return new;
end;
$$;

create trigger notes_log_insert after insert on public.notes
  for each row execute function private.log_note_event();
create trigger notes_log_status after update of status on public.notes
  for each row execute function private.log_note_event();

-- Ledger rows are never edited or deleted once written.
create trigger issuances_append_only before update or delete on public.issuances
  for each row execute function private.forbid_change();
create trigger issuance_items_append_only before update or delete on public.issuance_items
  for each row execute function private.forbid_change();
create trigger redemptions_append_only before update or delete on public.redemptions
  for each row execute function private.forbid_change();
create trigger redemption_items_append_only before update or delete on public.redemption_items
  for each row execute function private.forbid_change();
