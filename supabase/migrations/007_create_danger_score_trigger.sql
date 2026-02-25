-- Recalculate danger score for a spot based on all its reports
-- Severity weighted by recency, with volume factor
CREATE OR REPLACE FUNCTION recalculate_danger_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_score NUMERIC;
  v_effective_count NUMERIC;
  v_volume_factor NUMERIC;
  v_weighted_avg NUMERIC;
BEGIN
  -- Calculate weighted average severity based on recency
  SELECT
    COALESCE(
      SUM(
        r.severity * CASE
          WHEN r.created_at > now() - INTERVAL '30 days' THEN 1.0
          WHEN r.created_at > now() - INTERVAL '90 days' THEN 0.6
          WHEN r.created_at > now() - INTERVAL '365 days' THEN 0.3
          ELSE 0.1
        END
      ) / NULLIF(
        SUM(CASE
          WHEN r.created_at > now() - INTERVAL '30 days' THEN 1.0
          WHEN r.created_at > now() - INTERVAL '90 days' THEN 0.6
          WHEN r.created_at > now() - INTERVAL '365 days' THEN 0.3
          ELSE 0.1
        END),
        0
      ),
      1
    ),
    -- Effective count = sum of weights
    COALESCE(
      SUM(CASE
        WHEN r.created_at > now() - INTERVAL '30 days' THEN 1.0
        WHEN r.created_at > now() - INTERVAL '90 days' THEN 0.6
        WHEN r.created_at > now() - INTERVAL '365 days' THEN 0.3
        ELSE 0.1
      END),
      0
    )
  INTO v_weighted_avg, v_effective_count
  FROM public.reports r
  WHERE r.spot_id = NEW.spot_id;

  -- Volume factor: min(1.5, 1 + ln(effective_count) * 0.15)
  IF v_effective_count > 0 THEN
    v_volume_factor := LEAST(1.5, 1 + LN(v_effective_count) * 0.15);
  ELSE
    v_volume_factor := 1.0;
  END IF;

  -- Final score: (weighted_avg * 2) * volume_factor, clamped 1-10
  v_score := LEAST(10, GREATEST(1, (v_weighted_avg * 2) * v_volume_factor));

  -- Update the spot
  UPDATE public.spots
  SET
    danger_score = ROUND(v_score, 1),
    reports_count = (SELECT COUNT(*) FROM public.reports WHERE spot_id = NEW.spot_id),
    last_report_at = now()
  WHERE id = NEW.spot_id;

  -- Update user's report count
  UPDATE public.profiles
  SET reports_count = (SELECT COUNT(*) FROM public.reports WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_created
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_danger_score();
