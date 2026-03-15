'use client';

import { useState, useCallback, useRef } from 'react';
import { fetchCyclingInfra, type Bounds } from '@/lib/overpass';
import type { FeatureCollection, LineString } from 'geojson';

const CYCLING_MIN_ZOOM = 13;
// Padding factor: fetch 50% extra around viewport so small pan/zoom won't refetch
const PADDING = 0.5;
// Minimum seconds between API calls
const THROTTLE_MS = 3000;

function expandBounds(bounds: Bounds, factor: number): Bounds {
  const latSpan = bounds.ne_lat - bounds.sw_lat;
  const lngSpan = bounds.ne_lng - bounds.sw_lng;
  const latPad = latSpan * factor;
  const lngPad = lngSpan * factor;
  return {
    sw_lat: bounds.sw_lat - latPad,
    sw_lng: bounds.sw_lng - lngPad,
    ne_lat: bounds.ne_lat + latPad,
    ne_lng: bounds.ne_lng + lngPad,
  };
}

function containsBounds(outer: Bounds, inner: Bounds): boolean {
  return (
    outer.sw_lat <= inner.sw_lat &&
    outer.sw_lng <= inner.sw_lng &&
    outer.ne_lat >= inner.ne_lat &&
    outer.ne_lng >= inner.ne_lng
  );
}

export function useCyclingInfra() {
  const [geojson, setGeojson] = useState<FeatureCollection<LineString> | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fetchedBoundsRef = useRef<Bounds | null>(null);
  const lastFetchRef = useRef<number>(0);
  const throttleRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchForBounds = useCallback(async (bounds: Bounds, zoom: number) => {
    clearTimeout(throttleRef.current);

    if (zoom < CYCLING_MIN_ZOOM) {
      setGeojson(null);
      return;
    }

    // Skip if viewport is fully inside already-fetched area
    if (fetchedBoundsRef.current && containsBounds(fetchedBoundsRef.current, bounds)) {
      return;
    }

    // Throttle: at least THROTTLE_MS between API calls
    const now = Date.now();
    const elapsed = now - lastFetchRef.current;
    if (elapsed < THROTTLE_MS) {
      throttleRef.current = setTimeout(() => fetchForBounds(bounds, zoom), THROTTLE_MS - elapsed);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Fetch with padding so small movements don't trigger refetch
    const paddedBounds = expandBounds(bounds, PADDING);

    setLoading(true);
    lastFetchRef.current = Date.now();
    try {
      const data = await fetchCyclingInfra(paddedBounds, controller.signal);
      fetchedBoundsRef.current = paddedBounds;
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
