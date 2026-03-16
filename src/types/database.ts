export type DangerCategory =
  | 'buca_dissesto'
  | 'traffico_intenso'
  | 'scarsa_visibilita'
  | 'incrocio_pericoloso'
  | 'mancanza_pista_ciclabile'
  | 'pista_ciclabile_interrotta'
  | 'pista_ciclabile_non_connessa'
  | 'segnaletica_assente'
  | 'parcheggio_selvaggio';

export type SpotStatus = 'active' | 'resolved' | 'removed';

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  reports_count: number;
  created_at: string;
}

export interface Spot {
  id: string;
  lat: number;
  lng: number;
  title: string;
  address: string | null;
  reports_count: number;
  danger_score: number;
  last_report_at: string;
  status: SpotStatus;
  created_by?: string;
  created_at?: string;
}

export interface Report {
  id: string;
  spot_id: string;
  user_id: string;
  category: DangerCategory;
  severity: number;
  description: string | null;
  photo_url: string | null;
  created_at: string;
  // Joined fields
  profiles?: Pick<Profile, 'display_name'>;
}

export interface NearbySpot {
  id: string;
  lat: number;
  lng: number;
  title: string;
  danger_score: number;
  reports_count: number;
  distance: number;
}

export interface Neighborhood {
  id: string;
  name: string;
  municipality: 'Udine' | 'Tavagnacco';
  admin_level: number;
  boundary_geojson: object;
  centroid_lat: number;
  centroid_lng: number;
  area_km2: number | null;
  updated_at: string;
}

export interface NeighborhoodScore {
  id: string;
  neighborhood_id: string;
  computed_at: string;
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
  // Joined
  insicuri_neighborhoods?: Neighborhood;
}
