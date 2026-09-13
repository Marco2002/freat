interface TabChipsProps<T extends string> {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}

/**
 * A segmented switch: chips sharing one sunken background, so the choice reads
 * as one control with two states rather than two separate buttons.
 */
export function TabChips<T extends string>({
  tabs,
  active,
  onChange,
}: TabChipsProps<T>) {
  return (
    <div
      role="tablist"
      className="inline-flex gap-0.5 p-[3px] rounded-full bg-ink/[0.07] self-start"
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`font-mono text-[9.5px] font-medium tracking-[0.1em] py-[3px] px-[9px] rounded-full cursor-pointer border-none transition-colors duration-150 ${
              on
                ? 'bg-ink text-sand'
                : 'bg-transparent text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
