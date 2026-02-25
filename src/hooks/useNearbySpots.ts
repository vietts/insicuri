'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { NEARBY_RADIUS_M } from '@/lib/constants';
import type { NearbySpot } from '@/types';

export function useNearbySpots() {
  const [nearby, setNearby] = useState<NearbySpot[]>([]);
  const [loading, setLoading] = useState(false);

  const findNearby = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc('insicuri_find_nearby_spots', {
      p_lat: lat,
      p_lng: lng,
      p_radius: NEARBY_RADIUS_M,
    });

    if (!error && data) {
      setNearby(data as NearbySpot[]);
    } else {
      setNearby([]);
    }
    setLoading(false);
    return (data as NearbySpot[]) ?? [];
  }, []);

  return { nearby, loading, findNearby };
}
