-- Every public table has RLS enabled and forced, and the ledger is unwritable from the API.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity),
  null,
  'every public table has RLS enabled'
);

select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relforcerowsecurity),
  null,
  'every public table forces RLS'
);

select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
     and (has_table_privilege('anon', c.oid, 'INSERT')
       or has_table_privilege('anon', c.oid, 'UPDATE')
       or has_table_privilege('anon', c.oid, 'DELETE'))),
  null,
  'anon cannot write any table'
);

select is(
  (select array_agg(t.name order by t.name) from unnest(array[
     'notes', 'note_events', 'note_batches', 'note_allocations', 'issuances', 'issuance_items',
     'redemptions', 'redemption_items', 'customers', 'settlement_periods', 'settlement_lines',
     'disputes', 'audit_log', 'scan_rejections', 'cashier_scan_state', 'rate_limit_buckets'
   ]) as t(name)
   where has_table_privilege('authenticated', format('public.%I', t.name), 'INSERT')
      or has_table_privilege('authenticated', format('public.%I', t.name), 'UPDATE')
      or has_table_privilege('authenticated', format('public.%I', t.name), 'DELETE')),
  null,
  'ledger, customer, settlement and audit tables are not writable by API users (RPCs only)'
);

select is(
  (select array_agg(c.relname::text order by c.relname) from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
     and has_table_privilege('anon', c.oid, 'SELECT')),
  array['categories', 'network_settings'],
  'anon can read only categories and network_settings'
);

select ok(
  has_function_privilege('anon', 'public.directory()', 'EXECUTE'),
  'anon can call the public directory'
);

select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'user_id', 'UPDATE'),
  'profiles.user_id is not updatable'
);

select * from finish();
rollback;
