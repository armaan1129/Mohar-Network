-- §2: only one business per category among active (and suspended) businesses.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.categories (id, name) values ('a0000000-0000-4000-8000-0000000000c1', 'Test Category One');

insert into public.businesses (id, name, category_id, address)
values ('a0000000-0000-4000-8000-0000000000b1', 'First Shop', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 1');

select throws_ok(
  $$ insert into public.businesses (name, category_id, address)
     values ('Second Shop', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
  '23505', null,
  'a second active business in the same category is rejected'
);

update public.businesses set status = 'suspended' where id = 'a0000000-0000-4000-8000-0000000000b1';

select throws_ok(
  $$ insert into public.businesses (name, category_id, address)
     values ('Second Shop', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
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
  $$ insert into public.businesses (id, name, category_id, address)
     values ('a0000000-0000-4000-8000-0000000000b2', 'Second Shop', 'a0000000-0000-4000-8000-0000000000c1', 'Some address 2') $$,
  'a business that left frees the category'
);

select throws_ok(
  $$ update public.businesses set status = 'active' where id = 'a0000000-0000-4000-8000-0000000000b1' $$,
  'P0001', 'MOHAR_BUSINESS_LEFT',
  'a business that left cannot be reactivated'
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
