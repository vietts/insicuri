'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FeatureCollection, LineString } from 'geojson';
import type { CyclingInfraType } from '@/lib/overpass';

const STYLES: Record<CyclingInfraType, L.PathOptions> = {
  cycleway: {
    color: '#16a34a',
    weight: 4,
    opacity: 0.7,
  },
  lane: {
    color: '#2563eb',
    weight: 3,
    opacity: 0.7,
    dashArray: '8 4',
  },
  shared_lane: {
    color: '#f59e0b',
    weight: 3,
    opacity: 0.7,
    dashArray: '4 4',
  },
};

interface CyclingLayerProps {
  geojson: FeatureCollection<LineString> | null;
  visible: boolean;
}

export function CyclingLayer({ geojson, visible }: CyclingLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!visible || !geojson) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    // Remove previous layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const layer = L.geoJSON(geojson, {
      style: (feature) => {
        const infraType = (feature?.properties?.infraType ?? 'cycleway') as CyclingInfraType;
        return STYLES[infraType] ?? STYLES.cycleway;
      },
      interactive: false,
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, geojson, visible]);

  return null;
}
