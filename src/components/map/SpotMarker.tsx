'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { getDangerColor } from '@/lib/constants';
import type { Spot } from '@/types';

interface SpotMarkerProps {
  spot: Spot;
  onClick: () => void;
}

export function SpotMarker({ spot, onClick }: SpotMarkerProps) {
  const map = useMap();

  useEffect(() => {
    const color = getDangerColor(spot.danger_score);
    const size = spot.danger_score >= 7 ? 20 : 16;

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);cursor:pointer"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker([spot.lat, spot.lng], { icon })
      .addTo(map)
      .on('click', onClick);

    return () => {
      marker.remove();
    };
  }, [map, spot, onClick]);

  return null;
}
