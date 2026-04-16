import { useCallback, useEffect, useState } from "react";
import { getForgeData } from "../services/forgeService";
import type {
  BOM,
  CatalogItem,
  DashSummary,
  DowntimeLog,
  Location,
  Project,
  QCRecord,
  WorkOrder,
  Workstation,
} from "../types";

export function useForge() {
  const [workstations, setWorkstations] = useState<Workstation[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [qcRecords, setQcRecords] = useState<QCRecord[]>([]);
  const [downtimeLogs, setDowntimeLogs] = useState<DowntimeLog[]>([]);
  const [dashSummary, setDashSummary] = useState<DashSummary | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getForgeData();
      setWorkstations(data.workstations);
      setBoms(data.boms);
      setWorkOrders(data.workOrders);
      setQcRecords(data.qcRecords);
      setDowntimeLogs(data.downtimeLogs);
      setDashSummary(data.dashSummary);
      setCatalogItems(data.catalogItems);
      setLocations(data.locations);
      setProjects(data.projects);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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
    loading,
    fetchAll,
  };
}
