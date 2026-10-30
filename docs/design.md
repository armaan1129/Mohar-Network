# The Mohar Network — design

The agreed design for the network app: data model, RPC surface, RLS, and the rulings on every
ambiguous rule. The master brief is the source for anything not listed here; where the brief says
"Sirhind Mohar" or `sirhindmohar.in`, read "the Mohar Network" and `themoharnetwork.com`.

## National network (agreed 30 Oct 2026)

| #   | Topic       | Decision                                                                                                                                                                                                   |
| --- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | Domain      | `themoharnetwork.com` for the national site, partner app (`/app`) and admin (`/admin`). Each city gets a subdomain for its public site, e.g. `sirhind.themoharnetwork.com` (milestone 4).                  |
| N2  | QR / serial | Printed QR: `https://themoharnetwork.com/n/SIR-A000001`. Serial = 3-letter city code, hyphen, series letter, 6 digits. Permanent; never depends on a subdomain. No notes were printed with the old domain. |
| N3  | Cities      | A `cities` table (code, name, subdomain slug, state, live flag). The code is printed on notes, so it is effectively permanent. A business belongs to one city and never moves.                             |
| N4  | Categories  | One business per category **per city** (active or suspended).                                                                                                                                              |
| N5  | Spend scope | Set per business at onboarding: `city` accepts notes issued in its own city; `national` also accepts notes issued by other `national` businesses in any city.                                              |
| N6  | Admin       | One national network admin for now; city admins can be added later.                                                                                                                                        |

Redemption rule this implies (enforced in `rpc_redeem_notes`, milestone 3): a note issued by
business I can be redeemed at business R when I and R are in the same city, or when both are
`national`.

**Proposed, to confirm before milestone 5:** settle each quarter in separate pools that each
balance to zero: one pool per city (redemptions where issuer and redeemer share a city) and one
national pool (cross-city redemptions between national businesses). This stops one city's
redemption pattern from moving money in another city.

## Decisions (agreed 30 Oct 2026)

| #   | Topic            | Decision                                                                                                                                                                                                          |
| --- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Repo             | Monorepo in `armaan1129/Mohar-Network`.                                                                                                                                                                           |
| 3   | Logins           | Email magic link now (assumed for cashiers too until an SMS provider with DLT templates is chosen, then phone OTP). Self sign-up is off: the admin invites.                                                       |
| 4   | One per category | A **suspended** business keeps its category. Only `left` frees it, and leaving is permanent.                                                                                                                      |
| 5   | Framework        | Next.js 15.                                                                                                                                                                                                       |
| 7   | Content          | Punjabi drafted in-house for review; legal pages marked "draft — legal review".                                                                                                                                   |
| 8   | Bill basis       | Redemption cap uses the gross bill before the Mohar discount. If `earn_on_bills_with_redemption` is on, earn is on gross − discount.                                                                              |
| 9   | Same bill        | `bill_ref` is required and unique per business per IST day. Issuing is rejected if the same business redeemed against the same `bill_ref` that day.                                                               |
| 10  | Short stock      | Strict: issuing fewer notes than earned is rejected. The low-stock alert (20%) prevents it.                                                                                                                       |
| 11  | Issuance cap     | Counted in notes per IST calendar quarter, hard block.                                                                                                                                                            |
| 12  | Suspended / left | Suspended: no issuing; redeeming continues, payouts net against debt. **Open:** can a `left` business redeem, and who covers the liability of its still-valid issued notes?                                       |
| 13  | Expiry           | Valid through 23:59:59 IST on the same date 12 months later. `expires_at` is fixed at issue. Unissued stock never expires.                                                                                        |
| 14  | Void             | Admin voids any unredeemed note; owners void their own unissued stock. Lost issued notes are not replaced.                                                                                                        |
| 15  | Reversals        | Admin-only, audited, open quarter only (milestone 3).                                                                                                                                                             |
| 16  | Consent          | Two checkboxes: record-keeping (required to issue) and SMS/WhatsApp (optional).                                                                                                                                   |
| 17  | Name mismatch    | Keep the stored name; show the cashier the mismatch.                                                                                                                                                              |
| 18  | "No loss"        | The §6 formula is implemented exactly. It does not guarantee no loss, so public copy won't claim that.                                                                                                            |
| 19  | Mixed bills      | `inbound_bill` is pro-rated by the face value of the non-self notes on the bill.                                                                                                                                  |
| 20  | Payments         | Hub model: negative nets pay the network settlement account, which pays positive nets. Suspension applies to an unpaid negative net > 15 days after finalising. Fee rounds half-up per business.                  |
| 21  | Calendar         | Calendar quarters in IST, by redemption time. Jobs at 02:00 IST. Disputes days 7–14 only; an upheld dispute reverses the redemption and the draft is recomputed; finalising is blocked while any dispute is open. |

Still open: #2 (Supabase/Vercel/Cloudflare accounts and secrets), the `left` half of #12, and the
settlement pools above. #6 is settled by N2.

## ERD

```
auth.users 1──1 profiles (role: member | network_admin)
auth.users 1──1 business_users (role: owner|cashier) *──1 businesses *──1 categories
                                                              businesses *──1 cities (code SIR, slug sirhind)
                     businesses: scope city|national; partial unique(city_id, category_id) where status in (active, suspended)
network_settings  (single row, id = 1)

cities 1──* note_batches 1──* notes 1──* note_events (append-only, written by trigger)
notes.serial = city_code-series+seq, e.g. SIR-A000001 (note's city and series must match its batch)
note_batches 1──* note_allocations *──1 businesses
notes *──0..1 businesses  (allocated_business_id, issued_business_id)
notes *──0..1 customers

businesses 1──* issuances  1──* issuance_items   *──1 notes  (note_id UNIQUE)
businesses 1──* redemptions 1──* redemption_items 1──1 notes (note_id UNIQUE)

settlement_periods 1──* settlement_lines *──1 businesses   unique(period_id, business_id)
settlement_periods 1──* disputes

ops: audit_log (append-only), scan_rejections, cashier_scan_state, rate_limit_buckets
```

Guard rails enforced in the database (not only in RPCs):

- `notes_status_fields`: a note's columns must agree with its status.
- `guard_note_update`: only `printed→allocated→issued→redeemed`, `issued→expired`,
  `allocated→printed` (return), `{printed,allocated,issued}→void`. Redeemed, expired and void
  notes never change again.
- `note_events`, `audit_log`, issuances, redemptions and their items are append-only.
- A finalised settlement period is immutable except `paid_at` / `payment_ref`.
- Batches in a city's series cannot overlap.
- A business cannot change city.

## RPCs

All `SECURITY DEFINER`, `search_path = ''`, check role and business from `auth.uid()`,
lock notes with `SELECT … ORDER BY seq FOR UPDATE`, run in one transaction, and raise
`MOHAR_<CODE>` errors with the serial in `DETAIL`.

| Milestone | Function                                                                                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2         | `rpc_create_batch(city_code, series, first_seq, last_seq, stack_size, printed_at, notes)`; allocation only to businesses in the batch's city                                                         |
| 2         | `rpc_allocate_range(business_id, first_serial, last_serial)`, `rpc_allocate_stack(batch_id, stack_index, business_id)`, `rpc_return_range(first_serial, last_serial, reason)`                        |
| 2         | `rpc_void_note(serial, reason)`                                                                                                                                                                      |
| 3         | `rpc_lookup_customer(mobile_e164)` → name, active notes                                                                                                                                              |
| 3         | `rpc_scan_note(mode, serial, mobile_e164)` → per-scan check; logs rejections; 5 rejects → 60 s lock                                                                                                  |
| 3         | `rpc_issue_notes(idempotency_key, mobile, name, bill_paise, bill_ref, serials[], consent_records, consent_marketing, consent_version)`                                                               |
| 3         | `rpc_redeem_notes(idempotency_key, mobile, bill_paise, bill_ref, serials[], no_other_offer, otp?)`                                                                                                   |
| 4         | `public_note_status(serial)` → state, valid_until, masked mobile, business, where it can be spent (anon)                                                                                             |
| 5         | `settlement_compute(period_id)`, `rpc_settlement_create_draft(quarter_start)`, `rpc_file_dispute`, `rpc_resolve_dispute`, `rpc_finalise_period`, `rpc_record_payment`, `rpc_my_outbound_redemptions` |
| 6         | `rpc_erase_customer(customer_id, reason)`, `rpc_remove_staff(business_id, user_id)`                                                                                                                  |
| cron      | `job_expire_notes()`, `job_apply_suspensions()`, `job_settlement_drafts()`                                                                                                                           |

## RLS

Every table: RLS enabled and forced; all privileges revoked from `anon`/`authenticated`,
then granted back per table. `private.is_admin()` requires `network_admin` **and** an `aal2`
(TOTP) session. pgTAP in `supabase/tests/database` proves each line below.

| Table                                  | Read                                                                                              | Write                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------- |
| network_settings, categories           | everyone                                                                                          | admin                             |
| cities                                 | public: live cities; members: own city; admin all                                                 | admin                             |
| businesses                             | admin; members: own business; public: `directory(city_code?)` (active, live cities, safe columns) | admin                             |
| profiles                               | own; admin                                                                                        | own display name; role admin-only |
| business_users                         | self; owners: own staff; admin                                                                    | admin; owners remove cashiers     |
| customers                              | admin; members: customers who transacted with them                                                | RPC only                          |
| note_batches                           | admin                                                                                             | RPC only                          |
| notes, note_allocations, note_events   | admin; members: own business's                                                                    | RPC only                          |
| issuances, redemptions (+ items)       | admin; owners: own business; cashiers: own business, last 24 h                                    | RPC only                          |
| settlement_periods                     | members                                                                                           | RPC only                          |
| settlement_lines, disputes             | admin; owners of that business                                                                    | RPC only                          |
| audit_log, scan_rejections             | admin                                                                                             | triggers / RPC                    |
| cashier_scan_state, rate_limit_buckets | nobody                                                                                            | RPC only                          |

## Settlement worked example (§6)

The brief's example checks out to the paisa (largest-remainder rounding):
F −₹692.11, C +₹1,792.71, S −₹1,100.60, sum 0. It becomes the fixture for the
`packages/core` settlement test and its SQL mirror in milestone 5.
