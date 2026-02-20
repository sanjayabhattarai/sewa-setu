export function formatMoneyCents(
  amountCents: number | null | undefined,
  currency?: string | null
) {
  if (amountCents == null) return "—";

  const cur = (currency ?? "eur").toUpperCase(); // "eur" -> "EUR"
  const amount = amountCents / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}