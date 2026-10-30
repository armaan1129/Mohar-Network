-- Local / staging seed data. Never run against production.
--
-- Milestone 1: two cities (Sirhind live, Patiala not yet), categories, 3 demo businesses in
-- Sirhind (one of them national-scope), and demo logins.
-- Milestones 2–3 extend this with batch SIR-A (SIR-A000001–SIR-A000504, 12 stacks of 42), 20 customers
-- and a quarter of issue/redeem activity once the RPCs exist.
--
-- Demo logins (magic link via the local Mailpit inbox at http://127.0.0.1:54324):
--   admin@mohar.test          network admin (enrol TOTP on first visit to /admin)
--   owner.cafe@mohar.test     owner,   Demo Café
--   cashier.cafe@mohar.test   cashier, Demo Café
--   owner.salon@mohar.test    owner,   Demo Salon
--   owner.attar@mohar.test    owner,   Demo Attar House

insert into public.cities (id, code, name, name_pa, slug, is_live) values
  ('0c000000-0000-4000-8000-000000000001', 'SIR', 'Sirhind', 'ਸਰਹਿੰਦ', 'sirhind', true),
  ('0c000000-0000-4000-8000-000000000002', 'PTA', 'Patiala', 'ਪਟਿਆਲਾ', 'patiala', false);

insert into public.categories (id, name, name_pa) values
  ('10000000-0000-4000-8000-000000000001', 'Café', 'ਕੈਫ਼ੇ'),
  ('10000000-0000-4000-8000-000000000002', 'Salon', 'ਸੈਲੂਨ'),
  ('10000000-0000-4000-8000-000000000003', 'Attar & Perfume', 'ਅਤਰ'),
  ('10000000-0000-4000-8000-000000000004', 'Sweets & Bakery', 'ਮਿਠਾਈ ਤੇ ਬੇਕਰੀ'),
  ('10000000-0000-4000-8000-000000000005', 'Clothing', 'ਕੱਪੜੇ'),
  ('10000000-0000-4000-8000-000000000006', 'Footwear', 'ਜੁੱਤੀਆਂ');

insert into public.businesses (id, name, city_id, scope, category_id, address, lat, lng, phone, hours, issuance_cap_per_quarter) values
  ('20000000-0000-4000-8000-000000000001', 'Demo Café', '0c000000-0000-4000-8000-000000000001', 'city', '10000000-0000-4000-8000-000000000001',
   'Demo address — Main Bazaar, Sirhind, Punjab 140406', 30.643600, 76.384700, '+911762000001', '9 am – 10 pm, all days', 300),
  ('20000000-0000-4000-8000-000000000002', 'Demo Salon', '0c000000-0000-4000-8000-000000000001', 'city', '10000000-0000-4000-8000-000000000002',
   'Demo address — GT Road, Sirhind, Punjab 140406', 30.641900, 76.389200, '+911762000002', '10 am – 8 pm, closed Tuesday', 200),
  ('20000000-0000-4000-8000-000000000003', 'Demo Attar House', '0c000000-0000-4000-8000-000000000001', 'national', '10000000-0000-4000-8000-000000000003',
   'Demo address — Rauza Sharif Road, Sirhind, Punjab 140406', 30.646200, 76.380900, '+911762000003', '11 am – 9 pm, all days', null);

-- Demo auth users (local only). Passwordless: they sign in by magic link.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email, '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
from (values
  ('30000000-0000-4000-8000-000000000001'::uuid, 'admin@mohar.test'),
  ('30000000-0000-4000-8000-000000000002'::uuid, 'owner.cafe@mohar.test'),
  ('30000000-0000-4000-8000-000000000003'::uuid, 'cashier.cafe@mohar.test'),
  ('30000000-0000-4000-8000-000000000004'::uuid, 'owner.salon@mohar.test'),
  ('30000000-0000-4000-8000-000000000005'::uuid, 'owner.attar@mohar.test')
) as u (id, email);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u
where u.email like '%@mohar.test';

update public.profiles set role = 'network_admin', display_name = 'Network Admin'
where user_id = '30000000-0000-4000-8000-000000000001';

insert into public.business_users (business_id, user_id, role) values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000002', 'owner'),
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'cashier'),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', 'owner'),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000005', 'owner');
