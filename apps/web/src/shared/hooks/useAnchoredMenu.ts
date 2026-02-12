import { useCallback, useEffect, useRef, useState } from "react";

interface UseAnchoredMenuOptions {
  resolveAnchor: () => HTMLElement | null;
  menuWidth: number;
  gap?: number;
}

interface AnchoredPosition {
  top: number;
  left: number;
}

export function useAnchoredMenu({
  resolveAnchor,
  menuWidth,
  gap = 4,
}: UseAnchoredMenuOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<AnchoredPosition | null>(null);
  const resolveAnchorRef = useRef(resolveAnchor);

  useEffect(() => {
    resolveAnchorRef.current = resolveAnchor;
  }, [resolveAnchor]);

  const updatePosition = useCallback(() => {
    const anchor = resolveAnchorRef.current();
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let left = rect.left;
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    setPosition({
      top: rect.bottom + gap,
      left,
    });
  }, [gap, menuWidth]);

  const open = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

  // Open menu at specific coordinates (for context menus)
  const openAtPosition = useCallback((x: number, y: number) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    // Estimate menu height (roughly 200px max) and adjust if near bottom
    let top = y;
    const estimatedMenuHeight = 200;
    if (top + estimatedMenuHeight > viewportHeight - 8) {
      top = viewportHeight - estimatedMenuHeight - 8;
    }
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
    setIsOpen(true);
  }, [menuWidth]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [close, isOpen, open]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  return {
    isOpen,
    position,
    open,
    openAtPosition,
    close,
    toggle,
    updatePosition,
  };
}


