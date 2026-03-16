import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  fetchNeighborhoodsAndBoundaries,
  fetchCyclingInfra,
  fetchRoadNetwork,
  fetchLanduse,
  UDINE_RELATION,
  TAVAGNACCO_RELATION,
} from './overpass-queries.ts';
import {
  polygonFromRelation,
  pointInGeoJSON,
  haversineKm,
} from './geo-utils.ts';
import type { OverpassElement } from './overpass-queries.ts';

interface NeighborhoodData {
  id: string;
  name: string;
  municipality: string;
  admin_level: number;
  centroid_lat: number;
  centroid_lng: number;
  boundary_geojson: object;
}

/** Build Voronoi-like assignment: each point goes to nearest neighborhood centroid,
 *  clipped by municipal boundary */
function buildVoronoiGeoJSON(
  neighborhoods: NeighborhoodData[],
  _municipalBoundaries: Map<string, { type: string; coordinates: number[][][] }>
): Map<string, { type: string; coordinates: number[][][] | number[][][][] }> {
  // For Voronoi we don't need actual polygon geometry for scoring —
  // we use nearest-centroid assignment instead.
  // But we store a small bounding circle as placeholder GeoJSON for the DB.
  const result = new Map<string, { type: string; coordinates: number[][][] | number[][][][] }>();

  for (const hood of neighborhoods) {
    // Create a rough square polygon (~500m radius) around centroid as placeholder
    const R = 0.005; // ~500m in degrees
    const coords: [number, number][] = [
      [hood.centroid_lng - R, hood.centroid_lat - R],
      [hood.centroid_lng + R, hood.centroid_lat - R],
      [hood.centroid_lng + R, hood.centroid_lat + R],
      [hood.centroid_lng - R, hood.centroid_lat + R],
      [hood.centroid_lng - R, hood.centroid_lat - R],
    ];
    result.set(hood.id, { type: 'Polygon', coordinates: [coords] });
  }

  return result;
}

/** Find the nearest neighborhood centroid for a point, within the correct municipality */
function findNearestNeighborhood(
  lat: number,
  lon: number,
  neighborhoods: NeighborhoodData[],
  municipalBoundaries: Map<string, { type: string; coordinates: number[][][] }>
): string | null {
  // First determine which municipality the point is in
  let municipality: string | null = null;
  for (const [name, boundary] of municipalBoundaries) {
    if (pointInGeoJSON(lat, lon, boundary)) {
      municipality = name;
      break;
    }
  }

  if (!municipality) return null;

  // Find nearest centroid in the same municipality
  let bestId: string | null = null;
  let bestDist = Infinity;

  for (const hood of neighborhoods) {
    if (hood.municipality !== municipality) continue;
    const dist = haversineKm(lat, lon, hood.centroid_lat, hood.centroid_lng);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = hood.id;
    }
  }

  return bestId;
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Step 1/5: Fetching neighborhoods and municipal boundaries...');
    const elements = await fetchNeighborhoodsAndBoundaries();

    // Parse municipal boundaries
    const municipalBoundaries = new Map<string, { type: string; coordinates: number[][][] }>();
    const neighborhoods: NeighborhoodData[] = [];

    for (const el of elements) {
      if (el.type === 'relation' && el.members) {
        const poly = polygonFromRelation(el.members);
        if (!poly) continue;
        const name = el.id === UDINE_RELATION ? 'Udine' : 'Tavagnacco';
        municipalBoundaries.set(name, poly);
      }
    }

    // Parse neighborhood nodes
    for (const el of elements) {
      if (el.type === 'node' && el.lat && el.lon) {
        const name = el.tags?.name;
        if (!name) continue;

        // Determine municipality — skip if outside all known boundaries
        let municipality: string | null = null;
        for (const [mName, boundary] of municipalBoundaries) {
          if (pointInGeoJSON(el.lat, el.lon, boundary)) {
            municipality = mName;
            break;
          }
        }
        if (!municipality) continue; // Not in Udine or Tavagnacco — skip

        const placeType = el.tags?.place ?? 'neighbourhood';
        const adminLevel = placeType === 'suburb' ? 9 : placeType === 'quarter' ? 9 : 10;

        neighborhoods.push({
          id: String(el.id),
          name: name.split(' / ')[0], // Use Italian name only
          municipality,
          admin_level: adminLevel,
          centroid_lat: el.lat,
          centroid_lng: el.lon,
          boundary_geojson: {}, // placeholder, will be set below
        });
      }
    }

    // Build Voronoi-like boundaries
    const voronoiGeo = buildVoronoiGeoJSON(neighborhoods, municipalBoundaries);
    for (const hood of neighborhoods) {
      hood.boundary_geojson = voronoiGeo.get(hood.id) ?? {};
    }

    console.log(`  Found ${neighborhoods.length} neighborhoods, ${municipalBoundaries.size} municipalities`);

    // Upsert neighborhoods
    if (neighborhoods.length > 0) {
      const { error: nhError } = await supabase
        .from('insicuri_neighborhoods')
        .upsert(
          neighborhoods.map((n) => ({
            id: n.id,
            name: n.name,
            municipality: n.municipality,
            admin_level: n.admin_level,
            boundary_geojson: n.boundary_geojson,
            centroid_lat: n.centroid_lat,
            centroid_lng: n.centroid_lng,
            area_km2: null,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'id' }
        );
      if (nhError) throw new Error(`Upsert neighborhoods: ${nhError.message}`);
    }

    console.log('Step 2/5: Fetching cycling infrastructure...');
    const cyclingElements = await fetchCyclingInfra();
    console.log(`  Found ${cyclingElements.length} cycling ways`);

    console.log('Step 3/5: Fetching road network...');
    const roadElements = await fetchRoadNetwork();
    console.log(`  Found ${roadElements.length} road ways`);

    console.log('Step 4/5: Fetching landuse zones...');
    const landuseElements = await fetchLanduse();
    console.log(`  Found ${landuseElements.length} landuse elements`);

    // Assign cycling ways to neighborhoods by nearest centroid
    console.log('Step 5/5: Computing scores...');

    const cyclingByHood = new Map<string, OverpassElement[]>();
    const roadByHood = new Map<string, OverpassElement[]>();
    const landuseByHood = new Map<string, OverpassElement[]>();

    for (const hood of neighborhoods) {
      cyclingByHood.set(hood.id, []);
      roadByHood.set(hood.id, []);
      landuseByHood.set(hood.id, []);
    }

    // Assign ways by midpoint
    for (const el of cyclingElements) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
      const mid = el.geometry[Math.floor(el.geometry.length / 2)];
      const hoodId = findNearestNeighborhood(mid.lat, mid.lon, neighborhoods, municipalBoundaries);
      if (hoodId) cyclingByHood.get(hoodId)?.push(el);
    }

    for (const el of roadElements) {
      if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue;
      const mid = el.geometry[Math.floor(el.geometry.length / 2)];
      const hoodId = findNearestNeighborhood(mid.lat, mid.lon, neighborhoods, municipalBoundaries);
      if (hoodId) roadByHood.get(hoodId)?.push(el);
    }

    for (const el of landuseElements) {
      if (!el.geometry || el.geometry.length < 3) continue;
      const mid = el.geometry[Math.floor(el.geometry.length / 2)];
      const hoodId = findNearestNeighborhood(mid.lat, mid.lon, neighborhoods, municipalBoundaries);
      if (hoodId) landuseByHood.get(hoodId)?.push(el);
    }

    // Fetch InSicuri spots
    const { data: spots } = await supabase
      .from('insicuri_spots')
      .select('id, lat, lng, danger_score, last_report_at, status')
      .eq('status', 'active');

    const { data: reports } = await supabase
      .from('insicuri_reports')
      .select('spot_id, severity');

    const reportsBySpot = new Map<string, { severity: number }[]>();
    for (const r of reports ?? []) {
      if (!reportsBySpot.has(r.spot_id)) reportsBySpot.set(r.spot_id, []);
      reportsBySpot.get(r.spot_id)!.push({ severity: r.severity });
    }

    const spotsPerNeighborhood = new Map<
      string,
      { lat: number; lng: number; danger_score: number; last_report_at: string; reports: { severity: number }[] }[]
    >();

    for (const spot of spots ?? []) {
      const hoodId = findNearestNeighborhood(spot.lat, spot.lng, neighborhoods, municipalBoundaries);
      if (!hoodId) continue;
      if (!spotsPerNeighborhood.has(hoodId)) spotsPerNeighborhood.set(hoodId, []);
      spotsPerNeighborhood.get(hoodId)!.push({
        lat: spot.lat,
        lng: spot.lng,
        danger_score: spot.danger_score,
        last_report_at: spot.last_report_at,
        reports: reportsBySpot.get(spot.id) ?? [],
      });
    }

    // Compute scores using nearest-centroid assignment
    const scores = computeAllScoresPreAssigned(
      neighborhoods,
      cyclingByHood,
      roadByHood,
      landuseByHood,
      spotsPerNeighborhood
    );

    // Upsert scores
    if (scores.length > 0) {
      const { error: scoreError } = await supabase
        .from('insicuri_neighborhood_scores')
        .upsert(
          scores.map((s) => ({
            neighborhood_id: s.neighborhood_id,
            computed_at: new Date().toISOString(),
            cycleway_km: s.cycleway_km,
            lane_km: s.lane_km,
            shared_lane_km: s.shared_lane_km,
            total_road_km: s.total_road_km,
            coverage_ratio: s.coverage_ratio,
            continuity_ratio: s.continuity_ratio,
            corridor_score: s.corridor_score,
            spots_count: s.spots_count,
            bonus_total: s.bonus_total,
            malus_total: s.malus_total,
            score: s.score,
          })),
          { onConflict: 'neighborhood_id' }
        );
      if (scoreError) throw new Error(`Upsert scores: ${scoreError.message}`);
    }

    console.log(`Done! Computed scores for ${scores.length} neighborhoods`);

    return new Response(
      JSON.stringify({
        success: true,
        neighborhoods: neighborhoods.length,
        scores: scores.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Scoring with pre-assigned data (no point-in-polygon needed per way)
import { wayLengthKm } from './geo-utils.ts';

interface ScoreResult {
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

function classifyCyclingWay(tags: Record<string, string>): 'cycleway' | 'lane' | 'shared_lane' {
  if (tags.highway === 'cycleway' || tags.bicycle === 'designated') return 'cycleway';
  const val = tags.cycleway || tags['cycleway:left'] || tags['cycleway:right'] || '';
  if (val === 'shared_lane') return 'shared_lane';
  return 'lane';
}

function computeAllScoresPreAssigned(
  neighborhoods: NeighborhoodData[],
  cyclingByHood: Map<string, OverpassElement[]>,
  roadByHood: Map<string, OverpassElement[]>,
  landuseByHood: Map<string, OverpassElement[]>,
  spotsPerNeighborhood: Map<string, { lat: number; lng: number; danger_score: number; last_report_at: string; reports: { severity: number }[] }[]>
): ScoreResult[] {
  const now = new Date();
  const results: ScoreResult[] = [];

  for (const hood of neighborhoods) {
    const cyclingWays = cyclingByHood.get(hood.id) ?? [];
    const roadWays = roadByHood.get(hood.id) ?? [];
    const landuseEls = landuseByHood.get(hood.id) ?? [];

    let cyclewayKm = 0, laneKm = 0, sharedLaneKm = 0;
    const cyclingGeos: { geometry: { lat: number; lon: number }[] }[] = [];

    for (const way of cyclingWays) {
      if (!way.geometry || way.geometry.length < 2) continue;
      const km = wayLengthKm(way.geometry);
      const type = classifyCyclingWay(way.tags ?? {});
      if (type === 'cycleway') cyclewayKm += km;
      else if (type === 'lane') laneKm += km;
      else sharedLaneKm += km;
      cyclingGeos.push({ geometry: way.geometry });
    }

    const totalCyclingKm = cyclewayKm + laneKm + sharedLaneKm;
    const totalRoadKm = roadWays.reduce((s, w) => s + (w.geometry ? wayLengthKm(w.geometry) : 0), 0);
    const coverageRatio = totalRoadKm > 0 ? totalCyclingKm / totalRoadKm : 0;

    // Continuity
    const continuityRatio = computeContinuityRatioLocal(cyclingGeos);

    // Corridor
    let hasResidential = false, hasWorkZone = false;
    for (const el of landuseEls) {
      const lu = el.tags?.landuse;
      if (lu === 'residential') hasResidential = true;
      if (lu && ['commercial', 'industrial', 'retail'].includes(lu)) hasWorkZone = true;
    }
    let corridorScore = 0;
    if (hasResidential && hasWorkZone && cyclingGeos.length > 0) corridorScore = 1.0;
    else if ((hasResidential || hasWorkZone) && cyclingGeos.length > 0) corridorScore = 0.5;

    // Bonus
    const bonusTotal =
      Math.min(30, cyclewayKm * 6) +
      Math.min(15, laneKm * 3) +
      Math.min(5, sharedLaneKm * 1) +
      Math.min(25, coverageRatio * 100) +
      Math.min(15, continuityRatio * 15) +
      corridorScore * 10;

    // Malus
    const spots = spotsPerNeighborhood.get(hood.id) ?? [];
    let malusTotal = 0;
    for (const spot of spots) {
      const avgSev = spot.reports.length > 0
        ? spot.reports.reduce((s, r) => s + r.severity, 0) / spot.reports.length
        : 3;
      const days = (now.getTime() - new Date(spot.last_report_at).getTime()) / 86400000;
      const recency = days < 90 ? 1.0 : days < 365 ? 0.5 : 0.2;
      malusTotal += (spot.danger_score / 10) * (avgSev / 5) * recency;
    }
    malusTotal = Math.min(30, malusTotal);

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

function computeContinuityRatioLocal(
  ways: { geometry: { lat: number; lon: number }[] }[]
): number {
  if (ways.length === 0) return 0;
  const THRESHOLD = 0.005;
  const adj: Map<number, Set<number>> = new Map();
  for (let i = 0; i < ways.length; i++) adj.set(i, new Set());

  const ep = ways.map((w) => ({ s: w.geometry[0], e: w.geometry[w.geometry.length - 1] }));

  for (let i = 0; i < ways.length; i++) {
    for (let j = i + 1; j < ways.length; j++) {
      for (const pi of [ep[i].s, ep[i].e]) {
        for (const pj of [ep[j].s, ep[j].e]) {
          if (haversineKm(pi.lat, pi.lon, pj.lat, pj.lon) <= THRESHOLD) {
            adj.get(i)!.add(j);
            adj.get(j)!.add(i);
          }
        }
      }
    }
  }

  const visited = new Set<number>();
  let inLarge = 0;
  for (let i = 0; i < ways.length; i++) {
    if (visited.has(i)) continue;
    const comp: number[] = [];
    const q = [i];
    visited.add(i);
    while (q.length) {
      const n = q.shift()!;
      comp.push(n);
      for (const nb of adj.get(n)!) {
        if (!visited.has(nb)) { visited.add(nb); q.push(nb); }
      }
    }
    if (comp.length >= 3) inLarge += comp.length;
  }
  return inLarge / ways.length;
}
