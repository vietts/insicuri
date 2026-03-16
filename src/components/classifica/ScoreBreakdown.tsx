'use client';

import type { NeighborhoodScore } from '@/types';

interface ScoreBreakdownProps {
  score: NeighborhoodScore;
}

function Row({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-700 font-medium w-10 text-right">{value.toFixed(1)}/{max}</span>
    </div>
  );
}

export function ScoreBreakdown({ score }: ScoreBreakdownProps) {
  const bonusCycleway = Math.min(30, score.cycleway_km * 6);
  const bonusLane = Math.min(15, score.lane_km * 3);
  const bonusShared = Math.min(5, score.shared_lane_km * 1);
  const bonusCoverage = Math.min(25, score.coverage_ratio * 100);
  const bonusContinuity = Math.min(15, score.continuity_ratio * 15);
  const bonusCorridor = score.corridor_score * 10;

  return (
    <div className="space-y-4 pt-3 border-t border-gray-100">
      {/* Bonus */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bonus</p>
        <Row label="Ciclabili dedicate" value={Math.round(bonusCycleway * 10) / 10} max={30} />
        <Row label="Corsie ciclabili" value={Math.round(bonusLane * 10) / 10} max={15} />
        <Row label="Corsie condivise" value={Math.round(bonusShared * 10) / 10} max={5} />
        <Row label="Copertura stradale" value={Math.round(bonusCoverage * 10) / 10} max={25} />
        <Row label="Continuita rete" value={Math.round(bonusContinuity * 10) / 10} max={15} />
        <Row label="Corridoi casa-lavoro" value={Math.round(bonusCorridor * 10) / 10} max={10} />
      </div>

      {/* Malus */}
      {score.malus_total > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Malus</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 w-28 shrink-0">
              {score.spots_count} segnalazioni
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full"
                style={{ width: `${Math.min(100, (score.malus_total / 30) * 100)}%` }}
              />
            </div>
            <span className="text-red-600 font-medium w-10 text-right">
              -{score.malus_total.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* Raw metrics */}
      <div className="text-[11px] text-gray-400 grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Ciclabili: {score.cycleway_km.toFixed(1)} km</span>
        <span>Corsie: {score.lane_km.toFixed(1)} km</span>
        <span>Strade: {score.total_road_km.toFixed(1)} km</span>
        <span>Copertura: {(score.coverage_ratio * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}
