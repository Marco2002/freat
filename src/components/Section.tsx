import { useState } from 'react';

interface SectionProps {
  title: string;
  /** Shown beside the title — what is on, without having to open it. */
  summary?: string;
  /** Collapsible sections start shut; the plain ones are always open. */
  collapsible?: boolean;
  children: React.ReactNode;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className="transition-transform duration-200 shrink-0"
      style={{ transform: open ? 'rotate(90deg)' : 'none' }}
    >
      <path
        d="M3.5 1.5 L7 5 L3.5 8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const LABEL =
  'font-mono text-[10.5px] font-medium tracking-[0.14em] uppercase text-muted-light';

/**
 * A labelled block of the setup screen. The optional extras start collapsed, so
 * the screen opens on the two things every session needs — chords and
 * positions — rather than on everything at once.
 */
export function Section({
  title,
  summary,
  collapsible = false,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(false);

  if (!collapsible) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className={LABEL}>{title}</div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${LABEL} flex items-center gap-2 bg-transparent border-none p-0 cursor-pointer text-left transition-colors duration-150 hover:text-muted`}
      >
        <Chevron open={open} />
        {title}
        {summary && <span className="text-muted-light/70">· {summary}</span>}
      </button>
      {/* 0fr → 1fr animates the height without needing to know it. */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
