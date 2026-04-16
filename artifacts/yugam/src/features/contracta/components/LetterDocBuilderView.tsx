import { FileText, FileSignature, Plus, X, Save, Eye, Printer, ChevronDown, Trash2 } from "lucide-react";
import { useLetterDocBuilder } from "../hooks/useContracta";
import { PLACEHOLDER_VARIABLES } from "../utils/contractaUtils";

export default function LetterDocBuilderView() {
  const {
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
  } = useLetterDocBuilder();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Letter & Doc Builder</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create templates with dynamic placeholders for HR & Legal documents</p>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Templates</span>
            <button onClick={() => setShowNewModal(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#E31E24] hover:bg-red-50 transition-colors" title="New Template">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center py-6 text-xs text-gray-400">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No templates yet</div>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${selectedTemplate?.id === t.id ? "bg-[#E31E24]/10 text-[#E31E24]" : "text-gray-600 hover:bg-gray-50"}`}
                  onClick={() => selectTemplate(t)}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.templateName}</p>
                    <p className={`text-[10px] ${selectedTemplate?.id === t.id ? "text-[#E31E24]/60" : "text-gray-400"}`}>{t.category}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {!selectedTemplate ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">Select a template or create a new one</p>
                <p className="text-xs text-gray-400 mt-1">Use the panel on the left to get started</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="text-sm font-semibold text-gray-800 border-none outline-none bg-transparent flex-1"
                  placeholder="Template Name"
                />
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                >
                  <option value="HR">HR</option>
                  <option value="Legal">Legal</option>
                  <option value="General">General</option>
                </select>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] disabled:opacity-50 transition-all"
                  >
                    <Save className="w-3 h-3" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setShowPrintPreview(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                </div>
              </div>

              <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1 flex-wrap">
                <button onClick={() => execCmd("bold")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors" title="Bold">B</button>
                <button onClick={() => execCmd("italic")} className="p-1.5 rounded text-xs italic text-gray-600 hover:bg-gray-100 transition-colors" title="Italic">I</button>
                <button onClick={() => execCmd("underline")} className="p-1.5 rounded text-xs underline text-gray-600 hover:bg-gray-100 transition-colors" title="Underline">U</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("formatBlock", "h1")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H1</button>
                <button onClick={() => execCmd("formatBlock", "h2")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H2</button>
                <button onClick={() => execCmd("formatBlock", "h3")} className="p-1.5 rounded text-xs font-bold text-gray-600 hover:bg-gray-100">H3</button>
                <button onClick={() => execCmd("formatBlock", "p")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">P</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("insertUnorderedList")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100" title="Bullet List">• List</button>
                <button onClick={() => execCmd("insertOrderedList")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100" title="Numbered List">1. List</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <button onClick={() => execCmd("justifyLeft")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Left</button>
                <button onClick={() => execCmd("justifyCenter")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Center</button>
                <button onClick={() => execCmd("justifyRight")} className="p-1.5 rounded text-xs text-gray-600 hover:bg-gray-100">Right</button>
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <div className="relative">
                  <button
                    onClick={() => setShowVarDropdown(!showVarDropdown)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Insert Variable
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showVarDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto py-1">
                      {PLACEHOLDER_VARIABLES.map((v) => (
                        <button key={v} onClick={() => insertVariable(v)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-mono">
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onBlur={handleEditorInput}
                className="flex-1 overflow-y-auto p-6 outline-none text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
                style={{ minHeight: 200, fontFamily: "'Times New Roman', serif" }}
                dangerouslySetInnerHTML={{ __html: editorContent }}
              />
            </>
          )}
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">New Template</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Template Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Onboarding Letter"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24]/20 bg-white"
                >
                  <option value="HR">HR</option>
                  <option value="Legal">Legal</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPrintPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Print Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Generate & Print
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8" style={{ fontFamily: "'Times New Roman', serif" }}>
              <div className="max-w-xl mx-auto prose prose-sm" dangerouslySetInnerHTML={{ __html: printContent }} />
            </div>
            <div className="px-6 py-3 border-t border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">This preview is optimized for printing on pre-printed company letterheads. No headers/footers will appear.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
