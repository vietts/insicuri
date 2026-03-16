import {
  wayLengthKm,
  wayIntersectsGeoJSON,
  pointInGeoJSON,
  haversineKm,
} from './geo-utils.ts';
import type { OverpassElement } from './overpass-queries.ts';

interface NeighborhoodGeo {
  id: string;
  geojson: { type: string; coordinates: number[][][] | number[][][][] };
}

interface SpotData {
  lat: number;
  lng: number;
  danger_score: number;
  last_report_at: string;
  reports: { severity: number }[];
}

export interface ScoreResult {
  neighborhood_id: string;
  cycleway_km: number;
  lane_km: number;
  shared_lane_km: number;
  total_road_km: number;
  coverage_ratio: number;
  continuity_ratio: number;
  corridor_score: number;
  spots_count: number;
  bonus_total: number;
  malus_total: number;
  score: number;
}

/** Classify a cycling way */
function classifyCyclingWay(tags: Record<string, string>): 'cycleway' | 'lane' | 'shared_lane' {
  if (tags.highway === 'cycleway' || tags.bicycle === 'designated') return 'cycleway';
  const val = tags.cycleway || tags['cycleway:left'] || tags['cycleway:right'] || '';
  if (val === 'shared_lane') return 'shared_lane';
  return 'lane';
}

/** Compute continuity ratio using a graph of connected ways */
function computeContinuityRatio(
  ways: { geometry: { lat: number; lon: number }[] }[]
): number {
  if (ways.length === 0) return 0;

  // Build adjacency: two ways are connected if their endpoints are within 5m
  const THRESHOLD_KM = 0.005; // 5 meters
  const adj: Map<number, Set<number>> = new Map();

  for (let i = 0; i < ways.length; i++) {
    adj.set(i, new Set());
  }

  // Extract endpoints for each way
  const endpoints = ways.map((w) => ({
    start: w.geometry[0],
    end: w.geometry[w.geometry.length - 1],
  }));

  for (let i = 0; i < ways.length; i++) {
    for (let j = i + 1; j < ways.length; j++) {
      const pts_i = [endpoints[i].start, endpoints[i].end];
      const pts_j = [endpoints[j].start, endpoints[j].end];

      let connected = false;
      for (const pi of pts_i) {
        for (const pj of pts_j) {
          if (haversineKm(pi.lat, pi.lon, pj.lat, pj.lon) <= THRESHOLD_KM) {
            connected = true;
            break;
          }
        }
        if (connected) break;
      }

      if (connected) {
        adj.get(i)!.add(j);
        adj.get(j)!.add(i);
      }
    }
  }

  // Find connected components via BFS
  const visited = new Set<number>();
  let waysInLargeComponents = 0;

  for (let i = 0; i < ways.length; i++) {
    if (visited.has(i)) continue;
    const component: number[] = [];
    const queue = [i];
    visited.add(i);

    while (queue.length > 0) {
      const node = queue.shift()!;
      component.push(node);
      for (const neighbor of adj.get(node)!) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= 3) {
      waysInLargeComponents += component.length;
    }
  }

  return waysInLargeComponents / ways.length;
}

/** Compute corridor score (0, 0.5, or 1.0) */
function computeCorridorScore(
  neighborhood: NeighborhoodGeo,
  cyclingWays: { geometry: { lat: number; lon: number }[] }[],
  landuseElements: OverpassElement[]
): number {
  // Check which landuse types are present in the neighborhood
  let hasResidential = false;
  let hasWorkZone = false; // commercial, industrial, retail

  for (const el of landuseElements) {
    if (!el.geometry || el.geometry.length < 3) continue;
    const landuse = el.tags?.landuse;
    if (!landuse) continue;

    // Check if landuse area overlaps with neighborhood
    const midpoint = el.geometry[Math.floor(el.geometry.length / 2)];
    if (!pointInGeoJSON(midpoint.lat, midpoint.lon, neighborhood.geojson)) continue;

    if (landuse === 'residential') hasResidential = true;
    if (['commercial', 'industrial', 'retail'].includes(landuse)) hasWorkZone = true;
  }

  // Check if cycling infrastructure touches both zone types
  if (!hasResidential && !hasWorkZone) return 0;
  if (hasResidential && hasWorkZone && cyclingWays.length > 0) return 1.0;
  if ((hasResidential || hasWorkZone) && cyclingWays.length > 0) return 0.5;
  return 0;
}

/** Compute malus from InSicuri spots */
function computeMalus(spots: SpotData[], now: Date): number {
  let totalMalus = 0;

  for (const spot of spots) {
    const avgSeverity =
      spot.reports.length > 0
        ? spot.reports.reduce((s, r) => s + r.severity, 0) / spot.reports.length
        : 3;

    const lastReport = new Date(spot.last_report_at);
    const daysSince = (now.getTime() - lastReport.getTime()) / (1000 * 60 * 60 * 24);

    let recencyWeight: number;
    if (daysSince < 90) recencyWeight = 1.0;
    else if (daysSince < 365) recencyWeight = 0.5;
    else recencyWeight = 0.2;

    totalMalus += (spot.danger_score / 10) * (avgSeverity / 5) * recencyWeight;
  }

  return Math.min(30, totalMalus);
}

/** Main scoring function: compute scores for all neighborhoods */
export function computeAllScores(
  neighborhoods: NeighborhoodGeo[],
  cyclingElements: OverpassElement[],
  roadElements: OverpassElement[],
  landuseElements: OverpassElement[],
  spotsPerNeighborhood: Map<string, SpotData[]>
): ScoreResult[] {
  const now = new Date();
  const results: ScoreResult[] = [];

  for (const hood of neighborhoods) {
    // Filter cycling ways that fall in this neighborhood
    const cyclingWays = cyclingElements.filter(
      (el) =>
        el.type === 'way' &&
        el.geometry &&
        el.geometry.length >= 2 &&
        wayIntersectsGeoJSON(el.geometry, hood.geojson)
    );

    // Classify and compute km
    let cyclewayKm = 0;
    let laneKm = 0;
    let sharedLaneKm = 0;

    const cyclingGeos: { geometry: { lat: number; lon: number }[] }[] = [];

    for (const way of cyclingWays) {
      const km = wayLengthKm(way.geometry!);
      const type = classifyCyclingWay(way.tags ?? {});
      if (type === 'cycleway') cyclewayKm += km;
      else if (type === 'lane') laneKm += km;
      else sharedLaneKm += km;
      cyclingGeos.push({ geometry: way.geometry! });
    }

    const totalCyclingKm = cyclewayKm + laneKm + sharedLaneKm;

    // Filter road ways
    const roadWays = roadElements.filter(
      (el) =>
        el.type === 'way' &&
        el.geometry &&
        el.geometry.length >= 2 &&
        wayIntersectsGeoJSON(el.geometry, hood.geojson)
    );
    const totalRoadKm = roadWays.reduce((s, w) => s + wayLengthKm(w.geometry!), 0);

    const coverageRatio = totalRoadKm > 0 ? totalCyclingKm / totalRoadKm : 0;

    // Continuity
    const continuityRatio = computeContinuityRatio(cyclingGeos);

    // Corridors
    const corridorScore = computeCorridorScore(hood, cyclingGeos, landuseElements);

    // Bonus
    const bonusCycleway = Math.min(30, cyclewayKm * 6);
    const bonusLane = Math.min(15, laneKm * 3);
    const bonusShared = Math.min(5, sharedLaneKm * 1);
    const bonusCoverage = Math.min(25, coverageRatio * 100);
    const bonusContinuity = Math.min(15, continuityRatio * 15);
    const bonusCorridor = corridorScore * 10;
    const bonusTotal = bonusCycleway + bonusLane + bonusShared + bonusCoverage + bonusContinuity + bonusCorridor;

    // Malus
    const spots = spotsPerNeighborhood.get(hood.id) ?? [];
    const malusTotal = computeMalus(spots, now);

    const score = Math.max(0, Math.min(100, bonusTotal - malusTotal));

    results.push({
      neighborhood_id: hood.id,
      cycleway_km: Math.round(cyclewayKm * 100) / 100,
      lane_km: Math.round(laneKm * 100) / 100,
      shared_lane_km: Math.round(sharedLaneKm * 100) / 100,
      total_road_km: Math.round(totalRoadKm * 100) / 100,
      coverage_ratio: Math.round(coverageRatio * 1000) / 1000,
      continuity_ratio: Math.round(continuityRatio * 1000) / 1000,
      corridor_score: corridorScore,
      spots_count: spots.length,
      bonus_total: Math.round(bonusTotal * 100) / 100,
      malus_total: Math.round(malusTotal * 100) / 100,
      score: Math.round(score * 100) / 100,
    });
  }

  return results;
}
