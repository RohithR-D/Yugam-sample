import { useCallback, useEffect, useState } from "react";
import { getBillrClients, getInvoices, getReceipts } from "../services/billrService";
import type { Client, InvoiceRecord, ReceiptRecord } from "../types";

export function useBillr() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [invoiceData, receiptData, clientData] = await Promise.all([
        getInvoices(),
        getReceipts(),
        getBillrClients(),
      ]);
      setInvoices(invoiceData);
      setReceipts(receiptData);
      setClients(clientData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    invoices,
    receipts,
    clients,
    loading,
    fetchAll,
  };
}
