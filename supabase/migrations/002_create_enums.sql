-- Danger category enum for reports
CREATE TYPE danger_category AS ENUM (
  'buca_dissesto',
  'traffico_intenso',
  'scarsa_visibilita',
  'incrocio_pericoloso',
  'mancanza_pista_ciclabile',
  'segnaletica_assente',
  'parcheggio_selvaggio'
);

-- Spot status enum
CREATE TYPE spot_status AS ENUM (
  'active',
  'resolved',
  'removed'
);
