import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ShellState, ShellActions, PageId, EditorMode } from "./types";
import { DEFAULT_SHELL_STATE } from "./types";

interface ShellContextValue {
  state: ShellState;
  actions: ShellActions;
}

const ShellContext = createContext<ShellContextValue | null>(null);

interface ShellProviderProps {
  children: React.ReactNode;
  initialPage?: PageId;
  onPageChange?: (page: PageId) => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
}

export function ShellProvider({
  children,
  initialPage = "notes",
  onPageChange,
  onGoBack,
  onGoForward,
}: ShellProviderProps) {
  const [state, setState] = useState<ShellState>(() => ({
    ...DEFAULT_SHELL_STATE,
    currentPage: initialPage,
  }));

  const setCurrentPage = useCallback(
    (page: PageId) => {
      setState((prev) => ({ ...prev, currentPage: page }));
      onPageChange?.(page);
    },
    [onPageChange]
  );

  const toggleLeftPanel = useCallback(() => {
    setState((prev) => ({ ...prev, leftPanelOpen: !prev.leftPanelOpen }));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setState((prev) => ({ ...prev, rightPanelOpen: !prev.rightPanelOpen }));
  }, []);

  const setLeftPanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, leftPanelOpen: open }));
  }, []);

  const setRightPanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, rightPanelOpen: open }));
  }, []);

  const setEditorMode = useCallback((mode: EditorMode) => {
    setState((prev) => ({ ...prev, editorMode: mode }));
  }, []);

  const toggleEditorMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      editorMode: prev.editorMode === "preview" ? "edit" : "preview",
    }));
  }, []);

  const setPageTab = useCallback((page: PageId, tabIndex: number) => {
    setState((prev) => ({
      ...prev,
      pageTabs: {
        ...prev.pageTabs,
        [page]: { activeTabIndex: tabIndex },
      },
    }));
  }, []);

  const setFilePath = useCallback((path: string) => {
    setState((prev) => ({ ...prev, filePath: path }));
  }, []);

  const goBack = useCallback(() => {
    onGoBack?.();
  }, [onGoBack]);

  const goForward = useCallback(() => {
    onGoForward?.();
  }, [onGoForward]);

  const actions: ShellActions = useMemo(
    () => ({
      setCurrentPage,
      toggleLeftPanel,
      toggleRightPanel,
      setLeftPanelOpen,
      setRightPanelOpen,
      setEditorMode,
      toggleEditorMode,
      setPageTab,
      setFilePath,
      goBack,
      goForward,
    }),
    [
      setCurrentPage,
      toggleLeftPanel,
      toggleRightPanel,
      setLeftPanelOpen,
      setRightPanelOpen,
      setEditorMode,
      toggleEditorMode,
      setPageTab,
      setFilePath,
      goBack,
      goForward,
    ]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return (
    <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within a ShellProvider");
  }
  return context;
}

export function useShellState(): ShellState {
  return useShell().state;
}

export function useShellActions(): ShellActions {
  return useShell().actions;
}
