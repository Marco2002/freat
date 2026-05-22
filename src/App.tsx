import { useState } from 'react';
import { MenuPage } from './MenuPage';
import { PositionSelect } from './PositionSelect';
import { ArpeggioDrill } from './ArpeggioDrill';
import { TheoryPage } from './TheoryPage';

type Page = 'menu' | 'select' | 'drill' | 'theory';

export default function App() {
  const [page, setPage] = useState<Page>('menu');
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

  if (page === 'menu') {
    return <MenuPage onPractice={() => setPage('select')} onTheory={() => setPage('theory')} />;
  }

  if (page === 'select') {
    return (
      <PositionSelect
        selected={selectedPositionIds}
        onToggle={togglePosition}
        selectedChordIndices={selectedChordIndices}
        onToggleChord={toggleChord}
        onBack={() => setPage('menu')}
        onStart={() => setPage('drill')}
      />
    );
  }

  if (page === 'theory') {
    return <TheoryPage onBack={() => setPage('menu')} />;
  }

  return (
    <ArpeggioDrill
      selectedPositionIds={selectedPositionIds}
      selectedChordIndices={selectedChordIndices}
      onBack={() => setPage('select')}
    />
  );
}
