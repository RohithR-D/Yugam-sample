import { useCallback, useEffect, useState } from "react";
import { getCrmClientsPage } from "../services/crmService";
import type { ClientRecord } from "../types";

export function useCrmClients(page: number) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [allClients, setAllClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getCrmClientsPage(page, 50);
      setClients(data.data);
      setAllClients(data.data);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    allClients,
    loading,
    totalPages,
    totalCount,
    fetchClients,
  };
}
