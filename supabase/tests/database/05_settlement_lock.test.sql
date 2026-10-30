-- §6: a finalised period is immutable except for recording payments.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into public.categories (id, name) values ('d1000000-0000-4000-8000-000000000001', 'Settle Cat');
insert into public.businesses (id, name, category_id, address)
values ('d2000000-0000-4000-8000-000000000001', 'Settle Shop', 'd1000000-0000-4000-8000-000000000001', 'Settle address');

select throws_ok(
  $$ insert into public.settlement_periods (quarter_start, quarter_end) values ('2026-02-01', '2026-04-30') $$,
  '23514', null, 'periods must be calendar quarters');

insert into public.settlement_periods (id, quarter_start, quarter_end, status)
values ('d9000000-0000-4000-8000-000000000001', '2026-04-01', '2026-06-30', 'draft');
insert into public.settlement_lines (id, period_id, business_id, inbound_face_paise, payout_paise, outbound_owed_paise, net_paise)
values ('da000000-0000-4000-8000-000000000001', 'd9000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 500000, 400000, 600000, -200000);

select throws_ok(
  $$ update public.settlement_lines set net_paise = 0 where id = 'da000000-0000-4000-8000-000000000001' $$,
  '23514', null, 'net must equal payout − outbound − fee');

update public.settlement_periods set status = 'final', final_at = now() where id = 'd9000000-0000-4000-8000-000000000001';

select throws_ok(
  $$ update public.settlement_lines set payout_paise = 1, net_paise = 1 - 600000 where id = 'da000000-0000-4000-8000-000000000001' $$,
  'P0001', 'MOHAR_PERIOD_LOCKED', 'amounts on a final period cannot change');

select lives_ok(
  $$ update public.settlement_lines set paid_at = '2026-07-20', payment_ref = 'UTR123' where id = 'da000000-0000-4000-8000-000000000001' $$,
  'payments can be recorded on a final period');

select throws_ok(
  $$ update public.settlement_periods set status = 'draft' where id = 'd9000000-0000-4000-8000-000000000001' $$,
  'P0001', 'MOHAR_PERIOD_LOCKED', 'a final period cannot be reopened');

select lives_ok(
  $$ update public.settlement_periods set status = 'paid' where id = 'd9000000-0000-4000-8000-000000000001' $$,
  'a final period can be marked paid');

select * from finish();
rollback;
