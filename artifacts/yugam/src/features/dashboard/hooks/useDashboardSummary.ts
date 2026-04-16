import { useCallback, useEffect, useState } from "react";
import { getDashboardSummary } from "../services/dashboardService";
import type { DashboardSummary } from "../types";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      setData(await getDashboardSummary());
    } catch (err) {
      console.error("Dashboard summary fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, fetchSummary };
}
