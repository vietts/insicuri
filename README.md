# InSicuri

Mappa collaborativa dei punti pericolosi per ciclisti a Udine e dintorni.

I ciclisti segnalano spot pericolosi con un pin sulla mappa. Ogni spot accumula segnalazioni e il punteggio di pericolosità si calcola automaticamente.

## Tech Stack

- **Next.js 16** (App Router) su Vercel
- **Supabase** (PostgreSQL + PostGIS, Auth magic link, Storage)
- **Leaflet** + react-leaflet (mappa OpenStreetMap)
- **Tailwind CSS v4**, TypeScript

## Setup locale

### 1. Clona e installa

```bash
git clone https://github.com/YOUR_USERNAME/insicuri.git
cd insicuri
npm install --legacy-peer-deps
```

### 2. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Abilita l'estensione PostGIS (Database > Extensions > postgis)
3. Esegui le migrazioni SQL in ordine dalla cartella `supabase/migrations/`
4. (Opzionale) Esegui `supabase/seed.sql` per dati demo
5. Crea il bucket Storage `report-photos` (public read)
6. Configura Auth: abilita Email provider con magic link

### 3. Environment variables

```bash
cp .env.local.example .env.local
# Modifica con le tue credenziali Supabase
```

### 4. Avvia

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

## Come funziona

- **Visualizza**: la mappa mostra i pin colorati per livello di pericolo (verde > rosso)
- **Segnala**: tieni premuto sulla mappa per posizionare un pin, scegli categoria e gravita
- **Nearby detection**: se c'e uno spot entro 50m, puoi aggiungerti invece di crearne uno nuovo
- **Danger score**: calcolato automaticamente pesando gravita per recency + volume

## Categorie di pericolo

| Categoria | Icona |
|-----------|-------|
| Buca / Dissesto | hole |
| Traffico intenso | car |
| Scarsa visibilita | fog |
| Incrocio pericoloso | warning |
| No pista ciclabile | no bike |
| Segnaletica assente | no sign |
| Parcheggio selvaggio | parking |

## Licenza

AGPL-3.0 - vedi [LICENSE](LICENSE)
