const CARD_W = 1080;
const CARD_H = 1920;
const TILE_SIZE = 256;
const ZOOM = 17;

function latLngToTile(lat: number, lng: number) {
  const n = 2 ** ZOOM;
  const latRad = (lat * Math.PI) / 180;
  const xtile = Math.floor(((lng + 180) / 360) * n);
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  const xpx = (((lng + 180) / 360) * n - xtile) * TILE_SIZE;
  const ypx =
    (((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n - ytile) *
    TILE_SIZE;
  return { xtile, ytile, xpx, ypx };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'it' } }
    );
    const data = await res.json();
    const a = data.address;
    if (!a) return '';
    const road = a.road || a.pedestrian || a.cycleway || '';
    const house = a.house_number || '';
    const city = a.city || a.town || a.village || '';
    const parts = [road, house, city].filter(Boolean);
    return parts.join(', ');
  } catch {
    return '';
  }
}

export interface ShareCardInput {
  title: string;
  category: string;
  lat: number;
  lng: number;
}

export async function generateShareCard({ title, category, lat, lng }: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Fetch address in parallel with tiles
  const addressPromise = reverseGeocode(lat, lng);

  // --- Map tiles (top 60% of card) ---
  const mapH = CARD_H * 0.6;
  const { xtile, ytile, xpx, ypx } = latLngToTile(lat, lng);

  const pinX = CARD_W / 2;
  const pinY = mapH * 0.45;

  const offsetX = pinX - xpx;
  const offsetY = pinY - ypx;

  const tiles: Promise<{ img: HTMLImageElement; x: number; y: number }>[] = [];

  for (let tx = xtile - 3; tx <= xtile + 3; tx++) {
    for (let ty = ytile - 5; ty <= ytile + 5; ty++) {
      const x = offsetX + (tx - xtile) * TILE_SIZE;
      const y = offsetY + (ty - ytile) * TILE_SIZE;
      if (x > CARD_W || y > CARD_H || x + TILE_SIZE < 0 || y + TILE_SIZE < 0) continue;
      tiles.push(
        loadImage(`https://tile.openstreetmap.org/${ZOOM}/${tx}/${ty}.png`).then((img) => ({
          img,
          x,
          y,
        }))
      );
    }
  }

  try {
    const loaded = await Promise.all(tiles);
    loaded.forEach(({ img, x, y }) => ctx.drawImage(img, x, y, TILE_SIZE, TILE_SIZE));
  } catch {
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
  }

  // --- Dark gradient from map into bottom panel ---
  const grad = ctx.createLinearGradient(0, mapH - 200, 0, mapH + 100);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.5, 'rgba(17,17,17,0.85)');
  grad.addColorStop(1, '#111111');
  ctx.fillStyle = grad;
  ctx.fillRect(0, mapH - 200, CARD_W, 300);

  // Solid dark bottom panel
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, mapH + 100, CARD_W, CARD_H - mapH - 100);

  // Subtle top gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.35)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CARD_W, 120);

  // --- Pin marker ---
  // Shadow
  ctx.beginPath();
  ctx.ellipse(pinX, pinY + 28, 14, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // Outer glow
  ctx.beginPath();
  ctx.arc(pinX, pinY, 26, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.25)';
  ctx.fill();

  // White border
  ctx.beginPath();
  ctx.arc(pinX, pinY, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Red center
  ctx.beginPath();
  ctx.arc(pinX, pinY, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // --- Text content area (bottom panel) ---
  const textX = 60;
  const maxTextW = CARD_W - 120;
  let cursorY = mapH + 20;

  // Category pill
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const catW = ctx.measureText(category).width;
  const pillPadX = 20;
  const pillH = 44;

  ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
  const pillRadius = pillH / 2;
  ctx.beginPath();
  ctx.roundRect(textX, cursorY, catW + pillPadX * 2, pillH, pillRadius);
  ctx.fill();

  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(category, textX + pillPadX, cursorY + pillH / 2);

  cursorY += pillH + 36;

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'top';
  const titleLines = wrapText(ctx, title, maxTextW);
  titleLines.slice(0, 3).forEach((line, i) => {
    ctx.fillText(line, textX, cursorY + i * 64);
  });

  cursorY += Math.min(titleLines.length, 3) * 64 + 28;

  // Address
  const address = await addressPromise;
  if (address) {
    ctx.font = '30px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    // Pin icon prefix
    ctx.fillText('\uD83D\uDCCD ' + address, textX, cursorY);
    cursorY += 44;
  }

  // --- Red accent line ---
  cursorY += 20;
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(textX, cursorY, 60, 4);

  // --- Bottom: Logo + URL ---
  const bottomY = CARD_H - 80;

  // Logo: "In" (red) + "Sicuri" (white)
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'left';

  ctx.fillStyle = '#dc2626';
  const inW = ctx.measureText('In').width;
  ctx.fillText('In', textX, bottomY);

  ctx.fillStyle = '#ffffff';
  ctx.fillText('Sicuri', textX + inW, bottomY);

  // URL
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('insicuri.vercel.app', textX, bottomY + 32);

  // OSM attribution
  ctx.textAlign = 'right';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText('\u00A9 OpenStreetMap contributors', CARD_W - 30, CARD_H - 20);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
