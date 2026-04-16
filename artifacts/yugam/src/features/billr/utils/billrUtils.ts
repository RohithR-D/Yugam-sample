import type { LineItem } from "../types";

export const COMPANY_INFO = {
  name: "Yugam Technologies Pvt. Ltd.",
  address: "3rd Floor, Tech Park, Andheri East",
  city: "Mumbai, Maharashtra — 400069",
  gstin: "27AABCY1234F1ZQ",
  email: "billing@yugam.com",
};

export function formatCurrency(value: number) {
  if (isNaN(value) || value === 0) return "Rs 0";
  return "Rs " + value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function emptyLineItem(): LineItem {
  return { description: "", hsnSac: "", qty: "1", unit: "NOS", rate: "0", taxPercentage: "18", taxAmount: "0", lineTotal: "0" };
}

export function calcLineItem(item: LineItem): LineItem {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const taxPct = parseFloat(item.taxPercentage) || 0;
  const base = qty * rate;
  const tax = (base * taxPct) / 100;
  return { ...item, taxAmount: tax.toFixed(2), lineTotal: (base + tax).toFixed(2) };
}
