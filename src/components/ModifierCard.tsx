import { useId } from 'react';
import { CHORDS, SEVENTH_CHORDS, positionById, splitRank } from '../lib/data';
import type { Degree } from '../lib/data';
import { modifierInfo } from '../lib/modifiers';
import type { BossKind, Modifier } from '../lib/modifiers';
import { ShapePreview } from './ShapePreview';

interface ModifierCardProps {
  modifier: Modifier;
  invert: boolean;
  /** Degrees the rules already in force take off the neck. */
  hiddenDegrees?: readonly Degree[];
  /** Staggers the entrance so the cards land one after another. */
  index: number;
  /** Odd card out on mobile: spans both columns but keeps one column's width. */
  centered?: boolean;
  /** Where this card stands once a pick has been made. */
  state?: 'idle' | 'chosen' | 'dismissed';
  /** Pixels from this card to the middle of the screen, measured on the tap. */
  flight?: { dx: number; dy: number };
  /** Collection view: the card is shown, not offered — no float, no picking. */
  showcase?: boolean;
  onChoose?: (el: HTMLElement) => void;
}

/**
 * Rush is an hourglass part-way through. Only the fill level changes between
 * ranks, so the three read as one object in three states — and a fourth rank
 * is a number in this row, not a new drawing.
 */
// Even steps, and stopping at three quarters rather than running the top bulb
// dry: an empty chamber reads as "finished" instead of "nearly out of time".
const DRAIN = [0.25, 0.5, 0.75];

// Glass geometry, all of it derived from these four numbers.
const TOP = 7,
  WAIST = 22,
  BOT = 37,
  HALF = 9,
  NECK = 1;

/** Half-width of the glass at any height — the taper both bulbs are cut from. */
const halfAt = (y: number): number =>
  y <= WAIST
    ? HALF - ((y - TOP) / (WAIST - TOP)) * (HALF - NECK)
    : NECK + ((y - WAIST) / (BOT - WAIST)) * (HALF - NECK);

function Hourglass({ rank }: { rank: number }) {
  const drained = DRAIN[Math.min(Math.max(rank, 1), DRAIN.length) - 1];
  const stroke = 'var(--color-wrong)';

  // What is left up top, and what has already gathered below.
  const ys = TOP + drained * (WAIST - TOP);
  const yb = BOT - drained * (BOT - WAIST);
  const wu = halfAt(ys);
  const wb = halfAt(yb);

  // The falling stream is spaced across whatever gap is left to fall through,
  // so it shortens as the lower bulb rises rather than clipping into it.
  const gap = yb - WAIST;
  const grains =
    gap > 9
      ? [WAIST + gap * 0.34, WAIST + gap * 0.67]
      : gap > 2.5
        ? [WAIST + gap * 0.5]
        : [];

  return (
    <svg width="58" height="58" viewBox="0 0 44 44" aria-hidden="true">
      {/* Sand still to fall reads solid; what has already run through is
          faded, so the eye tracks the mass that is disappearing. */}
      <path
        d={`M${22 - wu} ${ys}H${22 + wu}L${22 + NECK} ${WAIST}H${22 - NECK}Z`}
        fill={stroke}
      />
      <path
        d={`M${22 - wb} ${yb}H${22 + wb}L${22 + HALF} ${BOT}H${22 - HALF}Z`}
        fill={stroke}
        opacity={0.28}
      />
      <g fill={stroke}>
        {grains.map((y) => (
          <circle key={y} cx="22" cy={y} r="1" />
        ))}
      </g>

      {/* Glass over the top, so the sand sits inside it. */}
      <path
        d={`M${22 - HALF} ${TOP}H${22 + HALF}L${22 + NECK} ${WAIST}L${22 + HALF} ${BOT}H${22 - HALF}L${22 - NECK} ${WAIST}Z`}
        fill="none"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <g fill={stroke}>
        <rect x="9.5" y="3.8" width="25" height="3.4" rx="1.7" />
        <rect x="9.5" y="36.8" width="25" height="3.4" rx="1.7" />
      </g>
    </svg>
  );
}

/**
 * One icon per boss, each a different shape family so they never blur together
 * at card size: a skull, a staircase, a pentagon and a target.
 */
function BossIcon({ boss }: { boss: BossKind }) {
  const stroke = 'var(--color-wrong)';
  const common = {
    width: 58,
    height: 58,
    viewBox: '0 0 44 44',
    'aria-hidden': true,
  } as const;

  // No Mistakes: the one that ends the drill outright.
  if (boss === 'strict') {
    return (
      <svg {...common}>
        <path
          d="M22 5C12.6 5 6.3 11.8 6.3 20.7c0 5.2 2.6 8.4 5.2 10.3v4.4c0 2.3 1.9 4.2 4.2 4.2h12.6c2.3 0 4.2-1.9 4.2-4.2V31c2.6-1.9 5.2-5.1 5.2-10.3C37.7 11.8 31.4 5 22 5z"
          fill={stroke}
        />
        <circle cx="16" cy="21.3" r="3.8" fill="var(--color-ink)" />
        <circle cx="28" cy="21.3" r="3.8" fill="var(--color-ink)" />
        <path d="M22 27.6 19.9 31.8h4.2z" fill="var(--color-ink)" />
        <path
          d="M17.8 35.4v4.2M22 35.4v4.2M26.2 35.4v4.2"
          stroke="var(--color-ink)" strokeWidth="1.7"
        />
      </svg>
    );
  }

  // In Order: the arpeggio has to be climbed, not merely cleared.
  if (boss === 'ordered') {
    return (
      <svg {...common}>
        {/* Nudged onto the box centre: the stepped line's own bounds sit low
            and left of it, which reads as a misplaced icon beside the others. */}
        <g transform="translate(1.1 -1.3)">
        <path
          d="M7 35h8v-8h8v-8h8v-7"
          fill="none" stroke={stroke} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M27.2 15.4 31 11.6l3.8 3.8"
          fill="none" stroke={stroke} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        </g>
      </svg>
    );
  }

  // Pentatonic Only: five degrees left standing — so, five sides.
  if (boss === 'pentatonic') {
    return (
      <svg {...common}>
        {/* A regular pentagon's bounding box is not centred on its own mass —
            the apex sits closer in than the base — so it needs nudging down or
            it hangs high against the other icons. */}
        <g transform="translate(0 1.45)">
        <path
          d="M22 7 36.3 17.4 30.8 34.1H13.2L7.7 17.4z"
          fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round"
        />
        <g fill={stroke}>
          <circle cx="22" cy="7" r="2.8" />
          <circle cx="36.3" cy="17.4" r="2.8" />
          <circle cx="30.8" cy="34.1" r="2.8" />
          <circle cx="13.2" cy="34.1" r="2.8" />
          <circle cx="7.7" cy="17.4" r="2.8" />
        </g>
        </g>
      </svg>
    );
  }

  // Root Only: one note on the whole neck.
  return (
    <svg {...common}>
      <circle cx="22" cy="22" r="15" fill="none" stroke={stroke} strokeWidth="2.2" />
      <circle cx="22" cy="22" r="4.2" fill={stroke} />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   The card is drawn in one fixed coordinate space rather than laid out with
   flex. Every card then reserves exactly the same content space — same visual
   slot, same name baseline, same three lines for the detail — whatever it is
   showing and however wide it ends up on screen. Text scales with the card
   instead of reflowing, so a narrow phone column and a desktop row are the
   same drawing at two sizes.
   ------------------------------------------------------------------------- */
const CARD_W = 180;
const CARD_H = 225;
const BAND_H = 22;
const PAD_X = 14;
const SLOT_Y = 23;
const SLOT_H = 68;
const ICON = 58;
const NAME_BASE = 119;
const DETAIL_BASE = 145;
const DETAIL_LEADING = 15;
/** Reserved whether or not a card uses them — this is the "same space" part. */
const DETAIL_LINES = 3;
const DETAIL_SIZE = 10.5;

/**
 * JetBrains Mono advances exactly 0.6em, so wrapping the detail by character
 * count is exact rather than an estimate. SVG will not wrap text itself, and
 * guessing at proportional metrics is what makes hand-wrapped SVG text brittle.
 */
const DETAIL_COLS = Math.floor((CARD_W - PAD_X * 2) / (DETAIL_SIZE * 0.6));

function wrapMono(text: string, cols: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= cols) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, DETAIL_LINES);
}

/** Five families, separated on colour, texture, edge and inversion. */
const FAMILY: Record<
  Modifier['kind'],
  {
    label: string;
    fill: string;
    stroke: string;
    band: string;
    bandInk: string;
    name: string;
    detail: string;
  }
> = {
  chord: {
    label: 'Chord',
    fill: 'var(--color-sand)',
    stroke: 'rgba(41, 38, 27, 0.2)',
    band: 'var(--color-amber)',
    bandInk: 'var(--color-ink)',
    name: 'var(--color-ink)',
    detail: 'var(--color-muted)',
  },
  seventh: {
    label: 'Seventh',
    fill: 'var(--color-sand)',
    stroke: 'rgba(193, 85, 31, 0.45)',
    band: 'var(--color-seventh)',
    bandInk: 'var(--color-sand)',
    name: 'var(--color-ink)',
    detail: 'var(--color-muted)',
  },
  position: {
    label: 'Position',
    fill: 'var(--color-sand)',
    stroke: 'rgba(41, 38, 27, 0.2)',
    band: 'var(--color-ink)',
    bandInk: 'var(--color-sand)',
    name: 'var(--color-ink)',
    detail: 'var(--color-muted)',
  },
  rush: {
    label: 'Rush',
    fill: 'var(--color-sand)',
    stroke: 'rgba(185, 64, 64, 0.4)',
    band: 'var(--color-wrong)',
    bandInk: 'var(--color-sand)',
    name: 'var(--color-ink)',
    detail: 'var(--color-muted)',
  },
  boss: {
    label: 'Boss',
    fill: 'var(--color-ink)',
    stroke: 'var(--color-wrong)',
    band: 'var(--color-wrong)',
    bandInk: 'var(--color-sand)',
    name: 'var(--color-sand)',
    detail: 'rgba(240, 238, 233, 0.7)',
  },
};

/** Rush is taped off along the top — a bargain, not an imposition. */
function HazardStripe() {
  const ticks = [];
  for (let x = -14; x < CARD_W + 14; x += 10) {
    ticks.push(<path key={x} d={`M${x} 9L${x + 5} 9L${x + 12} 2L${x + 7} 2Z`} />);
  }
  return (
    <g fill="var(--color-wrong)" opacity={0.85}>
      {ticks}
    </g>
  );
}

/** What the modifier does, at a glance — drawn into the card's visual slot. */
function CardVisual({
  modifier,
  invert,
  hiddenDegrees,
}: {
  modifier: Modifier;
  invert: boolean;
  hiddenDegrees?: readonly Degree[];
}) {
  const iconY = SLOT_Y + (SLOT_H - ICON) / 2;

  if (modifier.kind === 'position') {
    const p = positionById(modifier.positionId);
    // A nested viewport, so the preview keeps its own 76×52 ratio and centres
    // itself inside the slot rather than stretching to it.
    return (
      <svg x={(CARD_W - 100) / 2} y={SLOT_Y} width={100} height={SLOT_H}>
        <ShapePreview
          frets={p.frets}
          notes={p.notes}
          invert={invert}
          hiddenDegrees={hiddenDegrees}
        />
      </svg>
    );
  }

  if (modifier.kind === 'chord' || modifier.kind === 'seventh') {
    const c =
      modifier.kind === 'seventh'
        ? SEVENTH_CHORDS[modifier.chordIdx]
        : CHORDS[modifier.chordIdx];
    const { stem, suffix } = splitRank(c.rank);
    return (
      <text
        x={CARD_W / 2}
        y={71}
        textAnchor="middle"
        fontFamily="'Instrument Serif', Georgia, serif"
        fontStyle="italic"
        fontSize={42}
        fill="var(--color-amber)"
      >
        {stem}
        {suffix && <tspan fill="var(--color-seventh)">{suffix}</tspan>}
      </text>
    );
  }

  return (
    <g transform={`translate(${(CARD_W - ICON) / 2} ${iconY})`}>
      {modifier.kind === 'boss' ? (
        <BossIcon boss={modifier.boss} />
      ) : (
        <Hourglass rank={modifier.rank} />
      )}
    </g>
  );
}

/** The app's mark, used as the pattern on the back of every card. */
function CardBack() {
  return (
    <span className="card-face card-back bg-ink flex items-center justify-center overflow-hidden">
      {/* The mark's own opacities are tuned for a full-contrast icon; as a
          watermark each band is dialled down separately, so the notes stay
          readable as a climb instead of the whole thing fading to nothing. */}
      <svg viewBox="0 0 400 320" className="w-[62%] h-auto" aria-hidden="true">
        <g stroke="var(--color-sand)" opacity={0.07} strokeWidth={5}>
          <path d="M112 8V312" />
          <path d="M200 8V312" />
          <path d="M288 8V312" />
        </g>
        <g stroke="var(--color-sand)" opacity={0.13} strokeLinecap="round">
          <path d="M24 40H376" strokeWidth={3} />
          <path d="M24 120H376" strokeWidth={4.5} />
          <path d="M24 200H376" strokeWidth={6} />
          <path d="M24 280H376" strokeWidth={8} />
        </g>
        <g fill="var(--color-sand)" opacity={0.26}>
          <circle cx="68" cy="280" r="24" />
          <circle cx="156" cy="200" r="24" />
          <circle cx="244" cy="120" r="24" />
          <circle cx="332" cy="40" r="24" />
        </g>
      </svg>
    </span>
  );
}

// Each card hangs on its own cycle, so the three never gyrate together. The
// periods are deliberately non-harmonic: equal ones would hold any head start
// forever and still read as one block moving.
const FLOAT = [
  { dur: 7400, lead: 0, lift: 3, tiltX: 3, tiltY: 4 },
  { dur: 8600, lead: 420, lift: 3.5, tiltX: 3.75, tiltY: 3.25 },
  { dur: 7900, lead: 800, lift: 2.5, tiltX: 2.5, tiltY: 4.5 },
];

export function ModifierCard({
  modifier,
  invert,
  hiddenDegrees,
  index,
  centered = false,
  state = 'idle',
  flight,
  showcase = false,
  onChoose,
}: ModifierCardProps) {
  // useId contains colons, which are awkward inside url(#…) references.
  const uid = useId().replace(/:/g, '');
  const clipId = `card${uid}`;
  const { name, detail } = modifierInfo(modifier);
  const family = FAMILY[modifier.kind];
  const lines = wrapMono(detail, DETAIL_COLS);
  const float = FLOAT[index % FLOAT.length];

  return (
    <button
      onClick={(e) => onChoose?.(e.currentTarget)}
      disabled={showcase || state !== 'idle'}
      aria-label={`${name} — ${detail}`}
      // One fixed ratio for every card, whatever it holds and however wide the
      // column it lands in — a deck of one shape.
      className={`group relative block aspect-[4/5] w-full sm:w-[180px] ${
        showcase ? 'cursor-default' : 'modifier-card cursor-pointer'
      } ${
        centered ? 'max-sm:col-span-2 max-sm:w-[calc(50%-6px)] max-sm:mx-auto' : ''
      } ${state === 'chosen' ? 'card-chosen' : ''} ${
        state === 'dismissed' ? 'card-dismissed' : ''
      }`}
      style={{
        ['--card-delay' as string]: `${index * 90}ms`,
        ['--float-dur' as string]: `${float.dur}ms`,
        ['--float-lead' as string]: `${float.lead}ms`,
        ['--float-lift' as string]: `${float.lift}px`,
        ['--tilt-x' as string]: `${float.tiltX}deg`,
        ['--tilt-y' as string]: `${float.tiltY}deg`,
        ['--dx' as string]: `${flight?.dx ?? 0}px`,
        ['--dy' as string]: `${flight?.dy ?? 0}px`,
      }}
    >
      {/* The turning part. The flight lives on the button outside it. */}
      <span className="card-spinner">
        <span className="card-face">
          <svg
            viewBox={`0 0 ${CARD_W} ${CARD_H}`}
            className="block w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect
                  x={1}
                  y={1}
                  width={CARD_W - 2}
                  height={CARD_H - 2}
                  rx={17}
                />
              </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
              <rect width={CARD_W} height={CARD_H} fill={family.fill} />
              {modifier.kind === 'rush' && <HazardStripe />}
              {/* Position cards are mounted rather than printed on: a hairline
                  inside the border, so the card reads as a framed view of
                  somewhere on the neck. */}
              {modifier.kind === 'position' && (
                <rect
                  x={7}
                  y={7}
                  width={CARD_W - 14}
                  height={CARD_H - 14}
                  rx={12}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeOpacity={0.15}
                />
              )}

              <CardVisual
                modifier={modifier}
                invert={invert}
                hiddenDegrees={hiddenDegrees}
              />

              <text
                x={CARD_W / 2}
                y={NAME_BASE}
                textAnchor="middle"
                fontFamily="'Instrument Serif', Georgia, serif"
                fontStyle="italic"
                fontSize={22}
                fill={family.name}
              >
                {name}
              </text>

              {lines.map((line, i) => (
                <text
                  key={i}
                  x={CARD_W / 2}
                  y={DETAIL_BASE + i * DETAIL_LEADING}
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', ui-monospace, monospace"
                  fontSize={DETAIL_SIZE}
                  fill={family.detail}
                >
                  {line}
                </text>
              ))}

              {/* Every card names its family in the same place — the band is
                  what turns five treatments into one deck. */}
              <rect
                y={CARD_H - BAND_H}
                width={CARD_W}
                height={BAND_H}
                fill={family.band}
              />
              <text
                x={CARD_W / 2 + 0.8}
                y={CARD_H - BAND_H / 2 + 3}
                textAnchor="middle"
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                fontSize={8.5}
                fontWeight={600}
                letterSpacing="1.55"
                fill={family.bandInk}
              >
                {family.label.toUpperCase()}
              </text>
            </g>

            {/* Drawn last and outside the clip, so the border sits over the
                band rather than being trimmed by it. */}
            <rect
              x={1}
              y={1}
              width={CARD_W - 2}
              height={CARD_H - 2}
              rx={17}
              fill="none"
              strokeWidth={2}
              stroke={family.stroke}
              className={`transition-[stroke] duration-150 ${
                state === 'chosen'
                  ? 'stroke-amber'
                  : showcase
                    ? ''
                    : 'group-hover:stroke-amber'
              }`}
            />
          </svg>
        </span>
        <CardBack />
      </span>
    </button>
  );
}
