import { useCallback, useEffect, useState } from "react";
import { getGateDashboard, getRecentVisitors } from "../services/gateService";
import type { GateMetrics, VisitorRecord } from "../types";

export function useGateDashboard() {
  const [metrics, setMetrics] = useState<GateMetrics>({ currentOccupancy: 0, totalToday: 0, expectedVIPs: 0 });
  const [recentVisitors, setRecentVisitors] = useState<VisitorRecord[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [dashboard, visitors] = await Promise.all([getGateDashboard(), getRecentVisitors()]);
      setMetrics(dashboard);
      setRecentVisitors(visitors);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  return {
    metrics,
    recentVisitors,
    fetchData,
  };
}
