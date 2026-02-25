'use client';

import { CATEGORIES } from '@/lib/constants';
import type { DangerCategory } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryGridProps {
  selected: DangerCategory | null;
  onSelect: (category: DangerCategory) => void;
}

export function CategoryGrid({ selected, onSelect }: CategoryGridProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo di pericolo</label>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(CATEGORIES) as [DangerCategory, { label: string; icon: string }][]).map(
          ([key, { label, icon }]) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm transition',
                selected === key
                  ? 'border-red-500 bg-red-50 text-red-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="text-lg">{icon}</span>
              <span className="leading-tight">{label}</span>
            </button>
          )
        )}
      </div>
    </div>
  );
}
