export const INCLUDED_GUESTS = 2;

export function extraGuestCount(guests) {
  return Math.max(0, Number(guests) - INCLUDED_GUESTS);
}

export function nightTotalPrice(pricePerNight, guests, guestsDiscount = 50) {
  const guestPriceWithDiscount = pricePerNight * (guestsDiscount / 100);
  const total = pricePerNight + guestPriceWithDiscount * extraGuestCount(guests);

  return total.toFixed(2);
}

export function bookingTotalPrice(pricePerNight, guests, nightsCount, guestsDiscount = 50) {
  const total = nightTotalPrice(pricePerNight, guests, guestsDiscount) * nightsCount;

  return total.toFixed(2);
}
