import { loadImage, processImageWithFilter, downloadBlob } from './imageUtils';

type JsPDFConstructor = typeof import('jspdf')['jsPDF'];
let jsPDFLoaded: JsPDFConstructor | null = null;

async function loadJsPDF(): Promise<JsPDFConstructor> {
  if (jsPDFLoaded) return jsPDFLoaded;
  const { jsPDF } = await import('jspdf');
  jsPDFLoaded = jsPDF;
  return jsPDFLoaded;
}

export interface PdfPageItem {
  id: string;
  file: File;
  url: string;
}

export type ImageFilter = 'original' | 'grayscale' | 'document';

interface PdfPage {
  numPages: number;
  getPage: (n: number) => Promise<PdfPageRender>;
}

interface PdfPageRender {
  getViewport: (args: { scale: number }) => { width: number; height: number };
  render: (args: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> };
}

interface PdfjsModuleType {
  getDocument: (args: { data: ArrayBuffer }) => { promise: Promise<PdfPage> };
  GlobalWorkerOptions: { workerSrc: string };
  version: string;
}

let pdfjsLoaded: PdfjsModuleType | null = null;

async function loadPdfjs(): Promise<PdfjsModuleType> {
  if (pdfjsLoaded) return pdfjsLoaded;
  const pdfjs = await import('pdfjs-dist');
  const mod = pdfjs as unknown as PdfjsModuleType;
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  mod.GlobalWorkerOptions.workerSrc = workerUrl;
  pdfjsLoaded = mod;
  return mod;
}

async function renderPageToCanvas(page: PdfPageRender, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const w = Math.max(1, Math.round(viewport.width));
  const h = Math.max(1, Math.round(viewport.height));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export async function generateImagePdf(
  items: PdfPageItem[],
  filter: ImageFilter,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  if (items.length === 0) throw new Error('No images to export');

  const firstImg = await loadImage(items[0].url);
  const orientation = firstImg.naturalWidth >= firstImg.naturalHeight ? 'landscape' : 'portrait';
  const jsPDF = await loadJsPDF();
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 20;

  for (let i = 0; i < items.length; i++) {
    onProgress?.(i + 1, items.length);
    const img = await loadImage(items[i].url);
    const canvas = await processImageWithFilter(img, filter);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    if (i > 0) {
      const pageOrientation = canvas.width >= canvas.height ? 'landscape' : 'portrait';
      pdf.addPage('a4', pageOrientation);
    }
    pdf.addImage(imgData, 'JPEG', x, y, w, h);
  }

  return pdf.output('blob');
}

export async function downloadImagePdf(
  items: PdfPageItem[],
  filter: ImageFilter,
  filename: string = 'phototools-document.pdf',
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const blob = await generateImagePdf(items, filter, onProgress);
  downloadBlob(blob, filename);
}

async function buildPdfFromCanvases(
  canvases: HTMLCanvasElement[],
  targetBytes: number,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  let bestBlob: Blob | null = null;
  const jsPDF = await loadJsPDF();

  const attempts = [
    { quality: 0.75, scale: 1.0 },
    { quality: 0.55, scale: 1.0 },
    { quality: 0.35, scale: 1.0 },
    { quality: 0.2, scale: 1.0 },
    { quality: 0.55, scale: 0.7 },
    { quality: 0.35, scale: 0.7 },
    { quality: 0.2, scale: 0.7 },
    { quality: 0.35, scale: 0.5 },
    { quality: 0.2, scale: 0.5 },
    { quality: 0.15, scale: 0.35 },
  ];

  for (const { quality, scale } of attempts) {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < canvases.length; i++) {
      onProgress?.(i + 1, canvases.length);
      const src = canvases[i];
      const w = Math.max(1, Math.round(src.width * scale));
      const h = Math.max(1, Math.round(src.height * scale));
      const tmp = document.createElement('canvas');
      tmp.width = w;
      tmp.height = h;
      const tctx = tmp.getContext('2d');
      if (!tctx) continue;
      tctx.drawImage(src, 0, 0, w, h);
      const imgData = tmp.toDataURL('image/jpeg', quality);

      if (i > 0) pdf.addPage('a4', w >= h ? 'landscape' : 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH);
    }

    bestBlob = pdf.output('blob');
    if (!targetBytes || bestBlob.size <= targetBytes) return bestBlob;
  }

  return bestBlob || new Blob();
}

export async function compressPdf(
  file: File,
  targetBytes: number,
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await loadPdfjs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const canvases: HTMLCanvasElement[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(i, pdf.numPages);
    const page = await pdf.getPage(i);
    const canvas = await renderPageToCanvas(page, 1.0);
    canvases.push(canvas);
  }

  return buildPdfFromCanvases(canvases, targetBytes, onProgress);
}
