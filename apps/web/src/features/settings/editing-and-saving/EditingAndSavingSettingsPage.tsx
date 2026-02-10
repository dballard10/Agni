import { IconArrowLeft, IconDeviceFloppy, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

interface EditingAndSavingSettingsPageProps {
  onBack: () => void;
}

export function EditingAndSavingSettingsPage({ onBack }: EditingAndSavingSettingsPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors rounded-md hover:bg-bg-hover"
          title="Back to Settings"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-text-primary">Editing and Saving</h2>
      </div>

      <div className="space-y-6">
        <section className="bg-bg-panel/50 border border-border rounded-xl p-5">
          <div className="flex items-start gap-3 mb-6">
            <div className="mt-1 text-blue-400">
              <IconDeviceFloppy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-text-primary">Task Details Saving</h3>
              <p className="text-sm text-text-muted">
                Changes to task details require explicit saving. You have full control over when changes are committed.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-bg-elevated/30 border border-border-subtle/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-accent text-white">
                  <IconCheck className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary text-sm">Manual Save</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Changes are buffered locally while you edit. Click the checkmark icon in the Task Details header to save all changes to the backend at once.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-bg-elevated/30 border border-border-subtle/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 rounded-lg bg-amber-500 text-white">
                  <IconAlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-text-primary text-sm">Unsaved Changes Prompt</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    If you try to close the panel or switch to another task with unsaved changes, you will be prompted to Save, Discard, or Cancel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EditingAndSavingSettingsPage;
