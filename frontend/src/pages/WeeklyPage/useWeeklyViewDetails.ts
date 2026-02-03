import { useEffect, useState } from "react";

type DetailsMode = "side-panel" | null;

interface UseWeeklyViewDetailsArgs {
  openTaskId?: string | null;
  onOpenTaskHandled?: () => void;
}

export function useWeeklyViewDetails({
  openTaskId,
  onOpenTaskHandled,
}: UseWeeklyViewDetailsArgs) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailsMode, setDetailsMode] = useState<DetailsMode>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null
  );

  const openSidePanel = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailsMode("side-panel");
  };

  const closeDetails = () => {
    setDetailsMode(null);
    setSelectedTaskId(null);
    setHighlightedTaskId(null);
  };

  useEffect(() => {
    if (!openTaskId) return;
    setSelectedTaskId(openTaskId);
    setDetailsMode("side-panel");
    setHighlightedTaskId(openTaskId);
    const selector = `[data-task-id="${openTaskId}"]`;
    const taskNode = document.querySelector<HTMLElement>(selector);
    if (taskNode) {
      taskNode.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onOpenTaskHandled?.();
  }, [openTaskId, onOpenTaskHandled]);

  return {
    selectedTaskId,
    detailsMode,
    highlightedTaskId,
    openSidePanel,
    closeDetails,
    setHighlightedTaskId,
  };
}


