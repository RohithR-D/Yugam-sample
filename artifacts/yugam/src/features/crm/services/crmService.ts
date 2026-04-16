import { authFetch } from "@/lib/authFetch";
import type { ClientRecord, ContactRecord } from "../types";

export interface CrmClientPage {
  data: ClientRecord[];
  totalPages: number;
  totalCount: number;
}

export async function getCrmClientsPage(page: number, limit = 50): Promise<CrmClientPage> {
  const response = await authFetch(`/api/clients?page=${page}&limit=${limit}`);
  if (!response.ok) {
    return { data: [], totalPages: 1, totalCount: 0 };
  }
  return response.json();
}

export async function getCrmClients(): Promise<ClientRecord[]> {
  const data = await getCrmClientsPage(1, 50);
  return data.data;
}

export async function getCrmContacts(): Promise<ContactRecord[]> {
  const response = await authFetch("/api/contacts");
  if (!response.ok) {
    return [];
  }
  return response.json();
}
