import type { FeatureCollection, LineString } from 'geojson';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export type CyclingInfraType = 'cycleway' | 'lane' | 'shared_lane';

interface OverpassElement {
  type: 'way' | 'node' | 'relation';
  id: number;
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface Bounds {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

function buildCyclingQuery(bounds: Bounds): string {
  const bbox = `${bounds.sw_lat},${bounds.sw_lng},${bounds.ne_lat},${bounds.ne_lng}`;
  return `[out:json][timeout:15];
(
  way["highway"="cycleway"](${bbox});
  way["cycleway"~"^(lane|track|shared_lane)$"](${bbox});
  way["cycleway:left"~"^(lane|track|shared_lane)$"](${bbox});
  way["cycleway:right"~"^(lane|track|shared_lane)$"](${bbox});
  way["bicycle"="designated"](${bbox});
);
out geom;`;
}

function classifyWay(tags: Record<string, string>): CyclingInfraType {
  if (tags.highway === 'cycleway' || tags.bicycle === 'designated') {
    return 'cycleway';
  }
  const cyclewayValue = tags.cycleway || tags['cycleway:left'] || tags['cycleway:right'] || '';
  if (cyclewayValue === 'shared_lane') return 'shared_lane';
  if (cyclewayValue === 'lane' || cyclewayValue === 'track') return 'lane';
  return 'cycleway';
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < retries) {
      // Exponential backoff: 2s, 4s
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    return res;
  }
  // Unreachable, but TS needs it
  throw new Error('Overpass API: max retries exceeded');
}

export async function fetchCyclingInfra(
  bounds: Bounds,
  signal?: AbortSignal
): Promise<FeatureCollection<LineString>> {
  const query = buildCyclingQuery(bounds);

  const res = await fetchWithRetry(OVERPASS_API_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error: ${res.status}`);
  }

  const data: OverpassResponse = await res.json();

  const features = data.elements
    .filter((el) => el.type === 'way' && el.geometry && el.geometry.length >= 2)
    .map((el) => ({
      type: 'Feature' as const,
      properties: {
        id: el.id,
        infraType: classifyWay(el.tags ?? {}),
      },
      geometry: {
        type: 'LineString' as const,
        coordinates: el.geometry!.map((p) => [p.lon, p.lat]),
      },
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
