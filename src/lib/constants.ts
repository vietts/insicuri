import type { DangerCategory } from '@/types';

// Map defaults - centered on Udine
export const MAP_CENTER = { lat: 46.0711, lng: 13.2346 } as const;
export const MAP_DEFAULT_ZOOM = 14;
export const MAP_MIN_ZOOM = 11;
export const MAP_MAX_ZOOM = 19;

// Nearby spot detection radius in meters
export const NEARBY_RADIUS_M = 50;

// Danger score color thresholds
export function getDangerColor(score: number): string {
  if (score >= 9) return '#dc2626'; // red-600
  if (score >= 7) return '#ea580c'; // orange-600
  if (score >= 4) return '#ca8a04'; // yellow-600
  return '#16a34a'; // green-600
}

export function getDangerLabel(score: number): string {
  if (score >= 9) return 'Critico';
  if (score >= 7) return 'Alto';
  if (score >= 4) return 'Medio';
  return 'Basso';
}

export function getDangerBg(score: number): string {
  if (score >= 9) return 'bg-red-600';
  if (score >= 7) return 'bg-orange-500';
  if (score >= 4) return 'bg-yellow-500';
  return 'bg-green-500';
}

// Neighborhood score color thresholds (0-100)
export function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e'; // green-500
  if (score >= 50) return '#eab308'; // yellow-500
  if (score >= 25) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Ottimo';
  if (score >= 50) return 'Discreto';
  if (score >= 25) return 'Insufficiente';
  return 'Critico';
}

export function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getScoreTextColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 25) return 'text-orange-600';
  return 'text-red-600';
}

// Category metadata
export const CATEGORIES: Record<DangerCategory, { label: string; icon: string }> = {
  buca_dissesto: { label: 'Buca / Dissesto', icon: '🕳️' },
  traffico_intenso: { label: 'Traffico intenso', icon: '🚗' },
  scarsa_visibilita: { label: 'Scarsa visibilità', icon: '🌫️' },
  incrocio_pericoloso: { label: 'Incrocio pericoloso', icon: '⚠️' },
  mancanza_pista_ciclabile: { label: 'No pista ciclabile', icon: '🚳' },
  pista_ciclabile_interrotta: { label: 'Ciclabile finisce nel nulla', icon: '🛑' },
  pista_ciclabile_non_connessa: { label: 'Ciclabile non connessa', icon: '🔗' },
  segnaletica_assente: { label: 'Segnaletica assente', icon: '🚫' },
  parcheggio_selvaggio: { label: 'Parcheggio selvaggio', icon: '🅿️' },
};
