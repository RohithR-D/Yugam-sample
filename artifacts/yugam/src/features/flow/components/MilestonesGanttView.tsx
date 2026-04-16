import { BarChart3, Edit2, Flag, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createMilestone, deleteMilestone, updateMilestone } from "../services/flowService";
import type { Milestone, ProjectRecord } from "../types";
import { formatDate, inputCls } from "../utils/flowUtils";
import { EmptyState, Modal, ModalFooter } from "./FlowShared";

function MilestoneModal({
  projects,
  milestone,
  onClose,
  onSaved,
  defaultProjectId,
}: {
  projects: ProjectRecord[];
  milestone?: Milestone;
  onClose: () => void;
  onSaved: () => void;
  defaultProjectId?: number;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectId: milestone?.projectId?.toString() || defaultProjectId?.toString() || "",
    title: milestone?.title || "",
    targetDate: milestone ? new Date(milestone.targetDate).toISOString().split("T")[0] : "",
    completionPercent: milestone?.completionPercent?.toString() || "0",
    notes: milestone?.notes || "",
  });

  const isEdit = Boolean(milestone);

  const handleSave = async () => {
    if (!form.projectId || !form.title.trim() || !form.targetDate) {
      return;
    }

    setSaving(true);
    try {
      const wasSaved = isEdit
        ? await updateMilestone(milestone!.id, {
            title: form.title,
            targetDate: form.targetDate,
            completionPercent: parseInt(form.completionPercent, 10) || 0,
            notes: form.notes,
          })
        : await createMilestone({
            projectId: parseInt(form.projectId, 10),
            title: form.title,
            targetDate: form.targetDate,
            completionPercent: parseInt(form.completionPercent, 10) || 0,
            notes: form.notes,
          });

      if (wasSaved) {
        onSaved();
      }
    } catch {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? "Edit Milestone" : "Add Milestone"} icon={Flag} onClose={onClose}>
      <div className="p-6 space-y-4">
        {!isEdit && (
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
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Milestone Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Foundation Complete"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Target Date</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Completion %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.completionPercent}
              onChange={(event) => setForm({ ...form, completionPercent: event.target.value })}
              className={inputCls + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"}
            />
          </div>
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
        disabled={!form.projectId || !form.title.trim() || !form.targetDate}
        label={isEdit ? "Save Changes" : "Add Milestone"}
      />
    </Modal>
  );
}

export function MilestonesGanttView({
  projects,
  milestones,
  onRefresh,
}: {
  projects: ProjectRecord[];
  milestones: Milestone[];
  onRefresh: () => void;
}) {
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);

  const projectMilestones = useMemo(() => {
    if (!selectedProject) {
      return milestones;
    }
    return milestones.filter((milestone) => milestone.projectId === selectedProject);
  }, [milestones, selectedProject]);

  const ganttRange = useMemo(() => {
    if (projectMilestones.length === 0) {
      return {
        start: new Date(),
        end: new Date(Date.now() + 90 * 86400000),
        days: 90,
      };
    }

    const dates = projectMilestones.map((milestone) => new Date(milestone.targetDate).getTime());
    const minDate = new Date(Math.min(...dates) - 7 * 86400000);
    const maxDate = new Date(Math.max(...dates) + 14 * 86400000);
    const days = Math.max(30, Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000));

    return { start: minDate, end: maxDate, days };
  }, [projectMilestones]);

  const getPosition = (date: string) => {
    const dateTime = new Date(date).getTime();
    const start = ganttRange.start.getTime();
    const end = ganttRange.end.getTime();
    return Math.max(0, Math.min(100, ((dateTime - start) / (end - start)) * 100));
  };

  const monthMarkers = useMemo(() => {
    const markers: { label: string; pos: number }[] = [];
    const cursor = new Date(ganttRange.start);
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() + 1);

    while (cursor <= ganttRange.end) {
      const position = getPosition(cursor.toISOString());
      markers.push({
        label: cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        pos: position,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return markers;
  }, [ganttRange]);

  const handleDeleteMilestone = async (milestoneId: number) => {
    if (!confirm("Delete?")) {
      return;
    }
    await deleteMilestone(milestoneId);
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Milestones & Gantt</h1>
          <p className="text-sm text-gray-400 mt-0.5">Visual timeline of project phases and milestones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#E31E24] rounded-lg hover:bg-[#c9191f] shadow-lg shadow-red-500/15 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Milestone
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
        <p className="text-xs text-gray-400">{projectMilestones.length} milestones</p>
      </div>

      {projectMilestones.length === 0 ? (
        <EmptyState icon={BarChart3} text="No milestones for selected project" />
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="relative border-b border-gray-100 px-5 py-3 bg-gray-50/50">
            <div className="relative h-6">
              <div className="absolute left-0 top-0 w-full h-full flex items-center">
                {monthMarkers.map((marker, index) => (
                  <div
                    key={`${marker.label}-${index}`}
                    className="absolute text-[10px] text-gray-400 font-medium"
                    style={{ left: `${marker.pos}%` }}
                  >
                    {marker.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {projectMilestones.map((milestone) => {
              const position = getPosition(milestone.targetDate);
              const project = projects.find((item) => item.id === milestone.projectId);
              const isPast = new Date(milestone.targetDate) < new Date() && milestone.completionPercent < 100;

              return (
                <div
                  key={milestone.id}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="w-[200px] shrink-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{milestone.title}</p>
                    <p className="text-[10px] text-gray-400">
                      {project?.projectName || "-"} · {formatDate(milestone.targetDate)}
                    </p>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div className="absolute inset-0 bg-gray-100/50 rounded" />
                    <div className="absolute top-0 h-full" style={{ left: `${position}%`, transform: "translateX(-50%)" }}>
                      <div
                        className={`w-3 h-3 rounded-full border-2 mt-2.5 ${
                          milestone.completionPercent >= 100
                            ? "bg-green-500 border-green-300"
                            : isPast
                              ? "bg-red-500 border-red-300"
                              : "bg-[#E31E24] border-red-300"
                        }`}
                      />
                    </div>
                    {milestone.completionPercent > 0 && milestone.completionPercent < 100 && (
                      <div
                        className="absolute top-0 h-full rounded bg-[#E31E24]/10"
                        style={{ left: 0, width: `${position}%` }}
                      />
                    )}
                  </div>
                  <div className="w-[60px] text-right">
                    <span
                      className={`text-xs font-bold ${
                        milestone.completionPercent >= 100 ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {milestone.completionPercent}%
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditMilestone(milestone)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(milestone.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <MilestoneModal
          projects={projects}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            onRefresh();
          }}
          defaultProjectId={selectedProject || undefined}
        />
      )}

      {editMilestone && (
        <MilestoneModal
          projects={projects}
          milestone={editMilestone}
          onClose={() => setEditMilestone(null)}
          onSaved={() => {
            setEditMilestone(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
