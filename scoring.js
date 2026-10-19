// Convierte mediciones en puntajes 0–100 y arma las prioridades de entrenamiento.
import { TESTS, TESTS_BY_ID, CATEGORIES } from "./data/tests.js";
import { MUSCLES } from "./data/muscles.js";
import { latest } from "./store.js";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function testScore(testId, value) {
  const { base, elite } = TESTS_BY_ID[testId];
  return Math.round(clamp(((value - base) / (elite - base)) * 100, 0, 100));
}

export function isImprovement(testId, from, to) {
  const { base, elite } = TESTS_BY_ID[testId];
  return Math.sign(to - from) === Math.sign(elite - base);
}

export function latestTestScore(testId) {
  const e = latest(testId);
  return e ? testScore(testId, e.value) : null;
}

// Promedio ponderado de las pruebas que tienen datos.
function weighted(weights) {
  let sum = 0;
  let total = 0;
  for (const [testId, w] of Object.entries(weights)) {
    const s = latestTestScore(testId);
    if (s == null) continue;
    sum += s * w;
    total += w;
  }
  return total ? Math.round(sum / total) : null;
}

export function muscleScore(muscleId) {
  return weighted(MUSCLES[muscleId].tests);
}

export function categoryScore(catId) {
  const weights = Object.fromEntries(TESTS.filter((t) => t.cat === catId).map((t) => [t.id, 1]));
  return weighted(weights);
}

export function overallScore() {
  const scores = CATEGORIES.map((c) => categoryScore(c.id)).filter((s) => s != null);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

export function level(score) {
  if (score == null) return { id: "none", name: "Sin datos" };
  if (score >= 85) return { id: "elite", name: "Élite" };
  if (score >= 65) return { id: "advanced", name: "Avanzado" };
  if (score >= 40) return { id: "competitive", name: "Competitivo" };
  return { id: "developing", name: "En desarrollo" };
}

// Músculos ordenados por lo que más rinde trabajar: importancia × lo que falta para élite.
// Un músculo sin datos va primero si es importante, para que lo midas.
export function priorities() {
  return Object.entries(MUSCLES)
    .map(([id, m]) => {
      const score = muscleScore(id);
      const gap = score == null ? 60 : 100 - score;
      return { id, muscle: m, score, priority: m.importance * gap };
    })
    .sort((a, b) => b.priority - a.priority);
}

export function testsMeasured() {
  return TESTS.filter((t) => latest(t.id)).length;
}
