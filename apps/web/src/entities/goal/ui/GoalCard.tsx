import React, { useEffect, useRef, useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import type { Goal } from "../../../shared/types/weekly";
import {
  GOAL_CARD_EMOJI_WRAPPER,
  GOAL_CARD_HEADER,
  getGoalBackgroundClass,
} from "../model/goalStyles";
import {
  TASK_CARD_BODY,
  TASK_CARD_CONTAINER,
  TASK_CARD_TITLE_INPUT,
  TASK_CARD_TITLE_WRAPPER,
  TASK_DELETE_BUTTON,
  getTaskCardStyleClass,
} from "../../task/ui/taskCardStyles";

export interface GoalCardProps {
  goal: Goal & {
    stats: { completionRate: number; completed: number; total: number };
  };
  onUpdate: (id: string, name: string, emoji: string) => void;
  onDelete: (id: string) => void;
  isEditing: boolean;
  setEditingId: (id: string | null) => void;
  onSelect?: () => void;
}

function formatDueDateLabel(dueDate?: string) {
  if (!dueDate) return null;
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dueDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function GoalCard({
  goal,
  onUpdate,
  onDelete,
  isEditing,
  setEditingId,
  onSelect,
}: GoalCardProps) {
  const [editName, setEditName] = useState(goal.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardBackgroundClass = getGoalBackgroundClass(goal.color);
  const cardStyleClass = getTaskCardStyleClass({
    backgroundClass: cardBackgroundClass,
    textClass: "text-text-secondary",
    isClickable: Boolean(onSelect),
  });

  const handleSaveTitle = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== goal.name) {
      onUpdate(goal.id, trimmed, goal.emoji ?? "🎯");
    } else if (!trimmed) {
      setEditName(goal.name);
    }
    setEditingId(null);
  };

  const handleCancelTitleEdit = () => {
    setEditName(goal.name);
    setEditingId(null);
  };

  useEffect(() => {
    if (!isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with prop
      setEditName(goal.name);
    }
  }, [goal.name, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`${TASK_CARD_CONTAINER} ${cardStyleClass}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className={TASK_CARD_BODY}>
        <div className="flex-1 space-y-4">
          <div className={GOAL_CARD_HEADER}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={GOAL_CARD_EMOJI_WRAPPER}>{goal.emoji}</div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className={TASK_CARD_TITLE_WRAPPER}>
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className={TASK_CARD_TITLE_INPUT}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSaveTitle();
                          } else if (event.key === "Escape") {
                            handleCancelTitleEdit();
                          }
                          event.stopPropagation();
                        }}
                      />
                    ) : (
                      <h3
                        className="font-medium text-text-secondary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-1 rounded transform transition-transform duration-200 hover:scale-105 -translate-x-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditName(goal.name);
                          setEditingId(goal.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            setEditName(goal.name);
                            setEditingId(goal.id);
                          }
                        }}
                        tabIndex={0}
                      >
                        {goal.name}
                      </h3>
                    )}
                  </div>
                  {goal.dueDate && (
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">
                      Target date: {formatDueDateLabel(goal.dueDate)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {goal.stats.total} linked tasks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {onDelete && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            if (confirm("Delete this goal?")) {
              onDelete(goal.id);
            }
          }}
          className={TASK_DELETE_BUTTON}
          aria-label="Delete goal"
        >
          <IconTrash className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default GoalCard;
