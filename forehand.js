// Métricas del forehand para comparar contra jugadores pro.
//
// Usamos las coordenadas 3D "de mundo" de MediaPipe: están en metros y centradas en la cadera.
// Eso las hace bastante robustas al ángulo de la cámara, a qué tan lejos está y a que la cámara
// se mueva (típico en grabaciones de partidos). Las métricas que sí dependen del ángulo
// (scope "own") se calculan con la imagen 2D y solo se comparan contra tus propios videos.
//
// Cuadro compacto (lo que se guarda en el celular, sin video):
//   { t: segundos reales, p: [x, y] × 33 (imagen, 0–1), w: [x, y, z] × 33 (mundo, metros) }
import { LM } from "./metrics.js";

const NOSE = 0;
// Ventana de análisis alrededor de la suelta (segundos reales).
const WIND_UP = 0.6;
const AFTER = 0.05;
// Lo que se guarda de cada clip alrededor de la suelta.
export const KEEP = { before: 1.0, after: 0.6 };

// ---------- Cuadros compactos ----------

const r4 = (v) => Math.round(v * 1e4) / 1e4;

// Convierte los cuadros de pose.analyzeVideo a la forma compacta, con el tiempo real
// (un video en cámara lenta ×4 dura 4 veces más que la realidad).
export function compactFrames(frames, factor = 1) {
  return frames.map((f) => ({
    t: f.t / factor,
    p: f.landmarks ? f.landmarks.flatMap((l) => [r4(l.x), r4(l.y)]) : null,
    w: f.world ? f.world.flatMap((l) => [r4(l.x), r4(l.y), r4(l.z)]) : null,
  }));
}

// Recorta alrededor de la suelta (t = 0 en la suelta) y limita a 120 cuadros por segundo real,
// para que cada clip ocupe poco en el celular.
export function trimAroundRelease(frames, releaseT) {
  const out = [];
  let last = -Infinity;
  for (const f of frames) {
    const t = f.t - releaseT;
    if (t < -KEEP.before || t > KEEP.after || t - last < 1 / 120 - 1e-6) continue;
    out.push({ ...f, t: r4(t) });
    last = t;
  }
  return out;
}

const P = (f, i) => (f.p ? { x: f.p[2 * i], y: f.p[2 * i + 1] } : null);
const W = (f, i) => (f.w ? { x: f.w[3 * i], y: f.w[3 * i + 1], z: f.w[3 * i + 2] } : null);
export const point2D = P;

// ---------- Utilidades ----------

const mid = (a, b) => (a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: ((a.z ?? 0) + (b.z ?? 0)) / 2 } : null);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
const distXZ = (a, b) => Math.hypot(a.x - b.x, a.z - b.z); // horizontal (en mundo, y es vertical)

function median(values) {
  const s = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
}

function quantile(sorted, q) {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  return sorted[lo] + (sorted[Math.min(lo + 1, sorted.length - 1)] - sorted[lo]) * (pos - lo);
}

// Trayectoria de un punto: rellena huecos cortos (≤ 6 cuadros) y suaviza (promedio de 5 cuadros).
function track(frames, get) {
  const raw = frames.map(get);
  const n = raw.length;
  for (let i = 0; i < n; i++) {
    if (raw[i]) continue;
    let a = i - 1;
    let b = i;
    while (b < n && !raw[b]) b++;
    if (a >= 0 && b < n && b - a <= 7) {
      for (let k = i; k < b; k++) {
        const u = (frames[k].t - frames[a].t) / (frames[b].t - frames[a].t);
        raw[k] = { x: lerp(raw[a].x, raw[b].x, u), y: lerp(raw[a].y, raw[b].y, u), z: lerp(raw[a].z ?? 0, raw[b].z ?? 0, u) };
      }
    }
    i = b;
  }
  return raw.map((p, i) => {
    if (!p) return null;
    const win = raw.slice(Math.max(0, i - 2), i + 3).filter(Boolean);
    const avg = (k) => win.reduce((s, q) => s + (q[k] ?? 0), 0) / win.length;
    return { x: avg("x"), y: avg("y"), z: avg("z") };
  });
}

const lerp = (a, b, u) => a + (b - a) * u;

function smoothValues(values, radius) {
  return values.map((v, i) => {
    if (v == null) return null;
    const win = values.slice(Math.max(0, i - radius), i + radius + 1).filter((x) => x != null);
    return win.reduce((s, x) => s + x, 0) / win.length;
  });
}

// Rapidez (diferencia centrada, así el pico no se corre en el tiempo).
function speedOf(t, pts, scale) {
  const v = pts.map((_, i) => {
    const a = pts[i - 1];
    const b = pts[i + 1];
    if (!a || !b || t[i + 1] === t[i - 1]) return null;
    return dist(a, b) / (t[i + 1] - t[i - 1]) / scale;
  });
  return smoothValues(v, 1);
}

// Velocidad de giro (°/s) de la línea izquierda→derecha (caderas u hombros) vista desde arriba.
function yawSpeed(t, left, right) {
  const yaw = left.map((l, i) => (l && right[i] ? Math.atan2(right[i].z - l.z, right[i].x - l.x) : null));
  const v = yaw.map((_, i) => {
    const a = yaw[i - 1];
    const b = yaw[i + 1];
    if (a == null || b == null || t[i + 1] === t[i - 1]) return null;
    let d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d) / (t[i + 1] - t[i - 1]) * (180 / Math.PI);
  });
  return smoothValues(v, 1);
}

function argmax(values, ok = () => true) {
  let best = -1;
  values.forEach((v, i) => {
    if (v != null && ok(i) && (best < 0 || v > values[best])) best = i;
  });
  return best;
}

function angle2D(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

// Centro de masa aproximado (fracciones de masa por segmento, tablas de Dempster simplificadas).
function centerOfMass(j) {
  const parts = [
    [j.nose, 0.08],
    [mid(mid(j.LS, j.RS), mid(j.LH, j.RH)), 0.5],
    [mid(j.LS, j.LE), 0.028], [mid(j.RS, j.RE), 0.028],
    [mid(j.LE, j.LW), 0.022], [mid(j.RE, j.RW), 0.022],
    [mid(j.LH, j.LK), 0.1], [mid(j.RH, j.RK), 0.1],
    [mid(j.LK, j.LA), 0.06], [mid(j.RK, j.RA), 0.06],
  ];
  if (parts.some(([p]) => !p)) return null;
  const sum = (k) => parts.reduce((s, [p, m]) => s + p[k] * m, 0);
  return { x: sum("x"), y: sum("y"), z: sum("z") };
}

// ---------- Análisis ----------

// clip: { frames (compactos), hand: "R"|"L", w, h }. Devuelve null si no se ve el lanzamiento.
export function analyzeForehand({ frames, hand = "R", w = 1, h = 1 }) {
  if (!frames?.length) return null;
  const t = frames.map((f) => f.t);
  const s = hand === "L" ? "L" : "R"; // lado del brazo que lanza
  const o = s === "R" ? "L" : "R";
  const ids = {
    nose: NOSE,
    LS: LM.L_SHOULDER, RS: LM.R_SHOULDER, LE: LM.L_ELBOW, RE: LM.R_ELBOW, LW: LM.L_WRIST, RW: LM.R_WRIST,
    LH: LM.L_HIP, RH: LM.R_HIP, LK: LM.L_KNEE, RK: LM.R_KNEE, LA: LM.L_ANKLE, RA: LM.R_ANKLE,
  };
  const world = {};
  const img = {};
  for (const [k, i] of Object.entries(ids)) {
    world[k] = track(frames, (f) => W(f, i));
    img[k] = track(frames, (f) => P(f, i));
  }
  const at = (i) => Object.fromEntries(Object.keys(ids).map((k) => [k, world[k][i]]));

  // "Reglas" del cuerpo, para que nada dependa del tamaño de la persona ni de la cámara.
  const torso = median(t.map((_, i) => {
    const sh = mid(world.LS[i], world.RS[i]);
    const hp = mid(world.LH[i], world.RH[i]);
    return sh && hp ? dist(sh, hp) : NaN;
  }));
  const leg = median(t.map((_, i) => {
    const j = at(i);
    if (!j.LH || !j.LK || !j.LA || !j.RH || !j.RK || !j.RA) return NaN;
    return (dist(j.LH, j.LK) + dist(j.LK, j.LA) + dist(j.RH, j.RK) + dist(j.RK, j.RA)) / 2;
  }));
  if (!torso || !Number.isFinite(torso)) return null;
  // Cadera→tobillo mide cerca del 49 % de la estatura (tablas antropométricas): estimación.
  const stature = leg / 0.49;

  const wristV = speedOf(t, world[s + "W"], torso);
  const elbowV = speedOf(t, world[s + "E"], torso);
  const hipW = yawSpeed(t, world.LH, world.RH);
  const trunkW = yawSpeed(t, world.LS, world.RS);

  // Suelta = pico de velocidad de la muñeca que lanza (lejos de los bordes del video).
  const rel = argmax(wristV, (i) => i >= 3 && i < t.length - 3);
  if (rel < 0) return null;
  const tr = t[rel];
  const inWin = (i) => t[i] >= tr - WIND_UP && t[i] <= tr + AFTER;
  const peakMs = (series) => {
    const i = argmax(series, inWin);
    return i < 0 ? null : (t[i] - tr) * 1000;
  };
  const peaks = { hip: peakMs(hipW), trunk: peakMs(trunkW), elbow: peakMs(elbowV), wrist: 0 };

  // Orden cadera → hombros → codo → muñeca (10 ms de tolerancia: es la precisión del video).
  const TOL = 10;
  const chainOrder = [peaks.hip, peaks.trunk, peaks.elbow].includes(null)
    ? null
    : [peaks.hip <= peaks.trunk + TOL, peaks.trunk <= peaks.elbow + TOL, peaks.elbow <= peaks.wrist + TOL].filter(Boolean).length;

  // Ancho del pivot: separación horizontal de los tobillos en el armado (percentil 90, no el máximo,
  // porque la profundidad de MediaPipe es ruidosa).
  const widths = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] < tr - WIND_UP || t[i] > tr) continue;
    const a = world.LA[i];
    const b = world.RA[i];
    if (a && b && stature) widths.push(distXZ(a, b) / stature);
  }
  widths.sort((a, b) => a - b);
  const pivotWidth = widths.length >= 3 && Number.isFinite(stature) ? quantile(widths, 0.9) * 100 : null;

  // Transferencia de peso: posición del centro de masa entre el pie de pivot (0 %) y el pie de paso
  // (100 %), del punto más atrás del armado a la suelta. Diestro: pivotea en el izquierdo y da el paso
  // con el derecho.
  const shareAt = (i) => {
    const j = at(i);
    const com = centerOfMass(j);
    const piv = j[o + "A"];
    const step = j[s + "A"];
    if (!com || !piv || !step) return null;
    const ax = step.x - piv.x;
    const az = step.z - piv.z;
    const len2 = ax * ax + az * az;
    if (!stature || len2 < (0.1 * stature) ** 2) return null; // pies muy juntos: no se puede medir
    const f = ((com.x - piv.x) * ax + (com.z - piv.z) * az) / len2;
    return Math.max(-0.5, Math.min(1.5, f));
  };
  const share = t.map((_, i) => (t[i] >= tr - WIND_UP && t[i] <= tr + AFTER ? shareAt(i) : null));
  const atRelease = smoothValues(share, 2)[rel];
  const windup = share.filter((v, i) => v != null && t[i] <= tr - 0.1);
  const weightShift = atRelease != null && windup.length ? (atRelease - Math.min(...windup)) * 100 : null;

  // Solo contra tus videos (dependen del ángulo de cámara): en la imagen 2D.
  const pxp = (p) => p && { x: p.x * w, y: p.y * h };
  const sh2 = pxp(img[s + "S"][rel]);
  const el2 = pxp(img[s + "E"][rel]);
  const wr2 = pxp(img[s + "W"][rel]);
  const elbowAngle = sh2 && el2 && wr2 ? angle2D(sh2, el2, wr2) : null;
  const torso2D = median(t.map((_, i) => {
    const a = mid(pxp(img.LS[i]), pxp(img.RS[i]));
    const b = mid(pxp(img.LH[i]), pxp(img.RH[i]));
    return a && b ? dist({ ...a, z: 0 }, { ...b, z: 0 }) : NaN;
  }));
  const hip2 = mid(pxp(img.LH[rel]), pxp(img.RH[rel]));
  const releaseHeight = hip2 && wr2 && torso2D ? ((hip2.y - wr2.y) / torso2D) * 100 : null;

  // Calidad: cuerpo detectado en la ventana del lanzamiento y video que empiece antes del armado.
  const winIdx = t.map((_, i) => i).filter(inWin);
  const detected = winIdx.filter((i) => frames[i].w).length / Math.max(1, winIdx.length);
  const warnings = [];
  if (detected < 0.8) warnings.push("El cuerpo no se ve bien en el momento del lanzamiento.");
  if (tr - t[0] < WIND_UP * 0.75) warnings.push("El video empieza muy cerca de la suelta: graba desde antes del armado.");

  // Curvas de la cadena para la gráfica (cada una dividida por su pico en la ventana).
  const norm = (series) => {
    const i = argmax(series, inWin);
    const peak = i < 0 ? 1 : series[i] || 1;
    return series.map((v) => (v == null ? null : v / peak));
  };
  const chain = {
    tau: t.map((x) => x - tr),
    hip: norm(hipW), trunk: norm(trunkW), elbow: norm(elbowV), wrist: norm(wristV),
  };

  return {
    release: tr,
    metrics: {
      wristSpeed: wristV[rel],
      chainOrder,
      hipLead: peaks.hip == null ? null : -peaks.hip,
      trunkLead: peaks.trunk == null ? null : -peaks.trunk,
      pivotWidth,
      weightShift,
      elbowAngle,
      releaseHeight,
    },
    peaks,
    chain,
    quality: { detected, ok: !warnings.length, warnings },
  };
}

// ---------- Definición de cada métrica ----------
// scope "pro": robusta al ángulo, se compara contra el rango pro. "own": solo contra tus videos.
// dir: "up" (más es mejor), "band" (lo ideal es estar dentro del rango pro).
// span: qué tan lejos del rango pro llega a 0 puntos (estimación).
export const METRICS = [
  {
    id: "wristSpeed", scope: "pro", name: "Velocidad de muñeca", unit: "torsos/s", decimals: 1, dir: "up",
    span: (band) => Math.max(4, band.lo * 0.4),
    what: "Qué tan rápido viaja tu mano al soltar, en largos de tu propio torso por segundo.",
    low: "Tu mano llega lenta a la suelta. La velocidad nace en la cadera y termina en el golpe de muñeca: trabaja la rotación y el snap.",
    muscle: "forearms", drills: ["Snaps de forehand con toalla 3×20", "Lanzamiento rotacional con balón medicinal 3×8"],
  },
  {
    id: "chainOrder", scope: "pro", name: "Orden de la cadena", unit: "de 3", decimals: 0, dir: "up",
    span: () => 2,
    what: "Cadera → hombros → codo → muñeca: cada parte debe llegar a su máxima velocidad después de la anterior, como un látigo.",
    low: "El brazo arranca antes que el cuerpo. Empieza con la cadera, deja que los hombros la sigan y suelta el brazo al final.",
    muscle: "obliques", drills: ["Forehand con pausa en el armado 3×10", "Lanzamiento rotacional con balón medicinal 3×8"],
  },
  {
    id: "hipLead", scope: "pro", name: "Adelanto de la cadera", unit: "ms", decimals: 0, dir: "band",
    span: () => 120,
    what: "Cuánto antes de soltar gira más rápido tu cadera.",
    low: "Tu cadera gira casi al mismo tiempo que sueltas: todo sale del brazo. Gira la cadera antes y con más intención.",
    high: "Tu cadera gira demasiado pronto y la energía se pierde antes de llegar al brazo. Encadena el giro con el lanzamiento.",
    muscle: "glutes", drills: ["Forehand con pausa en el armado 3×10", "Lanzamiento rotacional con balón medicinal 3×8"],
  },
  {
    id: "trunkLead", scope: "pro", name: "Adelanto de los hombros", unit: "ms", decimals: 0, dir: "band",
    span: () => 100,
    what: "Cuánto antes de soltar giran más rápido tus hombros.",
    low: "Tus hombros giran tarde: el brazo trabaja solo. Deja que el tronco lleve al brazo.",
    high: "Tus hombros se abren muy pronto y el brazo queda atrás. Mantén el tronco cerrado un instante más.",
    muscle: "obliques", drills: ["Pallof press con banda 3×10", "Forehand con pausa en el armado 3×10"],
  },
  {
    id: "pivotWidth", scope: "pro", name: "Ancho del pivot", unit: "% altura", decimals: 0, dir: "band",
    span: () => 15,
    what: "Separación de tus pies al lanzar, relativa a tu altura (estimada del video).",
    low: "Pivot corto: un paso más largo y bajo te da espacio contra la marca y más palanca.",
    high: "Pivot demasiado abierto: pierdes equilibrio y giro. Busca un paso largo pero estable.",
    muscle: "adductors", drills: ["Pivot con paso largo y forehand 3×10", "Sentadilla Cossack 3×8"],
  },
  {
    id: "weightShift", scope: "pro", name: "Transferencia de peso", unit: "%", decimals: 0, dir: "band",
    span: () => 30,
    what: "Cuánto viaja tu centro de masa hacia el pie de paso, del armado a la suelta (% de la distancia entre pies).",
    low: "Tu peso se queda atrás. Empuja desde el pie de pivot y suelta con el peso sobre el pie de paso.",
    high: "Tu peso se va demasiado adelante: lanzas cayéndote. Termina equilibrado sobre el pie de paso.",
    muscle: "glutes", drills: ["Pivot con paso largo y forehand 3×10", "Sentadilla búlgara 3×12"],
  },
  {
    id: "elbowAngle", scope: "own", name: "Ángulo del codo al soltar", unit: "°", decimals: 0,
    what: "Qué tan estirado está tu brazo al soltar. Depende del ángulo de la cámara: compáralo solo entre videos grabados igual.",
  },
  {
    id: "releaseHeight", scope: "own", name: "Altura de suelta", unit: "% torso", decimals: 0,
    what: "Altura de la mano al soltar respecto a tu cadera (negativo = por debajo). Depende del ángulo de la cámara.",
  },
];

export const METRICS_BY_ID = Object.fromEntries(METRICS.map((m) => [m.id, m]));

// Rango pro de una métrica: con pocos clips, de mínimo a máximo; con 5 o más, del percentil 20 al 80
// (para que un clip raro no estire el rango).
export function proBand(values) {
  const s = values.filter((v) => v != null && Number.isFinite(v)).sort((a, b) => a - b);
  if (!s.length) return null;
  const wide = s.length < 5;
  return { lo: wide ? s[0] : quantile(s, 0.2), hi: wide ? s[s.length - 1] : quantile(s, 0.8), median: quantile(s, 0.5), n: s.length };
}

// Puntaje 0–100 contra el rango pro: 100 dentro del rango, baja en línea recta al alejarse.
export function scoreVsPro(metricId, value, band) {
  const m = METRICS_BY_ID[metricId];
  if (value == null || !band || m.scope !== "pro") return null;
  const below = Math.max(0, band.lo - value);
  const above = m.dir === "band" ? Math.max(0, value - band.hi) : 0;
  const d = Math.max(below, above);
  return Math.round(Math.max(0, Math.min(100, 100 - (d / m.span(band)) * 100)));
}

// "low" si estás por debajo del rango, "high" si por encima (solo métricas de rango).
export function gapSide(metricId, value, band) {
  return value < band.lo ? "low" : "high";
}

// Conexiones del esqueleto (sin cara), para dibujarlo sin depender de MediaPipe.
export const BONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [27, 29], [28, 30],
];
