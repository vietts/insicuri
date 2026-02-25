'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSpotDetail } from '@/hooks/useSpotDetail';
import { useAuth } from '@/hooks/useAuth';
import { DangerBadge } from '@/components/spots/DangerBadge';
import { ReportCard } from '@/components/reports/ReportCard';
import { ReportForm } from '@/components/reports/ReportForm';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function SpotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { spot, reports, loading } = useSpotDetail(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleAddReport = useCallback(() => {
    if (!user) {
      toast('Accedi per segnalare', 'info');
      router.push('/accedi');
      return;
    }
    setShowForm(true);
  }, [user, toast, router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-4">Spot non trovato</p>
        <Link href="/" className="text-red-600 font-medium">Torna alla mappa</Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-700">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{spot.title}</h1>
      </div>

      {/* Spot info */}
      <div className="bg-white px-4 py-5 space-y-3">
        <div className="flex items-center justify-between">
          <DangerBadge score={spot.danger_score} />
          <span className="text-sm text-gray-500">
            {spot.reports_count} segnalazion{spot.reports_count === 1 ? 'e' : 'i'}
          </span>
        </div>

        {spot.address && (
          <p className="text-sm text-gray-600">{spot.address}</p>
        )}

        <p className="text-xs text-gray-400">
          Creato il {formatDate(spot.created_at ?? spot.last_report_at)} · Ultima segnalazione: {formatDate(spot.last_report_at)}
        </p>
      </div>

      {/* Add report button */}
      <div className="px-4 py-3">
        <button
          onClick={handleAddReport}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Aggiungi segnalazione
        </button>
      </div>

      {/* Reports list */}
      <div className="px-4 pb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Segnalazioni</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nessuna segnalazione</p>
        ) : (
          reports.map((report) => <ReportCard key={report.id} report={report} />)
        )}
      </div>

      {/* Report form bottom sheet */}
      <BottomSheet open={showForm} onClose={() => setShowForm(false)} title="Aggiungi segnalazione">
        <ReportForm
          lat={spot.lat}
          lng={spot.lng}
          nearbySpot={{
            id: spot.id,
            lat: spot.lat,
            lng: spot.lng,
            title: spot.title,
            danger_score: spot.danger_score,
            reports_count: spot.reports_count,
            distance: 0,
          }}
          onSuccess={() => {
            setShowForm(false);
            // Reload page to show new report
            window.location.reload();
          }}
          onCancel={() => setShowForm(false)}
        />
      </BottomSheet>
    </div>
  );
}
