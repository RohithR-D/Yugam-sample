import type { DocItem } from "../types";

export const ENDPOINT_MAP: Record<string, string> = {
  Quotation: "/api/sales/quotations",
  "Proforma Invoice": "/api/sales/proforma-invoices",
  "Sales Order": "/api/sales/orders",
  Invoice: "/api/sales/invoices",
  "Delivery Challan": "/api/sales/challans",
  "Sales Return": "/api/sales/returns",
};

export const STATUS_OPTIONS: Record<string, string[]> = {
  Quotation: ["Draft", "Sent", "Revised", "Accepted", "Rejected", "Expired", "Cancelled"],
  "Proforma Invoice": ["Draft", "Sent", "Accepted", "Expired", "Cancelled"],
  "Sales Order": ["Draft", "Confirmed", "In Progress", "Completed", "Cancelled", "On Hold"],
  Invoice: ["Draft", "Approved", "Sent", "Overdue", "Paid", "Cancelled", "Written Off"],
  "Delivery Challan": ["Draft", "Dispatched", "In Transit", "Delivered", "Returned", "Cancelled"],
  "Sales Return": ["Draft", "Confirmed", "Goods Received", "Credit Issued", "Cancelled"],
};

export const DOC_TYPE_MAP = {
  Overview: "",
  Quotation: "Quotation",
  "Proforma Invoice": "Proforma Invoice",
  "Sales Order": "Sales Order",
  Invoices: "Invoice",
  "Delivery Challan": "Delivery Challan",
  "Sales Return": "Sales Return",
} as const;

export const DATE_FIELD_MAP: Record<string, string> = {
  Quotation: "quotationDate",
  "Proforma Invoice": "proformaDate",
  "Sales Order": "orderDate",
  Invoice: "invoiceDate",
  "Delivery Challan": "challanDate",
  "Sales Return": "returnDate",
};

export const NUMBER_FIELD_MAP: Record<string, string> = {
  Quotation: "quotationNumber",
  "Proforma Invoice": "proformaNumber",
  "Sales Order": "soNumber",
  Invoice: "invoiceNumber",
  "Delivery Challan": "challanNumber",
  "Sales Return": "returnNumber",
};

export const COMPANY_INFO = {
  name: "Yugam Technologies Pvt. Ltd.",
  address: "3rd Floor, Tech Park, Andheri East",
  city: "Mumbai, Maharashtra — 400069",
  gstin: "27AABCY1234F1ZQ",
  stateCode: "27",
};

export function formatCurrency(value: number) {
  if (isNaN(value) || value === 0) return "Rs 0";
  return "Rs " + value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function emptyDocItem(): DocItem {
  return {
    description: "",
    hsnSac: "",
    quantity: "1",
    uom: "Nos",
    rate: "0",
    discountPercent: "0",
    cgstPercent: "9",
    cgstAmount: "0",
    sgstPercent: "9",
    sgstAmount: "0",
    igstPercent: "0",
    igstAmount: "0",
    taxableAmount: "0",
    lineTotal: "0",
    itemType: "Product",
  };
}

export function calcDocItem(item: DocItem, gstType: "cgst_sgst" | "igst" = "cgst_sgst"): DocItem {
  const qty = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.rate) || 0;
  const base = qty * rate;
  const discPct = parseFloat(item.discountPercent) || 0;
  const discAmt = (base * discPct) / 100;
  const taxable = base - discAmt;

  let cgstPct = 0;
  let sgstPct = 0;
  let igstPct = 0;
  if (gstType === "cgst_sgst") {
    cgstPct = parseFloat(item.cgstPercent) || 0;
    sgstPct = parseFloat(item.sgstPercent) || 0;
  } else {
    igstPct =
      (parseFloat(item.cgstPercent) || 0) + (parseFloat(item.sgstPercent) || 0) || parseFloat(item.igstPercent) || 18;
  }

  const cgstAmt = (taxable * cgstPct) / 100;
  const sgstAmt = (taxable * sgstPct) / 100;
  const igstAmt = (taxable * igstPct) / 100;
  const lineTotal = taxable + cgstAmt + sgstAmt + igstAmt;

  return {
    ...item,
    taxableAmount: taxable.toFixed(2),
    cgstPercent: cgstPct.toFixed(2),
    cgstAmount: cgstAmt.toFixed(2),
    sgstPercent: sgstPct.toFixed(2),
    sgstAmount: sgstAmt.toFixed(2),
    igstPercent: igstPct.toFixed(2),
    igstAmount: igstAmt.toFixed(2),
    lineTotal: lineTotal.toFixed(2),
  };
}
