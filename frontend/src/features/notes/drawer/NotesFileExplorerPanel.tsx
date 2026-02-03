import { NotesDrawer } from "./NotesDrawer";
import type { Note } from "../../../mock/mockNotes";

interface NotesFileExplorerPanelProps {
  notes: Note[];
  folders: string[];
  selectedNoteId: string | null;
  onOpenNote: (noteId: string) => void;
  onRenameNote: (noteId: string, nextTitle: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameFolder: (folderPath: string, nextFolderName: string) => void;
  onDeleteFolder: (folderPath: string) => void;
  onCreateNoteInFolder: (folderPath: string) => void;
  onCreateFolderInFolder: (folderPath: string) => void;
  onMoveNote: (noteId: string, targetFolderPath: string | null) => void;
  onMoveFolder: (folderPath: string, targetFolderPath: string | null) => void;
}

export function NotesFileExplorerPanel({
  notes,
  folders,
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
}: NotesFileExplorerPanelProps) {
  return (
    <NotesDrawer
      notes={notes}
      folders={folders}
      selectedNoteId={selectedNoteId}
      onOpenNote={onOpenNote}
      onRenameNote={onRenameNote}
      onDeleteNote={onDeleteNote}
      onRenameFolder={onRenameFolder}
      onDeleteFolder={onDeleteFolder}
      onCreateNoteInFolder={onCreateNoteInFolder}
      onCreateFolderInFolder={onCreateFolderInFolder}
      onMoveNote={onMoveNote}
      onMoveFolder={onMoveFolder}
    />
  );
}

export default NotesFileExplorerPanel;
