-- Spots table with PostGIS geography
CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  title TEXT NOT NULL,
  address TEXT,
  reports_count INTEGER DEFAULT 0,
  danger_score NUMERIC(3,1) DEFAULT 1.0 CHECK (danger_score >= 1 AND danger_score <= 10),
  last_report_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  status spot_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for geographic queries
CREATE INDEX idx_spots_location ON spots USING GIST (location);

-- Index for status filtering
CREATE INDEX idx_spots_status ON spots (status) WHERE status = 'active';
