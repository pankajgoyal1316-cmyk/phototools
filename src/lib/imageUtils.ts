export interface ImageDimensions {
  width: number;
  height: number;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        }).catch(() => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
          URL.revokeObjectURL(url);
        });
      } else {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      resolve({ width: 1200, height: 800 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, type, quality);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const DPI = 96;
export function pxToUnit(px: number, unit: string): number {
  if (unit === 'cm') return Math.round((px / DPI) * 2.54);
  if (unit === 'in') return Math.round((px / DPI) * 100) / 100;
  return px;
}

export function unitToPx(value: number, unit: string): number {
  if (unit === 'cm') return Math.round((value / 2.54) * DPI);
  if (unit === 'in') return Math.round(value * DPI);
  return value;
}

function renderCanvas(img: HTMLImageElement, w: number, h: number, format: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

async function qualityBinarySearch(
  img: HTMLImageElement,
  w: number,
  h: number,
  targetBytes: number,
  format: string,
): Promise<Blob | null> {
  let lo = 0.1;
  let hi = 1.0;
  let bestBlob: Blob | null = null;

  for (let i = 0; i < 10; i++) {
    const quality = (lo + hi) / 2;
    const canvas = renderCanvas(img, w, h, format);
    const blob = await canvasToBlob(canvas, format, quality);
    if (blob.size <= targetBytes) {
      bestBlob = blob;
      lo = quality;
    } else {
      hi = quality;
    }
  }

  return bestBlob;
}

export async function compressToTargetSize(
  img: HTMLImageElement,
  width: number,
  height: number,
  targetBytes: number,
  format: string = 'image/jpeg',
): Promise<Blob> {
  let curW = width;
  let curH = height;

  for (let scaleStep = 0; scaleStep < 40; scaleStep++) {
    const result = await qualityBinarySearch(img, curW, curH, targetBytes, format);
    if (result) return result;
    curW = Math.round(curW * 0.95);
    curH = Math.round(curH * 0.95);
    if (curW < 8 || curH < 8) break;
  }

  const canvas = renderCanvas(img, Math.max(curW, 8), Math.max(curH, 8), format);
  return canvasToBlob(canvas, format, 0.1);
}

export function applyCanvasFilter(ctx: CanvasRenderingContext2D, filter: string) {
  if (filter === 'grayscale') {
    ctx.filter = 'grayscale(100%) contrast(1.1)';
  } else if (filter === 'document') {
    ctx.filter = 'grayscale(100%) contrast(1.4) brightness(1.1)';
  } else {
    ctx.filter = 'none';
  }
}

export async function processImageWithFilter(
  img: HTMLImageElement,
  filter: string,
  maxWidth: number = 2000,
): Promise<HTMLCanvasElement> {
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  applyCanvasFilter(ctx, filter);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}
