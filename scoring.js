// Convierte mediciones en puntajes 0–100 y arma las prioridades de entrenamiento.
// Tiene en cuenta el perfil: metas según sexo y prioridades según posición.
import { TESTS, TESTS_BY_ID, CATEGORIES } from "./data/tests.js";
import { MUSCLES, POSITION_BONUS } from "./data/muscles.js";
import { JOINTS } from "./data/joints.js";
import { latest, profile, currentWeight, injuries, checkins } from "./store.js";
import { WELLNESS_ITEMS } from "./data/checkin.js";

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

// Ajuste por edad (estimación): antes de los 20 se está madurando (las mujeres maduran antes)
// y desde los 35 se pierde algo de rendimiento. 1 = metas de adulto.
const AGE_CURVE = {
  m: { 13: 0.78, 14: 0.82, 15: 0.86, 16: 0.9, 17: 0.94, 18: 0.97, 19: 0.99 },
  f: { 13: 0.85, 14: 0.89, 15: 0.93, 16: 0.96, 17: 0.98, 18: 1, 19: 1 },
};

export function ageFactor() {
  const p = profile();
  const age = p?.age;
  if (!age) return 1;
  if (age < 20) return AGE_CURVE[p.sex === "f" ? "f" : "m"][Math.max(13, age)] ?? 1;
  if (age >= 35) return Math.max(0.8, 1 - (age - 34) * 0.007);
  return 1;
}

// La movilidad, el equilibrio, la precisión y la recuperación cardíaca no se ajustan por edad.
const NOT_AGE_ADJUSTED = new Set(["movilidad", "estabilidad"]);
const NOT_AGE_ADJUSTED_TESTS = new Set(["throwAccuracy", "hrRecovery"]);

export function isAgeAdjusted(testId) {
  const t = TESTS_BY_ID[testId];
  return ageFactor() !== 1 && !NOT_AGE_ADJUSTED.has(t.cat) && !NOT_AGE_ADJUSTED_TESTS.has(testId);
}

export function target(testId) {
  const t = TESTS_BY_ID[testId];
  const tgt = t.targets[profile()?.sex === "f" ? "f" : "m"];
  if (!isAgeAdjusted(testId)) return tgt;
  const f = ageFactor();
  // En pruebas de tiempo la diferencia por edad es menor: se aplica la mitad del ajuste.
  const adj = (v) => (tgt.elite < tgt.base ? v / (1 - (1 - f) / 2) : v * f);
  return { base: adj(tgt.base), elite: adj(tgt.elite) };
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
      const pain = latestPains()[id] ?? 0;
      return { id, joint: j, score, injury, alerts, pain, priority: j.importance * gap * (injury?.weight ?? 1) + alerts.length * 5 + pain * 3 };
    })
    .sort((a, b) => b.priority - a.priority);
}

// ---------- Check-in ----------

// Bienestar 0–100 a partir de las 5 preguntas (1–5).
export function wellness(c) {
  const sum = WELLNESS_ITEMS.reduce((acc, it) => acc + (c[it.id] ?? 0), 0);
  return Math.round(((sum - WELLNESS_ITEMS.length) / (WELLNESS_ITEMS.length * 4)) * 100);
}

// Carga de la semana: sesiones × esfuerzo percibido (simplificación de la carga sRPE).
export function weeklyLoad(c) {
  return (c.sessions ?? 0) * (c.rpe ?? 0);
}

// Dolor reportado en la última semana con check-in, por zona de blindaje.
export function latestPains() {
  const list = checkins();
  return list.length ? list[list.length - 1].pains ?? {} : {};
}

// Recomendaciones a partir del check-in y la semana anterior.
export function checkinInsights(c, prev) {
  const out = [];
  const w = wellness(c);
  const minSleep = (profile()?.age ?? 30) < 18 ? 8 : 7;
  for (const [zone, pain] of Object.entries(c.pains ?? {})) {
    if (pain < 4) continue;
    const name = JOINTS[zone].name.toLowerCase();
    const repeated = (prev?.pains?.[zone] ?? 0) >= 4;
    out.push({
      level: pain >= 6 || repeated ? "red" : "yellow",
      text: repeated
        ? `Segunda semana con dolor en ${name}: consulta a tu fisio antes de seguir cargando esa zona.`
        : `Dolor ${pain}/10 en ${name}: nada de pruebas máximas ahí esta semana; si sigue, consulta a tu fisio.`,
    });
  }
  if (w < 50) out.push({ level: "yellow", text: "Semana pesada: baja la intensidad y prioriza dormir. No es buen momento para medirte." });
  if (c.sleepHours && c.sleepHours < minSleep) out.push({ level: "yellow", text: `Dormiste ${c.sleepHours} h en promedio. Apunta a ${minSleep}+: es cuando el cuerpo se adapta al entrenamiento.` });
  if (prev && weeklyLoad(prev) > 0 && weeklyLoad(c) > weeklyLoad(prev) * 1.3) {
    out.push({ level: "yellow", text: "Subiste la carga más de 30 % frente a la semana pasada. Los saltos bruscos de carga aumentan el riesgo de lesión." });
  }
  if (!out.length && w >= 75) out.push({ level: "good", text: "Buena semana: estás fresco. Buen momento para medirte o subir un poco la intensidad." });
  return out;
}

// ---------- Qué hacer ahora ----------

// Qué tanto aporta medir una prueba: suma la importancia de los músculos y zonas que califica.
function testRelevance(testId) {
  let r = 0;
  for (const [id, m] of Object.entries(MUSCLES)) if (testId in m.tests) r += muscleImportance(id) * m.tests[testId];
  for (const j of Object.values(JOINTS)) if (testId in j.rango || testId in j.fuerza) r += j.importance * 0.5;
  return r;
}

const daysSince = (iso) => Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);

// Pruebas para medir ahora: primero las importantes que nunca mediste, luego las que hace más
// de 3 semanas no repites. Se saltan las que cargan una zona con lesión activa.
export function suggestedTests(n = 3) {
  const injured = new Set(injuries().filter((i) => i.status === "activa").map((i) => i.zone));
  const blocked = (testId) =>
    Object.entries(JOINTS).some(([z, j]) => injured.has(z) && (testId in j.rango || testId in j.fuerza || j.simetria.includes(testId)));
  const candidates = TESTS.filter((t) => !blocked(t.id)).map((t) => {
    const last = latest(t.id);
    const age = last ? daysSince(last.date) : null;
    const rank = last == null ? 1000 + testRelevance(t.id) * 100 : age >= 21 ? age + testRelevance(t.id) * 10 : -1;
    return { test: t, last, age, rank };
  });
  return candidates.filter((c) => c.rank >= 0).sort((a, b) => b.rank - a.rank).slice(0, n);
}

// La única acción que la app recomienda para hoy.
export function nextStep({ checkinDone, wellnessNow }) {
  if (!checkinDone) {
    return { kind: "checkin", title: "Haz tu check-in de la semana", text: "1 minuto. Sin él no sabemos si estás fresco o cansado." };
  }
  if (wellnessNow != null && wellnessNow < 50) {
    return { kind: "rest", title: "Semana de recuperar", text: "Tu bienestar está bajo: hoy movilidad y blindaje suave, nada de pruebas máximas." };
  }
  const [s] = suggestedTests(1);
  if (s && s.last == null) {
    return { kind: "test", testId: s.test.id, title: `Mide: ${s.test.name}`, text: "Es la prueba que más información le da a tu plan ahora." };
  }
  if (s) {
    return { kind: "test", testId: s.test.id, title: `Repite: ${s.test.name}`, text: `Hace ${s.age} días que no la mides. Mira si mejoraste.` };
  }
  const top = priorities()[0];
  return { kind: "train", muscleId: top.id, title: `Entrena tu foco: ${top.muscle.name}`, text: "Estás al día con las pruebas. Hoy toca subir tu punto más débil." };
}

// Rango razonable para una prueba: fuera de esto probablemente es un error de dedo.
// Más es mejor: de 0 a la meta élite + 150 % del recorrido. Tiempos: no más rápido que
// élite menos un recorrido completo, ni más lento que base + 3 recorridos.
export function plausibleRange(testId) {
  const { base, elite } = TESTS_BY_ID[testId].targets.m;
  const span = Math.abs(elite - base);
  if (elite < base) return { min: Math.max(0, elite - span), max: base + span * 3 };
  return { min: 0, max: elite + span * 1.5 };
}
