import { createPortal } from "react-dom";
import { IconX, IconCheck } from "@tabler/icons-react";
import TaskDetailsContent from "./TaskDetailsContent";
import type {
  Task,
  Goal,
  Companion,
  RecurrenceRule,
  TaskStatus,
  WeeklyItemType,
  TaskLocation,
} from "../../../shared/types/weekly";

interface TaskDetailsModalProps {
  isOpen: boolean;
  task: Task;
  goals: Goal[];
  companions: Companion[];
  recurrences?: Record<string, RecurrenceRule>;
  isDirty: boolean;
  onClose: () => void;
  onSave: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onTitleChange: (title: string) => void;
  onTypeChange: (type: WeeklyItemType) => void;
  onGoalsChange: (goalIds: string[]) => void;
  onCompanionsChange: (companionIds: string[]) => void;
  onLinksChange: (links?: string) => void;
  onNotesChange: (notes?: string) => void;
  onLocationChange: (location?: TaskLocation) => void;
  onScheduleChange: (schedule: {
    startDate?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }) => void;
  onRecurrenceChange: (
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
  onDelete: () => void;
}

export function TaskDetailsModal({
  isOpen,
  task,
  goals,
  companions,
  recurrences,
  isDirty,
  onClose,
  onSave,
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
}: TaskDetailsModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 flex-shrink-0">
          <h3 className="font-semibold text-slate-100">Task Details</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isDirty ? onSave : undefined}
              disabled={!isDirty}
              className={`p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
                isDirty
                  ? "text-indigo-400 hover:text-indigo-300 hover:bg-slate-800"
                  : "text-slate-500 opacity-40 cursor-default"
              }`}
              title={isDirty ? "Save changes" : "No pending changes"}
              aria-label="Save changes"
            >
              <IconCheck size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
              aria-label="Close"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <TaskDetailsContent
            task={task}
            goals={goals}
            companions={companions}
            recurrences={recurrences}
            onStatusChange={onStatusChange}
            onTitleChange={onTitleChange}
            onTypeChange={onTypeChange}
            onGoalsChange={onGoalsChange}
            onCompanionsChange={onCompanionsChange}
            onLinksChange={onLinksChange}
            onNotesChange={onNotesChange}
            onLocationChange={onLocationChange}
            onScheduleChange={onScheduleChange}
            onRecurrenceChange={onRecurrenceChange}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
