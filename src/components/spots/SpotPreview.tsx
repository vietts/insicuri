'use client';

import Link from 'next/link';
import type { Spot } from '@/types';
import { DangerBadge } from './DangerBadge';
import { formatRelativeDate } from '@/lib/utils';

interface SpotPreviewProps {
  spot: Spot;
  onAddReport?: () => void;
}

export function SpotPreview({ spot, onAddReport }: SpotPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{spot.title}</h3>
          {spot.address && (
            <p className="text-sm text-gray-500 truncate">{spot.address}</p>
          )}
        </div>
        <DangerBadge score={spot.danger_score} />
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>{spot.reports_count} segnalazion{spot.reports_count === 1 ? 'e' : 'i'}</span>
        <span>Ultima: {formatRelativeDate(spot.last_report_at)}</span>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/spot/${spot.id}`}
          className="flex-1 text-center px-4 py-2.5 bg-gray-100 text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
        >
          Dettagli
        </Link>
        {onAddReport && (
          <button
            onClick={onAddReport}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
          >
            Anch&apos;io!
          </button>
        )}
      </div>
    </div>
  );
}
