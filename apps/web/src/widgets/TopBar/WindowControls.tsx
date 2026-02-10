import { IconMinus, IconSquare, IconX, IconCopy } from "@tabler/icons-react"
import { useWindowControls } from "@/shared/hooks/usePlatform"

export function WindowControls() {
  const controls = useWindowControls()
  if (!controls) return null

  const { minimize, maximize, close, isMaximized } = controls

  return (
    <div
      className="flex items-center h-full -mr-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <button
        onClick={minimize}
        className="flex items-center justify-center w-12 h-full text-text-muted hover:bg-bg-hover"
        aria-label="Minimize"
      >
        <IconMinus className="w-4 h-4" />
      </button>
      <button
        onClick={maximize}
        className="flex items-center justify-center w-12 h-full text-text-muted hover:bg-bg-hover"
        aria-label={isMaximized ? "Restore" : "Maximize"}
      >
        {isMaximized ? <IconCopy className="w-4 h-4" /> : <IconSquare className="w-4 h-4" />}
      </button>
      <button
        onClick={close}
        className="flex items-center justify-center w-12 h-full text-text-muted hover:bg-status-error hover:text-white"
        aria-label="Close"
      >
        <IconX className="w-4 h-4" />
      </button>
    </div>
  )
}
