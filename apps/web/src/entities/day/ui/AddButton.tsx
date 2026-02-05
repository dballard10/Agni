import { IconPlus, IconCheckbox, IconFolderPlus } from "@tabler/icons-react";

interface AddButtonProps {
  onAddTaskClick: () => void;
  onAddGroupClick: () => void;
}

const AddButton = ({ onAddTaskClick, onAddGroupClick }: AddButtonProps) => {
  return (
    <div className="relative flex items-center justify-end group z-20">
      {/* Base Icon Button */}
      <button
        type="button"
        onClick={onAddTaskClick}
        className="p-1 text-slate-200 hover:text-slate-100 rounded transition-colors z-30"
        aria-label="Add options"
      >
        <IconPlus className="w-5 h-5" />
      </button>

      {/* Expandable Menu Container */}
      <div
        className={`absolute right-0 flex items-center bg-slate-800 rounded-lg border border-slate-700 shadow-xl pr-8 pl-2 py-1 gap-2 transition-all duration-300 ease-out origin-right opacity-0 translate-x-4 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto`}
      >
        {/* Add Task Button */}
        <button
          type="button"
          aria-label="Add task"
          onClick={onAddTaskClick}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors text-slate-300 hover:bg-slate-700 hover:text-slate-100 whitespace-nowrap"
        >
          <IconCheckbox className="w-3 h-3" />
          Task
        </button>

        {/* Add Group Button */}
        <button
          type="button"
          aria-label="Add group"
          onClick={onAddGroupClick}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors text-slate-300 hover:bg-slate-700 hover:text-slate-100 whitespace-nowrap"
        >
          <IconFolderPlus className="w-3 h-3" />
          Group
        </button>
      </div>
    </div>
  );
};

export default AddButton;
