/**
 * Global helper to detect when the pointer is hovering over a scrollbar gutter.
 * This allows us to reveal the scrollbar thumb ONLY when hovering the gutter,
 * rather than when hovering the entire scrollable container.
 */

const GUTTER_SIZE = 12; // Pixels to detect as "scrollbar gutter"
let currentScrollElement: HTMLElement | null = null;
let lastRafId: number | null = null;

function isScrollable(el: HTMLElement): { vertical: boolean; horizontal: boolean } {
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;

  const vertical =
    (overflowY === "auto" || overflowY === "scroll") &&
    el.scrollHeight > el.clientHeight;
  const horizontal =
    (overflowX === "auto" || overflowX === "scroll") &&
    el.scrollWidth > el.clientWidth;

  return { vertical, horizontal };
}

function handlePointerMove(e: PointerEvent) {
  if (lastRafId !== null) {
    cancelAnimationFrame(lastRafId);
  }

  lastRafId = requestAnimationFrame(() => {
    const x = e.clientX;
    const y = e.clientY;

    // Find the element at the current pointer position
    let target = document.elementFromPoint(x, y) as HTMLElement | null;
    let foundScrollElement: HTMLElement | null = null;
    let isInGutter = false;

    // Walk up the tree to find the nearest scrollable element
    while (target && target !== document.body) {
      const { vertical, horizontal } = isScrollable(target);

      if (vertical || horizontal) {
        const rect = target.getBoundingClientRect();
        
        // Check vertical scrollbar gutter (right side)
        const inVerticalGutter = vertical && x >= rect.right - GUTTER_SIZE && x <= rect.right;
        
        // Check horizontal scrollbar gutter (bottom side)
        const inHorizontalGutter = horizontal && y >= rect.bottom - GUTTER_SIZE && y <= rect.bottom;

        if (inVerticalGutter || inHorizontalGutter) {
          foundScrollElement = target;
          isInGutter = true;
          break;
        }
      }
      target = target.parentElement;
    }

    // Update the data attribute on the scroll element
    if (foundScrollElement && isInGutter) {
      if (currentScrollElement && currentScrollElement !== foundScrollElement) {
        delete currentScrollElement.dataset.scrollbarHover;
      }
      foundScrollElement.dataset.scrollbarHover = "1";
      currentScrollElement = foundScrollElement;
    } else {
      if (currentScrollElement) {
        delete currentScrollElement.dataset.scrollbarHover;
        currentScrollElement = null;
      }
    }
  });
}

function handlePointerLeave() {
  if (currentScrollElement) {
    delete currentScrollElement.dataset.scrollbarHover;
    currentScrollElement = null;
  }
}

export function initScrollbarHoverDetector() {
  if (typeof window === "undefined") return;

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerleave", handlePointerLeave);
  
  return () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
  };
}
