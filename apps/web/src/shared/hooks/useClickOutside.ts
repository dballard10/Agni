import { useEffect, type RefObject } from "react";

type PossibleRef<T> = RefObject<T | null> | null | undefined;

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  refs: PossibleRef<T>[],
  onOutsideClick: () => void,
  active = true
) {
  useEffect(() => {
    if (!active) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const isInside = refs.some((ref) => ref?.current?.contains(target));
      if (!isInside) {
        onOutsideClick();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [active, onOutsideClick, refs]);
}

