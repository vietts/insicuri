'use client';

import { useState, useCallback, useRef } from 'react';
import { fetchCyclingInfra, type Bounds } from '@/lib/overpass';
import type { FeatureCollection, LineString } from 'geojson';

const CYCLING_MIN_ZOOM = 13;
const GRID_SIZE = 0.01; // ~1km grid cells

function gridKey(bounds: Bounds): string {
  const swLat = Math.floor(bounds.sw_lat / GRID_SIZE) * GRID_SIZE;
  const swLng = Math.floor(bounds.sw_lng / GRID_SIZE) * GRID_SIZE;
  const neLat = Math.ceil(bounds.ne_lat / GRID_SIZE) * GRID_SIZE;
  const neLng = Math.ceil(bounds.ne_lng / GRID_SIZE) * GRID_SIZE;
  return `${swLat.toFixed(2)},${swLng.toFixed(2)},${neLat.toFixed(2)},${neLng.toFixed(2)}`;
}

export function useCyclingInfra() {
  const [geojson, setGeojson] = useState<FeatureCollection<LineString> | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, FeatureCollection<LineString>>>(new Map());
  const lastKeyRef = useRef<string>('');

  const fetchForBounds = useCallback(async (bounds: Bounds, zoom: number) => {
    if (zoom < CYCLING_MIN_ZOOM) {
      setGeojson(null);
      return;
    }

    const key = gridKey(bounds);
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const cached = cacheRef.current.get(key);
    if (cached) {
      setGeojson(cached);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      // Expand bounds slightly to grid-aligned bounds for better caching
      const gridBounds: Bounds = {
        sw_lat: Math.floor(bounds.sw_lat / GRID_SIZE) * GRID_SIZE,
        sw_lng: Math.floor(bounds.sw_lng / GRID_SIZE) * GRID_SIZE,
        ne_lat: Math.ceil(bounds.ne_lat / GRID_SIZE) * GRID_SIZE,
        ne_lng: Math.ceil(bounds.ne_lng / GRID_SIZE) * GRID_SIZE,
      };
      const data = await fetchCyclingInfra(gridBounds, controller.signal);
      cacheRef.current.set(key, data);
      setGeojson(data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Cycling infra fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { geojson, loading, fetchForBounds };
}
