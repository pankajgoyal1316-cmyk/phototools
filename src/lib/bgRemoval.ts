/**
 * Optimized background removal pipeline.
 *
 * Bypasses @imgly/background-removal's removeBackground() which hardcodes
 * 1024×1024 inference. Instead we:
 *  1. Use the library only to download/cache the ONNX model file
 *  2. Create our own ONNX Runtime session with optimized config
 *  3. Run inference at a configurable resolution (not locked to 1024)
 *  4. Reproduce the library's preprocessing (HWC→BCHW, mean/std normalization)
 *     and postprocessing (mask resize, alpha compositing, PNG encode)
 *
 * Model selection:
 *  - WebGPU: isnet_fp16 (~80MB) — fp16 weights run natively on WebGPU
 *    without dequantization. Half the memory bandwidth vs float32.
 *  - WASM:   isnet_quint8 (~40MB) — smallest download, dequantized to
 *    float32 by ORT (WASM has no native quantized ops either, but the
 *    smaller model downloads faster and the dequantized graph is still
 *    efficient for CPU inference).
 *
 * ORT 1.21.0 WebGPU backend supports: Conv, Mul, Add, Sub, Concat, Split,
 * Resize, Sigmoid, Cast, DequantizeLinear (for quint8 fallback).
 * It does NOT support QLinearConv/QuantizeLinear — so quint8 is dequantized
 * to float32 at session creation on WebGPU too, giving no inference speed
 * benefit over isnet (full float32) while being smaller to download.
 * isnet_fp16 has Cast ops that convert fp16→float32 for computation but
 * keep weights in fp16 format, reducing memory bandwidth on GPU.
 */

export type BgRemovalStage =
  | 'preparing'
  | 'downloading'
  | 'decoding'
  | 'inference'
  | 'mask'
  | 'encoding'
  | 'done';

export interface BgRemovalProgress {
  stage: BgRemovalStage;
  downloadPercent: number | null;
  message: string;
}

export interface BgRemovalResult {
  blob: Blob;
  width: number;
  height: number;
}

export interface BgRemovalTimings {
  moduleInit: number;
  modelDownload: number;
  sessionCreate: number;
  imageDecode: number;
  preprocessing: number;
  inference: number;
  maskResize: number;
  compositing: number;
  pngEncode: number;
  total: number;
  webgpuUsed: boolean;
  crossOriginIsolated: boolean;
  hardwareConcurrency: number;
  model: string;
  inferenceResolution: number;
  inputTensorShape: number[];
}

// --- Constants ---

const PUBLIC_PATH = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
const MODEL_INPUT_NAME = 'input';
const MODEL_OUTPUT_NAME = 'output';
const MEAN = [128, 128, 128];
const STD = [256, 256, 256];

// --- Types ---

import type { InferenceSession as OrtSessionType } from 'onnxruntime-web';

type OrtSession = OrtSessionType;
type OrtModule = typeof import('onnxruntime-web');

type BgRemovalLib = typeof import('@imgly/background-removal');

// --- State ---

let libPromise: Promise<BgRemovalLib> | null = null;
let ortPromise: Promise<OrtModule> | null = null;
let ortWebgpuPromise: Promise<OrtModule> | null = null;

interface CachedSession {
  session: OrtSession;
  model: string;
  useWebGPU: boolean;
  inferenceResolution: number;
}

let sessionCache: CachedSession | null = null;
let sessionCreatePromise: Promise<CachedSession> | null = null;

let webgpuCache: boolean | null = null;
let preloadPromise: Promise<void> | null = null;

// --- WebGPU detection ---

async function checkWebGPU(): Promise<boolean> {
  if (webgpuCache !== null) return webgpuCache;
  try {
    if (typeof navigator === 'undefined' || !(navigator as Navigator & { gpu?: unknown }).gpu) {
      webgpuCache = false;
      return false;
    }
    const nav = navigator as Navigator & { gpu: { requestAdapter: () => Promise<unknown | null> } };
    const adapter = await nav.gpu.requestAdapter();
    webgpuCache = adapter !== null;
    return webgpuCache;
  } catch {
    webgpuCache = false;
    return false;
  }
}

// --- Module loading ---

function getLib(): Promise<BgRemovalLib> {
  if (!libPromise) {
    libPromise = import('@imgly/background-removal').catch((err: unknown) => {
      libPromise = null;
      throw err;
    });
  }
  return libPromise;
}

function getOrt(useWebGPU: boolean): Promise<OrtModule> {
  if (useWebGPU) {
    if (!ortWebgpuPromise) {
      ortWebgpuPromise = import('onnxruntime-web/webgpu').then((m) => m.default as OrtModule).catch((err: unknown) => {
        ortWebgpuPromise = null;
        throw err;
      });
    }
    return ortWebgpuPromise;
  }
  if (!ortPromise) {
    ortPromise = import('onnxruntime-web').then((m) => m.default as OrtModule).catch((err: unknown) => {
      ortPromise = null;
      throw err;
    });
  }
  return ortPromise;
}

// --- Model preload (warms ORT module + sets WASM paths) ---

/**
 * Warm the ORT Runtime Web module import and configure WASM asset paths
 * so the first real inference call is fast. Model download happens on
 * first actual use (in createSession).
 */
export function preloadModel(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    // Just warm the ORT module import — model download happens on first use
    const useWebGPU = await checkWebGPU();
    await getOrt(useWebGPU);
    // Configure WASM paths early so ORT is ready
    const ort = await getOrt(useWebGPU);
    ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4;
    ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = getWasmPaths();

    console.log('[BG ORT Preload]', {
      wasmPaths: ort.env.wasm.wasmPaths,
      webgpuAvailable: useWebGPU,
    });
  })().catch((err: unknown) => {
    preloadPromise = null;
    console.warn('Model preload skipped:', err);
  });
  return preloadPromise;
}

// --- Model file download (direct fetch from CDN, cached by browser) ---

async function downloadModelBlob(
  model: string,
  onProgress: (p: BgRemovalProgress) => void,
): Promise<ArrayBuffer> {
  // Fetch resources.json to get chunk info (same as library does)
  const resourceUrl = new URL('resources.json', PUBLIC_PATH).toString();
  const resourceResponse = await fetch(resourceUrl);
  if (!resourceResponse.ok) throw new Error('Failed to fetch model resources metadata');
  const resourceMap = await resourceResponse.json() as Record<string, { chunks: { name: string; offsets: [number, number] }[]; size: number; mime: string }>;
  const key = `/models/${model}`;
  const entry = resourceMap[key];
  if (!entry) throw new Error(`Model ${model} not found in resources`);

  const chunks = entry.chunks;
  let downloadedSize = 0;
  const totalSize = entry.size;

  const responses = chunks.map(async (chunk) => {
    const chunkSize = chunk.offsets[1] - chunk.offsets[0];
    const url = new URL(chunk.name, PUBLIC_PATH).toString();
    const response = await fetch(url);
    const blob = await response.blob();
    if (blob.size !== chunkSize) throw new Error(`Model chunk size mismatch: expected ${chunkSize}, got ${blob.size}`);
    downloadedSize += chunkSize;
    const pct = Math.round((downloadedSize / totalSize) * 100);
    onProgress({ stage: 'downloading', downloadPercent: pct, message: `Loading AI model... ${pct}%` });
    return blob;
  });

  const allChunkBlobs = await Promise.all(responses);
  const merged = new Blob(allChunkBlobs, { type: entry.mime });
  if (merged.size !== totalSize) throw new Error(`Model size mismatch: expected ${totalSize}, got ${merged.size}`);
  return merged.arrayBuffer();
}

// --- ONNX session creation ---

/**
 * ORT 1.21 needs to fetch the .wasm binary and dynamically import the .mjs glue.
 * Vite blocks dynamic imports of files from public/, so we can't host them locally.
 * Instead we point to the exact files on jsDelivr CDN (same version, immutable cache,
 * CORS-enabled). The .mjs and .wasm are fetched at runtime by ORT's internal loader.
 */
const ORT_VERSION = '1.21.0';
const ORT_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

function getWasmPaths(): string {
  return ORT_CDN_BASE;
}

function getInferenceResolution(): number {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency ?? 4;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;

  if (isMobile) {
    if (memory !== undefined && memory <= 2) return 512;
    if (cores <= 4) return 640;
    return 768;
  }
  return 1024;
}

async function createSession(
  model: string,
  useWebGPU: boolean,
  inferenceResolution: number,
  onProgress: (p: BgRemovalProgress) => void,
): Promise<CachedSession> {
  // Download model
  const tDownloadStart = performance.now();
  const modelBuffer = await downloadModelBlob(model, onProgress);
  const downloadTime = performance.now() - tDownloadStart;

  // Get ORT
  const ort = await getOrt(useWebGPU);

  // Configure ORT — load WASM assets from jsDelivr CDN (Vite-compatible)
  ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4;
  ort.env.wasm.proxy = false;
  ort.env.wasm.wasmPaths = getWasmPaths();

  console.log('[BG ORT Diagnostics]', {
    wasmPaths: ort.env.wasm.wasmPaths,
    webgpuAvailable: useWebGPU,
    model,
    numThreads: ort.env.wasm.numThreads,
  });

  // Create session — WebGPU primary, WASM fallback
  const tSessionStart = performance.now();
  const sessionOptions: Record<string, unknown> = {
    executionProviders: useWebGPU
      ? ['webgpu']
      : ['wasm'],
    graphOptimizationLevel: 'all',
    executionMode: 'parallel',
    enableCpuMemArena: !useWebGPU,
    enableMemPattern: !useWebGPU,
  };

  const session = await ort.InferenceSession.create(new Uint8Array(modelBuffer), sessionOptions);
  const sessionCreateTime = performance.now() - tSessionStart;

  console.log('[BG Session]', {
    model,
    useWebGPU,
    downloadTime: `${downloadTime.toFixed(0)}ms`,
    sessionCreateTime: `${sessionCreateTime.toFixed(0)}ms`,
    inputNames: session.inputNames,
    outputNames: session.outputNames,
    inferenceResolution,
  });

  return { session, model, useWebGPU, inferenceResolution };
}

async function getOrCreateSession(
  model: string,
  useWebGPU: boolean,
  inferenceResolution: number,
  onProgress: (p: BgRemovalProgress) => void,
): Promise<CachedSession> {
  // Return cached session if config matches
  if (sessionCache &&
      sessionCache.model === model &&
      sessionCache.useWebGPU === useWebGPU &&
      sessionCache.inferenceResolution === inferenceResolution) {
    return sessionCache;
  }

  // If a session creation is in progress with the same config, wait for it
  if (sessionCreatePromise) {
    const pending = await sessionCreatePromise.catch(() => null);
    if (pending &&
        pending.model === model &&
        pending.useWebGPU === useWebGPU &&
        pending.inferenceResolution === inferenceResolution) {
      return pending;
    }
  }

  // Release old session if config changed
  if (sessionCache) {
    try { sessionCache.session.release(); } catch { /* ignore */ }
    sessionCache = null;
  }

  sessionCreatePromise = createSession(model, useWebGPU, inferenceResolution, onProgress);
  try {
    sessionCache = await sessionCreatePromise;
    return sessionCache;
  } finally {
    sessionCreatePromise = null;
  }
}

// --- Image decoding ---

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

interface DecodedImage {
  data: Uint8ClampedArray;  // RGBA pixel data
  width: number;
  height: number;
}

async function decodeImage(file: File, maxDim: number): Promise<DecodedImage> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    let w: number, h: number;
    if (longest > maxDim) {
      const scale = maxDim / longest;
      w = Math.round(bitmap.width * scale);
      h = Math.round(bitmap.height * scale);
    } else {
      w = bitmap.width;
      h = bitmap.height;
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    ctx.clearRect(0, 0, w, h);
    return { data: imageData.data, width: w, height: h };
  } catch {
    // Fallback for older browsers
    const objUrl = URL.createObjectURL(file);
    try {
      const img = await loadImage(objUrl);
      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      let w: number, h: number;
      if (longest > maxDim) {
        const scale = maxDim / longest;
        w = Math.round(img.naturalWidth * scale);
        h = Math.round(img.naturalHeight * scale);
      } else {
        w = img.naturalWidth;
        h = img.naturalHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      ctx.clearRect(0, 0, w, h);
      return { data: imageData.data, width: w, height: h };
    } finally {
      URL.revokeObjectURL(objUrl);
    }
  } finally {
    if (bitmap) bitmap.close();
  }
}

// --- Preprocessing: resize to inference resolution + HWC→BCHW normalization ---

/**
 * Resize RGBA image to target resolution using bilinear interpolation,
 * then convert to NCHW float32 tensor with mean/std normalization.
 * This replaces the library's tensorResizeBilinear + tensorHWCtoBCHW.
 */
function preprocessImage(
  imageData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  targetW: number,
  targetH: number,
): Float32Array {
  const t0 = performance.now();

  // If already at target size, skip resize
  let resizedData: Uint8ClampedArray;
  let resizedW: number, resizedH: number;

  if (srcW === targetW && srcH === targetH) {
    resizedData = imageData;
    resizedW = targetW;
    resizedH = targetH;
  } else {
    // Bilinear resize
    resizedData = new Uint8ClampedArray(targetW * targetH * 4);
    resizedW = targetW;
    resizedH = targetH;

    const scaleX = srcW / targetW;
    const scaleY = srcH / targetH;

    for (let y = 0; y < targetH; y++) {
      const srcY = y * scaleY;
      const y1 = Math.max(Math.floor(srcY), 0);
      const y2 = Math.min(Math.ceil(srcY), srcH - 1);
      const dy = srcY - y1;

      for (let x = 0; x < targetW; x++) {
        const srcX = x * scaleX;
        const x1 = Math.max(Math.floor(srcX), 0);
        const x2 = Math.min(Math.ceil(srcX), srcW - 1);
        const dx = srcX - x1;

        const dstIdx = (y * targetW + x) * 4;
        // Only need RGB channels (0,1,2) — alpha is not used by the model
        for (let c = 0; c < 3; c++) {
          const srcIdx1 = (y1 * srcW + x1) * 4 + c;
          const srcIdx2 = (y1 * srcW + x2) * 4 + c;
          const srcIdx3 = (y2 * srcW + x1) * 4 + c;
          const srcIdx4 = (y2 * srcW + x2) * 4 + c;
          const p1 = imageData[srcIdx1];
          const p2 = imageData[srcIdx2];
          const p3 = imageData[srcIdx3];
          const p4 = imageData[srcIdx4];
          resizedData[dstIdx + c] = (1 - dx) * (1 - dy) * p1 + dx * (1 - dy) * p2 + (1 - dx) * dy * p3 + dx * dy * p4;
        }
      }
    }
  }

  // HWC → BCHW with mean/std normalization (same as library's tensorHWCtoBCHW)
  const stride = resizedW * resizedH;
  const float32Data = new Float32Array(3 * stride);
  for (let i = 0, j = 0; i < resizedData.length; i += 4, j += 1) {
    float32Data[j] = (resizedData[i] - MEAN[0]) / STD[0];
    float32Data[j + stride] = (resizedData[i + 1] - MEAN[1]) / STD[1];
    float32Data[j + stride + stride] = (resizedData[i + 2] - MEAN[2]) / STD[2];
  }

  const elapsed = performance.now() - t0;
  console.log(`[BG Preprocess] ${srcW}×${srcH} → ${targetW}×${targetH}: ${elapsed.toFixed(0)}ms`);

  return float32Data;
}

// --- Mask resize (bilinear, single channel) ---

function resizeMaskBilinear(
  mask: Float32Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Uint8Array {
  const t0 = performance.now();
  const output = new Uint8Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const srcY = y * scaleY;
    const y1 = Math.max(Math.floor(srcY), 0);
    const y2 = Math.min(Math.ceil(srcY), srcH - 1);
    const dy = srcY - y1;

    for (let x = 0; x < dstW; x++) {
      const srcX = x * scaleX;
      const x1 = Math.max(Math.floor(srcX), 0);
      const x2 = Math.min(Math.ceil(srcX), srcW - 1);
      const dx = srcX - x1;

      const p1 = mask[y1 * srcW + x1];
      const p2 = mask[y1 * srcW + x2];
      const p3 = mask[y2 * srcW + x1];
      const p4 = mask[y2 * srcW + x2];
      const val = (1 - dx) * (1 - dy) * p1 + dx * (1 - dy) * p2 + (1 - dx) * dy * p3 + dx * dy * p4;
      output[y * dstW + x] = Math.max(0, Math.min(255, val * 255));
    }
  }

  const elapsed = performance.now() - t0;
  console.log(`[BG MaskResize] ${srcW}×${srcH} → ${dstW}×${dstH}: ${elapsed.toFixed(0)}ms`);
  return output;
}

// --- Alpha compositing + PNG encoding ---

async function compositeAndEncode(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  mask: Uint8Array,
  quality: number,
): Promise<Blob> {
  const t0 = performance.now();

  // Apply mask as alpha channel
  const stride = width * height;
  for (let i = 0; i < stride; i++) {
    imageData[i * 4 + 3] = mask[i];
  }

  // Encode to PNG via canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const imgData = new ImageData(imageData, width, height);
  ctx.putImageData(imgData, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png', quality);
  });

  ctx.clearRect(0, 0, width, height);
  const elapsed = performance.now() - t0;
  console.log(`[BG Encode] ${width}×${height}: ${elapsed.toFixed(0)}ms`);
  return blob;
}

// --- PNG dimension reading ---

function getPngDimensions(blob: Blob): Promise<{ width: number; height: number } | null> {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    blob.arrayBuffer().then((buf) => {
      const bytes = new Uint8Array(buf);
      if (bytes.length < 24) return resolve(null);
      const sig = [137, 80, 78, 71, 13, 10, 26, 10];
      for (let i = 0; i < 8; i++) {
        if (bytes[i] !== sig[i]) return resolve(null);
      }
      const view = new DataView(buf, 16, 8);
      resolve({ width: view.getUint32(0), height: view.getUint32(4) });
    }).catch(() => resolve(null));
  });
}

// --- Timeout utility ---

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

// --- Fallback to library pipeline ---

async function fallbackLibraryPipeline(
  file: File,
  isStale: () => boolean,
  onProgress: (p: BgRemovalProgress) => void,
  timeoutMs: number,
): Promise<BgRemovalResult> {
  const lib = await getLib();
  const result = await withTimeout(
    lib.removeBackground(file, {
      model: 'isnet_quint8',
      device: 'cpu',
      output: { format: 'image/png', quality: 0.9 },
      progress: (_key: string, _current: number, _total: number) => {
        if (isStale()) return;
        onProgress({ stage: 'inference', downloadPercent: null, message: 'AI is processing your image...' });
      },
    }),
    timeoutMs,
  );
  const resultBlob = result as Blob;
  const dims = await getPngDimensions(resultBlob);
  return { blob: resultBlob, width: dims?.width ?? 0, height: dims?.height ?? 0 };
}

// --- Main pipeline ---

export async function removeBackgroundPipeline(
  file: File,
  isStale: () => boolean,
  onProgress: (p: BgRemovalProgress) => void,
  timeoutMs: number = 180000,
): Promise<BgRemovalResult> {
  const totalStart = performance.now();

  const crossIsolated = typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false;
  const hwConcurrency = navigator.hardwareConcurrency ?? 0;
  const useWebGPU = await checkWebGPU();
  const model = useWebGPU ? 'isnet_fp16' : 'isnet_quint8';
  const inferenceResolution = getInferenceResolution();

  try {
    // Stage 1: Get or create ONNX session (downloads model on first run)
    onProgress({ stage: 'preparing', downloadPercent: null, message: 'Preparing image...' });

    const cached = await getOrCreateSession(model, useWebGPU, inferenceResolution, onProgress);
    if (isStale()) throw new Error('stale');

    // Stage 2: Decode image (downscale to maxDim for memory efficiency)
    const maxDecodeDim = Math.max(inferenceResolution, 1024); // Keep at least 1024 for output quality
    const tDecodeStart = performance.now();
    const decoded = await decodeImage(file, maxDecodeDim);
    const decodeTime = performance.now() - tDecodeStart;
    if (isStale()) throw new Error('stale');

    // Stage 3: Preprocess — resize to inference resolution + normalize
    onProgress({ stage: 'decoding', downloadPercent: null, message: 'Preparing image for AI...' });
    const tPreprocessStart = performance.now();
    const targetW = inferenceResolution;
    const targetH = inferenceResolution;
    const inputData = preprocessImage(decoded.data, decoded.width, decoded.height, targetW, targetH);
    const preprocessTime = performance.now() - tPreprocessStart;
    if (isStale()) throw new Error('stale');

    // Stage 4: Run ONNX inference
    onProgress({ stage: 'inference', downloadPercent: null, message: 'AI is processing your image...' });
    const ort = await getOrt(useWebGPU);
    const inputTensor = new ort.Tensor('float32', inputData, [1, 3, targetH, targetW]);
    const feeds: Record<string, unknown> = {};
    feeds[cached.session.inputNames[0] || MODEL_INPUT_NAME] = inputTensor;

    const tInferenceStart = performance.now();
    const outputData = await withTimeout(
      cached.session.run(feeds, {}),
      timeoutMs,
    );
    const inferenceTime = performance.now() - tInferenceStart;
    if (isStale()) throw new Error('stale');

    // Stage 5: Extract mask from output
    onProgress({ stage: 'mask', downloadPercent: null, message: 'Creating transparency mask...' });
    const outputTensor = outputData[cached.session.outputNames[0] || MODEL_OUTPUT_NAME];
    if (!outputTensor) throw new Error('Model did not return expected output');
    const maskFloat = outputTensor.data as Float32Array;
    const maskShape = outputTensor.dims;
    // Model outputs [1, 1, H, W] or [1, H, W, 1] — find spatial dims
    const maskH = maskShape[2] || targetH;
    const maskW = maskShape[3] || targetW;

    // Stage 6: Resize mask to original image dimensions
    const tMaskResizeStart = performance.now();
    const maskU8 = resizeMaskBilinear(maskFloat, maskW, maskH, decoded.width, decoded.height);
    const maskResizeTime = performance.now() - tMaskResizeStart;
    if (isStale()) throw new Error('stale');

    // Stage 7: Composite mask onto image and encode as PNG
    onProgress({ stage: 'encoding', downloadPercent: null, message: 'Creating transparent result...' });
    const tEncodeStart = performance.now();
    const blob = await compositeAndEncode(decoded.data, decoded.width, decoded.height, maskU8, 0.9);
    const encodeTime = performance.now() - tEncodeStart;

    // Stage 8: Read dimensions
    const dims = await getPngDimensions(blob);
    const totalTime = performance.now() - totalStart;

    const timings: BgRemovalTimings = {
      moduleInit: 0,
      modelDownload: 0,
      sessionCreate: 0,
      imageDecode: decodeTime,
      preprocessing: preprocessTime,
      inference: inferenceTime,
      maskResize: maskResizeTime,
      compositing: 0,
      pngEncode: encodeTime,
      total: totalTime,
      webgpuUsed: useWebGPU,
      crossOriginIsolated: crossIsolated,
      hardwareConcurrency: hwConcurrency,
      model,
      inferenceResolution,
      inputTensorShape: [1, 3, targetH, targetW],
    };

    console.log('[Background Removal Timing]', {
      model: timings.model,
      webgpuUsed: timings.webgpuUsed,
      crossOriginIsolated: timings.crossOriginIsolated,
      hardwareConcurrency: timings.hardwareConcurrency,
      inferenceResolution: timings.inferenceResolution,
      inputTensorShape: timings.inputTensorShape,
      imageDecode: `${timings.imageDecode.toFixed(0)}ms`,
      preprocessing: `${timings.preprocessing.toFixed(0)}ms`,
      inference: `${timings.inference.toFixed(0)}ms`,
      maskResize: `${timings.maskResize.toFixed(0)}ms`,
      pngEncode: `${timings.pngEncode.toFixed(0)}ms`,
      total: `${timings.total.toFixed(0)}ms`,
    });

    onProgress({ stage: 'done', downloadPercent: null, message: 'Done' });

    return {
      blob,
      width: dims?.width ?? decoded.width,
      height: dims?.height ?? decoded.height,
    };
  } catch (err) {
    if (err instanceof Error && err.message === 'stale') throw err;

    console.error('Custom ONNX pipeline failed, falling back to library:', err);

    // Fallback to the library's built-in pipeline (which is known to work)
    if (!isStale()) {
      onProgress({ stage: 'inference', downloadPercent: null, message: 'AI is processing your image...' });
      return await fallbackLibraryPipeline(file, isStale, onProgress, timeoutMs);
    }
    throw err;
  }
}
