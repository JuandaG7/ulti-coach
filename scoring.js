// Convierte mediciones en puntajes 0–100 y arma las prioridades de entrenamiento.
// Tiene en cuenta el perfil: metas según sexo y prioridades según posición.
import { TESTS, TESTS_BY_ID, CATEGORIES } from "./data/tests.js";
import { MUSCLES, POSITION_BONUS } from "./data/muscles.js";
import { JOINTS } from "./data/joints.js";
import { latest, profile, currentWeight, injuries } from "./store.js";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Cuánto pesa cada categoría en el Ulti Score según la posición.
const POSITION_WEIGHTS = {
  handler: { lanzamiento: 1.5, agilidad: 1.3, velocidad: 1, potencia: 0.9, resistencia: 0.9, fuerza: 1, estabilidad: 1, movilidad: 1 },
  cutter: { velocidad: 1.4, resistencia: 1.3, potencia: 1.2, agilidad: 1.2, lanzamiento: 0.8, fuerza: 1, estabilidad: 1.1, movilidad: 1 },
  hibrido: {},
};

export const POSITIONS = {
  handler: "Handler",
  cutter: "Cutter",
  hibrido: "Híbrido",
};

export function target(testId) {
  const t = TESTS_BY_ID[testId];
  return t.targets[profile()?.sex === "f" ? "f" : "m"];
}

export function testScore(testId, value) {
  const { base, elite } = target(testId);
  return Math.round(clamp(((value - base) / (elite - base)) * 100, 0, 100));
}

export function isImprovement(testId, from, to) {
  const { base, elite } = target(testId);
  return Math.sign(to - from) === Math.sign(elite - base);
}

export function latestTestScore(testId) {
  const e = latest(testId);
  return e ? testScore(testId, e.value) : null;
}

// Promedio ponderado de las pruebas que tienen datos.
function weighted(weights, scoreOf) {
  let sum = 0;
  let total = 0;
  for (const [id, w] of Object.entries(weights)) {
    const s = scoreOf(id);
    if (s == null) continue;
    sum += s * w;
    total += w;
  }
  return total ? Math.round(sum / total) : null;
}

export function muscleScore(muscleId) {
  return weighted(MUSCLES[muscleId].tests, latestTestScore);
}

export function categoryScore(catId) {
  const weights = Object.fromEntries(TESTS.filter((t) => t.cat === catId).map((t) => [t.id, 1]));
  return weighted(weights, latestTestScore);
}

export function overallScore() {
  const pos = POSITION_WEIGHTS[profile()?.position] ?? {};
  const weights = Object.fromEntries(CATEGORIES.map((c) => [c.id, pos[c.id] ?? 1]));
  return weighted(weights, categoryScore);
}

export const LEVELS = [
  { id: "t1", name: "Mejorable", min: 0 },
  { id: "t2", name: "Decente", min: 40 },
  { id: "t3", name: "Bueno", min: 65 },
  { id: "t4", name: "Excelente", min: 85 },
];

export function level(score) {
  if (score == null) return { id: "none", name: "Sin datos" };
  return [...LEVELS].reverse().find((l) => score >= l.min);
}

export function nextLevel(score) {
  return LEVELS.find((l) => score != null && l.min > score) ?? null;
}

export function muscleImportance(id) {
  const bonus = POSITION_BONUS[profile()?.position]?.[id] ?? 0;
  return Math.min(1.2, MUSCLES[id].importance + bonus);
}

// Músculos ordenados por lo que más rinde trabajar: importancia × lo que falta para Excelente.
// Un músculo sin datos va primero si es importante, para que lo midas.
export function priorities() {
  return Object.entries(MUSCLES)
    .map(([id, m]) => {
      const score = muscleScore(id);
      const gap = score == null ? 60 : 100 - score;
      return { id, muscle: m, score, priority: muscleImportance(id) * gap };
    })
    .sort((a, b) => b.priority - a.priority);
}

export function testsMeasured() {
  return TESTS.filter((t) => latest(t.id)).length;
}

// Potencia pico del salto vertical (fórmula de Sayers, 1999): necesita peso y salto.
export function jumpPower() {
  const jump = latest("vertJump");
  const kg = currentWeight();
  if (!jump || !kg) return null;
  const watts = Math.round(60.7 * jump.value + 45.3 * kg - 2055);
  return { watts, perKg: Math.round((watts / kg) * 10) / 10 };
}

// Foto de todos los puntajes, para comparar antes y después de registrar algo.
export function snapshot() {
  return {
    overall: overallScore(),
    muscles: Object.fromEntries(Object.keys(MUSCLES).map((id) => [id, muscleScore(id)])),
    top: priorities()[0]?.id,
  };
}

// ---------- Blindaje ----------

// Asimetría izquierda/derecha de la última medición bilateral (en % del lado fuerte).
export function asymmetry(testId) {
  const e = latest(testId);
  if (!e?.sides) return null;
  const { L, R } = e.sides;
  const hi = Math.max(L, R);
  if (!hi) return null;
  return { pct: Math.round(((hi - Math.min(L, R)) / hi) * 100), weak: L < R ? "L" : R < L ? "R" : null, L, R };
}

// Hasta 5 % es normal; desde 10 % es bandera amarilla y desde 15 % roja.
export function asymmetryFlag(pct) {
  if (pct >= 15) return "red";
  if (pct >= 10) return "yellow";
  return null;
}

function symmetryScore(testIds) {
  const pcts = testIds.map(asymmetry).filter(Boolean).map((a) => a.pct);
  if (!pcts.length) return null;
  const worst = Math.max(...pcts);
  return Math.round(clamp(100 - Math.max(0, worst - 5) * 6, 0, 100));
}

export function jointDimensions(jointId) {
  const j = JOINTS[jointId];
  return {
    rango: weighted(j.rango, latestTestScore),
    fuerza: weighted(j.fuerza, latestTestScore),
    simetria: symmetryScore(j.simetria),
  };
}

export function jointScore(jointId) {
  return weighted({ rango: 0.35, fuerza: 0.4, simetria: 0.25 }, (d) => jointDimensions(jointId)[d]);
}

export function jointAlerts(jointId) {
  return JOINTS[jointId].simetria
    .map((testId) => ({ testId, ...asymmetry(testId) }))
    .filter((a) => a.pct != null && asymmetryFlag(a.pct));
}

// Lesiones de la zona: una activa pesa más que una ya recuperada (si fue en los últimos 2 años).
export function jointInjury(jointId) {
  const list = injuries().filter((i) => i.zone === jointId);
  const active = list.find((i) => i.status === "activa");
  if (active) return { ...active, weight: 1.6 };
  const twoYears = new Date();
  twoYears.setFullYear(twoYears.getFullYear() - 2);
  const recent = list.find((i) => new Date(i.date) >= twoYears);
  return recent ? { ...recent, weight: 1.3 } : null;
}

export function jointPriorities() {
  return Object.entries(JOINTS)
    .map(([id, j]) => {
      const score = jointScore(id);
      const gap = score == null ? 60 : 100 - score;
      const injury = jointInjury(id);
      const alerts = jointAlerts(id);
      return { id, joint: j, score, injury, alerts, priority: j.importance * gap * (injury?.weight ?? 1) + alerts.length * 5 };
    })
    .sort((a, b) => b.priority - a.priority);
}
