/** Haversine distance in km between two points */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Total length of an OSM way (array of {lat,lon}) in km */
export function wayLengthKm(
  geometry: { lat: number; lon: number }[]
): number {
  let total = 0;
  for (let i = 1; i < geometry.length; i++) {
    total += haversineKm(
      geometry[i - 1].lat,
      geometry[i - 1].lon,
      geometry[i].lat,
      geometry[i].lon
    );
  }
  return total;
}

/** Ray-casting point-in-polygon test */
export function pointInPolygon(
  lat: number,
  lon: number,
  polygon: [number, number][] // [lon, lat] pairs (GeoJSON order)
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    if (
      yi > lon !== yj > lon &&
      lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** Check if a point is inside a GeoJSON Polygon or MultiPolygon */
export function pointInGeoJSON(
  lat: number,
  lon: number,
  geojson: { type: string; coordinates: number[][][] | number[][][][] }
): boolean {
  if (geojson.type === 'Polygon') {
    // Test outer ring only (index 0)
    return pointInPolygon(lat, lon, geojson.coordinates[0] as [number, number][]);
  }
  if (geojson.type === 'MultiPolygon') {
    for (const poly of geojson.coordinates as number[][][][]) {
      if (pointInPolygon(lat, lon, poly[0] as [number, number][])) {
        return true;
      }
    }
  }
  return false;
}

/** Check if any node of a way falls inside the polygon */
export function wayIntersectsGeoJSON(
  geometry: { lat: number; lon: number }[],
  geojson: { type: string; coordinates: number[][][] | number[][][][] }
): boolean {
  // Check first, last, and midpoint
  const checkPoints = [
    geometry[0],
    geometry[geometry.length - 1],
    geometry[Math.floor(geometry.length / 2)],
  ];
  return checkPoints.some((p) => pointInGeoJSON(p.lat, p.lon, geojson));
}

/** Extract polygon coordinates from an Overpass relation result */
export function polygonFromRelation(
  members: { type: string; role: string; geometry?: { lat: number; lon: number }[] }[]
): { type: string; coordinates: number[][][] } | null {
  // Collect outer ways
  const outerWays = members
    .filter((m) => m.type === 'way' && (m.role === 'outer' || m.role === '') && m.geometry)
    .map((m) => m.geometry!.map((p) => [p.lon, p.lat] as [number, number]));

  if (outerWays.length === 0) return null;

  // Merge ways into a single ring
  const ring = mergeWays(outerWays);
  if (ring.length < 4) return null;

  // Close ring if needed
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }

  return { type: 'Polygon', coordinates: [ring] };
}

/** Merge ordered way segments into a continuous ring */
function mergeWays(ways: [number, number][][]): [number, number][] {
  if (ways.length === 0) return [];
  if (ways.length === 1) return ways[0];

  const result = [...ways[0]];
  const remaining = ways.slice(1);

  while (remaining.length > 0) {
    const lastPt = result[result.length - 1];
    let bestIdx = -1;
    let bestReverse = false;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const way = remaining[i];
      const startDist = Math.abs(way[0][0] - lastPt[0]) + Math.abs(way[0][1] - lastPt[1]);
      const endDist =
        Math.abs(way[way.length - 1][0] - lastPt[0]) +
        Math.abs(way[way.length - 1][1] - lastPt[1]);

      if (startDist < bestDist) {
        bestDist = startDist;
        bestIdx = i;
        bestReverse = false;
      }
      if (endDist < bestDist) {
        bestDist = endDist;
        bestIdx = i;
        bestReverse = true;
      }
    }

    if (bestIdx === -1) break;

    const way = remaining.splice(bestIdx, 1)[0];
    const ordered = bestReverse ? [...way].reverse() : way;
    // Skip first point if it matches last (avoid duplicate)
    const start = ordered[0][0] === lastPt[0] && ordered[0][1] === lastPt[1] ? 1 : 0;
    result.push(...ordered.slice(start));
  }

  return result;
}

/** Compute centroid of a polygon ring */
export function centroid(ring: [number, number][]): { lat: number; lng: number } {
  let latSum = 0;
  let lonSum = 0;
  for (const [lon, lat] of ring) {
    latSum += lat;
    lonSum += lon;
  }
  return { lat: latSum / ring.length, lng: lonSum / ring.length };
}

/** Approximate area of a polygon in km² using the shoelace formula on projected coords */
export function polygonAreaKm2(ring: [number, number][]): number {
  const midLat = ring.reduce((s, [, lat]) => s + lat, 0) / ring.length;
  const degToKmLat = 111.32;
  const degToKmLon = 111.32 * Math.cos((midLat * Math.PI) / 180);

  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const x1 = ring[j][0] * degToKmLon;
    const y1 = ring[j][1] * degToKmLat;
    const x2 = ring[i][0] * degToKmLon;
    const y2 = ring[i][1] * degToKmLat;
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area / 2);
}
