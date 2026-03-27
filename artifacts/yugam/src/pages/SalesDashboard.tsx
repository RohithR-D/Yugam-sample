import { authFetch } from "@/lib/authFetch";
import { useModule } from "@/context/ModuleContext";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  FileText,
  Trash2,
  ArrowLeft,
  PlusCircle,
  Save,
  Send,
  Eye,
  IndianRupee,
  TrendingUp,
  CircleDollarSign,
  FileCheck,
  FileClock,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type SalesSubModule = "Overview" | "Quotation" | "Proforma Invoice" | "Sales Order" | "Invoices" | "Delivery Challan" | "Sales Return";

const DOC_TYPE_MAP: Record<SalesSubModule, string> = {
  "Overview": "",
  "Quotation": "Quotation",
  "Proforma Invoice": "Proforma Invoice",
  "Sales Order": "Sales Order",
  "Invoices": "Invoice",
  "Delivery Challan": "Delivery Challan",
  "Sales Return": "Sales Return",
};

const DOC_PREFIX_MAP: Record<string, string> = {
  "Quotation": "QTN",
  "Proforma Invoice": "PI",
  "Sales Order": "SO",
  "Invoice": "INV",
  "Delivery Challan": "DC",
  "Sales Return": "SR",
};

interface SalesDoc {
  id: number;
  clientId: number | null;
  clientName: string;
  documentType: string;
  documentNumber: string;
  issueDate: string | null;
  dueDate: string | null;
  subtotal: string;
  sgstTotal: string;
  cgstTotal: string;
  grandTotal: string;
  notes: string;
  terms: string;
  status: string;
  createdAt: string | null;
  items?: DocItem[];
}

interface DocItem {
  id?: number;
  documentId?: number;
  description: string;
  hsnSac: string;
  qty: string;
  rate: string;
  cgstPercentage: string;
  sgstPercentage: string;
  lineTotal: string;
}

interface Client {
  id: number;
  companyName: string;
}

function formatCurrency(val: number) {
  if (isNaN(val) || val === 0) return "₹ 0";
  return "₹ " + val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: "bg-green-50 text-green-600 border-green-200",
    Unpaid: "bg-amber-50 text-amber-600 border-amber-200",
    Drafting: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  );
}

const COMPANY_INFO = {
  name: "Yugam Technologies Pvt. Ltd.",
  address: "3rd Floor, Tech Park, Andheri East",
  city: "Mumbai, Maharashtra — 400069",
  gstin: "27AABCY1234F1ZQ",
};

function emptyDocItem(): DocItem {
  return { description: "", hsnSac: "", qty: "1", rate: "0", cgstPercentage: "9", sgstPercentage: "9", lineTotal: "0" };
}

function calcDocItem(item: DocItem): DocItem {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const base = qty * rate;
  const cgst = base * (parseFloat(item.cgstPercentage) || 0) / 100;
  const sgst = base * (parseFloat(item.sgstPercentage) || 0) / 100;
  return { ...item, lineTotal: (base + cgst + sgst).toFixed(2) };
}

export default function SalesDashboard() {
  const { activeModule, setActiveModule } = useModule();
  const subModule: SalesSubModule = (activeModule.replace("Sales:", "") || "Overview") as SalesSubModule;

  const [docs, setDocs] = useState<SalesDoc[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<SalesDoc | null>(null);
  const [builderDocType, setBuilderDocType] = useState("Quotation");

  const fetchAll = useCallback(async () => {
    try {
      const [docsRes, cliRes] = await Promise.all([
        authFetch("/api/sales-documents"),
        authFetch("/api/clients"),
      ]);
      if (docsRes.ok) setDocs(await docsRes.json());
      if (cliRes.ok) {
        const cliData = await cliRes.json();
        setClients(Array.isArray(cliData) ? cliData : cliData.data || []);
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredDocs = useMemo(() => {
    const targetType = DOC_TYPE_MAP[subModule];
    if (!targetType) return [];
    let items = docs.filter((d) => d.documentType === targetType);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((d) =>
        d.clientName.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q)
      );
    }
    return items;
  }, [docs, subModule, search]);

  const openBuilder = (docType: string, doc?: SalesDoc) => {
    setBuilderDocType(docType);
    setEditingDoc(doc || null);
    setBuilderOpen(true);
  };

  const handleBuilderSave = async () => {
    await fetchAll();
    setBuilderOpen(false);
    setEditingDoc(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this document?")) return;
    await authFetch(`/api/sales-documents/${id}`, { method: "DELETE" });
    await fetchAll();
  };

  if (builderOpen) {
    return (
      <DocumentBuilder
        documentType={builderDocType}
        doc={editingDoc}
        clients={clients}
        onSave={handleBuilderSave}
        onCancel={() => { setBuilderOpen(false); setEditingDoc(null); }}
      />
    );
  }

  if (subModule === "Overview") {
    return <OverviewDashboard docs={docs} loading={loading} setActiveModule={setActiveModule} />;
  }

  const canCreate = ["Quotation", "Proforma Invoice", "Sales Order", "Invoices", "Delivery Challan", "Sales Return"].includes(subModule);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{subModule}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage {subModule.toLowerCase()} documents</p>
        </div>
        {canCreate && (
          <button
            onClick={() => openBuilder(DOC_TYPE_MAP[subModule], undefined)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
          >
            <Plus className="w-4 h-4" /> Create {subModule}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder={`Search ${subModule.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No {subModule.toLowerCase()} documents found</p>
        </div>
      ) : (
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
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(doc.issueDate || doc.createdAt)}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-gray-700 font-medium">{doc.documentNumber}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-800 font-medium">{doc.clientName}</td>
                  <td className="px-4 py-3.5 text-center"><StatusPill status={doc.status} /></td>
                  <td className="px-4 py-3.5 text-right font-bold text-gray-800">{formatCurrency(parseFloat(doc.grandTotal) || 0)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-amber-600">
                    {doc.status === "Paid" ? formatCurrency(0) : formatCurrency(parseFloat(doc.grandTotal) || 0)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openBuilder(doc.documentType, doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OverviewDashboard({ docs, loading, setActiveModule }: {
  docs: SalesDoc[];
  loading: boolean;
  setActiveModule: (m: string) => void;
}) {
  const totalSales = docs.reduce((s, d) => s + (parseFloat(d.grandTotal) || 0), 0);
  const totalPaid = docs.filter((d) => d.status === "Paid").reduce((s, d) => s + (parseFloat(d.grandTotal) || 0), 0);
  const totalUnpaid = docs.filter((d) => d.status === "Unpaid").reduce((s, d) => s + (parseFloat(d.grandTotal) || 0), 0);
  const draftingCount = docs.filter((d) => d.status === "Drafting").length;

  const metrics = [
    { label: "Total Sales", value: formatCurrency(totalSales), icon: TrendingUp, color: "text-blue-600", ring: "border-blue-200", bg: "bg-blue-50" },
    { label: "Total Paid", value: formatCurrency(totalPaid), icon: CircleDollarSign, color: "text-green-600", ring: "border-green-200", bg: "bg-green-50" },
    { label: "Total Unpaid", value: formatCurrency(totalUnpaid), icon: IndianRupee, color: "text-amber-600", ring: "border-amber-200", bg: "bg-amber-50" },
    { label: "Drafting Invoice", value: draftingCount.toString(), icon: FileClock, color: "text-gray-600", ring: "border-gray-200", bg: "bg-gray-50" },
  ];

  const paidCount = docs.filter((d) => d.status === "Paid").length;
  const unpaidCount = docs.filter((d) => d.status === "Unpaid").length;
  const draftCount = docs.filter((d) => d.status === "Drafting").length;

  const donutData = [
    { name: "Paid", value: paidCount, color: "#22c55e" },
    { name: "Unpaid", value: unpaidCount, color: "#f59e0b" },
    { name: "Drafting", value: draftCount, color: "#9ca3af" },
  ].filter((d) => d.value > 0);

  const recentInvoices = docs
    .filter((d) => d.documentType === "Invoice")
    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
    .slice(0, 8);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading sales data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Dashboard across all sales document types</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full border-2 ${m.ring} ${m.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{m.label}</p>
                  <p className="text-xl font-bold text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">Total Invoice Status</h2>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of Paid, Unpaid & Drafting</p>
          </div>
          <div className="p-5 h-[280px]">
            {donutData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value} document${value !== 1 ? "s" : ""}`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">Recent Invoices</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest invoice entries</p>
            </div>
            <button
              onClick={() => setActiveModule("Sales:Invoices")}
              className="text-xs font-semibold text-[#E31E24] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentInvoices.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No invoices yet</div>
            ) : (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                      <FileCheck className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-500 truncate">{inv.documentNumber}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{inv.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(parseFloat(inv.grandTotal) || 0)}</p>
                    <StatusPill status={inv.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentBuilder({ documentType, doc, clients, onSave, onCancel }: {
  documentType: string;
  doc: SalesDoc | null;
  clients: Client[];
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!doc;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const prefix = DOC_PREFIX_MAP[documentType] || "DOC";
  const defaultDocNum = `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const [form, setForm] = useState({
    clientId: doc?.clientId?.toString() || "",
    clientName: doc?.clientName || "",
    documentNumber: doc?.documentNumber || defaultDocNum,
    issueDate: doc?.issueDate ? new Date(doc.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    dueDate: doc?.dueDate ? new Date(doc.dueDate).toISOString().split("T")[0] : "",
    notes: doc?.notes || "",
    terms: doc?.terms || "Payment due within 30 days of issue date.\nAll amounts are in Indian Rupees (₹).",
    status: doc?.status || "Drafting",
  });

  const [lineItems, setLineItems] = useState<DocItem[]>(
    doc?.items && doc.items.length > 0
      ? doc.items.map((i) => calcDocItem(i))
      : [emptyDocItem()]
  );

  useEffect(() => {
    if (isEdit && doc?.id) {
      authFetch(`/api/sales-documents/${doc.id}`).then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setLineItems(data.items.map((i: DocItem) => calcDocItem(i)));
          }
        }
      });
    }
  }, [isEdit, doc?.id]);

  const updateLineItem = (index: number, updates: Partial<DocItem>) => {
    setLineItems((prev) => prev.map((item, i) => i === index ? calcDocItem({ ...item, ...updates }) : item));
  };

  const addLineItem = () => setLineItems((prev) => [...prev, emptyDocItem()]);
  const removeLineItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, item) => {
      return s + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    }, 0);
    const cgstTotal = lineItems.reduce((s, item) => {
      const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return s + base * (parseFloat(item.cgstPercentage) || 0) / 100;
    }, 0);
    const sgstTotal = lineItems.reduce((s, item) => {
      const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return s + base * (parseFloat(item.sgstPercentage) || 0) / 100;
    }, 0);
    const grandTotal = subtotal + cgstTotal + sgstTotal;
    return { subtotal, cgstTotal, sgstTotal, grandTotal };
  }, [lineItems]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.id === parseInt(clientId));
    setForm((f) => ({ ...f, clientId, clientName: client?.companyName || "" }));
  };

  const handleSave = async (sendStatus?: string) => {
    setSaving(true);
    setError("");
    const status = sendStatus || form.status;

    const payload: any = {
      documentType,
      clientId: form.clientId ? parseInt(form.clientId) : null,
      clientName: form.clientName,
      documentNumber: form.documentNumber,
      issueDate: form.issueDate ? new Date(form.issueDate).toISOString() : null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      subtotal: totals.subtotal.toFixed(2),
      cgstTotal: totals.cgstTotal.toFixed(2),
      sgstTotal: totals.sgstTotal.toFixed(2),
      grandTotal: totals.grandTotal.toFixed(2),
      notes: form.notes,
      terms: form.terms,
      status,
      items: lineItems.map(({ id, documentId, ...rest }) => rest),
    };

    try {
      const url = isEdit ? `/api/sales-documents/${doc!.id}` : "/api/sales-documents";
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
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? "Edit" : "New"} {documentType}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{form.documentNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => handleSave("Drafting")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button onClick={() => handleSave("Unpaid")} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50 transition-all">
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
                <input type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} className={inputCls} />
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls + " cursor-pointer"}>
                  {["Drafting", "Unpaid", "Paid"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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
                <th className="px-3 py-2.5 text-left font-semibold min-w-[220px]">Item</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[90px]">HSN / SAC</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[65px]">Qty</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[90px]">Rate</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[65px]">CGST %</th>
                <th className="px-2 py-2.5 text-center font-semibold w-[65px]">SGST %</th>
                <th className="px-2 py-2.5 text-right font-semibold w-[90px]">Tax Amount</th>
                <th className="px-3 py-2.5 text-right font-semibold w-[110px]">Total Amount</th>
                <th className="w-[36px]"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => {
                const base = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                const cgstAmt = base * (parseFloat(item.cgstPercentage) || 0) / 100;
                const sgstAmt = base * (parseFloat(item.sgstPercentage) || 0) / 100;
                const taxAmt = cgstAmt + sgstAmt;
                return (
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
                      <input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, { rate: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={item.cgstPercentage} onChange={(e) => updateLineItem(idx, { cgstPercentage: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={item.sgstPercentage} onChange={(e) => updateLineItem(idx, { sgstPercentage: e.target.value })} className="w-full text-center text-xs bg-transparent outline-none border-b border-transparent focus:border-gray-300 py-1.5 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                    </td>
                    <td className="px-2 py-1.5 text-right text-xs text-gray-500 font-medium">
                      {formatCurrency(taxAmt)}
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
                );
              })}
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
            <div className="flex justify-between">
              <span className="text-gray-400">CGST</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.cgstTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SGST</span>
              <span className="font-semibold text-gray-700">{formatCurrency(totals.sgstTotal)}</span>
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
