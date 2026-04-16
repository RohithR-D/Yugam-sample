import { authFetch } from "@/lib/authFetch";
import type { Client, InvoiceRecord, ReceiptRecord } from "../types";

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const response = await authFetch("/api/invoices");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getReceipts(): Promise<ReceiptRecord[]> {
  const response = await authFetch("/api/receipts");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getBillrClients(): Promise<Client[]> {
  const response = await authFetch("/api/clients");
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
}
