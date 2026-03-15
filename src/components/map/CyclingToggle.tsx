'use client';

import { useState, useEffect } from 'react';

interface CyclingToggleProps {
  active: boolean;
  loading?: boolean;
  onClick: () => void;
}

export function CyclingToggle({ active, loading, onClick }: CyclingToggleProps) {
  const [showHint, setShowHint] = useState(true);

  // Auto-hide hint after 4s
  useEffect(() => {
    if (!showHint) return;
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, [showHint]);

  // Hide hint on first click
  const handleClick = () => {
    setShowHint(false);
    onClick();
  };

  return (
    <div className="absolute top-16 right-4 z-[1000] flex items-center gap-2">
      {/* Hint banner */}
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-1.5 text-xs font-medium text-gray-700 whitespace-nowrap transition-all duration-500 ${
          showHint ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        Mostra ciclabili
      </div>

      {/* Toggle button */}
      <button
        onClick={handleClick}
        className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          active
            ? 'bg-green-600 text-white scale-110'
            : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 animate-[pulse-subtle_2s_ease-in-out_3]'
        }`}
        title="Mostra piste ciclabili"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="5.5" cy="17.5" r="3.5" />
            <circle cx="18.5" cy="17.5" r="3.5" />
            <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" stroke="none" />
            <path d="M12 17.5V14l-3-3 4-3 2 3h3" />
          </svg>
        )}
      </button>
    </div>
  );
}
