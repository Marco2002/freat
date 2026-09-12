import { BOSS_INFO, BOSS_KINDS } from '../lib/modifiers';
import type { BossKind } from '../lib/modifiers';

interface BossPillsProps {
  selected: BossKind[];
  onToggle: (boss: BossKind) => void;
}

/**
 * The boss rules, as switches. In a run these are imposed; here they are opt-in,
 * so a rule that caught you out mid-run can be drilled deliberately.
 */
export function BossPills({ selected, onToggle }: BossPillsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {BOSS_KINDS.map((boss) => {
        const isOn = selected.includes(boss);
        return (
          <button
            key={boss}
            onClick={() => onToggle(boss)}
            aria-pressed={isOn}
            title={BOSS_INFO[boss].detail}
            className={`inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.1em] py-[7px] pl-[10px] pr-[14px] rounded-full cursor-pointer border-[1.5px] transition-all duration-[120ms] ${
              isOn
                ? 'bg-ink border-ink text-sand'
                : 'bg-transparent border-ink/35 text-muted hover:border-ink/55 hover:text-ink'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 42 42" aria-hidden="true">
              <path
                d="M21 4 C12 4 6 10.5 6 19 C6 24 8.5 27 11 28.8 L11 33 C11 35.2 12.8 37 15 37 L27 37 C29.2 37 31 35.2 31 33 L31 28.8 C33.5 27 36 24 36 19 C36 10.5 30 4 21 4 Z"
                fill={isOn ? 'var(--color-wrong)' : 'currentColor'}
              />
              <circle cx="15.2" cy="19.5" r="3.6" fill="currentColor" />
              <circle cx="26.8" cy="19.5" r="3.6" fill="currentColor" />
            </svg>
            {BOSS_INFO[boss].name}
          </button>
        );
      })}
    </div>
  );
}
