import { authFetch } from "@/lib/authFetch";
import { useState, useEffect, useCallback, useRef } from "react";
import { useModule } from "@/context/ModuleContext";
import { useGateDashboard } from "../hooks/useGateDashboard";
import { getRollCall } from "../services/gateService";
import type { Employee, VisitorRecord, WatchlistEntry } from "../types";
import { escapeHtml, formatDate, formatDateTime, formatTime } from "../utils/gateUtils";
import {
  Search,
  ShieldCheck,
  Users,
  AlertTriangle,
  UserPlus,
  Clock,
  X,
  Camera,
  QrCode,
  Printer,
  Star,
  Ban,
  Trash2,
  Plus,
  ScanLine,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";


function ClassBadge({ c }: { c: string }) {
  if (c === "VIP") return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-300">★ VIP</span>;
  if (c === "Blacklist") return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">⛔ BLACKLIST</span>;
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500">Standard</span>;
}

function StatusBadge({ s }: { s: string }) {
  if (s === "In-Premises") return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 animate-pulse">● In-Premises</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">Checked-Out</span>;
}

function PurposeBadge({ p }: { p: string }) {
  const colors: Record<string, string> = {
    Meeting: "bg-blue-50 text-blue-600",
    Interview: "bg-purple-50 text-purple-600",
    Delivery: "bg-orange-50 text-orange-600",
    Maintenance: "bg-teal-50 text-teal-600",
  };
  return <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${colors[p] || "bg-gray-50 text-gray-600"}`}>{p}</span>;
}

function GateDashboardView() {
  const { metrics, recentVisitors } = useGateDashboard();
  const [showRollCall, setShowRollCall] = useState(false);
  const [rollCallData, setRollCallData] = useState<VisitorRecord[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const handleRollCall = async () => {
    const data = await getRollCall();
    if (data.length > 0) {
      setRollCallData(data);
      setShowRollCall(true);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Emergency Roll Call - ${new Date().toLocaleString("en-IN")}</title><style>
      body{font-family:Arial,sans-serif;padding:20px}
      h1{color:#E31E24;font-size:24px;border-bottom:3px solid #E31E24;padding-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:13px}
      th{background:#f8f9fa;font-weight:bold}
      .timestamp{color:#666;font-size:12px;margin-top:4px}
    </style></head><body>`);
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.print();
  };

  const metricCards = [
    { label: "Current Occupancy", value: metrics.currentOccupancy, icon: Users, color: "text-green-600", bg: "bg-green-50", ring: "ring-green-200" },
    { label: "Total Visitors Today", value: metrics.totalToday, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-200" },
    { label: "Expected VIPs", value: metrics.expectedVIPs, icon: Star, color: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-200" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gate Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time facility occupancy monitoring</p>
        </div>
      </div>

      <button
        onClick={handleRollCall}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black text-lg rounded-xl shadow-xl shadow-red-500/30 hover:shadow-red-500/50 transition-all flex items-center justify-center gap-3 animate-pulse hover:animate-none border-2 border-red-400"
      >
        <AlertTriangle className="w-7 h-7" />
        🚨 EMERGENCY ROLL CALL
        <AlertTriangle className="w-7 h-7" />
      </button>

      <div className="grid grid-cols-3 gap-4">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${m.bg} ring-2 ${m.ring} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-3xl font-black text-gray-800 mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Visitor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Host</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Purpose</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Check In</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentVisitors.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">No visitors today</td></tr>
            ) : recentVisitors.map((v) => (
              <tr key={v.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${v.classification === "VIP" ? "bg-amber-50/30 border-l-4 border-l-amber-400" : v.classification === "Blacklist" ? "bg-red-50/30 border-l-4 border-l-red-500" : ""}`}>
                <td className="px-5 py-3 font-medium text-gray-800">{v.visitorName}</td>
                <td className="px-5 py-3 text-gray-600">{v.hostName}</td>
                <td className="px-5 py-3"><PurposeBadge p={v.purpose} /></td>
                <td className="px-5 py-3"><ClassBadge c={v.classification} /></td>
                <td className="px-5 py-3 text-xs text-gray-500">{formatTime(v.checkInTime)}</td>
                <td className="px-5 py-3"><StatusBadge s={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRollCall && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowRollCall(false)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-200 bg-red-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h2 className="text-lg font-black text-red-700">EMERGENCY ROLL CALL</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print List
                </button>
                <button onClick={() => setShowRollCall(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6" ref={printRef}>
              <h1>🚨 Emergency Roll Call — {new Date().toLocaleString("en-IN")}</h1>
              <p className="timestamp">Total persons in premises: {rollCallData.length}</p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Host</th>
                    <th>Check-In Time</th>
                    <th>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {rollCallData.map((v, i) => (
                    <tr key={v.id}>
                      <td>{i + 1}</td>
                      <td>{v.visitorName}</td>
                      <td>{v.phone || "—"}</td>
                      <td>{v.hostName}</td>
                      <td>{formatDateTime(v.checkInTime)}</td>
                      <td>{v.classification}</td>
                    </tr>
                  ))}
                  {rollCallData.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#999" }}>No visitors currently in premises</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccessPortalView() {
  const [mode, setMode] = useState<"check-in" | "check-out">("check-in");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ visitorName: "", phone: "", hostEmployeeId: "", hostName: "", purpose: "Meeting", ticketRef: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<VisitorRecord | null>(null);
  const [scanId, setScanId] = useState("");
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; visitor?: VisitorRecord } | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    authFetch("/api/gate/employees").then(async (r) => {
      if (r.ok) setEmployees(await r.json());
    }).catch(() => {});
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const body: any = {
        visitorName: form.visitorName,
        phone: form.phone,
        hostName: form.hostName || employees.find((e) => e.id === parseInt(form.hostEmployeeId))?.name || "",
        purpose: form.purpose,
        ticketRef: form.ticketRef,
        classification: "Standard",
      };
      if (form.hostEmployeeId) body.hostEmployeeId = parseInt(form.hostEmployeeId);
      const res = await authFetch("/api/gate/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Check-in failed");
        return;
      }
      setLastCheckIn(data);
      if (data.blacklistAlert) {
        setError("⚠️ BLACKLIST ALERT: This visitor matches a blacklisted individual!");
      }
      setSuccess(`✅ ${data.visitorName} checked in successfully. Pass ID: GATE-${data.id.toString().padStart(5, "0")}`);
      setForm({ visitorName: "", phone: "", hostEmployeeId: "", hostName: "", purpose: "Meeting", ticketRef: "" });
      setCapturedPhoto(false);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanCheckout = async () => {
    if (!scanId) return;
    setScanning(true);
    setScanResult(null);
    try {
      const id = scanId.replace(/\D/g, "");
      const res = await authFetch(`/api/gate/check-out/${id}`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setScanResult({ success: false, message: data.error || "Check-out failed" });
      } else {
        setScanResult({ success: true, message: `${data.visitorName} checked out at ${formatTime(data.checkOutTime)}`, visitor: data });
      }
      setScanId("");
    } catch {
      setScanResult({ success: false, message: "Network error" });
    } finally {
      setScanning(false);
    }
  };

  const handlePrintPass = () => {
    if (!lastCheckIn) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Gate Pass</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:monospace;width:58mm;padding:4mm}
      .header{text-align:center;border-bottom:2px dashed #000;padding-bottom:4mm;margin-bottom:4mm}
      .logo{font-size:18px;font-weight:bold;color:#E31E24}
      .field{display:flex;justify-content:space-between;font-size:11px;margin:2mm 0}
      .label{font-weight:bold}
      .qr{text-align:center;margin:4mm 0;padding:4mm;border:2px solid #000}
      .qr-code{font-size:48px}
      .footer{text-align:center;font-size:9px;border-top:2px dashed #000;padding-top:3mm;margin-top:4mm;color:#666}
    </style></head><body>
      <div class="header">
        <div class="logo">YUGAM ERP</div>
        <div style="font-size:12px;font-weight:bold">GATE PASS</div>
      </div>
      <div class="field"><span class="label">Pass ID:</span><span>GATE-${lastCheckIn.id.toString().padStart(5, "0")}</span></div>
      <div class="field"><span class="label">Name:</span><span>${escapeHtml(lastCheckIn.visitorName)}</span></div>
      <div class="field"><span class="label">Phone:</span><span>${escapeHtml(lastCheckIn.phone || "—")}</span></div>
      <div class="field"><span class="label">Host:</span><span>${escapeHtml(lastCheckIn.hostName)}</span></div>
      <div class="field"><span class="label">Purpose:</span><span>${escapeHtml(lastCheckIn.purpose)}</span></div>
      <div class="field"><span class="label">Time:</span><span>${formatDateTime(lastCheckIn.checkInTime)}</span></div>
      <div class="qr"><div class="qr-code">⣿⣿⣿</div><div style="font-size:10px;margin-top:2mm">GATE-${lastCheckIn.id.toString().padStart(5, "0")}</div></div>
      <div class="footer">Show this pass to exit • Valid today only</div>
    </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Portal</h1>
          <p className="text-sm text-gray-400 mt-0.5">High-speed check-in/out for security desk</p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setMode("check-in")} className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "check-in" ? "bg-green-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}>
            <UserPlus className="w-4 h-4 inline mr-1.5" />Check In
          </button>
          <button onClick={() => setMode("check-out")} className={`px-5 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "check-out" ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}>
            <ScanLine className="w-4 h-4 inline mr-1.5" />Check Out
          </button>
        </div>
      </div>

      {mode === "check-in" ? (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Live Camera
            </h3>
            <div className="aspect-[4/3] bg-gray-900 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
              {capturedPhoto ? (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm font-medium">Photo Captured</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute inset-4 border-2 border-green-400/50 rounded-lg" />
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  <div className="text-center">
                    <Camera className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Camera Feed</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setCapturedPhoto(!capturedPhoto)}
              className={`w-full py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${capturedPhoto ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20"}`}
            >
              <Camera className="w-4 h-4" />
              {capturedPhoto ? "Retake Photo" : "📸 Capture Photo"}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Visitor Details</h3>
            <form onSubmit={handleCheckIn} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input type="text" required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} placeholder="Visitor name" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Host Employee *</label>
                <div className="relative">
                  <select value={form.hostEmployeeId} onChange={(e) => {
                    const emp = employees.find((em) => em.id === parseInt(e.target.value));
                    setForm({ ...form, hostEmployeeId: e.target.value, hostName: emp ? emp.name : "" });
                  }} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white appearance-none">
                    <option value="">Select host employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              {!form.hostEmployeeId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Or type host name</label>
                  <input type="text" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} placeholder="Host name" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Purpose *</label>
                  <select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                    <option value="Meeting">Meeting</option>
                    <option value="Interview">Interview</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ticket Ref (optional)</label>
                  <input type="text" value={form.ticketRef} onChange={(e) => setForm({ ...form, ticketRef: e.target.value })} placeholder="e.g., TKT-001" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 font-medium">{error}</p>}
              {success && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 font-medium">{success}</p>}

              <button type="submit" disabled={submitting || (!form.hostEmployeeId && !form.hostName)} className="w-full py-3 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                {submitting ? "Processing..." : "CHECK IN & Issue Pass"}
              </button>
            </form>
            {lastCheckIn && (
              <button onClick={handlePrintPass} className="w-full mt-3 py-3 text-sm font-bold bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Generate 58mm Gate Pass
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg text-center">
            <div className="w-64 h-64 mx-auto bg-gray-900 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden">
              <div className="absolute inset-6 border-2 border-blue-400/60 rounded-xl" />
              <div className="absolute inset-6 border-2 border-blue-400/30 rounded-xl animate-ping" />
              <div className="text-center z-10">
                <QrCode className="w-16 h-16 text-blue-400 mx-auto mb-3" />
                <p className="text-blue-300 text-sm font-medium">Scan QR to Exit</p>
                <p className="text-gray-500 text-xs mt-1">Position gate pass in frame</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs text-gray-400 font-medium">Or enter Pass ID manually:</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScanCheckout()}
                placeholder="e.g., GATE-00012 or 12"
                className="flex-1 px-4 py-3 text-sm border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-lg text-center"
              />
              <button onClick={handleScanCheckout} disabled={scanning || !scanId} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/20 transition-all">
                {scanning ? "..." : "EXIT"}
              </button>
            </div>

            {scanResult && (
              <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${scanResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {scanResult.success ? <CheckCircle2 className="w-5 h-5 inline mr-2" /> : <AlertTriangle className="w-5 h-5 inline mr-2" />}
                {scanResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VisitorLogsView() {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (classFilter !== "all") params.set("classification", classFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await authFetch(`/api/gate/visitors?${params}`);
      if (res.ok) setVisitors(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, [search, classFilter, statusFilter]);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const handleCheckOut = async (id: number) => {
    try {
      const res = await authFetch(`/api/gate/check-out/${id}`, { method: "PATCH" });
      if (res.ok) fetchVisitors();
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visitor Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">Complete historical visitor register</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="search" placeholder="Search by name, phone, or host..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm outline-none w-full placeholder:text-gray-400" />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm">
          <option value="all">All Classes</option>
          <option value="Standard">Standard</option>
          <option value="VIP">VIP</option>
          <option value="Blacklist">Blacklist</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white shadow-sm">
          <option value="all">All Status</option>
          <option value="In-Premises">In-Premises</option>
          <option value="Checked-Out">Checked-Out</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading visitor logs...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Visitor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Host</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Purpose</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Class</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check In</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Check Out</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {visitors.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">No visitors found</td></tr>
              ) : visitors.map((v) => {
                const rowClass = v.classification === "VIP"
                  ? "bg-amber-50/40 border-l-4 border-l-amber-400"
                  : v.classification === "Blacklist"
                  ? "bg-red-50/40 border-l-4 border-l-red-500"
                  : "";
                return (
                  <tr key={v.id} className={`border-t border-gray-50 hover:bg-gray-50/50 ${rowClass}`}>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">GATE-{v.id.toString().padStart(5, "0")}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.visitorName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{v.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{v.hostName}</td>
                    <td className="px-4 py-3"><PurposeBadge p={v.purpose} /></td>
                    <td className="px-4 py-3"><ClassBadge c={v.classification} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(v.checkInTime)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{v.checkOutTime ? formatDateTime(v.checkOutTime) : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge s={v.status} /></td>
                    <td className="px-4 py-3">
                      {v.status === "In-Premises" && (
                        <button onClick={() => handleCheckOut(v.id)} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SecuritySettingsView() {
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", classification: "Blacklist", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"watchlist" | "settings">("watchlist");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wlRes, setRes] = await Promise.all([
        authFetch("/api/gate/watchlist"),
        authFetch("/api/gate/settings"),
      ]);
      if (wlRes.ok) setWatchlist(await wlRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authFetch("/api/gate/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", phone: "", classification: "Blacklist", reason: "" });
        fetchData();
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await authFetch(`/api/gate/watchlist/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch {}
  };

  const toggleSetting = async (key: string) => {
    const current = settings[key] === "true";
    try {
      await authFetch("/api/gate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: current ? "false" : "true" }),
      });
      setSettings({ ...settings, [key]: current ? "false" : "true" });
    } catch {}
  };

  const blacklisted = watchlist.filter((w) => w.classification === "Blacklist");
  const vips = watchlist.filter((w) => w.classification === "VIP");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Settings & Watchlist</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage VIP & Blacklist entries, notification settings</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-md hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all">
          <Plus className="w-4 h-4" /> Add to Watchlist
        </button>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("watchlist")} className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${tab === "watchlist" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Watchlist ({watchlist.length})
        </button>
        <button onClick={() => setTab("settings")} className={`px-5 py-2 text-sm font-semibold rounded-md transition-all ${tab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          Notification Settings
        </button>
      </div>

      {tab === "watchlist" ? (
        loading ? (
          <div className="text-center py-12 text-gray-400">Loading watchlist...</div>
        ) : (
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Ban className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-red-700">Blacklist ({blacklisted.length})</h3>
              </div>
              <div className="space-y-2">
                {blacklisted.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">No blacklisted entries</div>
                ) : blacklisted.map((w) => (
                  <div key={w.id} className="bg-white border-l-4 border-l-red-500 border border-red-100 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{w.name}</p>
                      <p className="text-xs text-gray-500">{w.phone || "No phone"} • {w.reason || "No reason given"}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Added {w.createdAt ? formatDate(w.createdAt) : "—"}</p>
                    </div>
                    <button onClick={() => handleDelete(w.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-amber-700">VIP List ({vips.length})</h3>
              </div>
              <div className="space-y-2">
                {vips.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-sm text-gray-400">No VIP entries</div>
                ) : vips.map((w) => (
                  <div key={w.id} className="bg-white border-l-4 border-l-amber-400 border border-amber-100 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">★ {w.name}</p>
                      <p className="text-xs text-gray-500">{w.phone || "No phone"} • {w.reason || "No notes"}</p>
                      <p className="text-[10px] text-gray-400 mt-1">Added {w.createdAt ? formatDate(w.createdAt) : "—"}</p>
                    </div>
                    <button onClick={() => handleDelete(w.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg space-y-5">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Notification Preferences</h3>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Notify Pantry/Housekeeping on VIP Check-In</p>
              <p className="text-xs text-gray-400 mt-0.5">Send alert when a VIP visitor checks in</p>
            </div>
            <button
              onClick={() => toggleSetting("notify_pantry_vip")}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings["notify_pantry_vip"] === "true" ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings["notify_pantry_vip"] === "true" ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-800">Blacklist Entry Alert</p>
              <p className="text-xs text-gray-400 mt-0.5">Show prominent alert when blacklisted person attempts check-in</p>
            </div>
            <button
              onClick={() => toggleSetting("blacklist_alert")}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings["blacklist_alert"] !== "false" ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings["blacklist_alert"] !== "false" ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Auto-Generate Gate Pass on Check-In</p>
              <p className="text-xs text-gray-400 mt-0.5">Automatically print 58mm thermal pass after successful check-in</p>
            </div>
            <button
              onClick={() => toggleSetting("auto_print_pass")}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings["auto_print_pass"] === "true" ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings["auto_print_pass"] === "true" ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add to Watchlist</h2>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Person's name" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Classification *</label>
                <select value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white">
                  <option value="Blacklist">Blacklist</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Reason / Notes</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Reason for listing..." rows={2} className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 resize-none" />
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50">{submitting ? "Adding..." : "Add Entry"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GateDashboard() {
  const { activeModule } = useModule();
  const sub = activeModule.startsWith("Gate:") ? activeModule.replace("Gate:", "") : "Gate Dashboard";

  switch (sub) {
    case "Gate Dashboard":
      return <GateDashboardView />;
    case "Access Portal":
      return <AccessPortalView />;
    case "Visitor Logs":
      return <VisitorLogsView />;
    case "Security Settings & Watchlist":
      return <SecuritySettingsView />;
    default:
      return <GateDashboardView />;
  }
}
