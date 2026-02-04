// Shell state types for the Agni Shell UI

export type PageId = "notes" | "weekly" | "calendar" | "goals" | "companions" | "settings";

export type EditorMode = "preview" | "edit";

export interface PageTabState {
  activeTabIndex: number; // 0-4 for Tab 1-5
}

export interface ShellState {
  currentPage: PageId;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  editorMode: EditorMode;
  pageTabs: Record<PageId, PageTabState>;
  filePath: string; // Current file path displayed in main content header
}

export interface ShellActions {
  setCurrentPage: (page: PageId) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setEditorMode: (mode: EditorMode) => void;
  toggleEditorMode: () => void;
  setPageTab: (page: PageId, tabIndex: number) => void;
  setFilePath: (path: string) => void;
  goBack: () => void;
  goForward: () => void;
}

export const DEFAULT_PAGE_TAB_STATE: PageTabState = {
  activeTabIndex: 0,
};

export const DEFAULT_SHELL_STATE: ShellState = {
  currentPage: "notes",
  leftPanelOpen: true,
  rightPanelOpen: false,
  editorMode: "preview",
  pageTabs: {
    notes: { ...DEFAULT_PAGE_TAB_STATE },
    weekly: { ...DEFAULT_PAGE_TAB_STATE },
    calendar: { ...DEFAULT_PAGE_TAB_STATE },
    goals: { ...DEFAULT_PAGE_TAB_STATE },
    companions: { ...DEFAULT_PAGE_TAB_STATE },
    settings: { ...DEFAULT_PAGE_TAB_STATE },
  },
  filePath: "File/Path/...",
};

// Page metadata for navigation
export interface PageMeta {
  id: PageId;
  label: string;
  icon: string; // Tabler icon name
}

export const PAGE_META: PageMeta[] = [
  { id: "notes", label: "Notes", icon: "folder" },
  { id: "weekly", label: "Weekly Todo", icon: "list-check" },
  { id: "calendar", label: "Calendar", icon: "calendar-week" },
  { id: "goals", label: "Goals", icon: "target-arrow" },
  { id: "companions", label: "Companions", icon: "users" },
];
