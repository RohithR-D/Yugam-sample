import { authFetch } from "@/lib/authFetch";
import type { ProposalRecord } from "../types";

export async function getProposals(): Promise<ProposalRecord[]> {
  const response = await authFetch("/api/proposals");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getProposalById(id: number): Promise<ProposalRecord | null> {
  const response = await authFetch(`/api/proposals/${id}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
}
