'use client';

import { useState, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Permesso negato'
            : 'Impossibile ottenere la posizione'
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { position, loading, error, locate };
}
