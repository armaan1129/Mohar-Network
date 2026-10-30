-- Milestone 1 — Row Level Security and grants for every public table.
--
-- Model
--   * Start from nothing: revoke every table privilege from anon and authenticated, then grant
--     back only what a policy below covers. A table without a grant is unreachable, even if a
--     policy were added by mistake.
--   * RLS is enabled AND forced on every table (pgTAP checks this for future tables too).
--   * Admin = profiles.role 'network_admin' AND an aal2 (TOTP) session; see private.is_admin().
--   * Ledger tables (notes, issuances, redemptions, …) have no write grants at all: only the
--     SECURITY DEFINER RPCs write them.

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke all on table public.%I from anon, authenticated', t.tablename);
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('alter table public.%I force row level security', t.tablename);
  end loop;
end;
$$;

-- Sequences behind identity columns: nobody writes those tables directly.
revoke all on all sequences in schema public from anon, authenticated;

-- New tables must opt in to grants explicitly.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- network_settings: public read (the rules are public), admin update
-- ---------------------------------------------------------------------------
grant select on public.network_settings to anon, authenticated;
grant update on public.network_settings to authenticated;

create policy network_settings_read on public.network_settings
  for select to anon, authenticated using (true);
create policy network_settings_admin_update on public.network_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- cities: live cities are public; a member also sees their own city; admin all
-- ---------------------------------------------------------------------------
grant select on public.cities to anon, authenticated;
grant insert, update, delete on public.cities to authenticated;

create policy cities_read_live on public.cities
  for select to anon using (is_live);
create policy cities_read on public.cities
  for select to authenticated
  using (
    is_live
    or (select private.is_admin())
    or id in (select b.city_id from public.businesses b where b.id in (select private.my_business_ids()))
  );
create policy cities_admin_insert on public.cities
  for insert to authenticated with check ((select private.is_admin()));
create policy cities_admin_update on public.cities
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy cities_admin_delete on public.cities
  for delete to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- categories: public read, admin write
-- ---------------------------------------------------------------------------
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

create policy categories_read on public.categories
  for select to anon, authenticated using (true);
create policy categories_admin_insert on public.categories
  for insert to authenticated with check ((select private.is_admin()));
create policy categories_admin_update on public.categories
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_admin_delete on public.categories
  for delete to authenticated using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- businesses: members read their own; admin reads and writes all.
-- Everyone else uses public.directory(), which returns only public columns of active businesses.
-- No delete: a business leaves by status = 'left'.
-- ---------------------------------------------------------------------------
grant select, insert, update on public.businesses to authenticated;

create policy businesses_read on public.businesses
  for select to authenticated
  using ((select private.is_admin()) or id in (select private.my_business_ids()));
create policy businesses_admin_insert on public.businesses
  for insert to authenticated with check ((select private.is_admin()));
create policy businesses_admin_update on public.businesses
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- profiles: own row; admin all. Users may change their display name; role is admin-only
-- (column grant + private.guard_profile_role trigger).
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name, role) on public.profiles to authenticated;

create policy profiles_read on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()))
  with check (user_id = (select auth.uid()) or (select private.is_admin()));

-- ---------------------------------------------------------------------------
-- business_users: see yourself and (owners) your staff; admin manages all;
-- an owner may remove a cashier of their own business.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.business_users to authenticated;

create policy business_users_read on public.business_users
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or business_id in (select private.my_owner_business_ids())
    or (select private.is_admin())
  );
create policy business_users_admin_insert on public.business_users
  for insert to authenticated with check ((select private.is_admin()));
create policy business_users_admin_update on public.business_users
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy business_users_delete on public.business_users
  for delete to authenticated
  using (
    (select private.is_admin())
    or (role = 'cashier' and business_id in (select private.my_owner_business_ids()))
  );

-- ---------------------------------------------------------------------------
-- customers: admin; members see customers who transacted at their business.
-- Cross-business lookup by mobile goes through rpc_lookup_customer (name only). No writes.
-- ---------------------------------------------------------------------------
grant select on public.customers to authenticated;

create policy customers_read on public.customers
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.issuances i
      where i.customer_id = customers.id and i.business_id in (select private.my_business_ids())
    )
    or exists (
      select 1 from public.redemptions r
      where r.customer_id = customers.id and r.business_id in (select private.my_business_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- Stock: batches (admin), allocations and notes (own business), events (own business)
-- ---------------------------------------------------------------------------
grant select on public.note_batches, public.note_allocations, public.notes, public.note_events to authenticated;

create policy note_batches_read on public.note_batches
  for select to authenticated using ((select private.is_admin()));

create policy note_allocations_read on public.note_allocations
  for select to authenticated
  using ((select private.is_admin()) or business_id in (select private.my_business_ids()));

create policy notes_read on public.notes
  for select to authenticated
  using (
    (select private.is_admin())
    or allocated_business_id in (select private.my_business_ids())
    or issued_business_id in (select private.my_business_ids())
    or redemption_id in (
      select r.id from public.redemptions r where r.business_id in (select private.my_business_ids())
    )
  );

create policy note_events_read on public.note_events
  for select to authenticated
  using ((select private.is_admin()) or business_id in (select private.my_business_ids()));

-- ---------------------------------------------------------------------------
-- Issuances / redemptions: owners see their business's history; cashiers see the last
-- 24 hours of their business (enough for "today", and limits what a cashier can scrape).
-- ---------------------------------------------------------------------------
grant select on public.issuances, public.issuance_items, public.redemptions, public.redemption_items to authenticated;

create policy issuances_read on public.issuances
  for select to authenticated
  using (
    (select private.is_admin())
    or business_id in (select private.my_owner_business_ids())
    or (business_id in (select private.my_business_ids()) and created_at > now() - interval '24 hours')
  );

create policy issuance_items_read on public.issuance_items
  for select to authenticated
  using (exists (select 1 from public.issuances i where i.id = issuance_items.issuance_id));

create policy redemptions_read on public.redemptions
  for select to authenticated
  using (
    (select private.is_admin())
    or business_id in (select private.my_owner_business_ids())
    or (business_id in (select private.my_business_ids()) and created_at > now() - interval '24 hours')
  );

create policy redemption_items_read on public.redemption_items
  for select to authenticated
  using (exists (select 1 from public.redemptions r where r.id = redemption_items.redemption_id));

-- ---------------------------------------------------------------------------
-- Settlement: periods are visible to members; lines and disputes to owners of that
-- business; admin all. Writes go through RPCs (milestone 5).
-- ---------------------------------------------------------------------------
grant select on public.settlement_periods, public.settlement_lines, public.disputes to authenticated;

create policy settlement_periods_read on public.settlement_periods
  for select to authenticated using (true);

create policy settlement_lines_read on public.settlement_lines
  for select to authenticated
  using ((select private.is_admin()) or business_id in (select private.my_owner_business_ids()));

create policy disputes_read on public.disputes
  for select to authenticated
  using ((select private.is_admin()) or business_id in (select private.my_owner_business_ids()));

-- ---------------------------------------------------------------------------
-- Audit and ops: admin read only. cashier_scan_state and rate_limit_buckets: no client access.
-- ---------------------------------------------------------------------------
grant select on public.audit_log, public.scan_rejections to authenticated;

create policy audit_log_read on public.audit_log
  for select to authenticated using ((select private.is_admin()));
create policy scan_rejections_read on public.scan_rejections
  for select to authenticated using ((select private.is_admin()));
