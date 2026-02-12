import { useState, useMemo, useRef, useCallback } from "react";
import { NotesPage, type NotesPageActions, type NoteTab, type SplitMode, type EditorPaneState, type FocusedPane } from "@/pages/NotesPage";
import { AgniShellLayout } from "@/app/layout";
import type { PageTab, TabGroup, TabContextMenuCallbacks } from "@/widgets/TopBar";
import type { EditorMode } from "@/app/shell/types";

function App() {
  const notesActionsRef = useRef<NotesPageActions | null>(null);
  const [notesShellState, setNotesShellState] = useState<{
    filePath: string;
    secondaryFilePath?: string;
    canGoBack: boolean;
    canGoForward: boolean;
    editorMode: EditorMode;
    noteTabs: NoteTab[];
    activeNoteTabIndex: number;
    splitMode: SplitMode;
    tabCount: number;
    primaryPane: EditorPaneState | null;
    secondaryPane: EditorPaneState | null;
    splitRatio: number;
  }>({
    filePath: "Notes",
    secondaryFilePath: undefined,
    canGoBack: false,
    canGoForward: false,
    editorMode: "preview",
    noteTabs: [],
    activeNoteTabIndex: -1,
    splitMode: "none",
    tabCount: 0,
    primaryPane: null,
    secondaryPane: null,
    splitRatio: 0.5,
  });

  const handleOpenFileExplorerTab = useCallback(() => {
    notesActionsRef.current?.focusExplorer();
  }, []);

  const handleFocusSearch = useCallback(() => {
    notesActionsRef.current?.focusSearch();
  }, []);

  const handleNotesShellStateChange = useCallback(
    (nextState: {
      filePath: string;
      secondaryFilePath?: string;
      canGoBack: boolean;
      canGoForward: boolean;
      editorMode: EditorMode;
      noteTabs: NoteTab[];
      activeNoteTabIndex: number;
      splitMode: SplitMode;
      tabCount: number;
      primaryPane: EditorPaneState | null;
      secondaryPane: EditorPaneState | null;
      splitRatio: number;
    }) => {
      setNotesShellState(nextState);
    },
    []
  );

  const handleNoteTabChange = useCallback((index: number) => {
    notesActionsRef.current?.selectTabIndex(index);
  }, []);

  const handleNoteTabClose = useCallback((index: number) => {
    notesActionsRef.current?.closeTabIndex(index);
  }, []);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    notesActionsRef.current?.reorderTab(fromIndex, toIndex);
  }, []);

  const handleAddTab = useCallback(() => {
    notesActionsRef.current?.addTab();
  }, []);

  const handleGroupAddTab = useCallback((groupIndex: number) => {
    const pane = groupIndex === 0 ? "primary" : "secondary";
    notesActionsRef.current?.addPaneTab(pane);
  }, []);

  const handleNotesGoBack = useCallback(() => {
    notesActionsRef.current?.goBack();
  }, []);

  const handleNotesGoForward = useCallback(() => {
    notesActionsRef.current?.goForward();
  }, []);

  // Build tab groups for split mode, or single pageTabs for normal mode
  const { pageTabs, tabGroups } = useMemo(() => {
    const isSplit = notesShellState.splitMode !== "none";

    if (isSplit && notesShellState.primaryPane && notesShellState.secondaryPane) {
      // Build tab groups from pane data
      const buildTabsFromPane = (pane: EditorPaneState): PageTab[] => {
        return pane.noteIds.map((noteId) => {
          const noteTab = notesShellState.noteTabs.find((t) => t.noteId === noteId);
          return {
            id: noteId,
            title: noteTab?.title ?? "Untitled",
            variant: "base" as const,
            closable: true,
          };
        });
      };

      const groups: TabGroup[] = [
        {
          tabs: buildTabsFromPane(notesShellState.primaryPane),
          activeIndex: notesShellState.primaryPane.activeIndex,
        },
        {
          tabs: buildTabsFromPane(notesShellState.secondaryPane),
          activeIndex: notesShellState.secondaryPane.activeIndex,
        },
      ];

      return { pageTabs: undefined, tabGroups: groups };
    }

    // Normal single-group mode
    const baseTabs: PageTab[] = notesShellState.noteTabs.map((t) => ({
      id: t.noteId,
      title: t.title,
      variant: "base" as const,
      closable: true,
    }));

    return {
      pageTabs: baseTabs.length > 0 ? baseTabs : undefined,
      tabGroups: undefined,
    };
  }, [notesShellState.splitMode, notesShellState.primaryPane, notesShellState.secondaryPane, notesShellState.noteTabs]);

  // Handlers for grouped tab operations (split mode)
  const handleGroupTabChange = useCallback((groupIndex: number, tabIndex: number) => {
    const pane: FocusedPane = groupIndex === 0 ? "primary" : "secondary";
    notesActionsRef.current?.selectPaneTabIndex(pane, tabIndex);
  }, []);

  const handleGroupTabClose = useCallback((groupIndex: number, tabIndex: number) => {
    const pane: FocusedPane = groupIndex === 0 ? "primary" : "secondary";
    notesActionsRef.current?.closePaneTabIndex(pane, tabIndex);
  }, []);

  const handleTabMove = useCallback(
    (fromGroup: number, fromIndex: number, toGroup: number, toIndex: number) => {
      const fromPane: FocusedPane = fromGroup === 0 ? "primary" : "secondary";
      const toPane: FocusedPane = toGroup === 0 ? "primary" : "secondary";
      notesActionsRef.current?.movePaneTab(fromPane, fromIndex, toPane, toIndex);
    },
    []
  );

  // Tab context menu callbacks
  const tabContextMenu = useMemo<TabContextMenuCallbacks | undefined>(() => {
    return {
      onSplitBelow: (tabId) => notesActionsRef.current?.splitBelowWithNote(tabId),
      onSplitRight: (tabId) => notesActionsRef.current?.splitRightWithNote(tabId),
      onCloseSplit: () => notesActionsRef.current?.closeSplit(),
      onCopyPath: (tabId) => notesActionsRef.current?.copyNotePath(tabId),
      onCopyFile: (tabId) => notesActionsRef.current?.copyNote(tabId),
      onRename: (tabId) => notesActionsRef.current?.renameNote(tabId),
      onDelete: (tabId) => notesActionsRef.current?.deleteNote(tabId),
    };
  }, []);

  return (
    <AgniShellLayout
      onOpenFileExplorerTab={handleOpenFileExplorerTab}
      onFocusSearch={handleFocusSearch}
      sidebarContent={<div id="agni-shell-sidebar-slot" className="h-full" />}
      canGoBack={notesShellState.canGoBack}
      canGoForward={notesShellState.canGoForward}
      onGoBack={handleNotesGoBack}
      onGoForward={handleNotesGoForward}
      pageTabs={pageTabs}
      activePageTabIndex={notesShellState.activeNoteTabIndex}
      onPageTabChange={handleNoteTabChange}
      onPageTabClose={handleNoteTabClose}
      onTabReorder={handleTabReorder}
      onAddTab={handleAddTab}
      tabGroups={tabGroups}
      onGroupTabChange={handleGroupTabChange}
      onGroupTabClose={handleGroupTabClose}
      onTabMove={handleTabMove}
      onGroupAddTab={handleGroupAddTab}
      splitRatio={notesShellState.splitRatio}
      tabContextMenu={tabContextMenu}
    >
      <NotesPage
        actionsRef={notesActionsRef}
        onShellStateChange={handleNotesShellStateChange}
      />
    </AgniShellLayout>
  );
}

export default App;
