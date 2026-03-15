'use client';

interface CyclingToggleProps {
  active: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function CyclingToggle({ active, loading, onClick }: CyclingToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-16 right-4 z-[1000] w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition ${
        active
          ? 'bg-green-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100'
      }`}
      title="Mostra piste ciclabili"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none" />
          <path d="M12 17.5V14l-3-3 4-3 2 3h3" />
        </svg>
      )}
    </button>
  );
}
