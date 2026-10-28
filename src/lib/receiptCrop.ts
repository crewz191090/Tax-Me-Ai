/**
 * Finds the receipt in a photo, straightens it (perspective correction) and
 * crops the background away. Pure canvas + typed arrays — no OpenCV — so it
 * stays light enough for phone WebViews.
 *
 * Detection is edge based: Sobel edges -> orientation-aware Hough lines ->
 * pick the quadrilateral of four lines whose sides are best backed by real
 * edges and that separates a distinct inside from its surroundings. Unlike
 * a brightness threshold this survives shadows across the paper, creases,
 * light surfaces and rotated receipts, because it only needs the outline.
 *
 * When nothing convincing is found it returns no quad and the original
 * image is kept; the user can then draw the crop themselves (CropEditor).
 */

export interface Point {
  x: number;
  y: number;
}

/** Corners in 0..1 coordinates relative to the (EXIF-corrected) image. */
export interface Quad {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

export interface CropResult {
  file: File;
  /** The detected receipt outline, or null if nothing convincing was found. */
  quad: Quad | null;
}

interface PixelImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

const ANALYSIS_MAX = 480;
const SOURCE_MAX = 2600;
const OUTPUT_MAX = 1800;
const JPEG_QUALITY = 0.92;
// Pull each auto-detected corner slightly inward so no background fringe
// survives; receipts have margins, so text is never touched.
const CORNER_INSET = 0.006;

const ANGLE_BINS = 180;
const MAX_PEAKS = 120;
const MAX_LINES = 28;
const MIN_AREA_RATIO = 0.05;
const MAX_AREA_RATIO = 0.96;
const MIN_SIDE_SUPPORT = 0.55;
const MIN_MEAN_SUPPORT = 0.7;
const MIN_CONTRAST = 12;
const MIN_SCORE = 0.2;
// Frame-edge sides are free to satisfy, so each costs a little: a quad only
// wins by using them when the receipt genuinely runs off the photo.
const BORDER_SIDE_PENALTY = 0.75;

// ---------------------------------------------------------------- image ops

function boxBlur(src: Uint8ClampedArray, w: number, h: number, radius: number) {
  const tmp = new Float32Array(w * h);
  const out = new Uint8ClampedArray(w * h);
  const span = radius * 2 + 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += src[y * w + Math.min(w - 1, Math.max(0, x + k))];
      }
      tmp[y * w + x] = sum / span;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let k = -radius; k <= radius; k++) {
        sum += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
      }
      out[y * w + x] = sum / span;
    }
  }
  return out;
}

/**
 * Sobel gradient. `ori` is the gradient direction folded into [0, PI) —
 * i.e. the normal of the edge, which is exactly the Hough line's theta.
 */
function sobel(gray: Uint8ClampedArray, w: number, h: number) {
  const mag = new Float32Array(w * h);
  const ori = new Float32Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = gray[i - w - 1];
      const t = gray[i - w];
      const tr = gray[i - w + 1];
      const l = gray[i - 1];
      const r = gray[i + 1];
      const bl = gray[i + w - 1];
      const b = gray[i + w];
      const br = gray[i + w + 1];

      const gx = tr + 2 * r + br - (tl + 2 * l + bl);
      const gy = bl + 2 * b + br - (tl + 2 * t + tr);
      mag[i] = Math.hypot(gx, gy);

      let a = Math.atan2(gy, gx) % Math.PI;
      if (a < 0) a += Math.PI;
      ori[i] = a;
    }
  }
  return { mag, ori };
}

function edgeThreshold(mag: Float32Array): number {
  let max = 0;
  for (let i = 0; i < mag.length; i++) if (mag[i] > max) max = mag[i];
  if (max === 0) return Infinity;

  const bins = new Uint32Array(256);
  for (let i = 0; i < mag.length; i++) bins[Math.min(255, Math.floor((mag[i] / max) * 255))]++;

  const target = mag.length * 0.99;
  let cumulative = 0;
  let p99 = max;
  for (let b = 0; b < 256; b++) {
    cumulative += bins[b];
    if (cumulative >= target) {
      p99 = ((b + 1) / 256) * max;
      break;
    }
  }
  // Floor keeps sensor noise out; the relative term keeps a weak outline
  // (paper on a similar surface) from being drowned in a sea of text edges.
  return Math.max(18, 0.22 * p99);
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, Math.PI - d);
}

// ---------------------------------------------------------------- hough

interface Line {
  theta: number;
  rho: number;
  cos: number;
  sin: number;
  border: boolean;
  /** Cumulative counts along the line: samples inside the frame / edge-backed. */
  inside: Int32Array;
  backed: Int32Array;
}

function lineDistance(a: { theta: number; rho: number }, b: { theta: number; rho: number }) {
  let dTheta = a.theta - b.theta;
  let rhoB = b.rho;
  if (dTheta > Math.PI / 2) {
    dTheta -= Math.PI;
    rhoB = -rhoB;
  } else if (dTheta < -Math.PI / 2) {
    dTheta += Math.PI;
    rhoB = -rhoB;
  }
  return { dTheta: Math.abs(dTheta), dRho: Math.abs(a.rho - rhoB) };
}

function houghLines(
  edgeOri: Float32Array,
  w: number,
  h: number
): { theta: number; rho: number }[] {
  const diag = Math.ceil(Math.hypot(w, h));
  const rhoSize = diag * 2 + 1;
  const acc = new Uint16Array(ANGLE_BINS * rhoSize);
  const cos = new Float32Array(ANGLE_BINS);
  const sin = new Float32Array(ANGLE_BINS);
  for (let b = 0; b < ANGLE_BINS; b++) {
    cos[b] = Math.cos((b * Math.PI) / ANGLE_BINS);
    sin[b] = Math.sin((b * Math.PI) / ANGLE_BINS);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ori = edgeOri[y * w + x];
      if (ori < 0) continue;
      const centre = Math.round((ori / Math.PI) * ANGLE_BINS);
      for (let d = -1; d <= 1; d++) {
        const b = (centre + d + ANGLE_BINS) % ANGLE_BINS;
        const rho = Math.round(x * cos[b] + y * sin[b]) + diag;
        acc[b * rhoSize + rho]++;
      }
    }
  }

  const peaks: { theta: number; rho: number; votes: number }[] = [];
  let maxVotes = 0;
  for (let b = 0; b < ANGLE_BINS; b++) {
    for (let r = 1; r < rhoSize - 1; r++) {
      const v = acc[b * rhoSize + r - 1] + acc[b * rhoSize + r] + acc[b * rhoSize + r + 1];
      if (v > maxVotes) maxVotes = v;
      if (v >= 60) {
        peaks.push({ theta: (b * Math.PI) / ANGLE_BINS, rho: r - diag, votes: v });
      }
    }
  }
  if (peaks.length === 0) return [];

  const minVotes = Math.max(60, maxVotes * 0.02);
  peaks.sort((a, b) => b.votes - a.votes);

  const chosen: { theta: number; rho: number }[] = [];
  for (const p of peaks) {
    if (p.votes < minVotes) break;
    const duplicate = chosen.some((c) => {
      const d = lineDistance(c, p);
      return d.dTheta < (6 * Math.PI) / 180 && d.dRho < 9;
    });
    if (duplicate) continue;
    chosen.push({ theta: p.theta, rho: p.rho });
    if (chosen.length >= MAX_PEAKS) break;
  }
  return chosen;
}

/** Precomputes, along a line, where it lies in the frame and where real edges back it. */
function profileLine(
  theta: number,
  rho: number,
  border: boolean,
  edgeOri: Float32Array,
  w: number,
  h: number
): Line {
  const diag = Math.ceil(Math.hypot(w, h));
  const size = diag * 2 + 2;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const x0 = rho * cos;
  const y0 = rho * sin;
  const inside = new Int32Array(size);
  const backed = new Int32Array(size);
  const tolerance = (20 * Math.PI) / 180;

  for (let i = 0; i < size - 1; i++) {
    const t = i - diag;
    const x = Math.round(x0 - t * sin);
    const y = Math.round(y0 + t * cos);
    let isInside = 0;
    let isBacked = 0;

    if (x >= 0 && x < w && y >= 0 && y < h) {
      isInside = 1;
      if (border) {
        isBacked = 1;
      } else {
        search: for (let dy = -2; dy <= 2; dy++) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            const ori = edgeOri[yy * w + xx];
            if (ori >= 0 && angleDiff(ori, theta) <= tolerance) {
              isBacked = 1;
              break search;
            }
          }
        }
      }
    }
    inside[i + 1] = inside[i] + isInside;
    backed[i + 1] = backed[i] + isBacked;
  }
  return { theta, rho, cos, sin, border, inside, backed };
}

/** Longest stretch of a line that real edges back, bridging gaps of up to 6 samples. */
function longestBackedRun(l: Line): number {
  let best = 0;
  let run = 0;
  let gap = 0;
  for (let i = 1; i < l.inside.length; i++) {
    const inside = l.inside[i] - l.inside[i - 1];
    if (!inside) continue;
    if (l.backed[i] - l.backed[i - 1]) {
      run += 1 + gap;
      gap = 0;
      if (run > best) best = run;
    } else if (++gap > 6) {
      run = 0;
      gap = 0;
    }
  }
  return best;
}

/**
 * Signed brightness step across a line, averaged over a wide band (6-14px
 * each side) and along its whole length. A receipt outline has paper on one
 * side and table on the other, so this is large; a row of printed text has
 * paper-and-ink on both sides, so it cancels out to ~0.
 */
function lineContrast(l: Line, gray: Uint8ClampedArray, w: number, h: number): number {
  const diag = Math.ceil(Math.hypot(w, h));
  let sum = 0;
  let count = 0;
  for (let i = 0; i < l.inside.length - 1; i += 4) {
    if (l.inside[i + 1] - l.inside[i] === 0) continue;
    const t = i - diag;
    const px = l.rho * l.cos - t * l.sin;
    const py = l.rho * l.sin + t * l.cos;
    for (let off = 6; off <= 14; off += 2) {
      const ax = Math.round(px + l.cos * off);
      const ay = Math.round(py + l.sin * off);
      const bx = Math.round(px - l.cos * off);
      const by = Math.round(py - l.sin * off);
      if (ax < 0 || ax >= w || ay < 0 || ay >= h || bx < 0 || bx >= w || by < 0 || by >= h) continue;
      sum += gray[ay * w + ax] - gray[by * w + bx];
      count++;
    }
  }
  return count < 10 ? 0 : Math.abs(sum / count);
}

function intersect(a: Line, b: Line): Point | null {
  const det = a.cos * b.sin - a.sin * b.cos;
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (a.rho * b.sin - b.rho * a.sin) / det,
    y: (b.rho * a.cos - a.rho * b.cos) / det,
  };
}

/** Position of point p along line l, in the profile's index space. */
function along(l: Line, p: Point, diag: number): number {
  return Math.round(-(p.x - l.rho * l.cos) * l.sin + (p.y - l.rho * l.sin) * l.cos) + diag;
}

/**
 * Re-fits a side to the edge pixels that actually lie along it (total least
 * squares). The Hough accumulator only knows angles to ~1 degree, which at
 * the far end of a long side is several pixels of slop.
 */
function refineLine(
  line: Line,
  a: Point,
  b: Point,
  edgeOri: Float32Array,
  w: number,
  h: number
): Line {
  if (line.border) return line;
  const tOf = (p: Point) => -(p.x - line.rho * line.cos) * line.sin + (p.y - line.rho * line.sin) * line.cos;
  const tMin = Math.min(tOf(a), tOf(b));
  const tMax = Math.max(tOf(a), tOf(b));
  const tolerance = (25 * Math.PI) / 180;

  let n = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (let t = Math.ceil(tMin); t <= tMax; t++) {
    for (let off = -5; off <= 5; off++) {
      const x = Math.round(line.rho * line.cos - t * line.sin + off * line.cos);
      const y = Math.round(line.rho * line.sin + t * line.cos + off * line.sin);
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const ori = edgeOri[y * w + x];
      if (ori < 0 || angleDiff(ori, line.theta) > tolerance) continue;
      n++;
      sx += x;
      sy += y;
      sxx += x * x;
      syy += y * y;
      sxy += x * y;
    }
  }
  if (n < 30) return line;

  const mx = sx / n;
  const my = sy / n;
  const vxx = sxx / n - mx * mx;
  const vyy = syy / n - my * my;
  const vxy = sxy / n - mx * my;
  const direction = 0.5 * Math.atan2(2 * vxy, vxx - vyy);
  let theta = direction + Math.PI / 2;
  theta %= Math.PI;
  if (theta < 0) theta += Math.PI;
  if (angleDiff(theta, line.theta) > (5 * Math.PI) / 180) return line;

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return { ...line, theta, rho: mx * cos + my * sin, cos, sin };
}

function sideSupport(l: Line, a: Point, b: Point, diag: number): { support: number; samples: number } {
  let t1 = along(l, a, diag);
  let t2 = along(l, b, diag);
  if (t1 > t2) [t1, t2] = [t2, t1];
  t1 = Math.max(0, t1);
  t2 = Math.min(l.inside.length - 1, t2);
  if (t2 <= t1) return { support: 0, samples: 0 };
  const samples = l.inside[t2] - l.inside[t1];
  if (samples === 0) return { support: 0, samples: 0 };
  return { support: (l.backed[t2] - l.backed[t1]) / samples, samples };
}

function quadAreaPx(c: Point[]): number {
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const p = c[i];
    const q = c[(i + 1) % 4];
    area += p.x * q.y - q.x * p.y;
  }
  return area / 2;
}

function isConvexWithGoodAngles(c: Point[]): boolean {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const p = c[i];
    const q = c[(i + 1) % 4];
    const r = c[(i + 2) % 4];
    const cross = (q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x);
    if (cross === 0) return false;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;

    const v1 = { x: p.x - q.x, y: p.y - q.y };
    const v2 = { x: r.x - q.x, y: r.y - q.y };
    const cosAngle =
      (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
    const angle = (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180) / Math.PI;
    if (angle < 55 || angle > 125) return false;
  }
  return true;
}

function meanAt(gray: Uint8ClampedArray, w: number, h: number, x: number, y: number) {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || xi >= w || yi < 0 || yi >= h) return null;
  return gray[yi * w + xi];
}

/**
 * Weakest |inside - outside| brightness step among the quad's non-frame
 * sides. Taking the minimum (not the mean) means one side that is merely a
 * grid line or a seam between similar areas rejects the whole quad.
 */
function sideContrast(
  corners: Point[],
  borderSide: boolean[],
  gray: Uint8ClampedArray,
  w: number,
  h: number
): number {
  const centre = {
    x: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
    y: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
  };
  const diffs: number[] = [];

  for (let s = 0; s < 4; s++) {
    if (borderSide[s]) continue;
    const a = corners[s];
    const b = corners[(s + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let nx = -(b.y - a.y) / len;
    let ny = (b.x - a.x) / len;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if ((centre.x - mid.x) * nx + (centre.y - mid.y) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }

    // Pair up an inside and an outside sample at the same spot; a genuine
    // outline steps the same way everywhere (polarity coherence ~1), while a
    // grid line or seam between alternating areas flips sign (coherence ~0).
    let signed = 0;
    let absolute = 0;
    let pairs = 0;
    for (let d = 0.1; d < 0.9; d += 0.04) {
      const px = a.x + (b.x - a.x) * d;
      const py = a.y + (b.y - a.y) * d;
      for (const off of [5, 8]) {
        const inside = meanAt(gray, w, h, px + nx * off, py + ny * off);
        const outside = meanAt(gray, w, h, px - nx * off, py - ny * off);
        if (inside === null || outside === null) continue;
        signed += inside - outside;
        absolute += Math.abs(inside - outside);
        pairs++;
      }
    }
    if (pairs < 6 || absolute === 0) return 0;
    if (Math.abs(signed) / absolute < 0.5) return 0;
    diffs.push(Math.abs(signed / pairs));
  }
  if (diffs.length === 0) return 0;
  return Math.min(...diffs);
}

/**
 * Finds the receipt outline in an image (any size; internally analysed at
 * a reduced resolution). Returns corners in 0..1 coordinates, or null.
 */
export function detectReceiptQuad(image: PixelImage): Quad | null {
  const { width: w, height: h, data } = image;

  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  }
  const blurred = boxBlur(gray, w, h, 4);
  const { mag, ori } = sobel(blurred, w, h);

  const threshold = edgeThreshold(mag);
  const edgeOri = new Float32Array(w * h).fill(-1);
  for (let i = 0; i < mag.length; i++) if (mag[i] > threshold) edgeOri[i] = ori[i];

  const found = houghLines(edgeOri, w, h);
  if (found.length < 2) return null;

  const diag = Math.ceil(Math.hypot(w, h));
  // Hough votes alone over-rate the many short horizontal rows of printed
  // text, so rank candidates by how long an unbroken edge-backed run they
  // have and how strongly they separate two different regions: a receipt's
  // outline does both, a row of text does neither.
  const lines: Line[] = found
    .map((l) => {
      const line = profileLine(l.theta, l.rho, false, edgeOri, w, h);
      return {
        line,
        run: longestBackedRun(line),
        contrast: lineContrast(line, blurred, w, h),
      };
    })
    .filter((c) => c.run >= Math.min(w, h) * 0.18)
    .sort((a, b) => b.run * (b.contrast + 4) - a.run * (a.contrast + 4))
    .slice(0, MAX_LINES)
    .map((c) => c.line);
  // The frame itself is a valid side: a long receipt can run off the photo.
  lines.push(profileLine(0, 0, true, edgeOri, w, h));
  lines.push(profileLine(0, w - 1, true, edgeOri, w, h));
  lines.push(profileLine(Math.PI / 2, 0, true, edgeOri, w, h));
  lines.push(profileLine(Math.PI / 2, h - 1, true, edgeOri, w, h));

  const minDim = Math.min(w, h);
  const parallelPairs: [number, number][] = [];
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[i].border && lines[j].border) {
        // Opposite frame edges only (left/right or top/bottom).
        if (angleDiff(lines[i].theta, lines[j].theta) > 0.1) continue;
      }
      const d = lineDistance(lines[i], lines[j]);
      if (d.dTheta > (35 * Math.PI) / 180) continue;
      if (d.dRho < minDim * 0.1) continue;
      parallelPairs.push([i, j]);
    }
  }

  let best: { corners: Point[]; score: number; sides: { line: Line; from: Point; to: Point }[] } | null = null;

  for (let p = 0; p < parallelPairs.length; p++) {
    for (let q = p + 1; q < parallelPairs.length; q++) {
      const [a1, a2] = parallelPairs[p];
      const [b1, b2] = parallelPairs[q];
      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
      const A1 = lines[a1];
      const A2 = lines[a2];
      const B1 = lines[b1];
      const B2 = lines[b2];

      if (angleDiff(A1.theta, B1.theta) < (55 * Math.PI) / 180) continue;
      const borderCount = [A1, A2, B1, B2].filter((l) => l.border).length;
      if (borderCount > 2) continue;

      const c0 = intersect(A1, B1);
      const c1 = intersect(A1, B2);
      const c2 = intersect(A2, B2);
      const c3 = intersect(A2, B1);
      if (!c0 || !c1 || !c2 || !c3) continue;
      const corners = [c0, c1, c2, c3];

      if (corners.some((c) => c.x < -w * 0.1 || c.x > w * 1.1 || c.y < -h * 0.1 || c.y > h * 1.1)) {
        continue;
      }
      if (!isConvexWithGoodAngles(corners)) continue;

      const area = Math.abs(quadAreaPx(corners)) / (w * h);
      if (area < MIN_AREA_RATIO || area > MAX_AREA_RATIO) continue;

      // Sides: A1 (c0-c1), B2 (c1-c2), A2 (c2-c3), B1 (c3-c0).
      const sides = [
        { line: A1, from: c0, to: c1 },
        { line: B2, from: c1, to: c2 },
        { line: A2, from: c2, to: c3 },
        { line: B1, from: c3, to: c0 },
      ];
      let supportProduct = 1;
      let supportSum = 0;
      let ok = true;
      for (const side of sides) {
        const s = sideSupport(side.line, side.from, side.to, diag);
        if (s.samples < 20 || s.support < MIN_SIDE_SUPPORT) {
          ok = false;
          break;
        }
        supportSum += s.support;
        supportProduct *= s.support * s.support;
      }
      if (!ok) continue;
      const meanSupport = supportSum / 4;
      if (meanSupport < MIN_MEAN_SUPPORT) continue;

      const contrast = sideContrast(corners, sides.map((s) => s.line.border), blurred, w, h);
      if (contrast < MIN_CONTRAST) continue;

      const areaFactor = 0.35 + 0.65 * Math.min(1, area / 0.5);
      // Multiplying per-side support (rather than averaging) is what stops a
      // bigger quad that borrows the photo's own frame as free sides from
      // beating the receipt's real, fully edge-backed outline.
      const score =
        supportProduct *
        Math.min(1, contrast / 50) *
        areaFactor *
        BORDER_SIDE_PENALTY ** borderCount;
      if (score >= MIN_SCORE && (!best || score > best.score)) best = { corners, score, sides };
    }
  }
  if (!best) return null;

  // Sharpen the winning outline: refit each side to its real edge pixels,
  // twice, and keep the result only if it is still a sane quadrilateral.
  let refined = best.sides;
  for (let pass = 0; pass < 2; pass++) {
    const next = refined.map((side) => ({
      ...side,
      line: refineLine(side.line, side.from, side.to, edgeOri, w, h),
    }));
    // sides are ordered A1 (c0-c1), B2 (c1-c2), A2 (c2-c3), B1 (c3-c0)
    const c0 = intersect(next[0].line, next[3].line);
    const c1 = intersect(next[0].line, next[1].line);
    const c2 = intersect(next[2].line, next[1].line);
    const c3 = intersect(next[2].line, next[3].line);
    if (!c0 || !c1 || !c2 || !c3 || !isConvexWithGoodAngles([c0, c1, c2, c3])) break;
    refined = [
      { line: next[0].line, from: c0, to: c1 },
      { line: next[1].line, from: c1, to: c2 },
      { line: next[2].line, from: c2, to: c3 },
      { line: next[3].line, from: c3, to: c0 },
    ];
  }

  // Order as tl, tr, br, bl (clockwise starting from the top-left-most).
  let corners = refined.map((side) => side.from);
  if (quadAreaPx(corners) < 0) corners = [...corners].reverse();
  let start = 0;
  for (let i = 1; i < 4; i++) {
    if (corners[i].x + corners[i].y < corners[start].x + corners[start].y) start = i;
  }
  const ordered = [0, 1, 2, 3].map((k) => corners[(start + k) % 4]);

  const norm = (p: Point): Point => ({
    x: Math.min(1, Math.max(0, p.x / w)),
    y: Math.min(1, Math.max(0, p.y / h)),
  });
  return { tl: norm(ordered[0]), tr: norm(ordered[1]), br: norm(ordered[2]), bl: norm(ordered[3]) };
}

// ---------------------------------------------------------------- warping

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  const hm = solveHomography(
    [
      { x: 0, y: 0 },
      { x: outW - 1, y: 0 },
      { x: outW - 1, y: outH - 1 },
      { x: 0, y: outH - 1 },
    ],
    [quad.tl, quad.tr, quad.br, quad.bl]
  );
  if (!hm) return null;

  const out = new ImageData(outW, outH);
  const { width: sw, height: sh, data: sd } = source;
  const od = out.data;

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const denom = hm[6] * x + hm[7] * y + 1;
      const u = (hm[0] * x + hm[1] * y + hm[2]) / denom;
      const v = (hm[3] * x + hm[4] * y + hm[5]) / denom;

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

async function warpBitmapToFile(bitmap: ImageBitmap, quad: Quad, name: string): Promise<File | null> {
  const source = drawScaled(bitmap, SOURCE_MAX);
  if (!source) return null;
  const { width: sw, height: sh } = source.canvas;

  const px = (p: Point): Point => ({ x: p.x * sw, y: p.y * sh });
  const q: Quad = { tl: px(quad.tl), tr: px(quad.tr), br: px(quad.br), bl: px(quad.bl) };

  let outW = Math.round(Math.max(distance(q.tl, q.tr), distance(q.bl, q.br)));
  let outH = Math.round(Math.max(distance(q.tl, q.bl), distance(q.tr, q.br)));
  const shrink = Math.min(1, OUTPUT_MAX / Math.max(outW, outH));
  outW = Math.max(2, Math.round(outW * shrink));
  outH = Math.max(2, Math.round(outH * shrink));

  const warped = warpPerspective(source.ctx.getImageData(0, 0, sw, sh), q, outW, outH);
  if (!warped) return null;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.putImageData(warped, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return null;

  const baseName = name.replace(/\.[^.]+$/, "").replace(/-cropped$/, "") || "receipt";
  return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
}

// ---------------------------------------------------------------- public API

/** Detects the receipt and returns the cropped copy (or the original if none found). */
export async function autoCropReceipt(file: File): Promise<CropResult> {
  // Bank-transfer and e-wallet screenshots are PNGs; they have no table to
  // crop away, and their card/header layout looks like a receipt outline to
  // an edge detector. Camera photos arrive as JPEG, so only those are tried
  // (the user can still crop any image by hand).
  if (file.type === "image/png") return { file, quad: null };

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const analysis = drawScaled(bitmap, ANALYSIS_MAX);
      if (!analysis) return { file, quad: null };

      const detected = detectReceiptQuad(
        analysis.ctx.getImageData(0, 0, analysis.canvas.width, analysis.canvas.height)
      );
      if (!detected) return { file, quad: null };

      const quad = insetQuad(detected);
      const cropped = await warpBitmapToFile(bitmap, quad, file.name);
      return cropped ? { file: cropped, quad } : { file, quad: null };
    } finally {
      bitmap.close();
    }
  } catch {
    // Undecodable format (e.g. HEIC outside Safari) or any canvas failure:
    // the original is always a safe answer.
    return { file, quad: null };
  }
}

/** Crops `file` to a user-chosen quad (0..1 coordinates). Returns null on failure. */
export async function cropToQuad(file: File, quad: Quad): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      return await warpBitmapToFile(bitmap, quad, file.name);
    } finally {
      bitmap.close();
    }
  } catch {
    return null;
  }
}

/** A sensible starting quad for manual cropping when nothing was detected. */
export function defaultQuad(): Quad {
  return {
    tl: { x: 0.08, y: 0.08 },
    tr: { x: 0.92, y: 0.08 },
    br: { x: 0.92, y: 0.92 },
    bl: { x: 0.08, y: 0.92 },
  };
}

/** Whether a (possibly hand-edited) quad is a usable, convex, non-degenerate shape. */
export function isValidQuad(q: Quad): boolean {
  const c = [q.tl, q.tr, q.br, q.bl];
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const p = c[i];
    const n = c[(i + 1) % 4];
    const r = c[(i + 2) % 4];
    const cross = (n.x - p.x) * (r.y - n.y) - (n.y - p.y) * (r.x - n.x);
    if (Math.abs(cross) < 1e-6) return false;
    if (sign === 0) sign = Math.sign(cross);
    else if (Math.sign(cross) !== sign) return false;
  }
  const area = Math.abs(quadAreaPx(c));
  return area > 0.02;
}
