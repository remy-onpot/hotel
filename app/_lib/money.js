export const bookingCurrency = "GHS";

export function formatMoney(amount, currency = bookingCurrency) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

export function formatRoomPrice(priceGhs, priceUsd) {
  const ghs = formatMoney(priceGhs, "GHS");
  if (priceUsd === null || priceUsd === undefined || priceUsd === "") return ghs;
  return `${ghs} · ${formatMoney(priceUsd, "USD")}`;
}
