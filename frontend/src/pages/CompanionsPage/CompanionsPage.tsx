import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  IconPlus,
  IconTrash,
  IconUsers,
  IconMessageCircle,
  IconCheck,
} from "@tabler/icons-react";
import type { WeekState, Companion, Task } from "../../shared/types/weekly";
import { RightSidePanel } from "../../widgets/SidePanel";
import { useClickOutside } from "../../shared/hooks/useClickOutside";
import CompanionAvatar from "../../entities/companion/ui/CompanionAvatar";
import {
  TASK_DETAILS_TITLE_INPUT,
  TASK_DETAILS_TITLE_DISPLAY,
  TASK_SELECTOR_DROPDOWN,
} from "../../features/weekly/edit-task/taskDetailsStyles";

type PanelMode = "details" | "add";

interface CompanionsPageProps {
  weekState: WeekState;
  actions: {
    addCompanion: (
      name: string,
      relationship: Companion["relationship"],
      description?: string
    ) => string;
    updateCompanion: (
      id: string,
      updates: Partial<Omit<Companion, "id" | "createdAt">>
    ) => void;
    deleteCompanion: (id: string) => void;
  };
}

// Compute per-companion stats
function useCompanionStats(companions: Companion[], tasks: Task[]) {
  return useMemo(() => {
    const statsMap: Record<
      string,
      {
        total: number;
        completed: number;
        failed: number;
        open: number;
        completionRate: number;
      }
    > = {};

    companions.forEach((c) => {
      const companionTasks = tasks.filter((t) =>
        t.companionIds?.includes(c.id)
      );
      const total = companionTasks.length;
      const completed = companionTasks.filter(
        (t) => t.status === "completed"
      ).length;
      const failed = companionTasks.filter((t) => t.status === "failed").length;
      const open = companionTasks.filter((t) => t.status === "open").length;
      const completionRate =
        total > 0 ? Math.round((completed / total) * 100) : 0;

      statsMap[c.id] = {
        total,
        completed,
        failed,
        open,
        completionRate,
      };
    });

    return statsMap;
  }, [companions, tasks]);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CompanionsPage({
  weekState,
  actions,
}: CompanionsPageProps) {
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(
    null
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("details");

  // Form State
  const [formData, setFormData] = useState<Partial<Companion>>({
    name: "",
    relationship: "friend",
    description: "",
  });

  const companionStats = useCompanionStats(
    weekState.companions,
    weekState.tasks
  );

  const selectedCompanion = useMemo(
    () => weekState.companions.find((c) => c.id === selectedCompanionId),
    [weekState.companions, selectedCompanionId]
  );

  const companionTasks = useMemo(() => {
    if (!selectedCompanionId) return [];
    return weekState.tasks.filter((t) =>
      t.companionIds?.includes(selectedCompanionId)
    );
  }, [weekState.tasks, selectedCompanionId]);

  const handleOpenDetails = (companionId: string) => {
    setSelectedCompanionId(companionId);
    setPanelMode("details");
    setIsPanelOpen(true);
  };

  const handleOpenAdd = () => {
    setSelectedCompanionId(null);
    setFormData({
      name: "",
      relationship: "friend",
      description: "",
    });
    setPanelMode("add");
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    // Delay clearing selection so animation can complete
    setTimeout(() => {
      if (panelMode === "add") {
        setSelectedCompanionId(null);
      }
      setPanelMode("details");
    }, 300);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (panelMode === "add") {
      const newId = actions.addCompanion(
        formData.name,
        formData.relationship as Companion["relationship"],
        formData.description || undefined
      );
      // Select the new companion and show details
      setSelectedCompanionId(newId);
      setPanelMode("details");
    }
  };

  const handleDelete = () => {
    if (!selectedCompanion) return;
    if (confirm(`Remove ${selectedCompanion.name}?`)) {
      actions.deleteCompanion(selectedCompanion.id);
      setSelectedCompanionId(null);
      setIsPanelOpen(false);
    }
  };

  const panelTitle =
    panelMode === "add" ? "Add Companion" : "Companion details";

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {weekState.companions.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
              <IconUsers className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">
              No companions yet
            </h2>
            <p className="text-slate-400 mb-6 max-w-sm">
              Add companions to track shared tasks and activities with friends,
              family, and coworkers.
            </p>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              <IconPlus className="w-5 h-5" />
              Add Your First Companion
            </button>
          </div>
        ) : (
          /* Card Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {weekState.companions.map((companion) => {
              const stats = companionStats[companion.id];
              return (
                <motion.button
                  key={companion.id}
                  onClick={() => handleOpenDetails(companion.id)}
                  className={`group relative p-4 rounded-xl border text-left transition-all ${
                    selectedCompanionId === companion.id && isPanelOpen
                      ? "bg-slate-800 border-indigo-500/50 ring-1 ring-indigo-500/30"
                      : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-3 mb-3">
                    <CompanionAvatar
                      name={companion.name}
                      color={companion.color}
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 truncate">
                        {companion.name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300 capitalize">
                        {companion.relationship}
                      </span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Tasks:</span>
                      <span className="font-medium text-slate-200">
                        {stats?.total || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Done:</span>
                      <span
                        className={`font-medium ${
                          (stats?.completionRate || 0) >= 80
                            ? "text-emerald-400"
                            : (stats?.completionRate || 0) >= 50
                            ? "text-amber-400"
                            : "text-slate-300"
                        }`}
                      >
                        {stats?.completionRate || 0}%
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {/* Add Card */}
            <button
              onClick={handleOpenAdd}
              className="group p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-500 bg-transparent hover:bg-slate-800/30 transition-all flex flex-col items-center justify-center min-h-[140px] text-slate-400 hover:text-slate-200"
            >
              <IconPlus className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
              <span className="text-sm font-medium">Add Companion</span>
            </button>
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <RightSidePanel
        title={panelTitle}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      >
        {panelMode === "add" ? (
          <CompanionForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            onCancel={handleClosePanel}
          />
        ) : selectedCompanion ? (
          <CompanionDetails
            companion={selectedCompanion}
            stats={companionStats[selectedCompanion.id]}
            tasks={companionTasks}
            onUpdate={(updates) =>
              actions.updateCompanion(selectedCompanion.id, updates)
            }
            onDelete={handleDelete}
          />
        ) : null}
      </RightSidePanel>
    </div>
  );
}

// Companion Details Panel Content
function CompanionDetails({
  companion,
  stats,
  tasks,
  onUpdate,
  onDelete,
}: {
  companion: Companion;
  stats: {
    total: number;
    completed: number;
    failed: number;
    open: number;
    completionRate: number;
  };
  tasks: Task[];
  onUpdate: (updates: Partial<Omit<Companion, "id" | "createdAt">>) => void;
  onDelete: () => void;
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(companion.name);
  const [isRelationshipDropdownOpen, setIsRelationshipDropdownOpen] =
    useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const relationshipDropdownRef = useRef<HTMLDivElement>(null);

  // Sync internal state if companion changes
  useEffect(() => {
    setEditName(companion.name);
    setIsEditingName(false);
    setIsRelationshipDropdownOpen(false);
  }, [companion.id]);

  useClickOutside(
    [relationshipDropdownRef],
    () => setIsRelationshipDropdownOpen(false),
    isRelationshipDropdownOpen
  );

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const saveName = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== companion.name) {
      onUpdate({ name: trimmed });
    } else if (!trimmed) {
      // Revert if empty
      setEditName(companion.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveName();
    } else if (e.key === "Escape") {
      setEditName(companion.name);
      setIsEditingName(false);
    }
  };

  const relationshipOptions: Companion["relationship"][] = [
    "friend",
    "coworker",
    "partner",
    "family",
    "acquaintance",
    "other",
  ];

  return (
    <div className="flex flex-col h-full text-slate-100">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
            <CompanionAvatar
              name={companion.name}
              color={companion.color}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={handleNameKeyDown}
                  className={TASK_DETAILS_TITLE_INPUT}
                  placeholder="Companion name"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingName(true)}
                  className={TASK_DETAILS_TITLE_DISPLAY}
                >
                  {companion.name}
                </h2>
              )}
              <div
                className="relative mt-1 w-fit"
                ref={relationshipDropdownRef}
              >
                <button
                  onClick={() =>
                    setIsRelationshipDropdownOpen(!isRelationshipDropdownOpen)
                  }
                  className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-slate-700 text-slate-300 capitalize hover:bg-slate-600 transition-colors"
                >
                  {companion.relationship}
                </button>

                {isRelationshipDropdownOpen && (
                  <div
                    className={`${TASK_SELECTOR_DROPDOWN} left-0 top-full mt-1 min-w-[140px] p-1 z-50`}
                  >
                    {relationshipOptions.map((option) => {
                      const isSelected = companion.relationship === option;
                      return (
                        <button
                          key={option}
                          onClick={() => {
                            onUpdate({ relationship: option });
                            setIsRelationshipDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded transition-colors capitalize ${
                            isSelected
                              ? "bg-indigo-600/20 text-indigo-200"
                              : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                          }`}
                        >
                          {option}
                          {isSelected && (
                            <IconCheck className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {companion.description && (
                <p className="mt-2 text-sm text-slate-400 italic">
                  {companion.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 py-4 border-b border-slate-700">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
              <div className="text-xl font-bold text-slate-100">
                {stats.total}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                Shared
              </div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
              <div className="text-xl font-bold text-emerald-400">
                {stats.completed}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                Done
              </div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-center">
              <div className="text-xl font-bold text-indigo-400">
                {stats.completionRate}%
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                Rate
              </div>
            </div>
          </div>

          {/* Recent Interactions */}
          <div className="flex-1 py-4 flex flex-col">
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <IconMessageCircle className="w-4 h-4 text-slate-400" />
              Recent Interactions
            </h3>
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-sm text-slate-500 italic py-4">
                  No shared tasks or events recorded this week.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.status === "completed"
                            ? "bg-emerald-500"
                            : task.status === "failed"
                            ? "bg-rose-500"
                            : "bg-slate-500"
                        }`}
                      />
                      <span
                        className={`text-sm truncate ${
                          task.status === "completed"
                            ? "line-through text-slate-500"
                            : "text-slate-200"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex-shrink-0 ml-2">
                      {DAY_NAMES[task.dayIndex]}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions (Delete at bottom) */}
      <div className="pt-4 border-t border-slate-700 mt-auto">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 bg-slate-800 hover:bg-rose-900/30 rounded-lg transition-colors"
        >
          <IconTrash className="w-4 h-4" />
          Delete Companion
        </button>
      </div>
    </div>
  );
}

// Companion Form (Add/Edit)
function CompanionForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
}: {
  formData: Partial<Companion>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Companion>>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Name
          </label>
          <input
            required
            type="text"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Alice Smith"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Relationship
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-indigo-500 transition-colors"
              value={formData.relationship || "friend"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  relationship: e.target.value as Companion["relationship"],
                })
              }
            >
              <option value="friend">Friend</option>
              <option value="coworker">Coworker</option>
              <option value="partner">Partner</option>
              <option value="family">Family</option>
              <option value="acquaintance">Acquaintance</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-indigo-500 transition-colors resize-none"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Met at the coffee shop..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-auto border-t border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm font-medium transition-colors"
        >
          Add Companion
        </button>
      </div>
    </form>
  );
}
