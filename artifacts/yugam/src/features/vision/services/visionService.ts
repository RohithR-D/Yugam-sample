import { authFetch } from "@/lib/authFetch";

export async function getExecutiveSummary() {
  const res = await authFetch("/api/vision/executive-summary");
  if (!res.ok) return null;
  return res.json();
}

export async function getFinancialHealth() {
  const res = await authFetch("/api/vision/financial-health");
  if (!res.ok) return null;
  return res.json();
}

export async function getOpsProduction() {
  const res = await authFetch("/api/vision/ops-production");
  if (!res.ok) return null;
  return res.json();
}

export async function getReportCenter() {
  const res = await authFetch("/api/vision/report-center");
  if (!res.ok) return null;
  return res.json();
}
