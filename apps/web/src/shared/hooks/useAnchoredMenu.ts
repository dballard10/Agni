import { useCallback, useEffect, useState } from "react";

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

  const updatePosition = useCallback(() => {
    const anchor = resolveAnchor();
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
  }, [gap, menuWidth, resolveAnchor]);

  const open = useCallback(() => {
    updatePosition();
    setIsOpen(true);
  }, [updatePosition]);

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
    close,
    toggle,
    updatePosition,
  };
}


