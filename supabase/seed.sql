-- Seed data: demo spots in Udine for testing
-- These are inserted directly (bypassing RLS via service role / seed context)

INSERT INTO spots (id, location, lat, lng, title, address, reports_count, danger_score, status) VALUES
  ('a1111111-1111-1111-1111-111111111111', ST_Point(13.2346, 46.0711)::geography, 46.0711, 13.2346, 'Buca pericolosa Via Mercatovecchio', 'Via Mercatovecchio, Udine', 3, 6.2, 'active'),
  ('a2222222-2222-2222-2222-222222222222', ST_Point(13.2290, 46.0650)::geography, 46.0650, 13.2290, 'Incrocio cieco Viale Venezia', 'Viale Venezia / Via Cividale, Udine', 5, 8.5, 'active'),
  ('a3333333-3333-3333-3333-333333333333', ST_Point(13.2400, 46.0730)::geography, 46.0730, 13.2400, 'Pista ciclabile interrotta Via Poscolle', 'Via Poscolle, Udine', 2, 4.8, 'active'),
  ('a4444444-4444-4444-4444-444444444444', ST_Point(13.2310, 46.0680)::geography, 46.0680, 13.2310, 'Parcheggio selvaggio Piazza Libertà', 'Piazza Libertà, Udine', 4, 7.1, 'active'),
  ('a5555555-5555-5555-5555-555555555555', ST_Point(13.2260, 46.0760)::geography, 46.0760, 13.2260, 'Scarsa visibilità rotonda ospedale', 'Piazzale Santa Maria della Misericordia, Udine', 2, 5.4, 'active'),
  ('a6666666-6666-6666-6666-666666666666', ST_Point(13.2380, 46.0620)::geography, 46.0620, 13.2380, 'Traffico intenso Viale Palmanova', 'Viale Palmanova, Udine', 6, 9.2, 'active');
