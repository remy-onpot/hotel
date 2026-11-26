export function dateRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

export function isBlockingReservation(reservation, now = Date.now()) {
  if (reservation.status === "confirmed") return true;
  if (reservation.status !== "pending" || !reservation.hold_expires_at) return false;
  return new Date(reservation.hold_expires_at).getTime() > now;
}

export function canEditReservation(reservation, today) {
  return ["confirmed", "unconfirmed"].includes(reservation.status) &&
    reservation.start_date > today &&
    !reservation.checked_in_at &&
    !reservation.checked_out_at;
}

export function getAccraToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function isGuestCountWithinCapacity(guestCount, capacity) {
  return Number.isInteger(Number(guestCount)) && Number(guestCount) >= 1 && Number(guestCount) <= Number(capacity);
}
