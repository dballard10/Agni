import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  Task,
  TaskStatus,
  Group,
  Goal,
  Companion,
} from "../../../shared/types/weekly";
import DayCardHeader from "./DayCardHeader";
import TaskCard from "../../task/ui/TaskCard";
import AddButton from "./AddButton";
import DayCardSettings, {
  type TaskFilter,
  type DaySortMode,
} from "../../../features/weekly/day-settings/DayCardSettings";
import GroupCard from "../../group/ui/GroupCard";
import { ITEM_TYPE_PRIORITIES } from "../../task/model/itemTypeConfig";

// Status priority: completed first, then cancelled, failed, moved, open last
const STATUS_RANK: Record<TaskStatus, number> = {
  completed: 0,
  cancelled: 1,
  failed: 2,
  moved: 3,
  open: 4,
};

interface DayCardProps {
  dayIndex: number;
  date: Date;
  tasks: Task[];
  groups?: Group[];
  goals?: Goal[];
  companions?: Companion[];
  onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
  onUpdateTaskTitle: (id: string, title: string) => void;
  onAddTask: (dayIndex: number, title: string) => void;
  onAddGroup: (dayIndex: number) => void;
  onAddTaskToGroup: (dayIndex: number, groupId: string, title: string) => void;
  onDeleteTask: (id: string) => void;
  onCopyTask?: (id: string) => void;
  onUpdateGroupTitle: (groupId: string, title: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onOpenDetailsSidePanel?: (taskId: string) => void;
  highlightTaskId?: string | null;
  // Day clipboard actions
  onCopyDay: (dayIndex: number) => void;
  onPasteDay: (dayIndex: number) => void;
  canPaste: boolean;
  onDeleteAllForDay: (dayIndex: number) => void;
  onMoveTask: (taskId: string, targetDayIndex: number, targetPosition: number) => void;
}

export default function DayCard({
  dayIndex,
  date,
  tasks,
  groups = [],
  goals = [],
  companions = [],
  onUpdateTaskStatus,
  onUpdateTaskTitle,
  onAddTask,
  onAddGroup,
  onAddTaskToGroup,
  onDeleteTask,
  onCopyTask,
  onUpdateGroupTitle,
  onDeleteGroup,
  onOpenDetailsSidePanel,
  highlightTaskId,
  onCopyDay,
  onPasteDay,
  canPaste,
  onDeleteAllForDay,
  onMoveTask,
}: DayCardProps) {
  // Collapse if no root tasks AND no groups
  const isEmpty = tasks.length === 0 && groups.length === 0;
  const [isCollapsed, setIsCollapsed] = useState(isEmpty);

  // Drag and drop target state
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const rootTasksContainerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("application/weekly-task-dnd")) return;
    e.preventDefault();
    e.stopPropagation();

    if (!rootTasksContainerRef.current) return;

    const containerRect = rootTasksContainerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - containerRect.top;

    // Find the index to drop at based on Y position of children
    const children = Array.from(rootTasksContainerRef.current.children) as HTMLElement[];
    let foundIndex = rootTasks.length;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childRect = child.getBoundingClientRect();
      const childCenterY = childRect.top + childRect.height / 2 - containerRect.top;

      if (relativeY < childCenterY) {
        foundIndex = i;
        break;
      }
    }

    setDropIndex(foundIndex);
  };

  const handleDragLeave = () => {
    setDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    const data = e.dataTransfer.getData("application/weekly-task-dnd");
    if (!data) return;

    try {
      const { taskId } = JSON.parse(data);
      const targetPos = dropIndex ?? rootTasks.length;
      onMoveTask(taskId, dayIndex, targetPos);
    } catch (err) {
      console.error("Failed to parse task drop data", err);
    }

    setDropIndex(null);
  };

  // Per-day filter state
  const [taskFilters, setTaskFilters] = useState<TaskFilter>([]);

  // Per-day sort state
  const [sortMode, setSortMode] = useState<DaySortMode>("position");

  // Task comparator based on current sort mode
  const compareTasksBy = useCallback(
    (a: Task, b: Task): number => {
      let result = 0;

      switch (sortMode) {
        case "type": {
          const rankA = ITEM_TYPE_PRIORITIES.indexOf(a.type);
          const rankB = ITEM_TYPE_PRIORITIES.indexOf(b.type);
          result = rankA - rankB;
          break;
        }
        case "status": {
          result = STATUS_RANK[a.status] - STATUS_RANK[b.status];
          break;
        }
        case "position":
        default:
          result = a.position - b.position;
          break;
      }

      // Tie-breakers: position -> createdAt -> title -> id
      if (result === 0) result = a.position - b.position;
      if (result === 0) {
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (result === 0) {
        result = a.title
          .trim()
          .toLocaleLowerCase()
          .localeCompare(b.title.trim().toLocaleLowerCase());
      }
      if (result === 0) result = a.id.localeCompare(b.id);

      return result;
    },
    [sortMode]
  );

  // Automatically expand when content is added
  useEffect(() => {
    if (!isEmpty) {
      setIsCollapsed(false);
    }
  }, [isEmpty]);

  // Apply task filter before splitting into root/group tasks
  const visibleTasks = useMemo(
    () =>
      taskFilters.length === 0
        ? tasks
        : tasks.filter((t) => taskFilters.includes(t.status)),
    [tasks, taskFilters]
  );

  // Separate root tasks from group tasks and apply sorting
  const rootTasks = useMemo(
    () =>
      visibleTasks
        .filter((t) => !t.groupId)
        .sort(compareTasksBy),
    [visibleTasks, compareTasksBy]
  );
  const tasksByGroupId = useMemo(() => {
    const map = new Map<string, Task[]>();
    visibleTasks.forEach((task) => {
      if (!task.groupId) return;
      const list = map.get(task.groupId) ?? [];
      list.push(task);
      map.set(task.groupId, list);
    });
    map.forEach((list, key) =>
      map.set(key, [...list].sort(compareTasksBy))
    );
    return map;
  }, [visibleTasks, compareTasksBy]);

  return (
    <div className="flex flex-col bg-slate-1000 rounded-lg border border-slate-700 max-w-5xl transition-all duration-300 ease-in-out">
      <div
        className={`grid grid-cols-3 items-center gap-2 p-2 bg-slate-800 border-slate-700 z-10 relative ${
          isCollapsed ? "rounded-lg" : "rounded-t-lg border-b-2 border-slate-700/80"
        }`}
      >
        <div className="flex justify-start">
          <DayCardSettings
            taskFilters={taskFilters}
            onTaskFiltersChange={setTaskFilters}
            sortMode={sortMode}
            onSortModeChange={setSortMode}
            isCollapsed={isCollapsed}
            onToggleCollapsed={() => setIsCollapsed(!isCollapsed)}
            onCopyDay={() => onCopyDay(dayIndex)}
            onPasteDay={() => onPasteDay(dayIndex)}
            canPaste={canPaste}
            onDeleteAll={() => onDeleteAllForDay(dayIndex)}
          />
        </div>
        <div className="flex justify-center">
          <DayCardHeader
            dayIndex={dayIndex}
            date={date}
            onClick={() => setIsCollapsed(!isCollapsed)}
            isCollapsed={isCollapsed}
          />
        </div>
        <div className="flex justify-end">
          <AddButton
            onAddTaskClick={() => onAddTask(dayIndex, "New task...")}
            onAddGroupClick={() => onAddGroup(dayIndex)}
          />
        </div>
      </div>
      <motion.div
        ref={rootTasksContainerRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`space-y-2 overflow-y-auto transition-all duration-300 ease-in-out min-h-[20px] ${
          isCollapsed
            ? "max-h-0 opacity-0 p-0 overflow-hidden"
            : "max-h-[600px] opacity-100 p-2"
        }`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {/* Render Groups First (or interleaved based on position if supported later) */}
          {groups.map((group) => {
            const groupTasks = tasksByGroupId.get(group.id) ?? [];
            return (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <GroupCard
                  group={group}
                  tasks={groupTasks}
                  goals={goals}
                  companions={companions}
                  highlightTaskId={highlightTaskId}
                  onAddTask={(gid: string, title: string) =>
                    onAddTaskToGroup(dayIndex, gid, title)
                  }
                  onUpdateTitle={onUpdateGroupTitle}
                  onDeleteGroup={onDeleteGroup}
                  onUpdateTaskStatus={onUpdateTaskStatus}
                  onUpdateTaskTitle={onUpdateTaskTitle}
                  onDeleteTask={onDeleteTask}
                  onOpenDetailsSidePanel={onOpenDetailsSidePanel}
                />
              </motion.div>
            );
          })}

          {/* Render Root Tasks */}
          {rootTasks.map((task, idx) => (
            <div key={task.id}>
              {dropIndex === idx && (
                <div className="h-1 bg-indigo-500 rounded-full my-1 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
              )}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
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
              </motion.div>
            </div>
          ))}
          {dropIndex === rootTasks.length && (
            <div className="h-1 bg-indigo-500 rounded-full my-1 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
