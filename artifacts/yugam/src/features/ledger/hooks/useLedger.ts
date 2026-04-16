import { useCallback, useEffect, useState } from "react";
import { getLedgerData } from "../services/ledgerService";
import type { APRecord, ARRecord, CoaRecord, DashSummary, JournalEntry } from "../types";

export function useLedger() {
  const [coa, setCoa] = useState<CoaRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [ap, setAp] = useState<APRecord[]>([]);
  const [ar, setAr] = useState<ARRecord[]>([]);
  const [summary, setSummary] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getLedgerData();
      setCoa(data.coa);
      setJournals(data.journals);
      setAp(data.ap);
      setAr(data.ar);
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { coa, journals, ap, ar, summary, loading, fetchAll };
}
