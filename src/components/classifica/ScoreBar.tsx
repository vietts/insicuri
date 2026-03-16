'use client';

import { getScoreBg } from '@/lib/constants';

interface ScoreBarProps {
  score: number;
}

export function ScoreBar({ score }: ScoreBarProps) {
  return (
    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${getScoreBg(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
