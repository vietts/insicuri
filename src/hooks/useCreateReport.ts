'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import type { DangerCategory } from '@/types';

interface CreateSpotParams {
  lat: number;
  lng: number;
  title: string;
  category: DangerCategory;
  severity: number;
  description?: string;
  photo_url?: string;
}

interface AddReportParams {
  spot_id: string;
  category: DangerCategory;
  severity: number;
  description?: string;
  photo_url?: string;
}

export function useCreateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSpotWithReport = useCallback(async (params: CreateSpotParams): Promise<string | null> => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: rpcError } = await supabase.rpc('insicuri_create_spot_with_report', {
      p_lat: params.lat,
      p_lng: params.lng,
      p_title: params.title,
      p_category: params.category,
      p_severity: params.severity,
      p_description: params.description ?? null,
      p_photo_url: params.photo_url ?? null,
    });

    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return null;
    }
    return data as string;
  }, []);

  const addReportToSpot = useCallback(async (params: AddReportParams): Promise<boolean> => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Devi effettuare il login');
      setLoading(false);
      return false;
    }

    const { error: insertError } = await supabase.from('insicuri_reports').insert({
      spot_id: params.spot_id,
      user_id: user.id,
      category: params.category,
      severity: params.severity,
      description: params.description ?? null,
      photo_url: params.photo_url ?? null,
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    return true;
  }, []);

  return { createSpotWithReport, addReportToSpot, loading, error };
}
