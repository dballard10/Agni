import { createPortal } from "react-dom";
import { IconAlertTriangle, IconX } from "@tabler/icons-react";

interface DeleteRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteThis: () => void;
  onDeleteAll: () => void;
}

export function DeleteRecurrenceModal({
  isOpen,
  onClose,
  onDeleteThis,
  onDeleteAll,
}: DeleteRecurrenceModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-bg-app/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg-panel border border-border rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-status-warning">
            <IconAlertTriangle size={20} />
            <h3 className="font-semibold text-text-primary">Delete Recurring Task</h3>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-muted transition-colors"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-text-muted mb-6 text-sm leading-relaxed">
            This is a recurring task. Would you like to delete just this specific
            occurrence, or the entire series?
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                onDeleteThis();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-bg-elevated hover:bg-bg-hover text-text-secondary font-medium rounded-md border border-border transition-colors text-sm"
            >
              Delete just this recurrence
            </button>
            <button
              onClick={() => {
                onDeleteAll();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-status-error/10 hover:bg-status-error/20 text-status-error font-medium rounded-md border border-status-error/30 transition-colors text-sm"
            >
              Delete all recurrences
            </button>
          </div>
        </div>

        <div className="p-4 bg-bg-app/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-text-muted hover:text-text-secondary transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteRecurrenceModal;
