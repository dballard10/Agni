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
} from "@tabler/icons-react";
import type { Note } from "../../../mock/mockNotes";
import { useAnchoredMenu } from "../../../shared/hooks/useAnchoredMenu";

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
  onMoveNote?: (noteId: string, targetFolderPath: string | null) => void;
  onMoveFolder?: (folderPath: string, targetFolderPath: string | null) => void;
  autoExpandAll?: boolean;
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
  onMoveNote,
  onMoveFolder,
  autoExpandAll = false,
}: NotesDrawerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

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
      {/* Tree list / Root drop zone */}
      <div
        onDragOver={(e) => handleDragOver(e, null)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
        className={`flex-1 overflow-y-auto -mx-2 px-2 transition-colors ${
          dragOverPath === "root" ? "bg-slate-800/30" : ""
        }`}
      >
        {tree.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm pointer-events-none">
            No notes found
          </div>
        ) : (
          renderTree(tree)
        )}
      </div>

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

export default NotesDrawer;
