const CARD_W = 1200;
const CARD_H = 675;
const TILE_SIZE = 256;
const ZOOM = 16;

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

  // --- Map tiles ---
  const { xtile, ytile, xpx, ypx } = latLngToTile(lat, lng);

  // Pin position on canvas (centered, slightly above middle)
  const pinX = CARD_W / 2;
  const pinY = CARD_H * 0.38;

  const offsetX = pinX - xpx;
  const offsetY = pinY - ypx;

  const tiles: Promise<{ img: HTMLImageElement; x: number; y: number }>[] = [];

  for (let tx = xtile - 3; tx <= xtile + 3; tx++) {
    for (let ty = ytile - 2; ty <= ytile + 2; ty++) {
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
    // Fallback: gray background if tiles fail
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
  }

  // --- Dark gradient overlay ---
  const grad = ctx.createLinearGradient(0, CARD_H * 0.25, 0, CARD_H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0.88)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle top gradient for legibility
  const topGrad = ctx.createLinearGradient(0, 0, 0, CARD_H * 0.15);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.3)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H * 0.15);

  // --- Pin marker ---
  // Outer glow
  ctx.beginPath();
  ctx.arc(pinX, pinY, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
  ctx.fill();

  // White border
  ctx.beginPath();
  ctx.arc(pinX, pinY, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Red center
  ctx.beginPath();
  ctx.arc(pinX, pinY, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#dc2626';
  ctx.fill();

  // --- Red accent line ---
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(40, CARD_H - 175, 4, 60);

  // --- Title ---
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const titleLines = wrapText(ctx, title, CARD_W - 120);
  const titleStartY = CARD_H - 170;
  titleLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, 56, titleStartY + i * 48);
  });

  // --- Category ---
  ctx.font = '22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const catY = titleStartY + titleLines.slice(0, 2).length * 48 + 8;
  ctx.fillText(category, 56, catY);

  // --- Logo: "In" (red) + "Sicuri" (white) ---
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  const sicuriW = ctx.measureText('Sicuri').width;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Sicuri', CARD_W - 40, CARD_H - 42);

  ctx.fillStyle = '#dc2626';
  ctx.fillText('In', CARD_W - 40 - sicuriW, CARD_H - 42);

  // --- URL ---
  ctx.font = '18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('insicuri.vercel.app', CARD_W - 40, CARD_H - 18);

  // --- OSM attribution (required) ---
  ctx.textAlign = 'left';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('\u00A9 OpenStreetMap contributors', 10, CARD_H - 6);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
