'use client';

import { useState } from 'react';
import type { NeighborhoodScore, Neighborhood } from '@/types';
import { getScoreLabel, getScoreTextColor, getScoreBg } from '@/lib/constants';
import { ScoreBar } from './ScoreBar';
import { ScoreBreakdown } from './ScoreBreakdown';

interface NeighborhoodCardProps {
  rank: number;
  score: NeighborhoodScore;
  neighborhood: Neighborhood;
}

export function NeighborhoodCard({ rank, score, neighborhood }: NeighborhoodCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded((prev) => !prev)}
      className="w-full bg-white rounded-xl px-4 py-3.5 text-left transition hover:shadow-sm active:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        {/* Rank */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
            rank <= 3 ? getScoreBg(score.score) : 'bg-gray-300'
          }`}
        >
          {rank}
        </div>

        {/* Name + municipality */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{neighborhood.name}</p>
          <p className="text-xs text-gray-400">{neighborhood.municipality}</p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${getScoreTextColor(score.score)}`}>
            {Math.round(score.score)}
          </p>
          <p className={`text-[10px] font-medium ${getScoreTextColor(score.score)}`}>
            {getScoreLabel(score.score)}
          </p>
        </div>

        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Score bar */}
      <div className="mt-2.5">
        <ScoreBar score={score.score} />
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-3">
          <ScoreBreakdown score={score} />
        </div>
      )}
    </button>
  );
}
