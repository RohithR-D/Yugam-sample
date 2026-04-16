import { authFetch } from "@/lib/authFetch";
import type { Client, SalesDoc } from "../types";

export async function getAllSalesDocuments(): Promise<SalesDoc[]> {
  const response = await authFetch("/api/sales/all-documents");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getSalesClients(): Promise<Client[]> {
  const response = await authFetch("/api/clients");
  if (!response.ok) {
    return [];
  }
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
}

export async function getSalesTypeDocuments(endpoint: string): Promise<any[]> {
  if (!endpoint) {
    return [];
  }
  const response = await authFetch(endpoint);
  if (!response.ok) {
    return [];
  }
  return response.json();
}
