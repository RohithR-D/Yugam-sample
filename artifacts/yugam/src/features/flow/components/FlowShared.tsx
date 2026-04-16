import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { inputCls } from "../utils/flowUtils";

export function StatusPill({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    Planning: "bg-gray-50 text-gray-500 border-gray-200",
    Active: "bg-blue-50 text-blue-600 border-blue-200",
    "On Hold": "bg-amber-50 text-amber-600 border-amber-200",
    Handover: "bg-green-50 text-green-600 border-green-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusClasses[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="text-center py-16 bg-white border border-gray-100 rounded-xl shadow-sm">
      <Icon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

export function Modal({
  title,
  icon: Icon,
  onClose,
  children,
  wide,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl ${wide ? "w-[680px]" : "w-[520px]"} max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E31E24]/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-[#E31E24]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalFooter({
  onClose,
  onSave,
  saving,
  disabled,
  label,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" /> {label}
      </button>
    </div>
  );
}

export { inputCls };
