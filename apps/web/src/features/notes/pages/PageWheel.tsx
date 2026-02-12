import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { NotePage } from "../../../mock/mockNotes";

interface PageWheelProps {
  pages: NotePage[];
  activePageIndex: number;
  anchorRect: DOMRect;
  onConfirm: (index: number) => void;
  onCancel: () => void;
}

const WHEEL_CONTAINER_HEIGHT = 360;
const ROTATION_ANGLE = 15;
const WHEEL_RADIUS = 110;
const FADE_STEP = 0.18;
const SCALE_STEP = 0.06;
const SCROLL_THRESHOLD = 50;
const ANIMATION_LERP = 0.15;
const MAX_VISIBLE_OFFSET = 5;
const MAX_TITLE_CHARS = 25;

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_CHARS) return title;
  return title.slice(0, MAX_TITLE_CHARS - 3) + "...";
}

function getItemStyle(offset: number): React.CSSProperties {
  const absOffset = Math.abs(offset);
  const clampedAbs = Math.min(absOffset, MAX_VISIBLE_OFFSET);

  const angleRad = (offset * ROTATION_ANGLE * Math.PI) / 180;
  const rotateX = -offset * ROTATION_ANGLE;
  const translateY = WHEEL_RADIUS * Math.sin(angleRad);
  const translateZ = WHEEL_RADIUS * Math.cos(angleRad) - WHEEL_RADIUS;
  const opacity = Math.max(0, 1 - clampedAbs * FADE_STEP);
  const scale = Math.max(0.6, 1 - clampedAbs * SCALE_STEP);

  return {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    transform: `translateY(calc(-50% + ${translateY}px)) rotateX(${rotateX}deg) translateZ(${translateZ}px) scale(${scale})`,
    opacity,
    zIndex: 10 - Math.round(clampedAbs),
    pointerEvents: "auto",
  };
}

function WheelItem({
  page,
  pageNumber,
  offset,
  isCentered,
  onClick,
}: {
  page: NotePage;
  pageNumber: number;
  offset: number;
  isCentered: boolean;
  onClick: () => void;
}) {
  const positionStyle = getItemStyle(offset);
  const absOffset = Math.abs(offset);
  const textOpacity = Math.max(0.15, 1 - absOffset * 0.22);

  return (
    <div
      style={{ ...positionStyle, color: `rgba(255,255,255,${textOpacity})` }}
      className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none rounded"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="text-xs font-mono w-5 shrink-0 text-right" style={{ color: `rgba(199,199,199,${textOpacity * 0.7})` }}>
        {pageNumber}
      </span>
      <span
        className={`truncate ${isCentered ? "text-sm font-semibold" : "text-sm"}`}
      >
        {truncateTitle(page.title)}
      </span>
    </div>
  );
}

export function PageWheel({
  pages,
  activePageIndex,
  anchorRect,
  onConfirm,
  onCancel,
}: PageWheelProps) {
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const scrollAccumRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const wheelPositionRef = useRef<number>(activePageIndex);

  const [targetIndex, setTargetIndex] = useState<number>(activePageIndex);
  const [wheelPosition, setWheelPosition] = useState<number>(activePageIndex);
  const [mounted, setMounted] = useState(false);

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Smooth animation loop
  useEffect(() => {
    let running = true;

    const animate = () => {
      if (!running) return;

      const current = wheelPositionRef.current;
      const diff = targetIndex - current;

      if (Math.abs(diff) < 0.01) {
        wheelPositionRef.current = targetIndex;
        setWheelPosition(targetIndex);
      } else {
        const next = current + diff * ANIMATION_LERP;
        wheelPositionRef.current = next;
        setWheelPosition(next);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetIndex]);

  // Wheel scroll handler (non-passive for preventDefault)
  useEffect(() => {
    const el = wheelContainerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      scrollAccumRef.current += e.deltaY;

      if (Math.abs(scrollAccumRef.current) >= SCROLL_THRESHOLD) {
        const direction = scrollAccumRef.current > 0 ? 1 : -1;
        scrollAccumRef.current = 0;

        setTargetIndex((prev) => {
          const next = prev + direction;
          return Math.max(0, Math.min(pages.length - 1, next));
        });
      }
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [pages.length]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onCancel();
          break;
        case "Enter":
          e.preventDefault();
          onConfirm(targetIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          setTargetIndex((prev) => Math.max(0, prev - 1));
          scrollAccumRef.current = 0;
          break;
        case "ArrowDown":
          e.preventDefault();
          setTargetIndex((prev) => Math.min(pages.length - 1, prev + 1));
          scrollAccumRef.current = 0;
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm, targetIndex, pages.length]);

  // Click handling
  const handleItemClick = useCallback(
    (index: number) => {
      if (index === targetIndex) {
        onConfirm(index);
      } else {
        setTargetIndex(index);
        scrollAccumRef.current = 0;
      }
    },
    [targetIndex, onConfirm]
  );

  const handleBackdropContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onCancel();
    },
    [onCancel]
  );

  const anchorCenterY = anchorRect.top + anchorRect.height / 2;
  const wheelTop = anchorCenterY - WHEEL_CONTAINER_HEIGHT / 2;

  // Width based on longest title (capped at MAX_TITLE_CHARS)
  const longestTitle = Math.min(
    Math.max(...pages.map((p) => p.title.length)),
    MAX_TITLE_CHARS
  );
  const wheelWidth = Math.max(160, longestTitle * 8 + 60);

  // Offset left so wheel title text aligns with the page title input text
  // Wheel items have: px-3 (12px) + w-5 number (20px) + gap-3 (12px) = 44px before title
  const WHEEL_ITEM_TEXT_OFFSET = 40;

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      onContextMenu={handleBackdropContextMenu}
    >
      {/* Transparent click-catcher to dismiss on click outside */}
      <div className="absolute inset-0" onClick={onCancel} />

      {/* Wheel container */}
      <div
        ref={wheelContainerRef}
        className={`absolute transition-all duration-200 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          left: anchorRect.left - WHEEL_ITEM_TEXT_OFFSET,
          top: wheelTop,
          width: wheelWidth,
          height: WHEEL_CONTAINER_HEIGHT,
          perspective: "800px",
          perspectiveOrigin: "center center",
        }}
      >
        {/* 3D wheel */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
          }}
        >
          {pages.map((page, index) => {
            const offset = index - wheelPosition;
            if (Math.abs(offset) > MAX_VISIBLE_OFFSET) return null;

            return (
              <WheelItem
                key={page.id}
                page={page}
                pageNumber={index + 1}
                offset={offset}
                isCentered={index === targetIndex}
                onClick={() => handleItemClick(index)}
              />
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
