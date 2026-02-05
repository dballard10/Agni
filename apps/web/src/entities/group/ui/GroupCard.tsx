import { useState, useRef, useEffect } from "react";
import { IconPlus } from "@tabler/icons-react";
import type {
  Task,
  Group,
  Goal,
  Companion,
  TaskStatus,
} from "../../../shared/types/weekly";
import TaskCard from "../../task/ui/TaskCard";

interface GroupCardProps {
  group: Group;
  tasks: Task[];
  goals?: Goal[];
  companions?: Companion[];
  onAddTask: (groupId: string, title: string) => void;
  onUpdateTitle: (groupId: string, title: string) => void;
  onDeleteGroup: (groupId: string) => void;
  // Pass-through props for tasks
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onUpdateTaskTitle: (id: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  onCopyTask?: (id: string) => void;
  onOpenDetailsSidePanel?: (taskId: string) => void;
  highlightTaskId?: string | null;
}

export default function GroupCard({
  group,
  tasks,
  goals = [],
  companions = [],
  onAddTask,
  onUpdateTitle,
  onDeleteGroup,
  onUpdateTaskStatus,
  onUpdateTaskTitle,
  onDeleteTask,
  onCopyTask,
  onOpenDetailsSidePanel,
  highlightTaskId,
}: GroupCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(group.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    if (title.trim() && title !== group.title) {
      onUpdateTitle(group.id, title.trim());
    } else {
      setTitle(group.title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSubmit();
    if (e.key === "Escape") {
      setTitle(group.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="group border border-slate-800 rounded-md bg-slate-900/20 p-2 mb-2">
      {/* Group Header */}
      <div className="flex mt-1 items-center gap-2 pb-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          {isCollapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          )}
        </button>

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={handleKeyDown}
            className="bg-slate-800 text-slate-200 px-1 py-0.5 rounded text-sm font-semibold border border-slate-600 focus:outline-none focus:border-slate-400"
          />
        ) : (
          <h4
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-semibold text-slate-300 cursor-pointer hover:text-slate-100"
          >
            {group.title}
          </h4>
        )}

        <div className="ml-auto flex items-center gap-1">
          {/* Add Task Button for Group */}
          <button
            type="button"
            onClick={() => onAddTask(group.id, "New task...")}
            className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-200 rounded pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
            aria-label="Add task to group"
          >
            <IconPlus className="w-3.5 h-3.5" />
          </button>

          {/* Delete Group Button (optional, could be in a menu) */}
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this group and its tasks?")) {
                onDeleteGroup(group.id);
              }
            }}
            className="opacity-0 group-hover:opacity-90 group-focus-within:opacity-90 transition-opacity p-0.5 text-slate-500 hover:text-red-400 rounded pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto"
            aria-label="Delete group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M4 7l16 0"></path>
              <path d="M10 11l0 6"></path>
              <path d="M14 11l0 6"></path>
              <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
              <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Group Tasks */}
      {!isCollapsed && (
        <div className="pl-4 border-l-2 border-slate-800 space-y-2 ml-2">
          {tasks.map((task) => (
            <div key={task.id}>
              <TaskCard
                task={task}
                goals={goals}
                companions={companions}
                isHighlighted={task.id === highlightTaskId}
                onStatusChange={onUpdateTaskStatus}
                onTitleChange={onUpdateTaskTitle}
                onDelete={onDeleteTask}
                onCopy={onCopyTask}
                onOpenDetailsSidePanel={onOpenDetailsSidePanel}
              />
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-xs text-slate-500 italic py-1">
              No tasks in this group
            </div>
          )}
        </div>
      )}
    </div>
  );
}
