import { createPortal } from "react-dom";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * Modal prompting the user to Save, Discard, or Cancel when leaving
 * Task Details with unsaved changes.
 */
export function UnsavedChangesModal({
  isOpen,
  onClose,
  onSave,
  onDiscard,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <IconAlertTriangle size={20} />
            <h3 className="font-semibold text-slate-100">Unsaved Changes</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            You have unsaved changes to this task. Would you like to save them
            before leaving?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onSave}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md transition-colors text-sm"
            >
              Save changes
            </button>
            <button
              onClick={onDiscard}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-md border border-slate-700 transition-colors text-sm"
            >
              Discard changes
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
