import { authFetch } from "@/lib/authFetch";
import type { GateMetrics, VisitorRecord } from "../types";

export async function getGateDashboard(): Promise<GateMetrics> {
  const response = await authFetch("/api/gate/dashboard");
  if (!response.ok) {
    return { currentOccupancy: 0, totalToday: 0, expectedVIPs: 0 };
  }
  return response.json();
}

export async function getRecentVisitors(): Promise<VisitorRecord[]> {
  const response = await authFetch("/api/gate/visitors?limit=10");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getRollCall(): Promise<VisitorRecord[]> {
  const response = await authFetch("/api/gate/roll-call");
  if (!response.ok) {
    return [];
  }
  return response.json();
}
