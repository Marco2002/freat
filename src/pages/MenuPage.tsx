interface MenuPageProps {
  onGame: () => void;
  onPractice: () => void;
  onTheory: () => void;
  onCollection: () => void;
}

export function MenuPage({
  onGame,
  onPractice,
  onTheory,
  onCollection,
}: MenuPageProps) {
  return (
    <div className="relative h-full flex flex-col items-center justify-center gap-12 px-8">
      <h1 className="text-center font-serif italic font-normal text-[clamp(48px,10vw,84px)] leading-[0.9] tracking-[-0.03em] text-ink m-0">
        Arpeggio
        <br />
        Drill
      </h1>

      {/* items-stretch makes every button as wide as the widest one, with no
          hardcoded width to keep in step as the labels change. */}
      <div className="flex flex-col items-stretch gap-3">
        <button
          className="bg-ink text-sand border-none font-mono text-xs font-medium tracking-[0.14em] uppercase py-4 px-11 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-80"
          onClick={onGame}
        >
          Play →
        </button>
        <button
          className="bg-sand text-ink border-[1.5px] border-ink/40 font-mono text-xs font-medium tracking-[0.14em] uppercase py-[14px] px-11 rounded-full cursor-pointer transition-all duration-150 hover:border-ink/65"
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

      {/* The collection is a reference, not a way to start playing — so it sits
          out of the run of buttons as a corner mark. */}
      <button
        onClick={onCollection}
        aria-label="Collection"
        title="Collection"
        className="absolute bottom-7 right-7 flex items-center justify-center w-11 h-11 rounded-full bg-transparent border border-ink/35 text-muted-dark cursor-pointer transition-all duration-150 hover:border-ink/60 hover:text-ink"
      >
        <svg width="19" height="19" viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="M10 5.4C8.2 4.1 5.6 3.7 2.9 4v10.4c2.7-.3 5.3.1 7.1 1.4 1.8-1.3 4.4-1.7 7.1-1.4V4c-2.7-.3-5.3.1-7.1 1.4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M10 5.4v10.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
