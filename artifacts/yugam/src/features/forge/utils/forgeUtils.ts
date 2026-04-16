export function fmtDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return `${fmtDate(value)} ${fmtTime(value)}`;
}

export function fmtCurrency(value: string | number): string {
  return `Rs${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

export const selectCls = inputCls + " cursor-pointer";
