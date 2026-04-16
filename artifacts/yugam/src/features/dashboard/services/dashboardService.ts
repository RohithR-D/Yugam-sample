import { authFetch } from "@/lib/authFetch";
import type { DashboardSummary } from "../types";

export async function getDashboardSummary() {
  const res = await authFetch(`${import.meta.env.BASE_URL}api/dashboard-summary`);
  if (!res.ok) throw new Error("Failed to fetch");
  return (await res.json()) as DashboardSummary;
}
