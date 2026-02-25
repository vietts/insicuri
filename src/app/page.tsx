'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useRef } from 'react';
import { useSpots } from '@/hooks/useSpots';
import { useNearbySpots } from '@/hooks/useNearbySpots';
import { useAuth } from '@/hooks/useAuth';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SpotPreview } from '@/components/spots/SpotPreview';
import { ReportForm } from '@/components/reports/ReportForm';
import { SearchBar } from '@/components/map/SearchBar';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';
import type { Spot, NearbySpot } from '@/types';
import type { MapViewHandle } from '@/components/map/MapView';

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

type Mode = 'browse' | 'preview' | 'place-pin' | 'nearby-choice' | 'report';

export default function HomePage() {
  const { spots, fetchSpots } = useSpots();
  const { findNearby } = useNearbySpots();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const mapRef = useRef<MapViewHandle>(null);

  const [mode, setMode] = useState<Mode>('browse');
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [pinPosition, setPinPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbySpot, setNearbySpot] = useState<NearbySpot | null>(null);

  const handleBoundsChange = useCallback(
    (bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) => {
      fetchSpots(bounds);
    },
    [fetchSpots]
  );

  const handleSpotClick = useCallback((spot: Spot) => {
    if (mode === 'place-pin') return;
    setSelectedSpot(spot);
    setMode('preview');
  }, [mode]);

  // Search result: fly to location
  const handleSearchSelect = useCallback((lat: number, lng: number) => {
    mapRef.current?.flyTo?.(lat, lng);
  }, []);

  // FAB: enter pin placement mode
  const handleFabClick = useCallback(() => {
    if (!user) {
      toast('Accedi per segnalare un pericolo', 'info');
      router.push('/accedi');
      return;
    }
    setMode('place-pin');
  }, [user, toast, router]);

  // Confirm crosshair position
  const handleConfirmPosition = useCallback(async () => {
    const center = mapRef.current?.getCenter();
    if (!center) return;

    setPinPosition(center);

    const results = await findNearby(center.lat, center.lng);
    if (results.length > 0) {
      setNearbySpot(results[0]);
      setMode('nearby-choice');
    } else {
      setNearbySpot(null);
      setMode('report');
    }
  }, [findNearby]);

  // From spot preview: add report to existing spot
  const handleAddReport = useCallback(
    (spot: Spot) => {
      if (!user) {
        toast('Accedi per segnalare', 'info');
        router.push('/accedi');
        return;
      }
      setNearbySpot({
        id: spot.id,
        lat: spot.lat,
        lng: spot.lng,
        title: spot.title,
        danger_score: spot.danger_score,
        reports_count: spot.reports_count,
        distance: 0,
      });
      setPinPosition({ lat: spot.lat, lng: spot.lng });
      setMode('report');
    },
    [user, toast, router]
  );

  const resetMode = useCallback(() => {
    setMode('browse');
    setSelectedSpot(null);
    setPinPosition(null);
    setNearbySpot(null);
  }, []);

  return (
    <div className="h-dvh w-full relative overflow-hidden">
      {/* Map */}
      <MapView
        ref={mapRef}
        spots={spots}
        onBoundsChange={handleBoundsChange}
        onSpotClick={handleSpotClick}
        placingPin={mode === 'place-pin'}
      />

      {/* Header bar: logo + search */}
      {mode === 'browse' && (
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-start gap-2">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 flex items-center gap-0.5 shrink-0">
            <span className="text-red-600 font-bold text-lg">In</span>
            <span className="font-bold text-gray-900 text-lg">Sicuri</span>
          </div>
          <SearchBar onSelect={handleSearchSelect} />
          {user ? (
            <button
              onClick={() => router.push('/profilo')}
              className="shrink-0 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-sm font-bold text-red-600 hover:bg-white transition"
              title={user.email ?? ''}
            >
              {(user.user_metadata?.display_name ?? user.email ?? '?')[0].toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => router.push('/accedi')}
              className="shrink-0 bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-3 py-2 text-sm text-gray-700 hover:bg-white transition"
            >
              Accedi
            </button>
          )}
        </div>
      )}

      {/* Placement mode UI */}
      {mode === 'place-pin' && (
        <>
          <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-center">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-4 py-2.5">
              <p className="text-sm font-medium text-gray-900 text-center">Sposta la mappa per posizionare il pin</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-4 right-4 z-[1000] flex gap-3">
            <button
              onClick={resetMode}
              className="flex-1 bg-white/95 backdrop-blur-sm text-gray-700 rounded-full py-3.5 shadow-xl font-semibold text-sm hover:bg-white transition"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmPosition}
              className="flex-1 bg-red-600 text-white rounded-full py-3.5 shadow-xl font-semibold text-sm hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Conferma posizione
            </button>
          </div>
        </>
      )}

      {/* FAB (browse mode only) */}
      {mode === 'browse' && (
        <button
          onClick={handleFabClick}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white rounded-full px-6 py-3.5 shadow-xl font-semibold text-sm hover:bg-red-700 active:bg-red-800 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Segna punto pericoloso
        </button>
      )}

      {/* Spot Preview */}
      <BottomSheet open={mode === 'preview' && !!selectedSpot} onClose={resetMode}>
        {selectedSpot && (
          <SpotPreview spot={selectedSpot} onAddReport={() => handleAddReport(selectedSpot)} />
        )}
      </BottomSheet>

      {/* Nearby: existing spot found */}
      <BottomSheet open={mode === 'nearby-choice'} onClose={resetMode} title="Punto gia segnalato">
        {nearbySpot && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Qualcuno ha gia segnalato un pericolo a <strong>{Math.round(nearbySpot.distance)}m</strong> da qui.
              Puoi aggiungere la tua segnalazione per confermarlo.
            </p>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="font-medium text-gray-900">{nearbySpot.title}</p>
              <p className="text-sm text-gray-500">
                {nearbySpot.reports_count} persone hanno segnalato
              </p>
            </div>
            <button
              onClick={() => setMode('report')}
              className="w-full px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Confermo, aggiungi la mia segnalazione
            </button>
            <button
              onClick={() => {
                setNearbySpot(null);
                setMode('report');
              }}
              className="w-full px-4 py-2.5 text-gray-500 text-sm hover:text-gray-700 transition"
            >
              No, il mio punto e diverso - crea nuovo
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Report Form */}
      <BottomSheet
        open={mode === 'report'}
        onClose={resetMode}
        title={nearbySpot ? 'La tua segnalazione' : 'Nuovo punto pericoloso'}
      >
        {pinPosition && (
          <ReportForm
            lat={pinPosition.lat}
            lng={pinPosition.lng}
            nearbySpot={nearbySpot}
            onSuccess={() => resetMode()}
            onCancel={resetMode}
          />
        )}
      </BottomSheet>
    </div>
  );
}
