'use client';

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, MAP_DEFAULT_ZOOM, MAP_MIN_ZOOM, MAP_MAX_ZOOM } from '@/lib/constants';
import { SpotMarker } from './SpotMarker';
import { LocationButton } from './LocationButton';
import type { Spot } from '@/types';

export interface MapViewHandle {
  getCenter: () => { lat: number; lng: number } | null;
  flyTo: (lat: number, lng: number) => void;
}

interface MapViewProps {
  spots: Spot[];
  onBoundsChange: (bounds: { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }) => void;
  onSpotClick: (spot: Spot) => void;
  placingPin?: boolean;
}

// Stores the map instance so the parent can read center
let mapInstance: L.Map | null = null;

function MapEvents({
  onBoundsChange,
}: {
  onBoundsChange: MapViewProps['onBoundsChange'];
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const emitBounds = useCallback((map: L.Map) => {
    const b = map.getBounds();
    onBoundsChange({
      sw_lat: b.getSouthWest().lat,
      sw_lng: b.getSouthWest().lng,
      ne_lat: b.getNorthEast().lat,
      ne_lng: b.getNorthEast().lng,
    });
  }, [onBoundsChange]);

  const map = useMapEvents({
    moveend() {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => emitBounds(map), 300);
    },
    zoomend() {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => emitBounds(map), 300);
    },
  });

  useEffect(() => {
    mapInstance = map;
    emitBounds(map);
  }, [map, emitBounds]);

  return null;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { spots, onBoundsChange, onSpotClick, placingPin },
  ref
) {

  useImperativeHandle(ref, () => ({
    getCenter: () => {
      if (!mapInstance) return null;
      const c = mapInstance.getCenter();
      return { lat: c.lat, lng: c.lng };
    },
    flyTo: (lat: number, lng: number) => {
      if (mapInstance) {
        mapInstance.flyTo([lat, lng], 17, { duration: 0.8 });
      }
    },
  }));

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[MAP_CENTER.lat, MAP_CENTER.lng]}
        zoom={MAP_DEFAULT_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        maxZoom={MAP_MAX_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <MapEvents onBoundsChange={onBoundsChange} />

        {spots.map((spot) => (
          <SpotMarker key={spot.id} spot={spot} onClick={() => onSpotClick(spot)} />
        ))}

      </MapContainer>

      {/* Crosshair overlay when placing pin */}
      {placingPin && (
        <div className="absolute inset-0 z-[500] pointer-events-none flex items-center justify-center">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-6 w-0.5 h-5 bg-red-600/70" />
            <div className="absolute left-1/2 -translate-x-1/2 top-3 w-0.5 h-5 bg-red-600/70" />
            {/* Horizontal line */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-6 h-0.5 w-5 bg-red-600/70" />
            <div className="absolute top-1/2 -translate-y-1/2 left-3 h-0.5 w-5 bg-red-600/70" />
            {/* Center dot */}
            <div className="w-3 h-3 bg-red-600 border-2 border-white rounded-full shadow-lg" />
          </div>
          {/* Drop shadow below pin */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-4 w-4 h-1 bg-black/20 rounded-full blur-sm" />
        </div>
      )}

      {/* Location button */}
      <LocationButton onLocate={(pos) => {
        if (mapInstance) mapInstance.flyTo([pos.lat, pos.lng], 17, { duration: 0.8 });
      }} />
    </div>
  );
});

export default MapView;
