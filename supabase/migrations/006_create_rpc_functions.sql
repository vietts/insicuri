-- Find nearby spots within radius (default 50m)
CREATE OR REPLACE FUNCTION find_nearby_spots(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  title TEXT,
  danger_score NUMERIC,
  reports_count INTEGER,
  distance DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.lat,
    s.lng,
    s.title,
    s.danger_score,
    s.reports_count,
    ST_Distance(s.location, ST_Point(p_lng, p_lat)::geography) AS distance
  FROM spots s
  WHERE s.status = 'active'
    AND ST_DWithin(s.location, ST_Point(p_lng, p_lat)::geography, p_radius)
  ORDER BY distance
  LIMIT 5;
$$;

-- Get spots in map viewport bounds
CREATE OR REPLACE FUNCTION get_spots_in_bounds(
  sw_lat DOUBLE PRECISION,
  sw_lng DOUBLE PRECISION,
  ne_lat DOUBLE PRECISION,
  ne_lng DOUBLE PRECISION
)
RETURNS TABLE (
  id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  title TEXT,
  address TEXT,
  danger_score NUMERIC,
  reports_count INTEGER,
  last_report_at TIMESTAMPTZ,
  status spot_status
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id, s.lat, s.lng, s.title, s.address,
    s.danger_score, s.reports_count, s.last_report_at, s.status
  FROM spots s
  WHERE s.status = 'active'
    AND s.lat BETWEEN sw_lat AND ne_lat
    AND s.lng BETWEEN sw_lng AND ne_lng
  ORDER BY s.danger_score DESC
  LIMIT 500;
$$;

-- Create spot with first report in a single transaction
CREATE OR REPLACE FUNCTION create_spot_with_report(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_title TEXT,
  p_category danger_category,
  p_severity INTEGER,
  p_description TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_spot_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the spot
  INSERT INTO public.spots (location, lat, lng, title, reports_count, danger_score, created_by)
  VALUES (
    ST_Point(p_lng, p_lat)::geography,
    p_lat, p_lng, p_title,
    1,
    LEAST(10, GREATEST(1, p_severity * 2.0)),
    v_user_id
  )
  RETURNING id INTO v_spot_id;

  -- Create the first report
  INSERT INTO public.reports (spot_id, user_id, category, severity, description, photo_url)
  VALUES (v_spot_id, v_user_id, p_category, p_severity, p_description, p_photo_url);

  -- Update user's report count
  UPDATE public.profiles SET reports_count = reports_count + 1 WHERE id = v_user_id;

  RETURN v_spot_id;
END;
$$;
