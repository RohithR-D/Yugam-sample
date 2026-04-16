import { authFetch } from "@/lib/authFetch";
import type { BudgetLine, DashSummary, DocRecord, Milestone, ProjectRecord } from "../types";

export async function getProjects(): Promise<ProjectRecord[]> {
  const response = await authFetch("/api/flow/projects");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getMilestones(): Promise<Milestone[]> {
  const response = await authFetch("/api/flow/milestones");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getBudgets(): Promise<BudgetLine[]> {
  const response = await authFetch("/api/flow/budgets");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getDocuments(): Promise<DocRecord[]> {
  const response = await authFetch("/api/flow/documents");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getDashboardSummary(): Promise<DashSummary | null> {
  const response = await authFetch("/api/flow/dashboard-summary");
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export async function deleteProject(projectId: number): Promise<void> {
  await authFetch(`/api/flow/projects/${projectId}`, { method: "DELETE" });
}

export async function createProject(payload: Partial<ProjectRecord>): Promise<boolean> {
  const response = await authFetch("/api/flow/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function deleteMilestone(milestoneId: number): Promise<void> {
  await authFetch(`/api/flow/milestones/${milestoneId}`, { method: "DELETE" });
}

export async function createMilestone(payload: Partial<Milestone> & { projectId: number }): Promise<boolean> {
  const response = await authFetch("/api/flow/milestones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function updateMilestone(
  milestoneId: number,
  payload: Pick<Milestone, "title" | "targetDate" | "completionPercent" | "notes">,
): Promise<boolean> {
  const response = await authFetch(`/api/flow/milestones/${milestoneId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function deleteBudgetLine(budgetLineId: number): Promise<void> {
  await authFetch(`/api/flow/budgets/${budgetLineId}`, { method: "DELETE" });
}

export async function createBudgetLine(payload: Partial<BudgetLine> & { projectId: number }): Promise<boolean> {
  const response = await authFetch("/api/flow/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}

export async function deleteDocument(documentId: number): Promise<void> {
  await authFetch(`/api/flow/documents/${documentId}`, { method: "DELETE" });
}

export async function createDocument(payload: Partial<DocRecord> & { projectId: number }): Promise<boolean> {
  const response = await authFetch("/api/flow/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.ok;
}
