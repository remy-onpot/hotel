export function dateRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isBlockingReservation(reservation, now = Date.now()) {
  if (reservation.status === "confirmed") return true;
  if (reservation.status !== "pending" || !reservation.hold_expires_at) return false;
  return new Date(reservation.hold_expires_at).getTime() > now;
}

export function canEditReservation(reservation, today) {
  return ["confirmed", "unconfirmed"].includes(reservation.status) && reservation.start_date > today;
}

export function isGuestCountWithinCapacity(guestCount, capacity) {
  return Number.isInteger(Number(guestCount)) && Number(guestCount) >= 1 && Number(guestCount) <= Number(capacity);
}
