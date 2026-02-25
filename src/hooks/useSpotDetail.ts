'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import type { Spot, Report } from '@/types';

export function useSpotDetail(spotId: string) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const [spotRes, reportsRes] = await Promise.all([
        supabase.from('insicuri_spots').select('*').eq('id', spotId).single(),
        supabase
          .from('insicuri_reports')
          .select('*')
          .eq('spot_id', spotId)
          .order('created_at', { ascending: false }),
      ]);

      if (spotRes.data) setSpot(spotRes.data as Spot);
      if (reportsRes.data) setReports(reportsRes.data as Report[]);
      setLoading(false);
    }

    load();
  }, [spotId]);

  return { spot, reports, loading };
}
