-- Neighborhood boundaries (from OSM relations)
CREATE TABLE insicuri_neighborhoods (
  id TEXT PRIMARY KEY,                     -- OSM relation ID
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,              -- 'Udine' | 'Tavagnacco'
  admin_level INTEGER NOT NULL,
  boundary_geojson JSONB NOT NULL,
  centroid_lat DOUBLE PRECISION NOT NULL,
  centroid_lng DOUBLE PRECISION NOT NULL,
  area_km2 DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Per-neighborhood cycling score (one row per neighborhood, upserted daily)
CREATE TABLE insicuri_neighborhood_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id TEXT NOT NULL REFERENCES insicuri_neighborhoods(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Raw metrics
  cycleway_km DOUBLE PRECISION DEFAULT 0,
  lane_km DOUBLE PRECISION DEFAULT 0,
  shared_lane_km DOUBLE PRECISION DEFAULT 0,
  total_road_km DOUBLE PRECISION DEFAULT 0,
  coverage_ratio DOUBLE PRECISION DEFAULT 0,
  continuity_ratio DOUBLE PRECISION DEFAULT 0,
  corridor_score DOUBLE PRECISION DEFAULT 0,
  spots_count INTEGER DEFAULT 0,
  -- Score components
  bonus_total DOUBLE PRECISION DEFAULT 0,
  malus_total DOUBLE PRECISION DEFAULT 0,
  score DOUBLE PRECISION DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  UNIQUE(neighborhood_id)
);

-- RLS: public read, service_role write
ALTER TABLE insicuri_neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE insicuri_neighborhood_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Neighborhoods are viewable by everyone"
  ON insicuri_neighborhoods FOR SELECT USING (true);

CREATE POLICY "Neighborhood scores are viewable by everyone"
  ON insicuri_neighborhood_scores FOR SELECT USING (true);
