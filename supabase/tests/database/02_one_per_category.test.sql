-- §2: only one business per category per city among active (and suspended) businesses.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into public.cities (id, code, name, slug, is_live) values
  ('a0000000-0000-4000-8000-0000000000e1', 'TQA', 'Test City A', 'tqa-test', true),
  ('a0000000-0000-4000-8000-0000000000e2', 'TQB', 'Test City B', 'tqb-test', true);

insert into public.categories (id, name) values ('a0000000-0000-4000-8000-0000000000c1', 'Test Category One');

insert into public.businesses (id, name, city_id, category_id, address)
values ('a0000000-0000-4000-8000-0000000000b1', 'First Shop', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 1');

select throws_ok(
  $$ insert into public.businesses (name, city_id, category_id, address)
     values ('Second Shop', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
  '23505', null,
  'a second active business in the same category is rejected'
);

update public.businesses set status = 'suspended' where id = 'a0000000-0000-4000-8000-0000000000b1';

select throws_ok(
  $$ insert into public.businesses (name, city_id, category_id, address)
     values ('Second Shop', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
  '23505', null,
  'a suspended business still holds its category'
);

update public.businesses set status = 'left' where id = 'a0000000-0000-4000-8000-0000000000b1';

select isnt(
  (select left_at from public.businesses where id = 'a0000000-0000-4000-8000-0000000000b1'),
  null,
  'leaving stamps left_at'
);

select lives_ok(
  $$ insert into public.businesses (id, name, city_id, category_id, address)
     values ('a0000000-0000-4000-8000-0000000000b2', 'Second Shop', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
  'a business that left frees the category'
);

select throws_ok(
  $$ update public.businesses set status = 'active' where id = 'a0000000-0000-4000-8000-0000000000b1' $$,
  'P0001', 'MOHAR_BUSINESS_LEFT',
  'a business that left cannot be reactivated'
);

select lives_ok(
  $$ insert into public.businesses (name, city_id, category_id, address)
     values ('Shop in City B', 'a0000000-0000-4000-8000-0000000000e2', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 3') $$,
  'the same category is open in another city'
);

select throws_ok(
  $$ update public.businesses set city_id = 'a0000000-0000-4000-8000-0000000000e2' where id = 'a0000000-0000-4000-8000-0000000000b2' $$,
  'P0001', 'MOHAR_CITY_FIXED',
  'a business cannot move to another city'
);

select throws_ok(
  $$ insert into public.cities (code, name, slug) values ('si', 'Bad Code', 'bad-code') $$,
  '23514', null,
  'city codes are exactly three capital letters'
);

select throws_ok(
  $$ insert into public.categories (name) values ('  test category ONE ') $$,
  '23505', null,
  'category names are unique ignoring case and spaces'
);

select is(
  (select count(*)::int from public.audit_log where table_name = 'businesses' and row_id = 'a0000000-0000-4000-8000-0000000000b1'),
  3,
  'business changes are audited (insert, suspend, leave)'
);

select * from finish();
rollback;
