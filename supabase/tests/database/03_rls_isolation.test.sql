-- §12: a business cannot read another business's rows; cashiers see less than owners;
-- admin rights need network_admin AND an MFA (aal2) session.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

insert into public.cities (id, code, name, slug, is_live) values
  ('b1000000-0000-4000-8000-0000000000e1', 'TRL', 'RLS City', 'trl-test', true);

-- Switch the transaction to an API user. Undo with `reset role`.
create function pg_temp.login(p_uid uuid, p_aal text default 'aal1') returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated', 'aal', p_aal)::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- Rows affected by a write, run as the current role (RLS silently filters UPDATE/DELETE).
create function pg_temp.affected(p_sql text) returns int language plpgsql as $$
declare
  n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------- fixture (as postgres)
insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-4000-8000-000000000001', 'admin@rls.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-0000000000a1', 'owner.a@rls.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-0000000000a2', 'cashier.a@rls.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-0000000000b1', 'owner.b@rls.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-4000-8000-0000000000b2', 'cashier.b@rls.test', 'authenticated', 'authenticated');
update public.profiles set role = 'network_admin' where user_id = 'b0000000-0000-4000-8000-000000000001';

insert into public.cities (code, name, slug, is_live) values ('TNL', 'Not Live City', 'tnl-test', false);
insert into public.categories (id, name) values
  ('b1000000-0000-4000-8000-00000000000a', 'RLS Cat A'),
  ('b1000000-0000-4000-8000-00000000000b', 'RLS Cat B');
insert into public.businesses (id, name, city_id, category_id, address) values
  ('b2000000-0000-4000-8000-00000000000a', 'Shop A', 'b1000000-0000-4000-8000-0000000000e1', 'b1000000-0000-4000-8000-00000000000a', 'Address of A'),
  ('b2000000-0000-4000-8000-00000000000b', 'Shop B', 'b1000000-0000-4000-8000-0000000000e1', 'b1000000-0000-4000-8000-00000000000b', 'Address of B');
insert into public.business_users (business_id, user_id, role) values
  ('b2000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-0000000000a1', 'owner'),
  ('b2000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-0000000000a2', 'cashier'),
  ('b2000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-0000000000b1', 'owner'),
  ('b2000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-0000000000b2', 'cashier');

insert into public.customers (id, mobile_e164, mobile_sha256, name) values
  ('b3000000-0000-4000-8000-00000000000a', '+919800000001', encode(sha256('+919800000001'::bytea), 'hex'), 'Customer of A'),
  ('b3000000-0000-4000-8000-00000000000b', '+919800000002', encode(sha256('+919800000002'::bytea), 'hex'), 'Customer of B');

insert into public.note_batches (id, city_code, series, first_seq, last_seq, stack_size, printed_at)
values ('b4000000-0000-4000-8000-000000000001', 'TRL', 'Z', 1, 4, 2, current_date);
insert into public.notes (id, city_code, series, seq, batch_id)
select ('b5000000-0000-4000-8000-00000000000' || s)::uuid, 'TRL', 'Z', s, 'b4000000-0000-4000-8000-000000000001'
from generate_series(1, 4) s;

insert into public.note_allocations (id, batch_id, business_id, first_seq, last_seq, stack_index) values
  ('b6000000-0000-4000-8000-00000000000a', 'b4000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000a', 1, 2, 0),
  ('b6000000-0000-4000-8000-00000000000b', 'b4000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000b', 3, 4, 1);
update public.notes set status = 'allocated', allocated_business_id = 'b2000000-0000-4000-8000-00000000000a',
  allocation_id = 'b6000000-0000-4000-8000-00000000000a' where seq in (1, 2);
update public.notes set status = 'allocated', allocated_business_id = 'b2000000-0000-4000-8000-00000000000b',
  allocation_id = 'b6000000-0000-4000-8000-00000000000b' where seq in (3, 4);

insert into public.issuances (id, business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, notes_count, idempotency_key, request_hash, created_at) values
  ('b7000000-0000-4000-8000-00000000000a', 'b2000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-0000000000a2',
   'b3000000-0000-4000-8000-00000000000a', 'A-1', 100000, 2, gen_random_uuid(), 'h', now()),
  ('b7000000-0000-4000-8000-0000000000a0', 'b2000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-0000000000a2',
   'b3000000-0000-4000-8000-00000000000a', 'A-0', 100000, 2, gen_random_uuid(), 'h', now() - interval '3 days'),
  ('b7000000-0000-4000-8000-00000000000b', 'b2000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-0000000000b2',
   'b3000000-0000-4000-8000-00000000000b', 'B-1', 100000, 2, gen_random_uuid(), 'h', now());

update public.notes set status = 'issued', issued_business_id = allocated_business_id,
  customer_id = 'b3000000-0000-4000-8000-00000000000a', issued_at = now(), expires_at = now() + interval '12 months',
  issuance_id = 'b7000000-0000-4000-8000-00000000000a' where seq = 2;
update public.notes set status = 'issued', issued_business_id = allocated_business_id,
  customer_id = 'b3000000-0000-4000-8000-00000000000b', issued_at = now(), expires_at = now() + interval '12 months',
  issuance_id = 'b7000000-0000-4000-8000-00000000000b' where seq = 4;
insert into public.issuance_items (issuance_id, note_id, face_paise) values
  ('b7000000-0000-4000-8000-00000000000a', 'b5000000-0000-4000-8000-000000000002', 10000),
  ('b7000000-0000-4000-8000-00000000000b', 'b5000000-0000-4000-8000-000000000004', 10000);

insert into public.redemptions (id, business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, discount_paise, no_other_offer_confirmed, idempotency_key, request_hash)
values ('b8000000-0000-4000-8000-00000000000b', 'b2000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-0000000000b2',
        'b3000000-0000-4000-8000-00000000000b', 'B-2', 50000, 10000, true, gen_random_uuid(), 'h');
insert into public.redemption_items (redemption_id, note_id, face_paise, issuer_business_id, is_self)
values ('b8000000-0000-4000-8000-00000000000b', 'b5000000-0000-4000-8000-000000000004', 10000, 'b2000000-0000-4000-8000-00000000000b', true);
update public.notes set status = 'redeemed', redeemed_at = now(), redemption_id = 'b8000000-0000-4000-8000-00000000000b' where seq = 4;

insert into public.settlement_periods (id, quarter_start, quarter_end, status)
values ('b9000000-0000-4000-8000-000000000001', '2026-07-01', '2026-09-30', 'draft');
insert into public.settlement_lines (period_id, business_id) values
  ('b9000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000a'),
  ('b9000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000b');
insert into public.disputes (period_id, business_id, reason)
values ('b9000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-00000000000b', 'Dispute filed by B');

-- ---------------------------------------------------------------- owner of A
select pg_temp.login('b0000000-0000-4000-8000-0000000000a1');

select results_eq($$ select name from public.businesses $$, array['Shop A'], 'owner A sees only business A');
select results_eq($$ select bill_ref from public.issuances order by bill_ref $$, array['A-0', 'A-1'], 'owner A sees all of A''s issuances and none of B''s');
select is((select count(*)::int from public.redemptions), 0, 'owner A cannot see B''s redemptions');
select is((select count(*)::int from public.redemption_items), 0, 'owner A cannot see B''s redemption items');
select results_eq($$ select serial from public.notes order by serial $$, array['TRL-Z000001', 'TRL-Z000002'], 'owner A sees only A''s notes');
select results_eq($$ select name from public.customers $$, array['Customer of A'], 'owner A sees only customers who transacted at A');
select is((select count(*)::int from public.note_events where business_id <> 'b2000000-0000-4000-8000-00000000000a'), 0, 'owner A sees no events of other businesses');
select ok((select count(*) from public.note_events) > 0, 'owner A sees A''s note events');
select results_eq($$ select business_id from public.settlement_lines $$, array['b2000000-0000-4000-8000-00000000000a'::uuid], 'owner A sees only A''s settlement line');
select is((select count(*)::int from public.disputes), 0, 'owner A cannot see B''s disputes');
select is((select count(*)::int from public.business_users), 2, 'owner A sees A''s staff only');
select is((select count(*)::int from public.profiles), 1, 'owner A sees only their own profile');
select is((select count(*)::int from public.audit_log), 0, 'owner A cannot read the audit log');
select is((select count(*)::int from public.note_batches), 0, 'owner A cannot read batches');

select throws_ok(
  $$ insert into public.businesses (name, city_id, category_id, address) values ('Sneaky', 'b1000000-0000-4000-8000-0000000000e1', 'b1000000-0000-4000-8000-00000000000b', 'x address') $$,
  '42501', null, 'owner A cannot create a business');
select is(
  pg_temp.affected($q$ update public.businesses set name = 'Renamed' $q$),
  0, 'owner A cannot edit businesses (admin only)');
select throws_ok(
  $$ update public.notes set status = 'void' $$,
  '42501', null, 'owner A cannot write notes directly');
select throws_ok(
  $$ insert into public.redemptions (business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, discount_paise, no_other_offer_confirmed, idempotency_key, request_hash)
     values ('b2000000-0000-4000-8000-00000000000a', 'b0000000-0000-4000-8000-0000000000a1', 'b3000000-0000-4000-8000-00000000000a', 'X', 1, 1, true, gen_random_uuid(), 'h') $$,
  '42501', null, 'owner A cannot insert redemptions directly');
select throws_ok(
  $$ update public.profiles set role = 'network_admin' where user_id = 'b0000000-0000-4000-8000-0000000000a1' $$,
  'P0001', 'MOHAR_FORBIDDEN', 'owner A cannot make themselves admin');
select is(
  pg_temp.affected($q$ delete from public.business_users where user_id = 'b0000000-0000-4000-8000-0000000000b2' $q$),
  0, 'owner A cannot remove B''s cashier');
reset role;

-- ---------------------------------------------------------------- cashier of A
select pg_temp.login('b0000000-0000-4000-8000-0000000000a2');
select results_eq($$ select bill_ref from public.issuances $$, array['A-1'], 'cashier A sees only the last 24 h of A''s issuances');
select is((select count(*)::int from public.settlement_lines), 0, 'cashier A cannot see settlement lines');
select is((select count(*)::int from public.business_users), 1, 'cashier A sees only their own membership');
select is(
  pg_temp.affected($q$ delete from public.business_users $q$),
  0, 'cashier A cannot remove staff');
reset role;

-- ---------------------------------------------------------------- owner of B
select pg_temp.login('b0000000-0000-4000-8000-0000000000b1');
select results_eq($$ select bill_ref from public.redemptions $$, array['B-2'], 'owner B sees B''s redemptions');
select is((select count(*)::int from public.issuances where business_id = 'b2000000-0000-4000-8000-00000000000a'), 0, 'owner B cannot see A''s issuances');
reset role;

-- ---------------------------------------------------------------- anon
set local role anon;
select throws_ok($$ select * from public.businesses $$, '42501', null, 'anon cannot read businesses directly');
select ok((select count(*) from public.directory() where name in ('Shop A', 'Shop B')) = 2, 'anon sees active businesses through directory()');
select throws_ok($$ select * from public.notes $$, '42501', null, 'anon cannot read notes');
select is((select count(*)::int from public.directory('trl')), 2, 'directory filters by city code');
select is((select count(*)::int from public.cities where code = 'TNL'), 0, 'anon cannot see a city that is not live');
reset role;

-- ---------------------------------------------------------------- admin
select pg_temp.login('b0000000-0000-4000-8000-000000000001', 'aal1');
select is((select count(*)::int from public.businesses), 0, 'admin without MFA (aal1) has no admin rights');
select throws_ok(
  $$ insert into public.categories (name) values ('Without MFA') $$,
  '42501', null, 'admin without MFA cannot write');
reset role;

select pg_temp.login('b0000000-0000-4000-8000-000000000001', 'aal2');
select ok((select count(*) from public.businesses) >= 2, 'admin with MFA sees every business');
select ok((select count(*) from public.redemptions) >= 1 and (select count(*) from public.issuances) >= 3, 'admin with MFA sees every ledger row');
select lives_ok(
  $$ insert into public.categories (name) values ('With MFA') $$,
  'admin with MFA can create a category');
reset role;

select * from finish();
rollback;
