import { useCallback, useEffect, useState } from "react";
import { getAllSalesDocuments, getSalesClients, getSalesTypeDocuments } from "../services/salesService";
import type { Client, SalesDoc } from "../types";

export function useSales() {
  const [allDocs, setAllDocs] = useState<SalesDoc[]>([]);
  const [typeDocs, setTypeDocs] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [documents, salesClients] = await Promise.all([getAllSalesDocuments(), getSalesClients()]);
      setAllDocs(documents);
      setClients(salesClients);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTypeDocs = useCallback(async (endpoint: string) => {
    const docs = await getSalesTypeDocuments(endpoint);
    setTypeDocs(docs);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    allDocs,
    typeDocs,
    clients,
    loading,
    fetchAll,
    fetchTypeDocs,
  };
}
