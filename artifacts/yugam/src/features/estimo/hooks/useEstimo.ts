import { useCallback, useEffect, useState } from "react";
import { getProposals } from "../services/estimoService";
import type { ProposalRecord } from "../types";

export function useEstimo() {
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    try {
      const data = await getProposals();
      setProposals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    loading,
    fetchProposals,
  };
}
