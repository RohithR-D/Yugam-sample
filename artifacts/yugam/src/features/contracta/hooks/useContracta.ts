import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Compliance, DashboardSummary, Template, ComplianceFormData } from "../types";
import {
  getContractaDashboardSummary,
  getCompliances,
  createCompliance,
  deleteCompliance,
  getContractaTemplates,
  updateContractaTemplate,
  createContractaTemplate,
  deleteContractaTemplate,
} from "../services/contractaService";
import { buildCreateTemplatePayload, buildTemplatePayload, formatPrintContent, PLACEHOLDER_VARIABLES } from "../utils/contractaUtils";

export function useComplianceDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getContractaDashboardSummary();
        setSummary(data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  return { summary, loading };
}

export function useComplianceTable(category: string) {
  const [records, setRecords] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<ComplianceFormData>({
    title: "",
    entityName: "",
    validFrom: new Date().toISOString().split("T")[0],
    expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCompliances(category);
      setRecords(data);
    } catch {} finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createCompliance({ ...formData, category });
      setShowModal(false);
      setFormData({
        title: "",
        entityName: "",
        validFrom: new Date().toISOString().split("T")[0],
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
        notes: "",
      });
      await fetchData();
    } catch (err: any) {
      setError(err?.message || "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;
    await deleteCompliance(id);
    await fetchData();
  };

  const filtered = useMemo(
    () => records.filter((r) => r.title.toLowerCase().includes(search.toLowerCase()) || r.entityName.toLowerCase().includes(search.toLowerCase())),
    [records, search],
  );

  return {
    records,
    loading,
    search,
    setSearch,
    showModal,
    setShowModal,
    formData,
    setFormData,
    submitting,
    error,
    handleSubmit,
    handleDelete,
    filtered,
  };
}

export function useLetterDocBuilder() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("HR");
  const [saving, setSaving] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("HR");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showVarDropdown, setShowVarDropdown] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContractaTemplates();
      setTemplates(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setEditorContent(template.contentHtml);
    setTemplateName(template.templateName);
    setTemplateCategory(template.category);
    if (editorRef.current) {
      editorRef.current.innerHTML = template.contentHtml;
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setEditorContent(editorRef.current.innerHTML);
    }
  };

  const insertVariable = (variable: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.className = "inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5";
      span.contentEditable = "false";
      span.textContent = variable;
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += `<span class=\"inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-mono mx-0.5\" contenteditable=\"false\">${variable}</span>&nbsp;`;
    }
    setEditorContent(editorRef.current.innerHTML);
    setShowVarDropdown(false);
  };

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      await updateContractaTemplate(selectedTemplate.id, buildTemplatePayload(templateName, templateCategory, editorContent));
      await fetchTemplates();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await createContractaTemplate(buildCreateTemplatePayload(newName, newCategory));
      await fetchTemplates();
      selectTemplate(created);
      setShowNewModal(false);
      setNewName("");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this template?")) return;
    await deleteContractaTemplate(id);
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
      setEditorContent("");
      setTemplateName("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
    await fetchTemplates();
  };

  const printContent = useMemo(() => formatPrintContent(editorContent), [editorContent]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${templateName || "Document"}</title><style>@page { margin: 2.5cm 2cm; } body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #222; padding: 0; margin: 0; } h1, h2, h3 { font-family: Arial, sans-serif; } p { margin: 0 0 8pt; } span[style*="underline"] { border-bottom: 1px solid #E31E24; padding-bottom: 1px; }</style></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const categoryIcons: Record<string, string> = { HR: "bg-teal-50 text-teal-600", Legal: "bg-indigo-50 text-indigo-600", General: "bg-gray-50 text-gray-600" };

  return {
    templates,
    loading,
    selectedTemplate,
    editorContent,
    templateName,
    templateCategory,
    saving,
    showNewModal,
    newName,
    newCategory,
    showPrintPreview,
    showVarDropdown,
    editorRef,
    selectTemplate,
    handleEditorInput,
    insertVariable,
    execCmd,
    handleSave,
    handleCreate,
    handleDelete,
    handlePrint,
    printContent,
    setShowNewModal,
    setShowPrintPreview,
    setShowVarDropdown,
    setTemplateName,
    setTemplateCategory,
    setNewName,
    setNewCategory,
    categoryIcons,
    PLACEHOLDER_VARIABLES,
  };
}
