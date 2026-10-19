// Cálculo de métricas a partir de los puntos del cuerpo (landmarks) de MediaPipe.
// "Derecha/izquierda" son del jugador, no de la cámara.
export const LM = {
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
};

// Convierte un landmark normalizado (0–1) a píxeles del video.
function px(p, w, h) {
  return { x: p.x * w, y: p.y * h };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
}

// Largo del torso (centro de hombros → centro de caderas) en píxeles.
// Lo usamos como "regla" para que las velocidades no dependan de qué tan lejos está la cámara.
export function torsoLengthPx(frames, w, h) {
  const lengths = frames
    .filter((f) => f.landmarks)
    .map(({ landmarks: l }) => {
      const shoulders = mid(px(l[LM.L_SHOULDER], w, h), px(l[LM.R_SHOULDER], w, h));
      const hips = mid(px(l[LM.L_HIP], w, h), px(l[LM.R_HIP], w, h));
      return dist(shoulders, hips);
    });
  return median(lengths);
}

// Velocidad de un punto del cuerpo en largos de torso por segundo, suavizada.
export function speedSeries(frames, w, h, index) {
  const torso = torsoLengthPx(frames, w, h);
  const raw = [];
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (!a.landmarks || !b.landmarks) continue;
    const d = dist(px(a.landmarks[index], w, h), px(b.landmarks[index], w, h));
    raw.push({ t: b.t, v: d / (b.t - a.t) / torso });
  }
  return smooth(raw, 2);
}

// Promedio móvil simple (ventana de 2*radius+1 cuadros).
function smooth(series, radius) {
  return series.map((p, i) => {
    const window = series.slice(Math.max(0, i - radius), i + radius + 1);
    return { t: p.t, v: window.reduce((s, q) => s + q.v, 0) / window.length };
  });
}
