'use client';

const ITEMS = [
  { label: 'Ciclabile dedicata', color: '#16a34a', dash: '' },
  { label: 'Corsia ciclabile', color: '#2563eb', dash: '6 3' },
  { label: 'Corsia condivisa', color: '#f59e0b', dash: '3 3' },
] as const;

export function CyclingLegend({ visible }: { visible: boolean }) {
  return (
    <div
      className={`absolute bottom-20 left-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2.5 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Piste ciclabili</p>
      <div className="space-y-1.5">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <svg width="24" height="4" className="shrink-0">
              <line
                x1="0" y1="2" x2="24" y2="2"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={item.dash || undefined}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xs text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
