export function formatCurrency(val: string) {
  const num = parseFloat(val);
  if (isNaN(num)) return "₹ 0";
  return "₹ " + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatCurrencyShort(val: number) {
  if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)}L`;
  if (val >= 1000) return `₹ ${(val / 1000).toFixed(1)}K`;
  return `₹ ${val.toFixed(0)}`;
}

export function parseMoney(val: string) {
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : 0;
}
