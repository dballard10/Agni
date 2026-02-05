import { useState, useRef, useEffect } from "react";
import type {
  Task,
  TaskStatus,
  TaskLocation,
  WeeklyItemType,
  Goal,
  Companion,
  RecurrenceRule,
  RecurrenceFrequency,
} from "../../../shared/types/weekly";
import { IconTrash, IconTarget, IconUsers, IconX } from "@tabler/icons-react";
import StatusSelector from "../../../entities/task/ui/StatusSelector";
import TaskDetailsForm from "./TaskDetailsForm";
import {
  ITEM_TYPE_STYLES,
  INFORMATIONAL_TYPES,
  type ItemTypeStyle,
} from "../../../entities/task/model/itemTypeConfig";
import {
  TASK_DETAILS_ACTIONS_WRAPPER,
  TASK_DETAILS_DELETE_BUTTON,
  TASK_DETAILS_HEADER,
  TASK_DETAILS_HEADER_ROW,
  TASK_DETAILS_ROOT,
  TASK_DETAILS_TITLE_DISPLAY,
  TASK_DETAILS_TITLE_INPUT,
  TASK_FORM_WRAPPER,
  TASK_LINKS_GRID,
  TASK_TYPE_BUTTON_BASE,
  TASK_TYPE_BUTTON_SELECTED,
  TASK_TYPE_BUTTON_UNSELECTED,
  TASK_TYPE_SELECTOR_BUTTONS,
  TASK_TYPE_SELECTOR_LABEL,
  TASK_TYPE_SELECTOR_WRAPPER,
  TASK_GOAL_PILLS_WRAP,
  TASK_GOAL_PILL,
  TASK_GOAL_PILL_AVATAR_BORDER,
  TASK_GOAL_PILL_REMOVE_ICON,
  TASK_COMPANION_SELECTED_LIST,
  TASK_COMPANION_PILL,
  TASK_COMPANION_PILL_ICON,
  TASK_COMPANION_SHOW_MORE_BUTTON,
} from "./taskDetailsStyles";
import { GoalMultiSelect } from "./GoalMultiSelect";
import { CompanionSelector } from "./CompanionSelector";
import { useAppSettings } from "../../../shared/context/AppSettingsContext";
import Avatar from "../../../shared/ui/Avatar";

interface TaskDetailsContentProps {
  task: Task;
  goals: Goal[];
  companions: Companion[];
  recurrences?: Record<string, RecurrenceRule>;
  onStatusChange?: (status: TaskStatus) => void;
  onTitleChange?: (title: string) => void;
  onTypeChange?: (type: WeeklyItemType) => void;
  onGoalsChange?: (goalIds: string[]) => void;
  onCompanionsChange?: (companionIds: string[]) => void;
  onLinksChange?: (linksMarkdown?: string) => void;
  onNotesChange?: (notesMarkdown?: string) => void;
  onLocationChange?: (location?: TaskLocation) => void;
  onScheduleChange?: (schedule: {
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }) => void;
  onRecurrenceChange?: (
    rule: Omit<
      RecurrenceRule,
      | "id"
      | "title"
      | "type"
      | "goalIds"
      | "companionIds"
      | "linksMarkdown"
      | "location"
      | "groupId"
    > | null
  ) => void;
  onDelete?: () => void;
}

// Helper to get initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TaskDetailsContent({
  task,
  goals,
  companions,
  recurrences = {},
  onStatusChange,
  onTitleChange,
  onTypeChange,
  onGoalsChange,
  onCompanionsChange,
  onLinksChange,
  onNotesChange,
  onLocationChange,
  onScheduleChange,
  onRecurrenceChange,
  onDelete,
}: TaskDetailsContentProps) {
  const settings = useAppSettings();
  // We can initialize the form with data from the task later.
  // For now, we just pass the task title if we want, or rely on internal form state.

  const type = task.type;
  const showStatusSelector = !INFORMATIONAL_TYPES.includes(type);
  const typeOptions = Object.entries(ITEM_TYPE_STYLES) as [
    WeeklyItemType,
    ItemTypeStyle
  ][];

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Goal Selection State
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(
    task.goalIds ?? []
  );
  const [showAllCompanions, setShowAllCompanions] = useState(false);

  const selectedGoals = goals.filter(g => selectedGoalIds.includes(g.id));
  const selectedCompanions = companions.filter(c => (task.companionIds ?? []).includes(c.id));

  // Recurrence rule from task (if linked)
  const currentRecurrence = task.recurrenceId ? recurrences[task.recurrenceId] : undefined;

  // Sync internal state if task changes (e.g. switching selection)
  useEffect(() => {
    setEditTitle(task.title);
    setIsEditingTitle(false);
    setSelectedGoalIds(task.goalIds ?? []);
  }, [task.id]); // Only reset on task ID change to preserve multi-selection state during updates

  const handleGoalsChange = (goalIds: string[]) => {
    setSelectedGoalIds(goalIds);
    onGoalsChange?.(goalIds);
  };

  // Focus and select all text when entering edit mode
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const saveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleChange?.(trimmed);
    } else if (!trimmed) {
      // Revert if empty
      setEditTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveTitle();
    } else if (e.key === "Escape") {
      setEditTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleCompanionsChange = (companionIds: string[]) => {
    onCompanionsChange?.(companionIds);
  };

  return (
    <div className={TASK_DETAILS_ROOT}>
      {/* Header Section */}
      <div className={TASK_DETAILS_HEADER}>
        <div className={TASK_DETAILS_HEADER_ROW}>
          {showStatusSelector && (
            <div className="mt-1">
              <StatusSelector
                status={task.status}
                onChange={(newStatus) => onStatusChange?.(newStatus)}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={handleTitleKeyDown}
                className={TASK_DETAILS_TITLE_INPUT}
                placeholder="Task title"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className={TASK_DETAILS_TITLE_DISPLAY}
              >
                {task.title}
              </h2>
            )}
          </div>
        </div>

        {/* Type Selector */}
        <div className={TASK_TYPE_SELECTOR_WRAPPER}>
          <div className={TASK_TYPE_SELECTOR_LABEL}>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Type
            </span>
            <div className={TASK_TYPE_SELECTOR_BUTTONS}>
              {typeOptions.map(([optionType, style]) => {
                const isSelected = type === optionType;
                const dynamicColor = settings.itemTypeColors[optionType];
                return (
                  <button
                    key={optionType}
                    onClick={() => {
                      if (optionType !== type) {
                        onTypeChange?.(optionType);
                      }
                    }}
                    className={`${TASK_TYPE_BUTTON_BASE} ${
                      isSelected
                        ? TASK_TYPE_BUTTON_SELECTED
                        : TASK_TYPE_BUTTON_UNSELECTED
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${dynamicColor}33`,
                            borderColor: `${dynamicColor}66`,
                            color: dynamicColor,
                            border: `1px solid ${dynamicColor}66`,
                          }
                        : undefined
                    }
                    title={style.label}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {task.groupId && (
            <div className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 w-fit text-xs border border-slate-700">
              Group ID: {task.groupId.slice(0, 8)}...
            </div>
          )}
        </div>
      </div>

      {/* Content below the header - scrolls with the sidebar/modal */}
      <div className={TASK_FORM_WRAPPER}>
        {/* Form Content */}
        <div>
          <TaskDetailsForm
            initialValues={{
              notesMarkdown: task.notesMarkdown,
              linksMarkdown: task.linksMarkdown,
              location: task.location,
              startDate: task.startDate,
              endDate: task.endDate,
              startTime: task.startTime,
              endTime: task.endTime,
              recurrenceFrequency: currentRecurrence?.frequency || "none",
              recurrenceInterval: currentRecurrence?.interval || 1,
            }}
            renderLinking={() => (
              <div className={TASK_LINKS_GRID}>
                {/* Row 1, Col 1: Goals Selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-slate-100 font-medium mb-1.5">
                    <IconTarget size={18} className="text-emerald-400" />
                    <h3>Goals</h3>
                  </div>
                  <GoalMultiSelect
                    goals={goals}
                    selectedGoalIds={selectedGoalIds}
                    onChange={handleGoalsChange}
                    showSelectedPills={false}
                  />
                </div>

                {/* Row 1, Col 2: Added Goals */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Added Goals
                  </span>
                  <div className={TASK_GOAL_PILLS_WRAP}>
                    {selectedGoals.length > 0 ? (
                      selectedGoals.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => handleGoalsChange(selectedGoalIds.filter(id => id !== g.id))}
                          className={TASK_GOAL_PILL}
                          title={`Unlink ${g.name}`}
                        >
                          <div className="relative w-5 h-5">
                            <div
                              className={TASK_GOAL_PILL_AVATAR_BORDER}
                              style={{ backgroundColor: g.color ?? "#475569" }}
                            >
                              <span className="text-[11px] leading-none">{g.emoji}</span>
                            </div>
                            <div className={TASK_GOAL_PILL_REMOVE_ICON}>
                              <IconX className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                          <span>{g.name}</span>
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-slate-600 italic">None linked</span>
                    )}
                  </div>
                </div>

                {/* Row 2, Col 1: Companions Selector */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-slate-100 font-medium mb-1.5">
                    <IconUsers size={18} className="text-orange-400" />
                    <h3>Companions</h3>
                  </div>
                  <CompanionSelector
                    companions={companions}
                    selectedIds={task.companionIds ?? []}
                    onChange={handleCompanionsChange}
                    showSelectedPills={false}
                  />
                </div>

                {/* Row 2, Col 2: Added Companions */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Added Companions
                  </span>
                  <div className={TASK_COMPANION_SELECTED_LIST}>
                    {selectedCompanions.length > 0 ? (
                      <>
                        {selectedCompanions
                          .slice(0, showAllCompanions ? undefined : 5)
                          .map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleCompanionsChange((task.companionIds ?? []).filter(id => id !== c.id))}
                              className={TASK_COMPANION_PILL}
                              title={`Remove ${c.name}`}
                            >
                              <div className="relative w-4 h-4 flex items-center justify-center">
                                <Avatar
                                  content={getInitials(c.name)}
                                  bgColor={c.color || "#64748b"}
                                  size={16}
                                  className="absolute inset-0 transition-opacity group-hover:opacity-0"
                                />
                                <div className={TASK_COMPANION_PILL_ICON}>
                                  <IconX className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <span>{c.name}</span>
                            </button>
                          ))}

                        {selectedCompanions.length > 5 && (
                          <button
                            onClick={() => setShowAllCompanions(!showAllCompanions)}
                            className={TASK_COMPANION_SHOW_MORE_BUTTON}
                          >
                            {showAllCompanions
                              ? "Show Less"
                              : `+${selectedCompanions.length - 5} more`}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-slate-600 italic">None added</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            onChange={(values) => {
              const norm = (v: string | undefined | null) => (v === "" || v == null ? undefined : v);
              
              if (norm(values.notesMarkdown) !== norm(task.notesMarkdown)) {
                onNotesChange?.(values.notesMarkdown);
              }
              if (norm(values.linksMarkdown) !== norm(task.linksMarkdown)) {
                onLinksChange?.(values.linksMarkdown);
              }
              
              // Normalize schedule values for comparison: treat "" as undefined/null
              const normSchedule = (v: string | undefined | null) => (v === "" || v == null ? null : v);

              const nextStartD = normSchedule(values.startDate);
              const nextEndD = normSchedule(values.endDate);
              const nextStartT = normSchedule(values.startTime);
              const nextEndT = normSchedule(values.endTime);

              const prevStartD = normSchedule(task.startDate);
              const prevEndD = normSchedule(task.endDate);
              const prevStartT = normSchedule(task.startTime);
              const prevEndT = normSchedule(task.endTime);

              // Schedule changes
              const scheduleChanged = 
                nextStartD !== prevStartD ||
                nextEndD !== prevEndD ||
                nextStartT !== prevStartT ||
                nextEndT !== prevEndT;
                
              if (scheduleChanged) {
                onScheduleChange?.({
                  startDate: nextStartD,
                  endDate: nextEndD,
                  startTime: nextStartT,
                  endTime: nextEndT,
                });
              }

              // Recurrence changes
              const freqChanged = values.recurrenceFrequency !== (currentRecurrence?.frequency || "none");
              const intervalChanged = values.recurrenceInterval !== (currentRecurrence?.interval || 1);

              if (freqChanged || intervalChanged) {
                if (values.recurrenceFrequency === "none") {
                  onRecurrenceChange?.(null);
                } else {
                  onRecurrenceChange?.({
                    frequency: values.recurrenceFrequency as RecurrenceFrequency,
                    interval: values.recurrenceInterval || 1,
                    startDateISO: values.startDate || new Date().toISOString().split("T")[0],
                  });
                }
              }

              // Location changes are handled via a separate callback
            }}
            onLocationChange={onLocationChange}
          />
        </div>

        {/* Delete Action */}
        {onDelete && (
          <div className={TASK_DETAILS_ACTIONS_WRAPPER}>
            <button
              type="button"
              onClick={onDelete}
              className={TASK_DETAILS_DELETE_BUTTON}
            >
              <IconTrash className="w-4 h-4" />
              Delete task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
