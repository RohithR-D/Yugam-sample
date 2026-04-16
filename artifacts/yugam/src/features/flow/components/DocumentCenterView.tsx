import { BarChart3, CheckCircle, CreditCard, Eye, FileText, HardDrive, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { createDocument, deleteDocument } from "../services/flowService";
import type { DocRecord, ProjectRecord } from "../types";
import { formatDate, inputCls } from "../utils/flowUtils";
import { EmptyState, Modal, ModalFooter } from "./FlowShared";

function UploadDocumentModal({
  projects,
  defaultProjectId,
  onClose,
  onSaved,
}: {
  projects: ProjectRecord[];
  defaultProjectId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectId: defaultProjectId?.toString() || "",
    fileName: "",
    fileUrl: "",
    fileType: "Contracts",
    fileSize: "",
    uploadedBy: "",
    notes: "",
  });

  const handleSave = async () => {
    if (!form.projectId || !form.fileName.trim()) {
      return;
    }

    setSaving(true);
    try {
      const saved = await createDocument({
        ...form,
        projectId: parseInt(form.projectId, 10),
      });
      if (saved) {
        onSaved();
      }
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Upload Document" icon={Upload} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Project</label>
          <select
            value={form.projectId}
            onChange={(event) => setForm({ ...form, projectId: event.target.value })}
            className={inputCls + " cursor-pointer"}
          >
            <option value="">Select Project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">File Name</label>
          <input
            type="text"
            value={form.fileName}
            onChange={(event) => setForm({ ...form, fileName: event.target.value })}
            placeholder="e.g. Contract_SolarFarm_v2.pdf"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Document Type</label>
            <select
              value={form.fileType}
              onChange={(event) => setForm({ ...form, fileType: event.target.value })}
              className={inputCls + " cursor-pointer"}
            >
              <option value="Contracts">Contracts</option>
              <option value="Architectural Drawings">Architectural Drawings</option>
              <option value="Compliance Permits">Compliance Permits</option>
              <option value="BOQs">BOQs</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">File Size</label>
            <input
              type="text"
              value={form.fileSize}
              onChange={(event) => setForm({ ...form, fileSize: event.target.value })}
              placeholder="e.g. 2.4 MB"
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">File URL (optional)</label>
          <input
            type="url"
            value={form.fileUrl}
            onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
            placeholder="https://..."
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Uploaded By</label>
          <input
            type="text"
            value={form.uploadedBy}
            onChange={(event) => setForm({ ...form, uploadedBy: event.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className={inputCls + " resize-none"}
          />
        </div>
      </div>
      <ModalFooter
        onClose={onClose}
        onSave={handleSave}
        saving={saving}
        disabled={!form.projectId || !form.fileName.trim()}
        label="Upload Document"
      />
    </Modal>
  );
}

export function DocumentCenterView({
  projects,
  documents,
  onRefresh,
}: {
  projects: ProjectRecord[];
  documents: DocRecord[];
  onRefresh: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const projectDocs = useMemo(() => {
    let result = selectedProject
      ? documents.filter((document) => document.projectId === selectedProject)
      : documents;

    if (typeFilter) {
      result = result.filter((document) => document.fileType === typeFilter);
    }

    return result;
  }, [documents, selectedProject, typeFilter]);

  const fileTypeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
    Contracts: { icon: FileText, color: "bg-blue-50 text-blue-600" },
    "Architectural Drawings": { icon: BarChart3, color: "bg-purple-50 text-purple-600" },
    "Compliance Permits": { icon: CheckCircle, color: "bg-green-50 text-green-600" },
    BOQs: { icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  };

  const docsByType = useMemo(() => {
    const grouped: Record<string, DocRecord[]> = {};
    projectDocs.forEach((document) => {
      if (!grouped[document.fileType]) {
        grouped[document.fileType] = [];
      }
      grouped[document.fileType].push(document);
    });
    return grouped;
  }, [projectDocs]);

  const handleDeleteDocument = async (documentId: number) => {
    if (!confirm("Delete document?")) {
      return;
    }
    await deleteDocument(documentId);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Center</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Project file repository - contracts, drawings, permits, BOQs
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedProject}
          onChange={(event) => setSelectedProject(event.target.value ? parseInt(event.target.value, 10) : "")}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm min-w-[250px]"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.projectName}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#E31E24] cursor-pointer shadow-sm"
        >
          <option value="">All Types</option>
          <option value="Contracts">Contracts</option>
          <option value="Architectural Drawings">Architectural Drawings</option>
          <option value="Compliance Permits">Compliance Permits</option>
          <option value="BOQs">BOQs</option>
        </select>
        <p className="text-xs text-gray-400">{projectDocs.length} documents</p>
      </div>

      {projectDocs.length === 0 ? (
        <EmptyState icon={HardDrive} text="No documents uploaded" />
      ) : (
        <div className="space-y-4">
          {Object.entries(docsByType).map(([type, docs]) => {
            const fileTypeInfo = fileTypeIcons[type] || { icon: FileText, color: "bg-gray-50 text-gray-600" };
            const FileTypeIcon = fileTypeInfo.icon;

            return (
              <div key={type} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${fileTypeInfo.color} flex items-center justify-center`}>
                    <FileTypeIcon className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">{type}</h3>
                  <span className="text-[10px] text-gray-400 ml-auto">{docs.length} files</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {docs.map((document) => {
                    const project = projects.find((item) => item.id === document.projectId);
                    return (
                      <div
                        key={document.id}
                        className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{document.fileName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {project?.projectName || "-"} · {document.uploadedBy || "System"} · {formatDate(document.createdAt)}
                          </p>
                        </div>
                        {document.fileSize && <span className="text-xs text-gray-400">{document.fileSize}</span>}
                        {document.fileUrl && (
                          <a
                            href={document.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <UploadDocumentModal
          projects={projects}
          defaultProjectId={selectedProject || undefined}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
