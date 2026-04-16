export const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20";

export const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b"];

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string): string {
  return (
    new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " " +
    new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
}

export function formatCurrency(value: string | number): string {
  return `Rs ${parseFloat(String(value)).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}
