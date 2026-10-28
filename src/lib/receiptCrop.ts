/**
 * Detects the receipt in a photo, straightens it (perspective correction)
 * and crops away the background. Pure canvas + typed arrays — no OpenCV —
 * so it stays light enough for phone WebViews.
 *
 * Approach: downscale -> blur -> Otsu threshold (paper is brighter than the
 * surface it lies on) -> morphological opening -> largest bright blob ->
 * fill its holes (printed text) -> take the four extreme corners -> warp.
 *
 * Detection is deliberately conservative: whenever the result doesn't look
 * like a single receipt-shaped quadrilateral (white paper on a white desk,
 * a full-frame screenshot, a cluttered scene…) it returns the original
 * file untouched, so a bad guess can never cost the user their receipt.
 */

const ANALYSIS_MAX = 480;
const SOURCE_MAX = 2600;
const OUTPUT_MAX = 1800;
const JPEG_QUALITY = 0.92;
// Pull each corner slightly toward the centre so no background fringe
// survives at the edges; receipts have margins, so text is never touched.
const CORNER_INSET = 0.006;

const MIN_AREA_RATIO = 0.1;
const MAX_AREA_RATIO = 0.93;
const MIN_RECTANGULARITY = 0.82;

interface Point {
  x: number;
  y: number;
}

interface Quad {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

function otsuThreshold(gray: Uint8ClampedArray): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];

  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    weightBackground += hist[t];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += t * hist[t];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sumAll - sumBackground) / weightForeground;
    const variance =
      weightBackground * weightForeground * (meanBackground - meanForeground) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = t;
    }
  }
  return threshold;
}

function boxBlur(src: Uint8ClampedArray, w: number, h: number, radius: number) {
  const tmp = new Float32Array(w * h);
  const out = new Uint8ClampedArray(w * h);
  const span = radius * 2 + 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        sum += src[y * w + xx];
      }
      tmp[y * w + x] = sum / span;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        sum += tmp[yy * w + x];
      }
      out[y * w + x] = sum / span;
    }
  }
  return out;
}

/** Separable square erosion (mode "min") or dilation (mode "max") of a 0/1 mask. */
function morph(mask: Uint8Array, w: number, h: number, radius: number, mode: "min" | "max") {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  const seed = mode === "min" ? 1 : 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let value = seed;
      for (let k = -radius; k <= radius; k++) {
        const xx = x + k;
        // Outside the frame counts as empty so erosion doesn't pad edges.
        const sample = xx < 0 || xx >= w ? 0 : mask[y * w + xx];
        value = mode === "min" ? Math.min(value, sample) : Math.max(value, sample);
      }
      tmp[y * w + x] = value;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let value = seed;
      for (let k = -radius; k <= radius; k++) {
        const yy = y + k;
        const sample = yy < 0 || yy >= h ? 0 : tmp[yy * w + x];
        value = mode === "min" ? Math.min(value, sample) : Math.max(value, sample);
      }
      out[y * w + x] = value;
    }
  }
  return out;
}

/** Labels 4-connected foreground blobs and returns a mask of just the largest. */
function largestComponent(mask: Uint8Array, w: number, h: number) {
  const labels = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  let bestLabel = 0;
  let bestArea = 0;
  let label = 0;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue;
    label++;
    let area = 0;
    let top = 0;
    stack[top++] = start;
    labels[start] = label;

    while (top > 0) {
      const idx = stack[--top];
      area++;
      const x = idx % w;
      const y = (idx - x) / w;
      if (x > 0 && mask[idx - 1] && !labels[idx - 1]) {
        labels[idx - 1] = label;
        stack[top++] = idx - 1;
      }
      if (x < w - 1 && mask[idx + 1] && !labels[idx + 1]) {
        labels[idx + 1] = label;
        stack[top++] = idx + 1;
      }
      if (y > 0 && mask[idx - w] && !labels[idx - w]) {
        labels[idx - w] = label;
        stack[top++] = idx - w;
      }
      if (y < h - 1 && mask[idx + w] && !labels[idx + w]) {
        labels[idx + w] = label;
        stack[top++] = idx + w;
      }
    }

    if (area > bestArea) {
      bestArea = area;
      bestLabel = label;
    }
  }

  if (bestLabel === 0) return null;
  const component = new Uint8Array(w * h);
  for (let i = 0; i < labels.length; i++) if (labels[i] === bestLabel) component[i] = 1;
  return component;
}

/** Area of the shape once interior holes (printed text) are filled in. */
function filledArea(component: Uint8Array, w: number, h: number): number {
  const outside = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let top = 0;

  const seed = (idx: number) => {
    if (!component[idx] && !outside[idx]) {
      outside[idx] = 1;
      stack[top++] = idx;
    }
  };
  for (let x = 0; x < w; x++) {
    seed(x);
    seed((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + (w - 1));
  }

  let outsideCount = 0;
  while (top > 0) {
    const idx = stack[--top];
    outsideCount++;
    const x = idx % w;
    const y = (idx - x) / w;
    if (x > 0) seed(idx - 1);
    if (x < w - 1) seed(idx + 1);
    if (y > 0) seed(idx - w);
    if (y < h - 1) seed(idx + w);
  }
  return w * h - outsideCount;
}

function extremeCorners(component: Uint8Array, w: number, h: number): Quad {
  let minSum = Infinity;
  let maxSum = -Infinity;
  let minDiff = Infinity;
  let maxDiff = -Infinity;
  const tl = { x: 0, y: 0 };
  const br = { x: 0, y: 0 };
  const tr = { x: 0, y: 0 };
  const bl = { x: 0, y: 0 };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!component[y * w + x]) continue;
      const sum = x + y;
      const diff = x - y;
      if (sum < minSum) {
        minSum = sum;
        tl.x = x;
        tl.y = y;
      }
      if (sum > maxSum) {
        maxSum = sum;
        br.x = x;
        br.y = y;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        tr.x = x;
        tr.y = y;
      }
      if (diff < minDiff) {
        minDiff = diff;
        bl.x = x;
        bl.y = y;
      }
    }
  }
  return { tl, tr, br, bl };
}

function quadArea(q: Quad): number {
  const pts = [q.tl, q.tr, q.br, q.bl];
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Returns the receipt's corners in analysis-image coordinates, or null if unsure. */
function detectQuad(imageData: ImageData): Quad | null {
  const { width: w, height: h, data } = imageData;

  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }

  const blurred = boxBlur(gray, w, h, 2);
  const threshold = otsuThreshold(blurred);

  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i++) mask[i] = blurred[i] > threshold ? 1 : 0;

  const opened = morph(morph(mask, w, h, 2, "min"), w, h, 2, "max");
  const component = largestComponent(opened, w, h);
  if (!component) return null;

  const area = filledArea(component, w, h);
  const areaRatio = area / (w * h);
  if (areaRatio < MIN_AREA_RATIO || areaRatio > MAX_AREA_RATIO) return null;

  const quad = extremeCorners(component, w, h);
  const quadSize = quadArea(quad);
  if (quadSize <= 0) return null;

  const rectangularity = area / quadSize;
  if (rectangularity < MIN_RECTANGULARITY || rectangularity > 1.15) return null;

  const shortSide = Math.min(w, h);
  const edges = [
    distance(quad.tl, quad.tr),
    distance(quad.tr, quad.br),
    distance(quad.br, quad.bl),
    distance(quad.bl, quad.tl),
  ];
  if (edges.some((e) => e < shortSide * 0.12)) return null;

  return quad;
}

/** Solves for the 8 homography coefficients mapping each dst point onto its src point. */
function solveHomography(dst: Point[], src: Point[]): number[] | null {
  const m: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = dst[i];
    const { x: u, y: v } = src[i];
    m.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u]);
    m.push([0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  }

  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) < 1e-9) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    for (let row = 0; row < 8; row++) {
      if (row === col) continue;
      const factor = m[row][col] / m[col][col];
      for (let k = col; k < 9; k++) m[row][k] -= factor * m[col][k];
    }
  }
  return m.map((row, i) => row[8] / row[i]);
}

function warpPerspective(source: ImageData, quad: Quad, outW: number, outH: number) {
  const h = solveHomography(
    [
      { x: 0, y: 0 },
      { x: outW - 1, y: 0 },
      { x: outW - 1, y: outH - 1 },
      { x: 0, y: outH - 1 },
    ],
    [quad.tl, quad.tr, quad.br, quad.bl]
  );
  if (!h) return null;

  const out = new ImageData(outW, outH);
  const { width: sw, height: sh, data: sd } = source;
  const od = out.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const denom = h[6] * x + h[7] * y + 1;
      const u = (h[0] * x + h[1] * y + h[2]) / denom;
      const v = (h[3] * x + h[4] * y + h[5]) / denom;

      const x0 = Math.min(sw - 2, Math.max(0, Math.floor(u)));
      const y0 = Math.min(sh - 2, Math.max(0, Math.floor(v)));
      const fx = Math.min(1, Math.max(0, u - x0));
      const fy = Math.min(1, Math.max(0, v - y0));

      const i00 = (y0 * sw + x0) * 4;
      const i10 = i00 + 4;
      const i01 = i00 + sw * 4;
      const i11 = i01 + 4;
      const o = (y * outW + x) * 4;

      for (let c = 0; c < 4; c++) {
        const top = sd[i00 + c] * (1 - fx) + sd[i10 + c] * fx;
        const bottom = sd[i01 + c] * (1 - fx) + sd[i11 + c] * fx;
        od[o + c] = top * (1 - fy) + bottom * fy;
      }
    }
  }
  return out;
}

function drawScaled(bitmap: ImageBitmap, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

function insetQuad(q: Quad): Quad {
  const cx = (q.tl.x + q.tr.x + q.br.x + q.bl.x) / 4;
  const cy = (q.tl.y + q.tr.y + q.br.y + q.bl.y) / 4;
  const pull = (p: Point): Point => ({
    x: p.x + (cx - p.x) * CORNER_INSET,
    y: p.y + (cy - p.y) * CORNER_INSET,
  });
  return { tl: pull(q.tl), tr: pull(q.tr), br: pull(q.br), bl: pull(q.bl) };
}

/**
 * Returns a cropped, straightened copy of the receipt in `file`, or the
 * original `file` if no receipt could be confidently detected.
 */
export async function cropReceiptFromImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const analysis = drawScaled(bitmap, ANALYSIS_MAX);
      const source = drawScaled(bitmap, SOURCE_MAX);
      if (!analysis || !source) return file;

      const detected = detectQuad(
        analysis.ctx.getImageData(0, 0, analysis.canvas.width, analysis.canvas.height)
      );
      if (!detected) return file;

      const ratio = source.canvas.width / analysis.canvas.width;
      const scaled = insetQuad({
        tl: { x: detected.tl.x * ratio, y: detected.tl.y * ratio },
        tr: { x: detected.tr.x * ratio, y: detected.tr.y * ratio },
        br: { x: detected.br.x * ratio, y: detected.br.y * ratio },
        bl: { x: detected.bl.x * ratio, y: detected.bl.y * ratio },
      });

      let outW = Math.round(Math.max(distance(scaled.tl, scaled.tr), distance(scaled.bl, scaled.br)));
      let outH = Math.round(Math.max(distance(scaled.tl, scaled.bl), distance(scaled.tr, scaled.br)));
      const shrink = Math.min(1, OUTPUT_MAX / Math.max(outW, outH));
      outW = Math.max(2, Math.round(outW * shrink));
      outH = Math.max(2, Math.round(outH * shrink));

      const warped = warpPerspective(
        source.ctx.getImageData(0, 0, source.canvas.width, source.canvas.height),
        scaled,
        outW,
        outH
      );
      if (!warped) return file;

      const outCanvas = document.createElement("canvas");
      outCanvas.width = outW;
      outCanvas.height = outH;
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) return file;
      outCtx.putImageData(warped, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        outCanvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
      );
      if (!blob) return file;

      const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
      return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
    } finally {
      bitmap.close();
    }
  } catch {
    // Undecodable format (e.g. HEIC outside Safari) or any canvas failure:
    // the original is always a safe answer.
    return file;
  }
}
