'use client';

import { cn } from '@/lib/utils';

interface SeveritySliderProps {
  value: number;
  onChange: (value: number) => void;
}

const LABELS = ['', 'Lieve', 'Moderato', 'Serio', 'Grave', 'Critico'];

export function SeveritySlider({ value, onChange }: SeveritySliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Gravità</label>
        <span className={cn(
          'text-sm font-semibold px-2 py-0.5 rounded-full',
          value <= 2 && 'bg-green-100 text-green-700',
          value === 3 && 'bg-yellow-100 text-yellow-700',
          value >= 4 && 'bg-red-100 text-red-700'
        )}>
          {value} - {LABELS[value]}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              'flex-1 h-10 rounded-lg text-sm font-semibold transition',
              n <= value
                ? n <= 2
                  ? 'bg-green-500 text-white'
                  : n === 3
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
