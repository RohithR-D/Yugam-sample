import { useCallback, useEffect, useState } from "react";
import { getCrmClients, getCrmContacts } from "../services/crmService";
import type { ClientRecord, ContactRecord } from "../types";

export function useCrm() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [clientData, contactData] = await Promise.all([getCrmClients(), getCrmContacts()]);
      setClients(clientData);
      setContacts(contactData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    clients,
    contacts,
    loading,
    fetchData,
  };
}
