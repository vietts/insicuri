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
