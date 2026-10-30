-- Note lifecycle guard rails (§3), append-only ledgers, and the one-redemption-per-note rule.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email, aud, role) values ('c0000000-0000-4000-8000-000000000001', 'cashier@ledger.test', 'authenticated', 'authenticated');
insert into public.categories (id, name) values ('c1000000-0000-4000-8000-000000000001', 'Ledger Cat');
insert into public.businesses (id, name, category_id, address)
values ('c2000000-0000-4000-8000-000000000001', 'Ledger Shop', 'c1000000-0000-4000-8000-000000000001', 'Ledger address');
insert into public.customers (id, mobile_e164, mobile_sha256, name)
values ('c3000000-0000-4000-8000-000000000001', '+919811111111', encode(sha256('+919811111111'::bytea), 'hex'), 'Ledger Customer');
insert into public.note_batches (id, series, first_seq, last_seq, stack_size, printed_at)
values ('c4000000-0000-4000-8000-000000000001', 'Y', 1, 3, 3, current_date);
insert into public.notes (id, series, seq, batch_id)
select ('c5000000-0000-4000-8000-00000000000' || s)::uuid, 'Y', s, 'c4000000-0000-4000-8000-000000000001' from generate_series(1, 3) s;

select throws_ok(
  $$ insert into public.note_batches (series, first_seq, last_seq, stack_size, printed_at) values ('Y', 3, 10, 2, current_date) $$,
  '23P01', null, 'overlapping batches in the same series are rejected');

select is((select serial from public.notes where seq = 1), 'Y000001', 'serial is generated from series + seq');
select is((select count(*)::int from public.note_events where type = 'printed' and note_id in (select id from public.notes where series = 'Y')), 3, 'creating notes logs a printed event each');

select throws_ok(
  $$ update public.notes set status = 'issued', issued_at = now() where seq = 1 and series = 'Y' $$,
  'P0001', 'MOHAR_BAD_TRANSITION', 'printed → issued skips allocation and is rejected');

select throws_ok(
  $$ update public.notes set status = 'allocated' where seq = 1 and series = 'Y' $$,
  '23514', null, 'allocated without a business violates the status check');

insert into public.note_allocations (id, batch_id, business_id, first_seq, last_seq)
values ('c6000000-0000-4000-8000-000000000001', 'c4000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 1, 3);
update public.notes set status = 'allocated', allocated_business_id = 'c2000000-0000-4000-8000-000000000001',
  allocation_id = 'c6000000-0000-4000-8000-000000000001' where series = 'Y';

insert into public.issuances (id, business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, notes_count, idempotency_key, request_hash)
values ('c7000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001', 'L-1', 100000, 2, gen_random_uuid(), 'h');
update public.notes set status = 'issued', issued_business_id = allocated_business_id, customer_id = 'c3000000-0000-4000-8000-000000000001',
  issued_at = now(), expires_at = now() + interval '12 months', issuance_id = 'c7000000-0000-4000-8000-000000000001'
where series = 'Y' and seq in (1, 2);

insert into public.redemptions (id, business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, discount_paise, no_other_offer_confirmed, idempotency_key, request_hash)
values ('c8000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001', 'L-2', 50000, 10000, true, gen_random_uuid(), 'h'),
       ('c8000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001', 'L-3', 50000, 10000, true, gen_random_uuid(), 'h');
insert into public.redemption_items (redemption_id, note_id, face_paise, issuer_business_id, is_self)
values ('c8000000-0000-4000-8000-000000000001', 'c5000000-0000-4000-8000-000000000001', 10000, 'c2000000-0000-4000-8000-000000000001', true);

select throws_ok(
  $$ insert into public.redemption_items (redemption_id, note_id, face_paise, issuer_business_id, is_self)
     values ('c8000000-0000-4000-8000-000000000002', 'c5000000-0000-4000-8000-000000000001', 10000, 'c2000000-0000-4000-8000-000000000001', true) $$,
  '23505', null, 'the same note cannot appear in a second redemption');

update public.notes set status = 'redeemed', redeemed_at = now(), redemption_id = 'c8000000-0000-4000-8000-000000000001'
where series = 'Y' and seq = 1;

select is(
  (select business_id from public.note_events where note_id = 'c5000000-0000-4000-8000-000000000001' and type = 'redeemed'),
  'c2000000-0000-4000-8000-000000000001'::uuid,
  'redemption is logged against the redeeming business');

select throws_ok(
  $$ update public.notes set status = 'issued', redeemed_at = null, redemption_id = null where series = 'Y' and seq = 1 $$,
  'P0001', 'MOHAR_NOTE_FINAL', 'a redeemed note can never change again');

select throws_ok(
  $$ update public.notes set status = 'void', voided_at = now(), void_reason = 'test' where series = 'Y' and seq = 1 $$,
  'P0001', 'MOHAR_NOTE_FINAL', 'a redeemed note cannot be voided');

select throws_ok(
  $$ insert into public.redemptions (business_id, cashier_id, customer_id, bill_ref, bill_amount_paise, discount_paise, no_other_offer_confirmed, idempotency_key, request_hash)
     values ('c2000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000001', 'L-4', 50000, 10000, false, gen_random_uuid(), 'h') $$,
  '23514', null, 'a redemption without "no other offer" confirmation is rejected');

select throws_ok($$ delete from public.note_events $$, 'P0001', 'MOHAR_APPEND_ONLY', 'note_events is append-only');
select throws_ok($$ update public.audit_log set action = 'x' $$, 'P0001', 'MOHAR_APPEND_ONLY', 'audit_log is append-only');
select throws_ok($$ delete from public.redemptions $$, 'P0001', 'MOHAR_APPEND_ONLY', 'redemptions are append-only');

select * from finish();
rollback;
