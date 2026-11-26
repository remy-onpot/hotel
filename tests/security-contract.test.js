import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../supabase/migrations/20261126000000_booking_and_operations_hardening.sql", import.meta.url), "utf8");
const authConfig = await readFile(new URL("../auth.js", import.meta.url), "utf8");
const paymentStore = await readFile(new URL("../app/_lib/supabase/privilegedReservations.js", import.meta.url), "utf8");

test("reservation writes are revoked from guest database roles", () => {
  assert.match(migration, /revoke insert, update on public\.reservations from anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.update_guest_reservation[\s\S]*?to service_role/i);
  assert.match(migration, /grant execute on function public\.cancel_guest_reservation[\s\S]*?to service_role/i);
  assert.match(migration, /grant execute on function public\.soft_delete_guest_reservation[\s\S]*?to service_role/i);
});

test("Auth.js exposes only credentials and no Supabase guest JWT", () => {
  assert.match(authConfig, /providers:\s*\[Credentials\(credentials\)\]/);
  assert.doesNotMatch(authConfig, /Google|Facebook|supabaseAccessToken|SUPABASE_JWT_SECRET/);
});

test("contact submission has an atomic per-email rate limit and an admin queue status", () => {
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(normalized_email, 0\)\)/);
  assert.match(migration, /created_at > now\(\) - interval '1 hour'[\s\S]*?>= 3/);
  assert.match(migration, /status text not null default 'new'[\s\S]*?'in_progress'[\s\S]*?'resolved'/);
});

test("repeated Paystack verification treats an already-confirmed booking as success", () => {
  assert.match(paymentStore, /reservation\?\.status === "confirmed"\) return \{ data: reservation, error: null \}/);
  assert.match(paymentStore, /onConflict: "payment_reference", ignoreDuplicates: true/);
});
