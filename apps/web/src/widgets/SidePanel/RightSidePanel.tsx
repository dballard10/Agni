import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { IconMaximize, IconMinimize, IconX } from "@tabler/icons-react";

interface RightSidePanelProps {
  title?: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
  showFloatingTrigger?: boolean;
  headerActions?: React.ReactNode;
  subHeader?: React.ReactNode;
  resizable?: boolean;
  persistWidthKey?: string;
  defaultWidthPx?: number;
  minWidthPx?: number;
  maxWidthPaddingPx?: number;
}

export function RightSidePanel({
  title = "Panel",
  isOpen,
  onClose,
  children,
  className = "",
  showFloatingTrigger = false,
  headerActions,
  subHeader,
  resizable = true,
  persistWidthKey,
  defaultWidthPx = 384,
  minWidthPx = 280,
  maxWidthPaddingPx = 16,
}: RightSidePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Capture focus when opening, restore when closing
  useEffect(() => {
    if (isOpen) {
      lastFocusRef.current = document.activeElement as HTMLElement;
    } else {
      // Small delay to allow the animation/inert to settle if needed, 
      // but usually immediate is fine for a11y.
      if (lastFocusRef.current && panelRef.current?.contains(document.activeElement)) {
        lastFocusRef.current.focus();
        lastFocusRef.current = null;
      }
    }
  }, [isOpen]);

  const [collapsedWidthPx, setCollapsedWidthPx] = useState(() => {
    if (typeof window === "undefined" || !persistWidthKey) {
      return defaultWidthPx;
    }
    const saved = localStorage.getItem(persistWidthKey);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return defaultWidthPx;
  });

  const [expandedWidthPx, setExpandedWidthPx] = useState(defaultWidthPx);
  const [isResizing, setIsResizing] = useState(false);

  // Computed width based on current state
  const currentWidth = isExpanded ? expandedWidthPx : collapsedWidthPx;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateMaxAndClamp = () => {
      const viewportWidth = window.innerWidth;
      let sidebarWidth = 0;
      const rootEl = panelRef.current?.closest(".app-shell-root") as HTMLElement | null;
      if (rootEl) {
        const raw = getComputedStyle(rootEl).getPropertyValue("--app-left-sidebar-width");
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed)) {
          sidebarWidth = parsed;
        }
      }
      if (!sidebarWidth) {
        sidebarWidth = 260;
      }

      const maxPossible = Math.max(minWidthPx, viewportWidth - sidebarWidth - maxWidthPaddingPx);
      setExpandedWidthPx(viewportWidth - sidebarWidth);

      setCollapsedWidthPx((prev) => {
        const clamped = Math.min(Math.max(prev, minWidthPx), maxPossible);
        return clamped;
      });
    };

    updateMaxAndClamp();
    const handleResize = () => updateMaxAndClamp();
    window.addEventListener("resize", handleResize);

    const rootEl = panelRef.current?.closest(".app-shell-root") as HTMLElement | null;
    const observer =
      rootEl && "MutationObserver" in window ? new MutationObserver(() => updateMaxAndClamp()) : null;
    if (observer && rootEl) {
      observer.observe(rootEl, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer?.disconnect();
    };
  }, [minWidthPx, maxWidthPaddingPx]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!resizable) return;
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = isExpanded ? expandedWidthPx : collapsedWidthPx;
    const snapPx = 16;
    const CLOSE_DRAG_THRESHOLD_PX = 128;
    let startXAtMin: number | null = null;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = startWidth - deltaX;

      // We need to know the current maxPossible width to clamp correctly
      const viewportWidth = window.innerWidth;
      let sidebarWidth = 0;
      const rootEl = panelRef.current?.closest(".app-shell-root") as HTMLElement | null;
      if (rootEl) {
        const raw = getComputedStyle(rootEl).getPropertyValue("--app-left-sidebar-width");
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed)) {
          sidebarWidth = parsed;
        }
      }
      if (!sidebarWidth) sidebarWidth = 260;
      const maxPossible = Math.max(minWidthPx, viewportWidth - sidebarWidth - maxWidthPaddingPx);
      const expandedWidth = viewportWidth - sidebarWidth;

      if (newWidth >= expandedWidth - snapPx) {
        setIsExpanded(true);
        startXAtMin = null;
      } else {
        setIsExpanded(false);
        setCollapsedWidthPx(Math.min(Math.max(newWidth, minWidthPx), maxPossible));

        // Drag-to-close threshold logic:
        // If we are at or below minWidthPx, track how much further right we drag.
        if (newWidth <= minWidthPx) {
          if (startXAtMin === null) {
            startXAtMin = moveEvent.clientX;
          } else {
            const dragDistanceRight = moveEvent.clientX - startXAtMin;
            if (dragDistanceRight >= CLOSE_DRAG_THRESHOLD_PX) {
              onClose();
              handlePointerUp();
              return;
            }
          }
        } else {
          startXAtMin = null;
        }
      }
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      // Persist the final width only if NOT expanded
      setIsExpanded((currentlyExpanded) => {
        if (!currentlyExpanded) {
          setCollapsedWidthPx((finalWidth) => {
            if (persistWidthKey) {
              localStorage.setItem(persistWidthKey, Math.round(finalWidth).toString());
            }
            return finalWidth;
          });
        }
        return currentlyExpanded;
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Allow local toggle only if floating trigger is enabled and we need a way to open it
  // But typically the parent controls isOpen.
  // If showFloatingTrigger is true, we need a way to request open?
  // Actually, if we are fully controlled, the parent handles open.
  // But if we want to support the "floating button opens it" pattern, we need an onOpen prop or similar.
  // For now, let's assume the parent handles opening via other means (header),
  // and showFloatingTrigger is just a legacy or backup that calls an onOpen callback?
  // To keep it simple and match the plan: "Remove or minimize... in favor of header-based control".
  // I will just rely on props. If floating trigger is needed, we'd need an onOpen callback.
  // Since the plan says "gate it... likely false", I'll assume we don't need it active for now.

  const panelTransition: Transition = {
    x: isResizing
      ? { duration: 0 }
      : isOpen
      ? { type: "spring", damping: 25, stiffness: 200 }
      : { type: "tween", duration: 0.3, ease: "circOut" },
    width: isResizing
      ? { duration: 0 }
      : isOpen
      ? { duration: 0.45, ease: "easeInOut" }
      : { duration: 0.3, ease: "circOut" },
  };

  const handleToggleExpanded = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setCollapsedWidthPx(defaultWidthPx);
      if (persistWidthKey) {
        localStorage.setItem(persistWidthKey, String(defaultWidthPx));
      }
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <>
      {/* Optional Floating Trigger - only if enabled */}
      {showFloatingTrigger && !isOpen && (
        <button
          onClick={() => {
            /* We need an onOpen prop if we want this to work, but for now parent controls it */
          }}
          className="fixed top-4 right-4 z-40 p-2 bg-bg-panel border border-border rounded-md hover:bg-bg-hover transition-colors"
          aria-label="Open panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
        </button>
      )}

      {/* Click-away backdrop: Only active when open and NOT full screen (expanded) */}
      {isOpen && !isExpanded && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : currentWidth,
          width: currentWidth,
        }}
        onAnimationComplete={() => {
          if (!isOpen) {
            setIsExpanded(false);
          }
        }}
        transition={panelTransition}
        className={`fixed inset-y-0 right-0 z-40 bg-bg-sidebar border-l border-border shadow-2xl ${className} ${
          isResizing ? "select-none" : ""
        }`}
        style={{ 
          maxWidth: "100%",
          pointerEvents: isOpen ? "auto" : "none"
        }}
        aria-hidden={!isOpen}
        inert={!isOpen}
        ref={panelRef}
      >
        {/* Resize Handle */}
        {resizable && (
          <div
            onPointerDown={handlePointerDown}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 group transition-all duration-300 ${
              isResizing 
                ? "bg-accent/50 opacity-100" 
                : "bg-accent/10 opacity-0 hover:opacity-100 hover:bg-accent/30"
            }`}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-px h-8 bg-accent/50 transition-opacity opacity-0 group-hover:opacity-100" />
          </div>
        )}

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b-2 border-border-subtle bg-bg-elevated/50">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <div className="flex items-center gap-1">
              {headerActions}
              <button
                onClick={handleToggleExpanded}
                className="p-1 text-text-muted hover:text-text-primary transition-colors rounded hover:bg-bg-hover"
                aria-label={isExpanded ? "Exit full screen" : "Full screen"}
                title={isExpanded ? "Exit full screen" : "Full screen"}
              >
                {isExpanded ? (
                  <IconMinimize className="w-5 h-5" />
                ) : (
                  <IconMaximize className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-1 text-text-muted hover:text-text-primary transition-colors rounded hover:bg-bg-hover"
                aria-label="Close panel"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub Header (e.g. Tabs) */}
          {subHeader && (
            <div className="border-b border-border bg-bg-panel/50">
              {subHeader}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-transparent">{children}</div>
        </div>
      </motion.div>
    </>
  );
}

export default RightSidePanel;
