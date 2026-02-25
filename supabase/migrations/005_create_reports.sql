-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  category danger_category NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  description TEXT CHECK (char_length(description) <= 500),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for spot detail page (reports by spot)
CREATE INDEX idx_reports_spot_id ON reports (spot_id, created_at DESC);

-- Index for user profile page
CREATE INDEX idx_reports_user_id ON reports (user_id, created_at DESC);
