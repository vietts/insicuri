const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const DELAY_MS = 1500;

// Bbox covering Udine + Tavagnacco with margin
const BBOX = '46.00,13.15,46.15,13.35';

// OSM relation IDs for municipal boundaries
const UDINE_RELATION = 179272;
const TAVAGNACCO_RELATION = 179203;

interface OverpassElement {
  type: 'way' | 'node' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
  members?: { type: string; ref: number; role: string; geometry?: { lat: number; lon: number }[] }[];
}

interface OverpassResponse {
  elements: OverpassElement[];
}

async function overpassFetch(query: string): Promise<OverpassElement[]> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithRetry(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!res.ok) {
        const text = await res.text();
        lastError = new Error(`Overpass error ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }

      const data: OverpassResponse = await res.json();
      return data.elements;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error('All Overpass endpoints failed');
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if ((res.status === 429 || res.status === 504) && attempt < retries) {
      await delay(3000 * (attempt + 1));
      continue;
    }
    return res;
  }
  throw new Error('Overpass API: max retries exceeded');
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Query 1: Neighborhood centroids + municipal boundaries */
export async function fetchNeighborhoodsAndBoundaries(): Promise<OverpassElement[]> {
  const query = `[out:json][timeout:90];
(
  node["place"~"^(suburb|neighbourhood|quarter)$"](${BBOX});
  relation(${UDINE_RELATION});
  relation(${TAVAGNACCO_RELATION});
);
out geom;`;
  return overpassFetch(query);
}

/** Query 2: All cycling infrastructure */
export async function fetchCyclingInfra(): Promise<OverpassElement[]> {
  await delay(DELAY_MS);
  const query = `[out:json][timeout:60];
(
  way["highway"="cycleway"](${BBOX});
  way["cycleway"~"^(lane|track|shared_lane)$"](${BBOX});
  way["cycleway:left"~"^(lane|track|shared_lane)$"](${BBOX});
  way["cycleway:right"~"^(lane|track|shared_lane)$"](${BBOX});
  way["bicycle"="designated"](${BBOX});
);
out geom;`;
  return overpassFetch(query);
}

/** Query 3: Full road network */
export async function fetchRoadNetwork(): Promise<OverpassElement[]> {
  await delay(DELAY_MS);
  const query = `[out:json][timeout:60];
(
  way["highway"~"^(primary|secondary|tertiary|residential|living_street|unclassified)$"](${BBOX});
);
out geom;`;
  return overpassFetch(query);
}

/** Query 4: Landuse zones */
export async function fetchLanduse(): Promise<OverpassElement[]> {
  await delay(DELAY_MS);
  const query = `[out:json][timeout:60];
(
  way["landuse"~"^(residential|commercial|industrial|retail)$"](${BBOX});
  relation["landuse"~"^(residential|commercial|industrial|retail)$"](${BBOX});
);
out geom;`;
  return overpassFetch(query);
}

export { UDINE_RELATION, TAVAGNACCO_RELATION };
export type { OverpassElement };
