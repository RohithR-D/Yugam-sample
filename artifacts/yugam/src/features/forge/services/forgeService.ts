import { authFetch } from "@/lib/authFetch";
import type { ForgeData } from "../types";

export async function getForgeData(): Promise<ForgeData> {
  const [wsR, bomR, woR, qcR, dtR, dsR, ciR, locR, prjR] = await Promise.all([
    authFetch("/api/forge/workstations"),
    authFetch("/api/forge/bom"),
    authFetch("/api/forge/work-orders"),
    authFetch("/api/forge/quality-control"),
    authFetch("/api/forge/downtime-logs"),
    authFetch("/api/forge/dashboard-summary"),
    authFetch("/api/forge/inventory-items"),
    authFetch("/api/forge/locations"),
    authFetch("/api/forge/projects"),
  ]);

  const [workstations, boms, workOrders, qcRecords, downtimeLogs, dashSummary, catalogItems, locations, projects] =
    await Promise.all([
      wsR.ok ? wsR.json() : Promise.resolve([]),
      bomR.ok ? bomR.json() : Promise.resolve([]),
      woR.ok ? woR.json() : Promise.resolve([]),
      qcR.ok ? qcR.json() : Promise.resolve([]),
      dtR.ok ? dtR.json() : Promise.resolve([]),
      dsR.ok ? dsR.json() : Promise.resolve(null),
      ciR.ok ? ciR.json() : Promise.resolve([]),
      locR.ok ? locR.json() : Promise.resolve([]),
      prjR.ok ? prjR.json() : Promise.resolve([]),
    ]);

  return {
    workstations,
    boms,
    workOrders,
    qcRecords,
    downtimeLogs,
    dashSummary,
    catalogItems,
    locations,
    projects,
  };
}
