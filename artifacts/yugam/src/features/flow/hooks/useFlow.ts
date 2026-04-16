import { useCallback, useEffect, useState } from "react";
import {
  getBudgets,
  getDashboardSummary,
  getDocuments,
  getMilestones,
  getProjects,
} from "../services/flowService";
import type { BudgetLine, DashSummary, DocRecord, Milestone, ProjectRecord } from "../types";

export function useFlow() {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budgets, setBudgets] = useState<BudgetLine[]>([]);
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [dashSummary, setDashSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [projectsData, milestonesData, budgetsData, documentsData, summaryData] = await Promise.all([
        getProjects(),
        getMilestones(),
        getBudgets(),
        getDocuments(),
        getDashboardSummary(),
      ]);

      setProjects(projectsData);
      setMilestones(milestonesData);
      setBudgets(budgetsData);
      setDocuments(documentsData);
      setDashSummary(summaryData);
    } catch {
      setProjects([]);
      setMilestones([]);
      setBudgets([]);
      setDocuments([]);
      setDashSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    projects,
    milestones,
    budgets,
    documents,
    dashSummary,
    loading,
    refresh,
  };
}
