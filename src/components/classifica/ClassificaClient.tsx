'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase';
import type { Neighborhood, NeighborhoodScore } from '@/types';
import { MunicipalityFilter, type MunicipalityTab } from './MunicipalityFilter';
import { NeighborhoodCard } from './NeighborhoodCard';

interface ScoreWithNeighborhood {
  score: NeighborhoodScore;
  neighborhood: Neighborhood;
}

export function ClassificaClient() {
  const [data, setData] = useState<ScoreWithNeighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<MunicipalityTab>('all');
  const [computedAt, setComputedAt] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: scores } = await supabase
        .from('insicuri_neighborhood_scores')
        .select('*, insicuri_neighborhoods(*)')
        .order('score', { ascending: false });

      if (scores && scores.length > 0) {
        const items: ScoreWithNeighborhood[] = scores
          .filter((s: NeighborhoodScore) => s.insicuri_neighborhoods)
          .map((s: NeighborhoodScore) => ({
            score: s,
            neighborhood: s.insicuri_neighborhoods as Neighborhood,
          }));

        setData(items);
        setComputedAt(scores[0].computed_at);
      }

      setLoading(false);
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'all') return data;
    return data.filter((d) => d.neighborhood.municipality === tab);
  }, [data, tab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-gray-400 text-sm">Nessun dato disponibile ancora.</p>
        <p className="text-gray-400 text-xs mt-1">I punteggi vengono calcolati quotidianamente.</p>
      </div>
    );
  }

  const formattedDate = computedAt
    ? new Date(computedAt).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="px-4">
        <MunicipalityFilter active={tab} onChange={setTab} />
      </div>

      {/* Timestamp */}
      {formattedDate && (
        <p className="px-4 text-xs text-gray-400">Aggiornata il {formattedDate}</p>
      )}

      {/* List */}
      <div className="px-4 space-y-2 pb-8">
        {filtered.map((item, i) => (
          <NeighborhoodCard
            key={item.score.neighborhood_id}
            rank={i + 1}
            score={item.score}
            neighborhood={item.neighborhood}
          />
        ))}
      </div>
    </div>
  );
}
