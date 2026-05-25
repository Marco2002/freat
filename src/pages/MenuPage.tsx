import { useState } from "react";

interface MenuPageProps {
  onPractice: () => void;
  onTheory: () => void;
  onNoteFinderPractice: () => void;
  onNoteFinderTheory: () => void;
}

type Side = "arpeggio" | "note-finder";

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
      className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent border border-ink/15 text-muted-dark cursor-pointer transition-all duration-150 hover:border-ink/35 hover:text-ink"
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

function Dots({ active }: { active: Side }) {
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
  onPractice,
  onTheory,
  onNoteFinderPractice,
  onNoteFinderTheory,
}: MenuPageProps) {
  const [side, setSide] = useState<Side>("arpeggio");

  return (
    <div className="h-full overflow-hidden relative">
      {/* Sliding container — 200% wide so each panel is one viewport width */}
      <div
        className="h-full flex transition-transform duration-500 ease-in-out"
        style={{
          width: "200%",
          transform:
            side === "note-finder" ? "translateX(-50%)" : "translateX(0)",
        }}
      >
        {/* ── Arpeggio Drill panel ───────────────────── */}
        <div
          className="h-full flex flex-col items-center justify-center gap-12 p-8 relative"
          style={{ width: "50%" }}
        >
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <NavArrow
              direction="right"
              onClick={() => setSide("note-finder")}
            />
          </div>

          <div className="text-center">
            <h1 className="font-serif italic font-normal text-[clamp(48px,10vw,84px)] leading-[0.9] tracking-[-0.03em] text-ink m-0 mb-4">
              Arpeggio
              <br />
              Drill
            </h1>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
              onClick={onPractice}
            >
              Practice →
            </button>
            <button
              className="bg-transparent text-ink border-[1.5px] border-ink/25 font-mono text-xs font-medium tracking-[0.14em] uppercase py-[14px] px-11 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/50"
              onClick={onTheory}
            >
              Theory →
            </button>
          </div>
        </div>

        {/* ── Note Finder panel ─────────────────────── */}
        <div
          className="h-full flex flex-col items-center justify-center gap-12 p-8 relative"
          style={{ width: "50%" }}
        >
          <div className="absolute left-5 top-1/2 -translate-y-1/2">
            <NavArrow direction="left" onClick={() => setSide("arpeggio")} />
          </div>

          <div className="text-center">
            <h1 className="font-serif italic font-normal text-[clamp(48px,10vw,84px)] leading-[0.9] tracking-[-0.03em] text-ink m-0 mb-4">
              Note
              <br />
              Finder
            </h1>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
              onClick={onNoteFinderPractice}
            >
              Practice →
            </button>
            <button
              className="bg-transparent text-ink border-[1.5px] border-ink/25 font-mono text-xs font-medium tracking-[0.14em] uppercase py-[14px] px-11 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/50"
              onClick={onNoteFinderTheory}
            >
              Theory →
            </button>
          </div>
        </div>
      </div>

      {/* Pagination dots — outside the slider so they don't move */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <Dots active={side} />
      </div>
    </div>
  );
}
