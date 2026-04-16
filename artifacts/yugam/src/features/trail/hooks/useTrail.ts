import { useCallback, useEffect, useState } from "react";
import { getTrailData } from "../services/trailService";
import type { ClaimRecord, DashSummary, PettyCashRecord } from "../types";

export function useTrail() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashRecord[]>([]);
  const [summary, setSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getTrailData();
      setClaims(data.claims);
      setPettyCash(data.pettyCash);
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { claims, pettyCash, summary, loading, fetchAll };
}
