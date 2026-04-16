import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useBillr } from "../hooks/useBillr";
import type { BillrTab, Client, InvoiceRecord, LineItem, ReceiptRecord } from "../types";
import { calcLineItem, COMPANY_INFO, emptyLineItem, formatCurrency, formatDate } from "../utils/billrUtils";
import {
  Search,
  Plus,
  X,
  Receipt,
  FileText,
  FileCheck2,
  FileMinus,
  ArrowLeft,
  Trash2,
  PlusCircle,
  Save,
  Send,
  Eye,
  IndianRupee,
  Calendar,
  Building2,
  Hash,
  CreditCard,
  Banknote,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";


function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-600 border-green-200",
    Unpaid: "bg-amber-50 text-amber-600 border-amber-200",
    Overdue: "bg-red-50 text-red-600 border-red-200",
    Draft: "bg-gray-50 text-gray-500 border-gray-200",
    Sent: "bg-blue-50 text-blue-600 border-blue-200",
    Cancelled: "bg-gray-100 text-gray-400 border-gray-200",
    "Partially Paid": "bg-purple-50 text-purple-600 border-purple-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}


export default function BillrDashboard() {
  const [tab, setTab] = useState<BillrTab>("tax");
  const { invoices, receipts, clients, loading, fetchAll } = useBillr();
  const [search, setSearch] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<"Tax" | "Proforma" | "Credit">("Tax");
  const [editingInvoice, setEditingInvoice] = useState<InvoiceRecord | null>(null);
  const [receiptDrawer, setReceiptDrawer] = useState(false);

  const tabConfig = [
    { key: "tax" as BillrTab, label: "Tax Invoices", icon: FileText, type: "Tax" },
    { key: "proforma" as BillrTab, label: "Proformas", icon: FileCheck2, type: "Proforma" },
    { key: "receipts" as BillrTab, label: "Receipts", icon: Receipt, type: null },
    { key: "credit" as BillrTab, label: "Credit Notes", icon: FileMinus, type: "Credit" },
  ];

  const filteredInvoices = useMemo(() => {
    const typeMap: Record<string, string> = { tax: "Tax", proforma: "Proforma", credit: "Credit" };
    const targetType = typeMap[tab];
    if (!targetType) return [];
    let items = invoices.filter((i) => i.type === targetType);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        i.clientName.toLowerCase().includes(q) ||
        i.documentNumber.toLowerCase().includes(q) ||
        i.invoiceNumber.toLowerCase().includes(q)
      );
    }
    return items;
  }, [invoices, tab, search]);

  const filteredReceipts = useMemo(() => {
    if (tab !== "receipts") return [];
    let items = receipts;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.paymentNumber.toLowerCase().includes(q)
      );
    }
    return items;
  }, [receipts, tab, search]);

  const openBuilder = (type: "Tax" | "Proforma" | "Credit", invoice?: InvoiceRecord) => {
    setBuilderType(type);
    setEditingInvoice(invoice || null);
    setBuilderOpen(true);
  };

  const handleBuilderSave = async () => {
    await fetchAll();
    setBuilderOpen(false);
    setEditingInvoice(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    await authFetch(`/api/invoices/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm("Delete this receipt?")) return;
    await authFetch(`/api/receipts/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  const createBtnLabel = tab === "tax" ? "New Tax Invoice" : tab === "proforma" ? "New Proforma" : tab === "credit" ? "New Credit Note" : "Record Payment";

  if (builderOpen) {
    return (
      <DocumentBuilder
        type={builderType}
        invoice={editingInvoice}
        clients={clients}
        onSave={handleBuilderSave}
        onCancel={() => { setBuilderOpen(false); setEditingInvoice(null); }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billr</h1>
          <p className="text-sm text-gray-400 mt-0.5">GST-compliant invoicing, proformas, receipts & credit notes</p>
        </div>
        <button
          onClick={() => {
            if (tab === "receipts") { setReceiptDrawer(true); }
            else { const typeMap: Record<string, "Tax" | "Proforma" | "Credit"> = { tax: "Tax", proforma: "Proforma", credit: "Credit" }; openBuilder(typeMap[tab] || "Tax"); }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" />
          {createBtnLabel}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        {tabConfig.map((t) => {
          const Icon = t.icon;
          const count = t.type ? invoices.filter((i) => i.type === t.type).length : receipts.length;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-[#E31E24] text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by customer, document number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : tab === "receipts" ? (
        <ReceiptsTable receipts={filteredReceipts} onDelete={handleDeleteReceipt} />
      ) : (
        <InvoicesTable
          invoices={filteredInvoices}
          tab={tab}
          onView={(inv) => openBuilder(inv.type as "Tax" | "Proforma" | "Credit", inv)}
          onDelete={handleDelete}
        />
      )}

      {receiptDrawer && (
        <ReceiptDrawer
          clients={clients}
          onSave={async () => { await fetchAll(); setReceiptDrawer(false); }}
          onClose={() => setReceiptDrawer(false)}
        />
      )}
    </div>
  );
}

function InvoicesTable({ invoices, tab, onView, onDelete }: {
  invoices: InvoiceRecord[];
  tab: BillrTab;
  onView: (inv: InvoiceRecord) => void;
  onDelete: (id: number) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
        <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No {tab === "credit" ? "credit notes" : tab === "proforma" ? "proformas" : "tax invoices"} yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Document #</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Balance Due</th>
            <th className="px-4 py-3 w-[80px]"></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(inv.issueDate || inv.createdAt)}</td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-xs text-gray-700 font-medium">{inv.documentNumber || inv.invoiceNumber}</span>
              </td>
              <td className="px-4 py-3.5 text-sm text-gray-800 font-medium">{inv.clientName}</td>
              <td className="px-4 py-3.5 text-center"><StatusPill status={inv.status} /></td>
              <td className="px-4 py-3.5 text-right font-bold text-gray-800">{formatCurrency(parseFloat(inv.grandTotal) || parseFloat(inv.amount) || 0)}</td>
              <td className="px-4 py-3.5 text-right font-semibold text-amber-600">{formatCurrency(parseFloat(inv.balanceDue) || 0)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onView(inv)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(inv.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptsTable({ receipts, onDelete }: {
  receipts: ReceiptRecord[];
  onDelete: (id: number) => void;
}) {
  if (receipts.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
        <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400">No receipts recorded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Payment #</th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Mode</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bank Charges</th>
            <th className="px-4 py-3 w-[50px]"></th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => (
            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
              <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(r.paymentDate)}</td>
              <td className="px-4 py-3.5 font-mono text-xs text-gray-700 font-medium">{r.paymentNumber}</td>
              <td className="px-4 py-3.5 text-sm text-gray-800 font-medium">{r.clientName}</td>
              <td className="px-4 py-3.5 text-center">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">{r.paymentMode}</span>
              </td>
              <td className="px-4 py-3.5 text-right font-bold text-green-700">{formatCurrency(parseFloat(r.amountReceived))}</td>
              <td className="px-4 py-3.5 text-right text-gray-500">{formatCurrency(parseFloat(r.bankCharges))}</td>
              <td className="px-4 py-3.5">
                <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentBuilder({ type, invoice, clients, onSave, onCancel }: {
  type: "Tax" | "Proforma" | "Credit";
  invoice: InvoiceRecord | null;
  clients: Client[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!invoice;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeLabel = type === "Tax" ? "Tax Invoice" : type === "Proforma" ? "Proforma Invoice" : "Credit Note";
  const docPrefix = type === "Tax" ? "INV" : type === "Proforma" ? "PRF" : "CN";
  const defaultDocNum = `${docPrefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const [form, setForm] = useState({
    clientId: invoice?.clientId?.toString() || "",
    clientName: invoice?.clientName || "",
    documentNumber: invoice?.documentNumber || invoice?.invoiceNumber || defaultDocNum,
    invoiceNumber: invoice?.invoiceNumber || defaultDocNum,
    poReference: invoice?.poReference || "",
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "",
    notes: invoice?.notes || "",
    terms: invoice?.terms || "Payment due within 30 days of issue date.\nAll amounts are in Indian Rupees (₹).",
    discountAmount: invoice?.discountAmount || "0",
    reasonForCredit: invoice?.reasonForCredit || "",
    invoiceReference: invoice?.invoiceReference || "",
    status: invoice?.status || "Draft",
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.items && invoice.items.length > 0
      ? invoice.items.map((i) => calcLineItem(i))
      : [emptyLineItem()]
  );

  useEffect(() => {
    if (isEdit && invoice?.id) {
      authFetch(`/api/invoices/${invoice.id}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setLineItems(data.items.map((i: LineItem) => calcLineItem(i)));
          }
        }
      });
    }
  }, [isEdit, invoice?.id]);

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    setLineItems((prev) => prev.map((item, i) => i === index ? calcLineItem({ ...item, ...updates }) : item));
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyLineItem()]);
  const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      return s + qty * rate;
    }, 0);
    const discount = parseFloat(form.discountAmount) || 0;
    const taxableAmount = subtotal - discount;
    const totalTax = lineItems.reduce((s, item) => s + (parseFloat(item.taxAmount) || 0), 0);
    const adjustedTax = totalTax * (taxableAmount / (subtotal || 1));
    const sgst = adjustedTax / 2;
    const cgst = adjustedTax / 2;
    const grandTotal = taxableAmount + adjustedTax;
    return { subtotal, discount, sgst, cgst, grandTotal };
  }, [lineItems, form.discountAmount]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === parseInt(clientId));
    setForm((f) => ({ ...f, clientId, clientName: client?.companyName || "" }));
  };

  const handleSave = async (sendStatus?: string) => {
    setSaving(true);
    setError("");
    const status = sendStatus || form.status;

    const payload: any = {
      type,
      clientId: form.clientId ? parseInt(form.clientId) : null,
      clientName: form.clientName,
      documentNumber: form.documentNumber,
      invoiceNumber: form.invoiceNumber,
      poReference: form.poReference,
      issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      subtotal: totals.subtotal.toFixed(2),
      discountAmount: totals.discount.toFixed(2),
      sgstTotal: totals.sgst.toFixed(2),
      cgstTotal: totals.cgst.toFixed(2),
      grandTotal: totals.grandTotal.toFixed(2),
      balanceDue: totals.grandTotal.toFixed(2),
      notes: form.notes,
      terms: form.terms,
      reasonForCredit: form.reasonForCredit,
      invoiceReference: form.invoiceReference,
      status,
      items: lineItems.map(({ id, invoiceId, ...rest }) => rest),
    };

    try {
      const url = isEdit ? `/api/invoices/${invoice!.id}` : "/api/invoices";
      const method = isEdit ? "PATCH" : "POST";
      const res = await authFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      onSave();
    } catch { setError("Network error"); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit" : "New"} {typeLabel}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{form.documentNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => handleSave("Draft")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => handleSave("Sent")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            <Send className="w-4 h-4" /> Save & Send
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-100">
          <div className="p-6 space-y-5">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Billed By</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-bold text-gray-800">{COMPANY_INFO.name}</p>
                <p className="text-xs text-gray-500 mt-1">{COMPANY_INFO.address}</p>
                <p className="text-xs text-gray-500">{COMPANY_INFO.city}</p>
                <p className="text-xs text-gray-400 mt-1.5 font-mono">GSTIN: {COMPANY_INFO.gstin}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
              <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className={inputCls + " cursor-pointer"}>
                <option value="">Select Client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
              </select>
              {!form.clientId && (
                <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Or type client name..." className={inputCls + " mt-2"} />
              )}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Document Number</label>
                <input type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value, invoiceNumber: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Issue Date</label>
                <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputCls} />
              </div>
              {type === "Credit" ? (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Invoice Reference</label>
                  <input type="text" value={form.invoiceReference} onChange={(e) => setForm({ ...form, invoiceReference: e.target.value })} placeholder="e.g., INV-2026-001" className={inputCls} />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">PO Number</label>
                  <input type="text" value={form.poReference} onChange={(e) => setForm({ ...form, poReference: e.target.value })} placeholder="Purchase Order ref." className={inputCls} />
                </div>
              )}
            </div>
            {type === "Credit" && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason for Credit</label>
                <select value={form.reasonForCredit} onChange={(e) => setForm({ ...form, reasonForCredit: e.target.value })} className={inputCls + " cursor-pointer"}>
                  <option value="">Select reason...</option>
                  <option value="Defective Goods">Defective Goods</option>
                  <option value="Overcharge">Overcharge</option>
                  <option value="Service Not Rendered">Service Not Rendered</option>
                  <option value="Contract Cancellation">Contract Cancellation</option>
                  <option value="Goodwill">Goodwill</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
                {["Draft", "Sent", "Unpaid", "Paid", "Overdue", "Partially Paid", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Line Items</h2>
          <button onClick={addLineItem} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#E31E24] border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <PlusCircle className="w-3.5 h-3.5" /> Add New Row
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-left font-semibold min-w-[220px]">Items</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[90px]">HSN / SAC</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[60px]">Qty</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[70px]">Unit</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[90px]">Rate</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[60px]">Tax %</th>
                <th className="px-2 py-2.5 text-right font-semibold w-[90px]">Tax Amt</th>
                <th className="px-3 py-2.5 text-right font-semibold w-[100px]">Amount</th>
                <th className="w-[36px]"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/30 group transition-colors">
                  <td className="px-3 py-1.5">
                    <input type="text" value={item.description} onChange={(e) => updateLineItem(idx, { description: e.target.value })} placeholder="Item description..." className="w-full text-xs text-gray-700 bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="text" value={item.hsnSac} onChange={(e) => updateLineItem(idx, { hsnSac: e.target.value })} placeholder="9983" className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors font-mono" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={item.qty} onChange={(e) => updateLineItem(idx, { qty: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={item.unit} onChange={(e) => updateLineItem(idx, { unit: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none py-1.5 cursor-pointer">
                      {["NOS", "HRS", "SQM", "SQFT", "RMT", "KG", "MT", "LTR", "SET", "LOT", "LS", "CUM", "DAYS"].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, { rate: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={item.taxPercentage} onChange={(e) => updateLineItem(idx, { taxPercentage: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                  </td>
                  <td className="px-2 py-1.5 text-right text-xs text-gray-500 font-medium">
                    {formatCurrency(parseFloat(item.taxAmount) || 0)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-xs font-bold text-gray-800">
                    {formatCurrency(parseFloat(item.lineTotal) || 0)}
                  </td>
                  <td className="px-1 py-1.5">
                    {lineItems.length > 1 && (
                      <button onClick={() => removeLineItem(idx)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes to the client..." className={inputCls + " resize-none"} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Terms & Conditions</label>
            <textarea rows={3} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className={inputCls + " resize-none"} />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Sub Total</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Discount</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">₹</span>
                <input
                  type="number"
                  value={form.discountAmount}
                  onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                  className="w-24 text-right text-sm font-semibold text-red-500 bg-red-50/50 border border-red-100 rounded-lg px-2.5 py-1 outline-none focus:border-red-300 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SGST</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.sgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CGST</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.cgst)}</span>
            </div>
            <div className="border-t-2 border-[#E31E24]/20 pt-3">
              <div className="flex justify-between">
                <span className="text-base font-black text-gray-800">Grand Total</span>
                <span className="text-lg font-black text-[#E31E24]">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiptDrawer({ clients, onSave, onClose }: {
  clients: Client[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const defaultPayNum = `REC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    amountReceived: "",
    bankCharges: "0",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNumber: defaultPayNum,
    paymentMode: "Bank Transfer",
    depositTo: "HDFC Current A/C",
    reference: "",
    taxDeducted: false,
  });

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === parseInt(clientId));
    setForm((f) => ({ ...f, clientId, clientName: client?.companyName || "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload: any = {
        clientId: form.clientId ? parseInt(form.clientId) : null,
        clientName: form.clientName,
        amountReceived: form.amountReceived || "0",
        bankCharges: form.bankCharges || "0",
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : null,
        paymentNumber: form.paymentNumber,
        paymentMode: form.paymentMode,
        depositTo: form.depositTo,
        reference: form.reference,
        taxDeducted: form.taxDeducted,
      };
      const res = await authFetch("/api/receipts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      onSave();
    } catch { setError("Network error"); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col" style={{ animation: "slideInRight 0.25s ease-out" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-400">Log a payment received from a client</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Building2 className="w-3 h-3" /> Customer</label>
            <select value={form.clientId} onChange={(e) => handleClientChange(e.target.value)} className={inputCls + " cursor-pointer"}>
              <option value="">Select Customer</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><IndianRupee className="w-3 h-3" /> Payment Received</label>
              <input type="number" value={form.amountReceived} onChange={(e) => setForm({ ...form, amountReceived: e.target.value })} placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><CreditCard className="w-3 h-3" /> Bank Charges</label>
              <input type="number" value={form.bankCharges} onChange={(e) => setForm({ ...form, bankCharges: e.target.value })} placeholder="0.00" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Calendar className="w-3 h-3" /> Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Hash className="w-3 h-3" /> Payment Number</label>
              <input type="text" value={form.paymentNumber} onChange={(e) => setForm({ ...form, paymentNumber: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Payment Mode</label>
            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} className={inputCls + " cursor-pointer"}>
              {["Bank Transfer", "Cash", "Cheque", "UPI", "Credit Card", "Debit Card", "NEFT/RTGS", "Demand Draft"].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Deposit To</label>
            <select value={form.depositTo} onChange={(e) => setForm({ ...form, depositTo: e.target.value })} className={inputCls + " cursor-pointer"}>
              {["HDFC Current A/C", "ICICI Current A/C", "SBI Savings A/C", "Axis Bank A/C", "Cash in Hand", "Petty Cash"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Reference</label>
            <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Transaction reference or UTR number" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Tax Deducted at Source (TDS)</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, taxDeducted: !form.taxDeducted })}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border transition-all w-full ${
                form.taxDeducted
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              {form.taxDeducted ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span className="text-sm font-medium">{form.taxDeducted ? "Yes, TDS Deducted" : "No TDS Deducted"}</span>
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>}
        </div>

        <div className="border-t border-gray-200 p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
            {saving ? "Saving..." : "Record Payment"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
