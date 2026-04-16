import type { BOQItem } from "../types";

export function genId() {
  return Math.random().toString(36).substring(2, 10);
}

export function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rs 0";
  if (num >= 10000000) return `Rs ${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `Rs ${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `Rs ${(num / 1000).toFixed(1)}K`;
  return `Rs ${num.toLocaleString("en-IN")}`;
}

export function formatFullCurrency(value: number) {
  if (isNaN(value)) return "Rs 0.00";
  return `Rs ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function toDateInput(value: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function calcRowTotal(item: BOQItem): number {
  const baseCost = item.qty * item.baseRate;
  const laborCost = item.labor;
  const machineCost = item.machine;
  const overheadCost = item.overhead;
  const subtotal = baseCost + laborCost + machineCost + overheadCost;
  const wastageAmt = subtotal * (item.wastagePct / 100);
  const afterWastage = subtotal + wastageAmt;
  const marginAmt = afterWastage * (item.marginPct / 100);
  const afterMargin = afterWastage + marginAmt;
  const discountAmt = afterMargin * (item.discPct / 100);
  const afterDisc = afterMargin - discountAmt;
  const taxAmt = afterDisc * (item.taxPct / 100);
  return afterDisc + taxAmt + item.freight;
}

export function calcAggregates(items: BOQItem[]) {
  let baseCost = 0;
  let labor = 0;
  let machine = 0;
  let overheads = 0;
  let marginAmt = 0;
  let discountAmt = 0;
  let taxAmt = 0;
  let freight = 0;

  items.forEach((item) => {
    const bc = item.qty * item.baseRate;
    baseCost += bc;
    labor += item.labor;
    machine += item.machine;
    overheads += item.overhead;
    const subtotal = bc + item.labor + item.machine + item.overhead;
    const wastage = subtotal * (item.wastagePct / 100);
    const afterWastage = subtotal + wastage;
    const margin = afterWastage * (item.marginPct / 100);
    marginAmt += margin;
    const afterMargin = afterWastage + margin;
    const disc = afterMargin * (item.discPct / 100);
    discountAmt += disc;
    const afterDisc = afterMargin - disc;
    const tax = afterDisc * (item.taxPct / 100);
    taxAmt += tax;
    freight += item.freight;
  });

  const subtotal = baseCost + labor + machine + overheads;
  return {
    baseCost,
    labor,
    machine,
    overheads,
    subtotal,
    marginAmt,
    discountAmt,
    taxAmt,
    freight,
    grandTotal: items.reduce((sum, item) => sum + calcRowTotal(item), 0),
  };
}
