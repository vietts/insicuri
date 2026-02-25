'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { Spot } from '@/types';

interface Bounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

export function useSpots() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSpots = useCallback(async (bounds: Bounds) => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('insicuri_get_spots_in_bounds', bounds);

    if (!error && data) {
      setSpots(data as Spot[]);
    }
    setLoading(false);
  }, []);

  return { spots, loading, fetchSpots };
}
