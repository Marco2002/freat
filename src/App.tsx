import { useState } from 'react';
import { MenuPage } from './pages/MenuPage';
import { PositionSelect } from './pages/PositionSelect';
import { ArpeggioDrill } from './pages/ArpeggioDrill';
import { TheoryPage } from './pages/TheoryPage';
import { NoteFinderDrill } from './pages/NoteFinderDrill';
import { NoteFinderTheory } from './pages/NoteFinderTheory';
import { useRoute } from './hooks/useRoute';
import { menuOf } from './lib/routes';

export default function App() {
  const [route, navigate] = useRoute();
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>([3]);
  const [selectedChordIndices, setSelectedChordIndices] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const togglePosition = (id: number) => {
    setSelectedPositionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleChord = (idx: number) => {
    setSelectedChordIndices((prev) =>
      prev.includes(idx) ? prev.filter((x) => x !== idx) : [...prev, idx]
    );
  };

  // Going back always lands on the menu already showing the mode just left.
  const backToMenu = () => navigate(menuOf(route.mode));
  const { screen, mode } = route;

  if (screen === 'menu') {
    return (
      <MenuPage
        mode={mode}
        // Flipping the carousel is not a new screen, so it replaces rather than
        // stacking an entry the back button would have to walk through.
        onModeChange={(next) => navigate(menuOf(next), true)}
        onPractice={() =>
          navigate(
            mode === 'arpeggio'
              ? { screen: 'positions', mode }
              : { screen: 'drill', mode }
          )
        }
        onTheory={() => navigate({ screen: 'theory', mode })}
      />
    );
  }

  if (screen === 'theory') {
    return mode === 'arpeggio' ? (
      <TheoryPage onBack={backToMenu} />
    ) : (
      <NoteFinderTheory onBack={backToMenu} />
    );
  }

  if (screen === 'positions') {
    return (
      <PositionSelect
        selected={selectedPositionIds}
        onToggle={togglePosition}
        selectedChordIndices={selectedChordIndices}
        onToggleChord={toggleChord}
        onBack={backToMenu}
        onStart={() => navigate({ screen: 'drill', mode })}
      />
    );
  }

  if (mode === 'note-finder') {
    return <NoteFinderDrill onBack={backToMenu} />;
  }

  return (
    <ArpeggioDrill
      selectedPositionIds={selectedPositionIds}
      selectedChordIndices={selectedChordIndices}
      // The drill is reached through position select, so that is where back
      // goes — including on a cold load of /arpeggio/drill, where it is the
      // screen the player would have come through.
      onBack={() => navigate({ screen: 'positions', mode })}
    />
  );
}
