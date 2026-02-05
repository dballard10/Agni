import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  IconFolder,
  IconChevronDown,
  IconChevronRight,
  IconFileText,
  IconFilePencil,
  IconFolderOpen,
  IconFile,
  IconPencil,
  IconTrash,
  IconFolderPlus,
  IconSearch,
  IconFilePlus,
} from "@tabler/icons-react";
import type { Note } from "../../../mock/mockNotes";
import { useAnchoredMenu } from "../../../shared/hooks/useAnchoredMenu";
import { searchNotes, type NoteSearchResult, type MatchPreview } from "../search/notesSearch";

interface NotesDrawerProps {
  notes: Note[];
  folders?: string[];
  selectedNoteId: string | null;
  onOpenNote: (noteId: string) => void;
  onRenameNote: (noteId: string, nextTitle: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderPath: string, nextFolderName: string) => void;
  onDeleteFolder: (folderPath: string) => void;
  onCreateNoteInFolder: (folderPath: string) => void;
  onCreateFolderInFolder: (folderPath: string) => void;
  onCreateNote?: () => void;
  onCreateFolder?: () => void;
  onMoveNote?: (noteId: string, targetFolderPath: string | null) => void;
  onMoveFolder?: (folderPath: string, targetFolderPath: string | null) => void;
  autoExpandAll?: boolean;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onOpenSearchResult?: (
    noteId: string,
    firstMatchRange: { from: number; to: number } | null
  ) => void;
  sidebarTab: "explorer" | "search";
  onSidebarTabChange: (tab: "explorer" | "search") => void;
}

interface TreeFolder {
  type: "folder";
  name: string;
  path: string;
  children: (TreeFolder | TreeNote)[];
}

interface TreeNote {
  type: "note";
  id: string;
  name: string;
  path: string;
  note: Note;
}

type TreeNode = TreeFolder | TreeNote;

interface BuildTreeInput {
  notes: Note[];
  folders: string[];
}

interface MenuState {
  nodeType: "folder" | "note";
  nodeId: string; // noteId for notes, folderPath for folders
  nodeName: string;
  isExpanded?: boolean; // For folders only
}

function buildTree({ notes, folders }: BuildTreeInput): TreeNode[] {
  const root: TreeNode[] = [];

  // Helper to ensure a folder path exists in the tree
  const ensureFolderPath = (folderPath: string) => {
    const parts = folderPath.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let folder = currentLevel.find(
        (node): node is TreeFolder =>
          node.type === "folder" && node.name === part
      );

      if (!folder) {
        folder = {
          type: "folder",
          name: part,
          path: currentPath,
          children: [],
        };
        currentLevel.push(folder);
      }
      currentLevel = folder.children;
    });
  };

  // First, insert explicit folder paths (so empty folders appear)
  folders.forEach((folderPath) => {
    ensureFolderPath(folderPath);
  });

  // Then, insert notes (creating any intermediate folders as needed)
  notes.forEach((note) => {
    const parts = note.path.split("/");
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      if (isLast) {
        currentLevel.push({
          type: "note",
          id: note.id,
          name: note.title,
          path: currentPath,
          note,
        });
      } else {
        let folder = currentLevel.find(
          (node): node is TreeFolder =>
            node.type === "folder" && node.name === part
        );

        if (!folder) {
          folder = {
            type: "folder",
            name: part,
            path: currentPath,
            children: [],
          };
          currentLevel.push(folder);
        }
        currentLevel = folder.children;
      }
    });
  });

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.type === "folder") {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(root);
  return root;
}

const INITIAL_MATCH_LIMIT = 3;

export function NotesDrawer({
  notes,
  folders = [],
  selectedNoteId,
  onOpenNote,
  onRenameNote,
  onDeleteNote,
  onRenameFolder,
  onDeleteFolder,
  onCreateNoteInFolder,
  onCreateFolderInFolder,
  onCreateNote,
  onCreateFolder,
  onMoveNote,
  onMoveFolder,
  autoExpandAll = false,
  searchInputRef,
  onOpenSearchResult,
  sidebarTab,
  onSidebarTabChange,
}: NotesDrawerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const [searchExpandedById, setSearchExpandedById] = useState<Record<string, boolean>>({});
  const [searchShowAllById, setSearchShowAllById] = useState<Record<string, boolean>>({});
  const searchListRef = useRef<HTMLDivElement>(null);

  // Drag and drop state
  const [dragOverPath, setDragOverPath] = useState<string | null>(null); // "root" or a folder path

  // Menu state
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  // Inline rename state
  const [editing, setEditing] = useState<{
    nodeType: "folder" | "note";
    nodeId: string;
  } | null>(null);
  const [draftName, setDraftName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const { isOpen, position, open, close } = useAnchoredMenu({
    resolveAnchor: () => anchorRef.current,
    menuWidth: 170,
  });

  const tree = useMemo(() => buildTree({ notes, folders }), [notes, folders]);

  // Compute search results
  const searchResults = useMemo(
    () => searchNotes(notes, searchQuery),
    [notes, searchQuery]
  );

  // Reset search active index and expanded state when search results change
  useEffect(() => {
    setSearchActiveIndex(0);
    setSearchExpandedById({});
    setSearchShowAllById({});
  }, [searchResults]);

  // Scroll active search result into view
  useEffect(() => {
    if (searchListRef.current && searchResults.length > 0 && searchQuery.trim() !== "") {
      const activeEl = searchListRef.current.querySelector(
        `[data-search-result-index="${searchActiveIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [searchActiveIndex, searchResults.length, searchQuery]);

  // Auto-expand folders on search or initial select
  useEffect(() => {
    if (autoExpandAll) {
      const foldersToExpand = new Set<string>();
      const addFolders = (nodes: TreeNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "folder") {
            foldersToExpand.add(node.path);
            addFolders(node.children);
          }
        });
      };
      addFolders(tree);
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        foldersToExpand.forEach((f) => next.add(f));
        return next;
      });
    }
  }, [autoExpandAll, tree]);

  useEffect(() => {
    if (selectedNoteId) {
      const selectedNote = notes.find((n) => n.id === selectedNoteId);
      if (selectedNote) {
        const parts = selectedNote.path.split("/");
        if (parts.length > 1) {
          const foldersToExpand = new Set<string>();
          let currentPath = "";
          for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
            foldersToExpand.add(currentPath);
          }
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            foldersToExpand.forEach((f) => next.add(f));
            return next;
          });
        }
      }
    }
  }, [selectedNoteId, notes]);

  // Close menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        close();
        setMenuState(null);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [close, isOpen]);

  // Handle focus and caret position when entering edit mode
  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      // Place caret at the end
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleOpenMenu = useCallback(
    (
      e: React.MouseEvent<HTMLButtonElement>,
      nodeType: "folder" | "note",
      nodeId: string,
      nodeName: string,
      isExpanded?: boolean
    ) => {
      anchorRef.current = e.currentTarget;
      setMenuState({ nodeType, nodeId, nodeName, isExpanded });
      open();
    },
    [open]
  );

  const handleCloseMenu = useCallback(() => {
    close();
    setMenuState(null);
  }, [close]);

  const cancelRename = useCallback(() => {
    setEditing(null);
    setDraftName("");
  }, []);

  const commitRename = useCallback(() => {
    if (!editing) return;

    const trimmed = draftName.trim();
    if (!trimmed || trimmed.includes("/")) {
      cancelRename();
      return;
    }

    if (editing.nodeType === "note") {
      onRenameNote(editing.nodeId, trimmed);
    } else {
      // If folder path changes, we need to update expandedFolders to keep expansion state
      const oldPath = editing.nodeId;
      const parts = oldPath.split("/");
      parts[parts.length - 1] = trimmed;
      const newPath = parts.join("/");

      if (newPath !== oldPath) {
        setExpandedFolders((prev) => {
          const next = new Set(prev);
          const toUpdate: { old: string; new: string }[] = [];

          prev.forEach((p) => {
            if (p === oldPath || p.startsWith(oldPath + "/")) {
              toUpdate.push({
                old: p,
                new: newPath + p.slice(oldPath.length),
              });
            }
          });

          toUpdate.forEach((u) => {
            next.delete(u.old);
            next.add(u.new);
          });

          return next;
        });
      }

      onRenameFolder(oldPath, trimmed);
    }

    setEditing(null);
    setDraftName("");
  }, [editing, draftName, onRenameNote, onRenameFolder, cancelRename]);

  // Menu action handlers
  const handleMenuExpandCollapse = useCallback(() => {
    if (menuState?.nodeType === "folder") {
      toggleFolder(menuState.nodeId);
    }
    handleCloseMenu();
  }, [menuState, toggleFolder, handleCloseMenu]);

  const handleMenuOpen = useCallback(() => {
    if (menuState?.nodeType === "note") {
      onOpenNote(menuState.nodeId);
    }
    handleCloseMenu();
  }, [menuState, onOpenNote, handleCloseMenu]);

  const handleMenuRename = useCallback(() => {
    if (!menuState) return;

    setEditing({
      nodeType: menuState.nodeType,
      nodeId: menuState.nodeId,
    });
    setDraftName(menuState.nodeName);
    handleCloseMenu();
  }, [menuState, handleCloseMenu]);

  const handleMenuDelete = useCallback(() => {
    if (!menuState) return;

    if (menuState.nodeType === "note") {
      onDeleteNote(menuState.nodeId);
    } else {
      onDeleteFolder(menuState.nodeId);
    }
    handleCloseMenu();
  }, [menuState, onDeleteNote, onDeleteFolder, handleCloseMenu]);

  const handleMenuCreateNote = useCallback(() => {
    if (menuState?.nodeType === "folder") {
      if (!menuState.isExpanded) {
        toggleFolder(menuState.nodeId);
      }
      onCreateNoteInFolder(menuState.nodeId);
    }
    handleCloseMenu();
  }, [menuState, onCreateNoteInFolder, toggleFolder, handleCloseMenu]);

  const handleMenuCreateFolder = useCallback(() => {
    if (menuState?.nodeType === "folder") {
      if (!menuState.isExpanded) {
        toggleFolder(menuState.nodeId);
      }
      onCreateFolderInFolder(menuState.nodeId);
    }
    handleCloseMenu();
  }, [menuState, onCreateFolderInFolder, toggleFolder, handleCloseMenu]);

  // Search keyboard handlers
  const toggleSearchExpanded = useCallback((noteId: string) => {
    setSearchExpandedById((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  }, []);

  const toggleSearchShowAll = useCallback((noteId: string) => {
    setSearchShowAllById((prev) => ({ ...prev, [noteId]: true }));
  }, []);

  const openSearchMatchLine = useCallback(
    (noteId: string, range: { from: number; to: number }) => {
      onOpenSearchResult?.(noteId, range);
    },
    [onOpenSearchResult]
  );

  const openSearchNoteWithoutRange = useCallback(
    (noteId: string) => {
      onOpenSearchResult?.(noteId, null);
    },
    [onOpenSearchResult]
  );

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSearchActiveIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSearchActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (searchResults[searchActiveIndex]) {
            toggleSearchExpanded(searchResults[searchActiveIndex].noteId);
          }
          break;
        case "Escape":
          e.preventDefault();
          if (searchQuery) {
            setSearchQuery("");
          } else {
            searchInputRef?.current?.blur();
            onSidebarTabChange("explorer");
          }
          break;
      }
    },
    [
      searchResults,
      searchActiveIndex,
      searchQuery,
      toggleSearchExpanded,
      searchInputRef,
      onSidebarTabChange,
    ]
  );

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: "note" | "folder",
    idOrPath: string
  ) => {
    e.dataTransfer.setData("application/notes-dnd", JSON.stringify({ type, idOrPath }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetPath: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(targetPath || "root");
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);
  };

  const handleDrop = (e: React.DragEvent, targetPath: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPath(null);

    const data = e.dataTransfer.getData("application/notes-dnd");
    if (!data) return;

    try {
      const { type, idOrPath } = JSON.parse(data) as {
        type: "note" | "folder";
        idOrPath: string;
      };

      if (type === "note") {
        onMoveNote?.(idOrPath, targetPath);
      } else {
        // Prevent dropping a folder into itself or its descendants
        if (
          targetPath === idOrPath ||
          (targetPath && targetPath.startsWith(idOrPath + "/"))
        ) {
          return;
        }

        // Keep expansion state for moved folder and its descendants
        const folderName = idOrPath.split("/").pop() || "";
        const newFolderPath = targetPath
          ? `${targetPath}/${folderName}`
          : folderName;

        if (newFolderPath !== idOrPath) {
          setExpandedFolders((prev) => {
            const next = new Set(prev);
            const toUpdate: { old: string; new: string }[] = [];

            prev.forEach((p) => {
              if (p === idOrPath || p.startsWith(idOrPath + "/")) {
                toUpdate.push({
                  old: p,
                  new: newFolderPath + p.slice(idOrPath.length),
                });
              }
            });

            toUpdate.forEach((u) => {
              next.delete(u.old);
              next.add(u.new);
            });

            return next;
          });
        }

        onMoveFolder?.(idOrPath, targetPath);
      }
    } catch (err) {
      console.error("Failed to parse drag data", err);
    }
  };

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return (
      <ul className="space-y-0.5">
        {nodes.map((node) => {
          const isEditing =
            editing?.nodeType === node.type &&
            editing?.nodeId === (node.type === "folder" ? node.path : node.id);

          if (node.type === "folder") {
            const isExpanded = expandedFolders.has(node.path);
            const isDragOver = dragOverPath === node.path;
            return (
              <li key={node.path}>
                <button
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, "folder", node.path)}
                  onDragOver={(e) => handleDragOver(e, node.path)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, node.path)}
                  onClick={() => !isEditing && toggleFolder(node.path)}
                  onContextMenu={(e) => {
                    if (isEditing) return;
                    e.preventDefault();
                    handleOpenMenu(
                      e,
                      "folder",
                      node.path,
                      node.name,
                      isExpanded
                    );
                  }}
                  className={`w-full flex items-center gap-1.5 px-2 py-1 rounded transition-colors group ${
                    isDragOver
                      ? "bg-slate-700/50 ring-1 ring-slate-500 text-slate-100"
                      : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                  <span className="shrink-0">
                    {isExpanded ? (
                      <IconChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <IconChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <IconFolder className="w-4 h-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-0 px-0 focus:border-b focus:border-slate-500/50 text-slate-100 min-w-0"
                    />
                  ) : (
                    <span className="text-sm font-medium truncate">
                      {node.name}
                    </span>
                  )}
                </button>
                {isExpanded && renderTree(node.children, level + 1)}
              </li>
            );
          } else {
            const isSelected = selectedNoteId === node.id;
            return (
              <li key={node.id}>
                <button
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, "note", node.id)}
                  onClick={() => !isEditing && onOpenNote(node.id)}
                  onContextMenu={(e) => {
                    if (isEditing) return;
                    e.preventDefault();
                    handleOpenMenu(e, "note", node.id, node.name);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    isSelected
                      ? "bg-slate-700 text-slate-100"
                      : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  style={{ paddingLeft: `${level * 12 + 28}px` }}
                >
                  <IconFileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="flex-1 bg-transparent border-none outline-none text-sm py-0 px-0 focus:border-b focus:border-slate-500/50 text-slate-100 min-w-0"
                    />
                  ) : (
                    <span className="text-sm truncate">{node.name}</span>
                  )}
                </button>
              </li>
            );
          }
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {sidebarTab === "search" ? (
        <>
          {/* Search tab header */}
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search in notes..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 text-sm placeholder-slate-500 outline-none focus:border-slate-600 transition-colors"
              />
            </div>
          </div>

          {/* Search results view */}
          <div ref={searchListRef} className="flex-1 overflow-y-auto -mx-2 px-2">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Type to search notes
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No results found
              </div>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((result, index) => (
                  <SearchResultItem
                    key={result.noteId}
                    result={result}
                    isActive={index === searchActiveIndex}
                    isExpanded={!!searchExpandedById[result.noteId]}
                    showAll={!!searchShowAllById[result.noteId]}
                    index={index}
                    query={searchQuery}
                    onToggleExpanded={() => toggleSearchExpanded(result.noteId)}
                    onToggleShowAll={() => toggleSearchShowAll(result.noteId)}
                    onOpenMatchLine={(range) =>
                      openSearchMatchLine(result.noteId, range)
                    }
                    onOpenNote={() => openSearchNoteWithoutRange(result.noteId)}
                    onMouseEnter={() => setSearchActiveIndex(index)}
                  />
                ))}
              </ul>
            )}
            {searchQuery.trim() !== "" && searchResults.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-800 text-xs text-slate-500">
                {searchResults.length} file{searchResults.length !== 1 ? "s" : ""} found
              </div>
            )}
          </div>
        </>
      ) : (
        // Tree list / Root drop zone
        <div
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`flex-1 overflow-y-auto -mx-2 px-2 transition-colors ${
            dragOverPath === "root" ? "bg-slate-800/30" : ""
          }`}
        >
          <div className="sticky top-0 z-10 mx-3 px-0 py-2 bg-slate-900">
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={onCreateNote}
                className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                aria-label="Create new note"
                title="Create new note"
              >
                <IconFilePlus className="w-5 h-5" />
              </button>
              <button
                onClick={onCreateFolder}
                className="flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                aria-label="New folder"
                title="New folder"
              >
                <IconFolderPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
          {tree.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm pointer-events-none">
              No notes found
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      )}

      {/* Actions menu portal */}
      {isOpen &&
        position &&
        menuState &&
        createPortal(
          <div className="fixed inset-0 z-50" onClick={handleCloseMenu}>
            <div
              className="absolute w-36 rounded bg-slate-900 border border-slate-700 shadow-lg overflow-hidden"
              style={{ top: position.top, left: position.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                {menuState.nodeType === "folder" ? (
                  <>
                    <button
                      onClick={handleMenuExpandCollapse}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      {menuState.isExpanded ? (
                        <IconFolderOpen className="w-4 h-4" />
                      ) : (
                        <IconFolder className="w-4 h-4" />
                      )}
                      <span>{menuState.isExpanded ? "Collapse" : "Expand"}</span>
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                      onClick={handleMenuCreateNote}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <IconFilePencil className="w-4 h-4" />
                      <span>New note</span>
                    </button>
                    <button
                      onClick={handleMenuCreateFolder}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <IconFolderPlus className="w-4 h-4" />
                      <span>New folder</span>
                    </button>
                    <div className="h-px bg-slate-800 my-1" />
                    <button
                      onClick={handleMenuRename}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <IconPencil className="w-4 h-4" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={handleMenuDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800"
                    >
                      <IconTrash className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleMenuOpen}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <IconFile className="w-4 h-4" />
                      <span>Open</span>
                    </button>
                    <button
                      onClick={handleMenuRename}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      <IconPencil className="w-4 h-4" />
                      <span>Rename</span>
                    </button>
                    <button
                      onClick={handleMenuDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-800"
                    >
                      <IconTrash className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

interface SearchResultItemProps {
  result: NoteSearchResult;
  isActive: boolean;
  isExpanded: boolean;
  showAll: boolean;
  index: number;
  query: string;
  onToggleExpanded: () => void;
  onToggleShowAll: () => void;
  onOpenMatchLine: (range: { from: number; to: number }) => void;
  onOpenNote: () => void;
  onMouseEnter: () => void;
}

function SearchResultItem({
  result,
  isActive,
  isExpanded,
  showAll,
  index,
  query,
  onToggleExpanded,
  onToggleShowAll,
  onOpenMatchLine,
  onOpenNote,
  onMouseEnter,
}: SearchResultItemProps) {
  const hasTitleMatch = result.titleMatchCount > 0;
  const hasPathMatch = result.pathMatchCount > 0;
  const hasContentMatches = result.contentMatches.length > 0;

  const visibleMatches = showAll
    ? result.contentMatches
    : result.contentMatches.slice(0, INITIAL_MATCH_LIMIT);
  const hiddenCount = Math.max(0, result.contentMatches.length - INITIAL_MATCH_LIMIT);

  return (
    <li data-search-result-index={index} onMouseEnter={onMouseEnter}>
      {/* File header - toggles expand/collapse */}
      <div
        onClick={onToggleExpanded}
        className={`rounded-md cursor-pointer transition-colors px-2 py-2 ${
          isActive ? "bg-slate-700" : "hover:bg-slate-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Chevron indicator */}
          <span className="w-4 h-4 flex items-center justify-center text-slate-500 shrink-0">
            {isExpanded ? (
              <IconChevronDown className="w-3.5 h-3.5" />
            ) : (
              <IconChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
          <IconFileText className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-sm font-medium text-slate-200 truncate">
            {result.title}
          </span>
          <span className="text-xs text-slate-500 ml-auto shrink-0">
            {result.matchCount} match{result.matchCount !== 1 ? "es" : ""}
          </span>
        </div>

        {/* Path */}
        <div className="text-[10px] font-mono text-slate-500 truncate mt-1 pl-8">
          {result.path}
        </div>
      </div>

      {/* Expanded content - match lines list */}
      {isExpanded && (
        <div className="pl-8 pr-2 pb-2 space-y-0.5">
          {hasTitleMatch && (
            <MetaMatchItem
              kind="T"
              label="Title"
              text={result.title}
              query={query}
              onClick={onOpenNote}
            />
          )}
          {hasPathMatch && (
            <MetaMatchItem
              kind="P"
              label="Path"
              text={result.path}
              query={query}
              onClick={onOpenNote}
            />
          )}

          {hasContentMatches && (
            <>
              {visibleMatches.map((match, idx) => (
                <MatchLineItem
                  key={idx}
                  match={match}
                  query={query}
                  onClick={() =>
                    onOpenMatchLine({ from: match.rangeFrom, to: match.rangeTo })
                  }
                />
              ))}
              {!showAll && hiddenCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleShowAll();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors pl-6 py-1"
                >
                  Show more ({hiddenCount})
                </button>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

interface MetaMatchItemProps {
  kind: "T" | "P";
  label: string;
  text: string;
  query: string;
  onClick: () => void;
}

function MetaMatchItem({ kind, label, text, query, onClick }: MetaMatchItemProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-start gap-2 text-xs cursor-pointer rounded px-1 py-0.5 hover:bg-slate-800 transition-colors"
    >
      <span className="text-slate-600 font-mono w-4 text-right shrink-0">
        {kind}
      </span>
      <span className="text-slate-400 truncate">
        <span className="text-slate-500 mr-1">{label}:</span>{" "}
        <InlineHighlight text={text} query={query} />
      </span>
    </div>
  );
}

interface MatchLineItemProps {
  match: MatchPreview;
  query: string;
  onClick: () => void;
}

function MatchLineItem({ match, onClick }: MatchLineItemProps) {
  const { lineNumber, text, matchStart, matchEnd } = match;

  // Truncate long lines, keeping the match visible
  const maxLen = 60;
  let displayText = text;
  let displayMatchStart = matchStart;
  let displayMatchEnd = matchEnd;

  if (text.length > maxLen) {
    // Center the match in the display window
    const matchCenter = (matchStart + matchEnd) / 2;
    let start = Math.max(0, Math.floor(matchCenter - maxLen / 2));
    let end = Math.min(text.length, start + maxLen);

    // Adjust if we hit the end
    if (end === text.length) {
      start = Math.max(0, end - maxLen);
    }

    displayText =
      (start > 0 ? "..." : "") +
      text.slice(start, end) +
      (end < text.length ? "..." : "");
    displayMatchStart = matchStart - start + (start > 0 ? 3 : 0);
    displayMatchEnd = matchEnd - start + (start > 0 ? 3 : 0);
  }

  // Split into before, match, after
  const before = displayText.slice(0, displayMatchStart);
  const matchText = displayText.slice(displayMatchStart, displayMatchEnd);
  const after = displayText.slice(displayMatchEnd);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex items-start gap-2 text-xs cursor-pointer rounded px-1 py-0.5 hover:bg-slate-800 transition-colors"
    >
      <span className="text-slate-600 font-mono w-4 text-right shrink-0">
        {lineNumber}
      </span>
      <span className="text-slate-400 truncate">
        <span>{before}</span>
        <span className="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">
          {matchText}
        </span>
        <span>{after}</span>
      </span>
    </div>
  );
}

function InlineHighlight({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const matchText = text.slice(idx, idx + trimmed.length);
  const after = text.slice(idx + trimmed.length);

  return (
    <>
      <span>{before}</span>
      <span className="bg-amber-500/30 text-amber-200 rounded-sm px-0.5">
        {matchText}
      </span>
      <span>{after}</span>
    </>
  );
}

export default NotesDrawer;
