import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCalendarPlus } from "@tabler/icons-react";
import DateInputWithPicker from "../../../shared/ui/DateInputWithPicker";
import { useAnchoredMenu } from "../../../shared/hooks/useAnchoredMenu";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { getTodayISO } from "../../../shared/lib/date";

interface CreateWeekPickerButtonProps {
  onCreateWeek: (dateISO: string) => void;
  /** Optional custom class for the trigger button (overrides default styling) */
  buttonClassName?: string;
}

export function CreateWeekPickerButton({ onCreateWeek, buttonClassName }: CreateWeekPickerButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  const { isOpen, position, toggle, close } = useAnchoredMenu({
    resolveAnchor: () => containerRef.current,
    menuWidth: 300,
    gap: 8,
  });

  useClickOutside([containerRef, menuRef], close, isOpen);

  const handleCreate = () => {
    if (selectedDate) {
      onCreateWeek(selectedDate);
      close();
    }
  };

  // Use custom className if provided, otherwise use default styling
  const triggerClassName = buttonClassName
    ? buttonClassName
    : `p-1 transition-colors rounded hover:bg-slate-800 ${
        isOpen ? "text-slate-100 bg-slate-800" : "text-slate-400 hover:text-slate-100"
      }`;

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={toggle}
        className={triggerClassName}
        title="Create week for specific date"
        aria-label="Create week for specific date"
      >
        <IconCalendarPlus className="w-5 h-5" />
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 w-[300px] flex flex-col gap-4"
            style={{ top: position.top, left: position.left }}
          >
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">
                Create/Select Week
              </h4>
            </div>

            <DateInputWithPicker
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Pick a date"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={close}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedDate}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded transition-colors"
              >
                Go to Week
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default CreateWeekPickerButton;
