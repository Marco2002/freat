import { useState } from 'react';
import { MenuPage } from './pages/MenuPage';
import { PositionSelect } from './pages/PositionSelect';
import { ArpeggioDrill } from './pages/ArpeggioDrill';
import { GameSetup } from './pages/GameSetup';
import { ArpeggioGame } from './pages/ArpeggioGame';
import { TheoryPage } from './pages/TheoryPage';
import { CollectionPage } from './pages/CollectionPage';
import { useRoute } from './hooks/useRoute';
import { DEFAULT_RUN_CHORDS, DEFAULT_RUN_POSITION, RUN_CHORDS } from './lib/game';
import { isUnlocked, pruneBosses } from './lib/modifiers';
import type { BossKind } from './lib/modifiers';

export default function App() {
  const [screen, navigate] = useRoute();
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([3]);
  const [selectedChordIndices, setSelectedChordIndices] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  // Boss rules switched on for practice. In a run these are imposed instead.
  const [practiceBosses, setPracticeBosses] = useState<BossKind[]>([]);
  // The run's opening hand. It starts on a sensible one — position 1 with the
  // I, IV and V — so Play can be a single tap, and the picker is a change
  // rather than a form to fill in.
  const [runPositionId, setRunPositionId] = useState<number | null>(
    DEFAULT_RUN_POSITION
  );
  const [runChordIndices, setRunChordIndices] =
    useState<number[]>(DEFAULT_RUN_CHORDS);
  // Whether a hand was actually chosen this session. A cold load of the run URL
  // has no run to resume, so it goes to the picker rather than dealing itself
  // one off the defaults.
  const [handChosen, setHandChosen] = useState(false);
  // Bumped to start a fresh run on the same hand — remounting the game is what
  // resets lives, score and clock.
  const [runKey, setRunKey] = useState(0);

  const togglePosition = (id: number) => {
    setSelectedPositionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Triads and sevenths share one selection: a seventh is its own chord to
  // drill, so it switches on and off independently of the triad it is built on.
  const toggleChord = (idx: number) => {
    setSelectedChordIndices((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  const toggleBoss = (boss: BossKind) => {
    setPracticeBosses((prev) => {
      // Switching one off takes anything built on top of it with it, so the
      // set of rules is always one a run could actually reach.
      if (prev.includes(boss))
        return pruneBosses(prev.filter((b) => b !== boss));
      const loadout = { positions: [], roster: [], rushRank: 0, bosses: prev };
      return isUnlocked(loadout, boss) ? [...prev, boss] : prev;
    });
  };

  const toggleRunChord = (idx: number) => {
    setRunChordIndices((prev) =>
      prev.includes(idx)
        ? prev.filter((x) => x !== idx)
        : prev.length < RUN_CHORDS
          ? [...prev, idx]
          : prev
    );
  };

  const backToMenu = () => navigate('menu');

  if (screen === 'menu') {
    return (
      <MenuPage
        onGame={() => navigate('game-setup')}
        onPractice={() => navigate('positions')}
        onTheory={() => navigate('theory')}
        onCollection={() => navigate('collection')}
      />
    );
  }

  if (screen === 'game-setup') {
    return (
      <GameSetup
        positionId={runPositionId}
        onPickPosition={setRunPositionId}
        chordIndices={runChordIndices}
        onToggleChord={toggleRunChord}
        onBack={backToMenu}
        onStart={() => {
          setHandChosen(true);
          setRunKey((k) => k + 1);
          navigate('game');
        }}
      />
    );
  }

  if (screen === 'game') {
    // A run cannot be deep-linked into: reloading /arpeggio/game has no run to
    // resume, so it falls back to choosing a hand.
    if (
      !handChosen ||
      runPositionId === null ||
      runChordIndices.length !== RUN_CHORDS
    ) {
      return (
        <GameSetup
          positionId={runPositionId}
          onPickPosition={setRunPositionId}
          chordIndices={runChordIndices}
          onToggleChord={toggleRunChord}
          onBack={backToMenu}
          onStart={() => {
            setHandChosen(true);
            setRunKey((k) => k + 1);
            navigate('game', true);
          }}
        />
      );
    }
    return (
      <ArpeggioGame
        key={runKey}
        positionId={runPositionId}
        chordIndices={runChordIndices}
        onQuit={() => navigate('game-setup')}
        onPlayAgain={() => navigate('game-setup')}
        onMenu={backToMenu}
      />
    );
  }

  if (screen === 'theory') {
    return <TheoryPage onBack={backToMenu} />;
  }

  if (screen === 'collection') {
    return <CollectionPage onBack={backToMenu} />;
  }

  if (screen === 'positions') {
    return (
      <PositionSelect
        selected={selectedPositionIds}
        onToggle={togglePosition}
        selectedChordIndices={selectedChordIndices}
        onToggleChord={toggleChord}
        bosses={practiceBosses}
        onToggleBoss={toggleBoss}
        onBack={backToMenu}
        onStart={() => navigate('drill')}
      />
    );
  }

  return (
    <ArpeggioDrill
      selectedPositionIds={selectedPositionIds}
      selectedChordIndices={selectedChordIndices}
      bosses={practiceBosses}
      // The drill is reached through position select, so that is where back
      // goes — including on a cold load of /arpeggio/drill, where it is the
      // screen the player would have come through.
      onBack={() => navigate('positions')}
    />
  );
}
