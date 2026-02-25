'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import { useEffect } from 'react';

interface LocationButtonProps {
  onLocate: (pos: { lat: number; lng: number }) => void;
}

export function LocationButton({ onLocate }: LocationButtonProps) {
  const { position, loading, locate } = useGeolocation();

  useEffect(() => {
    if (position) {
      onLocate(position);
    }
  }, [position, onLocate]);

  return (
    <button
      onClick={locate}
      disabled={loading}
      className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition disabled:opacity-50"
      title="La mia posizione"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
        </svg>
      )}
    </button>
  );
}
