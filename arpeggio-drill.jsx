// arpeggio-drill.jsx — Position 5 C major scale, arpeggio identification drill
// Convention: string index 0 = low E (top), 5 = high E (bottom)

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E'];
const STRING_THICKNESS = [2.4, 2.0, 1.7, 1.3, 1.0, 0.8];

// The note that marks the root of the position (1st degree of the major scale).
// Internally we still store note names because the shape was derived in C major,
// but the UI shows no letters — the user reads it as scale degrees.
const ROOT_NOTE = 'C';

// Position 5 C major scale — compact in-the-box pattern that overlaps with
// the 1st-position C major pentatonic (A minor pentatonic shape 1 at fret 5).
// Frets 4–8 only. 17 notes.
const POSITION_NOTES = [
  { s: 0, f: 5, note: 'A' },
  { s: 0, f: 7, note: 'B' },
  { s: 0, f: 8, note: 'C' },
  { s: 1, f: 5, note: 'D' },
  { s: 1, f: 7, note: 'E' },
  { s: 1, f: 8, note: 'F' },
  { s: 2, f: 5, note: 'G' },
  { s: 2, f: 7, note: 'A' },
  { s: 3, f: 4, note: 'B' },
  { s: 3, f: 5, note: 'C' },
  { s: 3, f: 7, note: 'D' },
  { s: 4, f: 5, note: 'E' },
  { s: 4, f: 6, note: 'F' },
  { s: 4, f: 8, note: 'G' },
  { s: 5, f: 5, note: 'A' },
  { s: 5, f: 7, note: 'B' },
  { s: 5, f: 8, note: 'C' },
];

// Diatonic chords of the major scale. tones = note names used internally to
// match against POSITION_NOTES (C major spelling). degrees = the scale degrees
// shown to the user on success — these are key-independent.
const CHORDS = [
  { rank: 'I',    quality: 'major',      tones: ['C','E','G'], degrees: ['1','3','5'] },
  { rank: 'ii',   quality: 'minor',      tones: ['D','F','A'], degrees: ['2','4','6'] },
  { rank: 'iii',  quality: 'minor',      tones: ['E','G','B'], degrees: ['3','5','7'] },
  { rank: 'IV',   quality: 'major',      tones: ['F','A','C'], degrees: ['4','6','1'] },
  { rank: 'V',    quality: 'major',      tones: ['G','B','D'], degrees: ['5','7','2'] },
  { rank: 'vi',   quality: 'minor',      tones: ['A','C','E'], degrees: ['6','1','3'] },
  { rank: 'vii°', quality: 'diminished', tones: ['B','D','F'], degrees: ['7','2','4'] },
];

const keyOf = (n) => `${n.s}-${n.f}`;

// ─── Fretboard ──────────────────────────────────────────────────────────────
const FRETS = [4, 5, 6, 7, 8];
const PAD_L = 60, PAD_R = 34, PAD_T = 40, PAD_B = 26;
const FRET_W = 124, STRING_GAP = 48;
const INNER_W = FRETS.length * FRET_W;
const INNER_H = 5 * STRING_GAP;
const BOARD_W = PAD_L + PAD_R + INNER_W;
const BOARD_H = PAD_T + PAD_B + INNER_H;

const fretX = (fret) => PAD_L + (fret - FRETS[0]) * FRET_W + FRET_W / 2;
const stringY = (s, invert) => PAD_T + (invert ? (5 - s) : s) * STRING_GAP;

function Fretboard({ selected, targetKeys, phase, invert, onToggle }) {
  const singleDots = [5, 7];

  return (
    <svg
      viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
      width="100%"
      style={{ maxWidth: BOARD_W, display: 'block' }}
    >
      {/* board surface */}
      <rect
        x={PAD_L - 14} y={PAD_T - 16}
        width={INNER_W + 28} height={INNER_H + 32}
        rx={8} fill="#231f1b"
      />

      {/* subtle wood grain via overlay */}
      <rect
        x={PAD_L - 14} y={PAD_T - 16}
        width={INNER_W + 28} height={INNER_H + 32}
        rx={8} fill="url(#grain)" opacity={0.4}
      />

      <defs>
        <linearGradient id="grain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a342d" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#231f1b" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1714" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* inlay dots */}
      {singleDots.map((f) => (
        <circle
          key={`dot-${f}`}
          cx={fretX(f)} cy={PAD_T + INNER_H / 2}
          r={5.5} fill="#f0eee9" opacity={0.13}
        />
      ))}

      {/* fret wires */}
      {Array.from({ length: FRETS.length + 1 }).map((_, i) => {
        const x = PAD_L + i * FRET_W;
        return (
          <line
            key={i}
            x1={x} y1={PAD_T - 16}
            x2={x} y2={PAD_T + INNER_H + 16}
            stroke="#8a857d" strokeWidth={2.2}
            strokeLinecap="round"
          />
        );
      })}

      {/* strings */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = stringY(i, invert);
        return (
          <line
            key={i}
            x1={PAD_L - 14} y1={y}
            x2={PAD_L + INNER_W + 14} y2={y}
            stroke="#d8d2c4"
            strokeWidth={STRING_THICKNESS[i]}
            opacity={0.85}
          />
        );
      })}

      {/* string letter labels */}
      {STRING_LABELS.map((label, i) => (
        <text
          key={i}
          x={PAD_L - 30} y={stringY(i, invert)}
          fill="#7d7a72" fontSize={11.5}
          textAnchor="middle" dominantBaseline="central"
          fontFamily="'JetBrains Mono', monospace"
          fontWeight={500} letterSpacing="0.04em"
        >
          {label}
        </text>
      ))}

      {/* notes (clickable) */}
      {POSITION_NOTES.map((n) => {
        const key = keyOf(n);
        const isSelected = selected.has(key);
        const isTarget = targetKeys.has(key);
        const isSuccess = phase === 'success' && isTarget;
        const isRoot = n.note === ROOT_NOTE;
        const x = fretX(n.f);
        const y = stringY(n.s, invert);

        let fill = '#f0eee9';
        let stroke = 'rgba(0,0,0,0.08)';
        let innerDotFill = '#29261b';

        if (isSuccess) {
          fill = '#4a9c7f';
          stroke = '#3a7d63';
          innerDotFill = '#ffffff';
        } else if (isSelected) {
          fill = '#e0a458';
          stroke = '#b8853d';
          innerDotFill = '#1f1a14';
        }

        return (
          <g
            key={key}
            className={`note ${isSuccess ? 'note-success' : ''}`}
            style={{ cursor: phase === 'playing' ? 'pointer' : 'default' }}
            onClick={() => onToggle(key)}
          >
            {/* generous hit area */}
            <circle cx={x} cy={y} r={24} fill="rgba(0,0,0,0)" />
            <circle
              cx={x} cy={y} r={17}
              fill={fill} stroke={stroke} strokeWidth={1.2}
            />
            {isRoot && (
              <circle
                cx={x} cy={y} r={5}
                fill={innerDotFill}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Drill app ──────────────────────────────────────────────────────────────
function pickNext(prevIdx) {
  let next;
  do { next = Math.floor(Math.random() * CHORDS.length); }
  while (next === prevIdx);
  return next;
}

function ArpeggioDrill() {
  const [chordIdx, setChordIdx] = React.useState(() => Math.floor(Math.random() * CHORDS.length));
  const [selected, setSelected] = React.useState(() => new Set());
  const [phase, setPhase] = React.useState('playing'); // 'playing' | 'success'
  const [streak, setStreak] = React.useState(0);
  const [invert, setInvert] = React.useState(() => {
    try { return localStorage.getItem('arp-invert') === '1'; } catch (e) { return false; }
  });

  React.useEffect(() => {
    try { localStorage.setItem('arp-invert', invert ? '1' : '0'); } catch (e) {}
  }, [invert]);

  const chord = CHORDS[chordIdx];

  const targetKeys = React.useMemo(() => {
    return new Set(
      POSITION_NOTES
        .filter((n) => chord.tones.includes(n.note))
        .map(keyOf)
    );
  }, [chordIdx]);

  // Auto-detect completion → flip into 'success'
  React.useEffect(() => {
    if (phase !== 'playing') return;
    if (selected.size !== targetKeys.size) return;
    for (const k of targetKeys) if (!selected.has(k)) return;

    setPhase('success');
    setStreak((s) => s + 1);
  }, [selected, phase, targetKeys]);

  // Once in 'success', wait then advance. Separate effect so the timeout
  // isn't cancelled by the phase transition that scheduled it.
  React.useEffect(() => {
    if (phase !== 'success') return;
    const t = setTimeout(() => {
      setChordIdx((idx) => pickNext(idx));
      setSelected(new Set());
      setPhase('playing');
    }, 1000);
    return () => clearTimeout(t);
  }, [phase]);

  const toggle = (key) => {
    if (phase !== 'playing') return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const skip = () => {
    if (phase !== 'playing') return;
    setStreak(0);
    setChordIdx((idx) => pickNext(idx));
    setSelected(new Set());
  };

  return (
    <div className="drill">
      <div className="top-row">
        <div className="drill-eyebrow">
          Arpeggio drill <span className="dot">·</span> Major scale <span className="dot">·</span> Position 5
        </div>
        <button
          className="flip-btn"
          onClick={() => setInvert((v) => !v)}
          title="Flip string order"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 2 L3 10 M3 2 L1.5 3.5 M3 2 L4.5 3.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 10 L9 2 M9 10 L7.5 8.5 M9 10 L10.5 8.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{invert ? 'high E up' : 'low E up'}</span>
        </button>
      </div>

      <div className="prompt">
        <div className={`rank ${phase === 'success' ? 'rank-success' : ''}`}>
          {chord.rank}
        </div>
        <div className={`sub ${phase === 'success' ? 'sub-visible' : ''}`}>
          {chord.quality} <span className="sub-sep">—</span> {chord.degrees.join('  ')}
        </div>
      </div>

      <div className="board-wrap">
        <Fretboard
          selected={selected}
          targetKeys={targetKeys}
          phase={phase}
          invert={invert}
          onToggle={toggle}
        />
      </div>

      <div className="meta-row">
        <div className="meta-left">
          <span className="meta-label">streak</span>
          <span className="meta-value">{String(streak).padStart(2, '0')}</span>
        </div>
        <div className="meta-center">
          tap every note of the&nbsp;<strong>{chord.rank}</strong>&nbsp;arpeggio
        </div>
        <button className="skip-btn" onClick={skip} disabled={phase !== 'playing'}>
          skip
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ArpeggioDrill />);
