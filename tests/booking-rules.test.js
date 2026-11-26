import test from "node:test";
import assert from "node:assert/strict";
import {
  canEditReservation,
  dateRangesOverlap,
  isBlockingReservation,
  isGuestCountWithinCapacity,
} from "../app/_lib/bookingRules.js";

test("date overlap uses hotel turnover dates as available", () => {
  assert.equal(dateRangesOverlap("2026-12-10", "2026-12-12", "2026-12-12", "2026-12-14"), false);
  assert.equal(dateRangesOverlap("2026-12-10", "2026-12-13", "2026-12-12", "2026-12-14"), true);
});

test("only confirmed stays and unexpired holds block dates", () => {
  const now = Date.parse("2026-12-01T12:00:00Z");
  assert.equal(isBlockingReservation({ status: "confirmed" }, now), true);
  assert.equal(isBlockingReservation({ status: "pending", hold_expires_at: "2026-12-01T12:01:00Z" }, now), true);
  assert.equal(isBlockingReservation({ status: "pending", hold_expires_at: "2026-12-01T11:59:00Z" }, now), false);
  assert.equal(isBlockingReservation({ status: "cancelled" }, now), false);
});

test("reservation edits require an eligible status and a future check-in", () => {
  assert.equal(canEditReservation({ status: "confirmed", start_date: "2026-12-02" }, "2026-12-01"), true);
  assert.equal(canEditReservation({ status: "pending", start_date: "2026-12-02" }, "2026-12-01"), false);
  assert.equal(canEditReservation({ status: "confirmed", start_date: "2026-12-01" }, "2026-12-01"), false);
});

test("guest count must be a positive whole number within capacity", () => {
  assert.equal(isGuestCountWithinCapacity("2", 3), true);
  assert.equal(isGuestCountWithinCapacity("0", 3), false);
  assert.equal(isGuestCountWithinCapacity("2.5", 3), false);
  assert.equal(isGuestCountWithinCapacity("4", 3), false);
});
