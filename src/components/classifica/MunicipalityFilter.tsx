'use client';

export type MunicipalityTab = 'all' | 'Udine' | 'Tavagnacco';

interface MunicipalityFilterProps {
  active: MunicipalityTab;
  onChange: (tab: MunicipalityTab) => void;
}

const TABS: { value: MunicipalityTab; label: string }[] = [
  { value: 'all', label: 'Tutti' },
  { value: 'Udine', label: 'Udine' },
  { value: 'Tavagnacco', label: 'Tavagnacco' },
];

export function MunicipalityFilter({ active, onChange }: MunicipalityFilterProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
            active === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
