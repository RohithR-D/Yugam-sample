export const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

export function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatCurrency(value: string | number): string {
  const parsed = typeof value === "string" ? parseFloat(value) : value;

  if (Number.isNaN(parsed)) {
    return "Rs 0";
  }

  if (parsed >= 10000000) {
    return `Rs ${(parsed / 10000000).toFixed(2)} Cr`;
  }

  if (parsed >= 100000) {
    return `Rs ${(parsed / 100000).toFixed(2)} L`;
  }

  if (parsed >= 1000) {
    return `Rs ${(parsed / 1000).toFixed(1)} K`;
  }

  return `Rs ${parsed.toLocaleString("en-IN")}`;
}
