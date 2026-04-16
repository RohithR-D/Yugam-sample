import { useModule } from "@/context/ModuleContext";
import {
  BudgetsCostingView,
  DocumentCenterView,
  FlowDashboardView,
  MilestonesGanttView,
  ProjectPortfolioView,
} from "../components";
import { useFlow } from "../hooks/useFlow";
import type { FlowSub } from "../types";

export default function FlowDashboard() {
  const { activeModule } = useModule();
  const sub = (activeModule.replace("Flow:", "") || "Dashboard") as FlowSub;
  const { budgets, dashSummary, documents, loading, milestones, projects, refresh } = useFlow();

  if (loading) {
    return <div className="text-center py-16 text-gray-400">Loading project data...</div>;
  }

  switch (sub) {
    case "Dashboard":
      return <FlowDashboardView summary={dashSummary} projects={projects} milestones={milestones} />;
    case "Project Portfolio":
      return <ProjectPortfolioView projects={projects} milestones={milestones} onRefresh={refresh} />;
    case "Milestones & Gantt":
      return <MilestonesGanttView projects={projects} milestones={milestones} onRefresh={refresh} />;
    case "Budgets & Costing":
      return <BudgetsCostingView projects={projects} budgets={budgets} onRefresh={refresh} />;
    case "Document Center":
      return <DocumentCenterView projects={projects} documents={documents} onRefresh={refresh} />;
    default:
      return <FlowDashboardView summary={dashSummary} projects={projects} milestones={milestones} />;
  }
}
