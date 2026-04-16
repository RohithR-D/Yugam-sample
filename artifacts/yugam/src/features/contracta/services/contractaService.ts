import { authFetch } from "@/lib/authFetch";
import { Compliance, DashboardSummary, Template, ComplianceFormData, TemplatePayload } from "../types";

export async function getContractaDashboardSummary(): Promise<DashboardSummary | null> {
  const res = await authFetch("/api/contracta/dashboard-summary");
  if (!res.ok) return null;
  return res.json();
}

export async function getCompliances(category: string): Promise<Compliance[]> {
  const res = await authFetch(`/api/contracta/compliances?category=${encodeURIComponent(category)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createCompliance(payload: ComplianceFormData & { category: string }): Promise<Compliance> {
  const res = await authFetch("/api/contracta/compliances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteCompliance(id: number): Promise<void> {
  await authFetch(`/api/contracta/compliances/${id}`, { method: "DELETE" });
}

export async function getContractaTemplates(): Promise<Template[]> {
  const res = await authFetch("/api/contracta/templates");
  if (!res.ok) return [];
  return res.json();
}

export async function updateContractaTemplate(id: number, payload: TemplatePayload): Promise<void> {
  await authFetch(`/api/contracta/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createContractaTemplate(payload: TemplatePayload): Promise<Template> {
  const res = await authFetch("/api/contracta/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteContractaTemplate(id: number): Promise<void> {
  await authFetch(`/api/contracta/templates/${id}`, { method: "DELETE" });
}
