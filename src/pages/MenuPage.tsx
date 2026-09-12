import { useState, useRef } from "react";
import type { Mode } from "../lib/routes";

interface MenuPageProps {
  /** Which half of the carousel is showing. Comes from the URL, so a refresh —
      or coming back out of a drill — reopens the menu on the same mode. */
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onPractice: () => void;
  onTheory: () => void;
}

// Per-mode full-screen background colour (covers the safe-area insets too).
const BACKGROUNDS: Record<Mode, string> = {
  arpeggio: "var(--color-sand)", // warm sand
  "note-finder": "var(--color-slate)", // soft slate blue
};

const SWIPE_THRESHOLD = 50; // px of horizontal travel needed to flip modes

function NavArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-ink/35 text-muted-dark cursor-pointer transition-all duration-150 hover:border-ink/55 hover:text-ink"
      aria-label={direction === "right" ? "Next mode" : "Previous mode"}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        {direction === "right" ? (
          <path
            d="M5 2.5L9.5 7L5 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M9 2.5L4.5 7L9 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

function Dots({ active }: { active: Mode }) {
  return (
    <div className="flex gap-2 items-center">
      <div
        className={`rounded-full transition-all duration-300 ${active === "arpeggio" ? "w-4 h-1.5 bg-ink" : "w-1.5 h-1.5 bg-ink/25"}`}
      />
      <div
        className={`rounded-full transition-all duration-300 ${active === "note-finder" ? "w-4 h-1.5 bg-ink" : "w-1.5 h-1.5 bg-ink/25"}`}
      />
    </div>
  );
}

export function MenuPage({
  mode,
  onModeChange,
  onPractice,
  onTheory,
}: MenuPageProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const isArp = mode === "arpeggio";

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    let dx = e.touches[0].clientX - startX.current;
    // Add resistance when dragging past either end of the carousel.
    if ((isArp && dx > 0) || (!isArp && dx < 0)) dx *= 0.3;
    setDragX(dx);
  };

  const handleTouchEnd = () => {
    if (dragX < -SWIPE_THRESHOLD && isArp) onModeChange("note-finder");
    else if (dragX > SWIPE_THRESHOLD && !isArp) onModeChange("arpeggio");
    setDragX(0);
    setDragging(false);
    startX.current = null;
  };

  // The title strip is 200% wide; -50% moves it left by one viewport width.
  const baseShift = isArp ? 0 : -50;

  return (
    <div
      className="h-full relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-screen background layer — extends under the safe-area insets so
          the mode colour fills the whole device, with no seam at the edges. */}
      <div
        className="fixed inset-0 -z-10 transition-colors duration-500 ease-in-out"
        style={{ background: BACKGROUNDS[mode] }}
      />

      {/* Nav arrows — only the actionable direction is shown */}
      {!isArp && (
        <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
          <NavArrow direction="left" onClick={() => onModeChange("arpeggio")} />
        </div>
      )}
      {isArp && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 z-10">
          <NavArrow
            direction="right"
            onClick={() => onModeChange("note-finder")}
          />
        </div>
      )}

      <div className="h-full flex flex-col items-center justify-center gap-12">
        {/* Title — the only thing that slides between modes. Spans the full
            screen width so it slides off at the true edge, not before. */}
        <div className="w-full overflow-hidden">
          <div
            className="flex w-[200%]"
            style={{
              transform: `translateX(calc(${baseShift}% + ${dragX}px))`,
              transition: dragging ? "none" : "transform 500ms ease-in-out",
            }}
          >
            <div className="w-1/2 flex items-center justify-center px-8">
              <h1 className="text-center font-serif italic font-normal text-[clamp(48px,10vw,84px)] leading-[0.9] tracking-[-0.03em] text-ink m-0">
                Arpeggio
                <br />
                Drill
              </h1>
            </div>
            <div className="w-1/2 flex items-center justify-center px-8">
              <h1 className="text-center font-serif italic font-normal text-[clamp(48px,10vw,84px)] leading-[0.9] tracking-[-0.03em] text-ink m-0">
                Note
                <br />
                Finder
              </h1>
            </div>
          </div>
        </div>

        {/* Buttons — fixed in place, act on whichever mode is active */}
        <div className="flex flex-col items-center gap-3">
          <button
            className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
            onClick={onPractice}
          >
            Practice →
          </button>
          <button
            className="bg-sand text-ink border-[1.5px] border-ink/40 font-mono text-xs font-medium tracking-[0.14em] uppercase py-[14px] px-11 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/65"
            onClick={onTheory}
          >
            Theory →
          </button>
        </div>
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <Dots active={mode} />
      </div>
    </div>
  );
}
