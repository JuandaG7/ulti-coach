// Pruebas del análisis del forehand con lanzamientos sintéticos: un esqueleto armado a mano
// donde sabemos la respuesta (cuándo gira la cadera, cuándo suelta, etc.).
import { faultsFor, drillsFor, THROW_DRILLS } from "../data/throw-drills.js";
import { findExercise } from "../data/exercises.js";
import { analyzeForehand, trimAroundRelease, moveRelease, consistency, proBand, scoreVsPro, compareOutcomes, throwGaps } from "../forehand.js";

// Función de distribución normal acumulada (aprox. de erf): convierte un pico de velocidad
// con forma de campana en una posición que avanza suave.
function phi(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return 0.5 * (1 + Math.sign(z) * erf);
}

// Lanzamiento diestro sintético. peaks: segundos (respecto a la suelta en t = 0) en que cada parte
// llega a su velocidad máxima. La muñeca siempre llega a su pico en t = 0.
export function syntheticThrow({ hip = -0.1, trunk = -0.06, elbow = -0.03, fps = 120, from = -1.2, to = 0.8, noise = 0, seed = 1 } = {}) {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647 - 0.5) * 2 * noise;
  const sig = 0.05;
  const frames = [];
  for (let t = from; t <= to + 1e-9; t += 1 / fps) {
    const W = Array.from({ length: 33 }, () => [0, 0, 0]);
    const set = (i, x, y, z) => (W[i] = [x + rand(), y + rand(), z + rand()]);
    const yawH = 1.2 * phi((t - hip) / sig);
    const yawS = 1.4 * phi((t - trunk) / sig);
    set(23, -0.15 * Math.cos(yawH), 0, -0.15 * Math.sin(yawH));
    set(24, 0.15 * Math.cos(yawH), 0, 0.15 * Math.sin(yawH));
    set(11, -0.2 * Math.cos(yawS), -0.5, -0.2 * Math.sin(yawS));
    set(12, 0.2 * Math.cos(yawS), -0.5, 0.2 * Math.sin(yawS));
    set(0, 0, -0.7, 0);
    set(13, -0.3, -0.25, 0);
    set(15, -0.35, 0, 0);
    // Codo y muñeca derechos: avanzan con su propio pico (la muñeca más rápido y más lejos).
    set(14, 0.3 + 0.3 * phi((t - elbow) / sig), -0.25, 0.1);
    set(16, 0.35 + 0.8 * phi(t / 0.04), -0.1, 0.2);
    set(25, -0.2, 0.45, 0);
    set(26, 0.3, 0.45, 0.05);
    set(27, -0.3, 0.9, 0);
    set(28, 0.4, 0.9, 0.1);
    for (const [foot, ankle] of [[29, 27], [31, 27], [30, 28], [32, 28]]) W[foot] = [...W[ankle]];
    frames.push({
      t: Math.round(t * 1e4) / 1e4,
      p: W.flatMap(([x, y]) => [0.5 + x * 0.3, 0.5 + y * 0.3]),
      w: W.flat(),
    });
  }
  return { frames, hand: "R", w: 1080, h: 1920, fps };
}

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, msg: err.message });
  }
}
function near(actual, expected, tol, what) {
  if (actual == null || Math.abs(actual - expected) > tol) throw new Error(`${what}: esperaba ${expected} ±${tol}, salió ${actual}`);
}
function ok(cond, what) {
  if (!cond) throw new Error(what);
}

test("Encuentra la suelta en el pico de la muñeca", () => {
  const a = analyzeForehand(syntheticThrow());
  near(a.release, 0, 1 / 120 + 1e-6, "suelta (s)");
});

test("Cadena en orden: cadera → hombros → codo → muñeca", () => {
  const a = analyzeForehand(syntheticThrow());
  ok(a.metrics.chainOrder === 3, `orden ${a.metrics.chainOrder} de 3`);
  near(a.metrics.hipLead, 100, 15, "adelanto de cadera (ms)");
  near(a.metrics.trunkLead, 60, 15, "adelanto de hombros (ms)");
});

test("Cadena al revés: lo detecta", () => {
  const a = analyzeForehand(syntheticThrow({ hip: -0.02, trunk: -0.06, elbow: -0.1 }));
  ok(a.metrics.chainOrder < 3, `orden ${a.metrics.chainOrder} de 3 (debería ser menos de 3)`);
});

test("Ancho del pivot ≈ 38 % de la altura", () => {
  const a = analyzeForehand(syntheticThrow());
  near(a.metrics.pivotWidth, 38, 3, "ancho del pivot (%)");
});

test("Video a 120 fps: sin avisos", () => {
  const a = analyzeForehand(syntheticThrow());
  ok(a.quality.ok, `avisos: ${a.quality.warnings.join(" | ")}`);
});

test("Video a 30 fps: avisa que los tiempos son aproximados", () => {
  const a = analyzeForehand(syntheticThrow({ fps: 30 }));
  ok(a.quality.warnings.some((w) => w.includes("cuadros por segundo")), "no avisó del fps bajo");
});

test("Video a 30 fps: la cadena se sigue leyendo con picos separados 40 ms", () => {
  const a = analyzeForehand(syntheticThrow({ fps: 30, hip: -0.14, trunk: -0.08, elbow: -0.04 }));
  ok(a.metrics.chainOrder === 3, `orden ${a.metrics.chainOrder} de 3`);
});

test("Ruido de medición moderado (±1 cm): la cadena sigue en orden", () => {
  const a = analyzeForehand(syntheticThrow({ noise: 0.01 }));
  ok(a.metrics.chainOrder === 3, `orden ${a.metrics.chainOrder} de 3`);
  near(a.metrics.hipLead, 100, 30, "adelanto de cadera (ms)");
});

test("El recorte guarda de −1 s a +0.6 s alrededor de la suelta", () => {
  const clip = syntheticThrow();
  const a = analyzeForehand(clip);
  const kept = trimAroundRelease(clip.frames, a.release);
  ok(kept[0].t >= -1 - 1e-6 && kept[kept.length - 1].t <= 0.6 + 1e-6, `de ${kept[0].t} a ${kept[kept.length - 1].t}`);
  // A 120 fps no debe botar cuadros: 1.6 s × 120 ≈ 192.
  ok(kept.length >= 190, `guardó ${kept.length} cuadros (debería ser ~192)`);
  near(analyzeForehand({ ...clip, frames: kept }).release, 0, 1e-6, "suelta después del recorte");
});

test("Suelta marcada a mano: todo se mide desde ese cuadro", () => {
  const clip = syntheticThrow();
  const moved = moveRelease(clip, 0.05);
  ok(moved.releaseLocked, "no quedó marcada");
  const a = analyzeForehand(moved);
  near(a.release, 0, 1e-6, "suelta");
  near(a.metrics.hipLead, 150, 15, "adelanto de cadera (ms)");
});

test("Volver a la suelta automática deshace la corrección", () => {
  const moved = moveRelease(moveRelease(syntheticThrow(), 0.05), -0.02);
  near(moved.shift, 0.03, 1e-6, "corrimiento acumulado");
  const back = moveRelease(moved, -moved.shift);
  ok(!back.releaseLocked && back.shift === 0, "sigue marcada");
  near(analyzeForehand(back).release, 0, 1 / 120 + 1e-6, "suelta automática");
});

test("Consistencia: videos idénticos = estable", () => {
  const a = analyzeForehand(syntheticThrow());
  const c = consistency([a, a, a]);
  ok(c.wristSpeed?.level === "estable", `muñeca: ${c.wristSpeed?.level}`);
  ok(c.hipLead?.level === "estable", `cadera: ${c.hipLead?.level}`);
});

test("Consistencia: cadera que salta 100 ms entre videos = muy variable", () => {
  const as = [-0.05, -0.2, -0.08, -0.25].map((hip) => analyzeForehand(syntheticThrow({ hip })));
  const c = consistency(as);
  ok(c.hipLead?.level === "muy variable", `cadera: ${c.hipLead?.level} (±${c.hipLead?.sd.toFixed(0)} ms)`);
});

test("Consistencia: con menos de 3 videos no opina", () => {
  const a = analyzeForehand(syntheticThrow());
  ok(!Object.keys(consistency([a, a])).length, "opinó con 2 videos");
});

test("Rango pro y puntaje: dentro del rango = 100, lejos = baja", () => {
  const band = proBand([60, 80, 100]);
  ok(band.lo === 60 && band.hi === 100, `rango ${band.lo}–${band.hi}`);
  ok(scoreVsPro("hipLead", 70, band) === 100, "dentro del rango no dio 100");
  ok(scoreVsPro("hipLead", 0, band) === 50, `a 60 ms del rango dio ${scoreVsPro("hipLead", 0, band)}`);
});

test("Buenos vs malos: encuentra que la diferencia está en la cadera", () => {
  const throwOf = (hip, seed, outcome) => ({ outcome, analysis: analyzeForehand(syntheticThrow({ hip, seed, noise: 0.004 })) });
  const items = [
    ...[-0.13, -0.12, -0.12, -0.11].map((h, i) => throwOf(h, i + 1, "bien")),
    ...[-0.05, -0.06, -0.04, -0.05].map((h, i) => throwOf(h, i + 11, i % 2 ? "se_fue" : "tambaleo")),
  ];
  const r = compareOutcomes(items);
  ok(r.ready, "no quedó lista con 4 y 4");
  const top = r.rows.find((x) => x.level);
  ok(top?.metric === "hipLead", `la diferencia más clara salió en ${top?.metric}`);
  ok(top.level === "clara", `nivel ${top.level}`);
  near(top.diff, 70, 20, "diferencia de adelanto de cadera (ms)");
});

test("Buenos vs malos: lanzamientos iguales = sin diferencias claras", () => {
  // 5 y 5 iguales (solo ruido de medición): no debe decir que hay una diferencia clara.
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed, i) => ({ outcome: i < 5 ? "bien" : "se_fue", analysis: analyzeForehand(syntheticThrow({ seed, noise: 0.004 })) }));
  const r = compareOutcomes(items);
  const flagged = r.rows.filter((x) => x.level === "clara").map((x) => x.metric);
  ok(!flagged.length, `inventó diferencias en: ${flagged.join(", ")}`);
});

test("Buenos vs malos: con menos de 3 por grupo espera", () => {
  const a = analyzeForehand(syntheticThrow());
  const r = compareOutcomes([{ outcome: "bien", analysis: a }, { outcome: "bien", analysis: a }, { outcome: "se_fue", analysis: a }]);
  ok(!r.ready && r.counts.good === 2 && r.counts.bad === 1, JSON.stringify(r.counts));
});

test("Plan de lanzamiento: mediana de tus últimos 5 (un video raro no cambia la falla)", () => {
  const pros = [-0.14, -0.12, -0.13].map((hip, i) => analyzeForehand(syntheticThrow({ hip, seed: 50 + i })));
  // Del más nuevo al más viejo: 4 con la cadera tarde y 1 "raro" con la cadera a tiempo.
  const mine = [-0.05, -0.13, -0.05, -0.06, -0.05].map((hip, i) => analyzeForehand(syntheticThrow({ hip, seed: 60 + i, noise: 0.003 })));
  const r = throwGaps(pros, mine);
  ok(r.gaps[0]?.metric === "hipLead", `primera falla: ${r.gaps[0]?.metric}`);
  ok(r.gaps.length <= 2, `${r.gaps.length} fallas`);
  ok(r.gaps[0].muscle === "glutes", `músculo: ${r.gaps[0].muscle}`);
});

test("Plan de lanzamiento: detecta que mejoraste frente a tus 5 videos anteriores", () => {
  const pros = [-0.14, -0.12, -0.13].map((hip, i) => analyzeForehand(syntheticThrow({ hip, seed: 70 + i })));
  const recent = [-0.11, -0.12, -0.11, -0.12, -0.11];
  const before = [-0.04, -0.05, -0.04, -0.05, -0.04];
  const mine = [...recent, ...before].map((hip, i) => analyzeForehand(syntheticThrow({ hip, seed: 80 + i, noise: 0.003 })));
  const r = throwGaps(pros, mine);
  const p = r.progress.find((x) => x.metric === "hipLead");
  ok(p, `no detectó la mejora (progress: ${r.progress.map((x) => x.metric).join(", ") || "nada"})`);
  ok(p.to > p.from, `de ${p.from} a ${p.to}`);
});

test("Taller: fallas desde el video y desde cómo marcaste tus lanzamientos", () => {
  const f = faultsFor({ gaps: [{ metric: "hipLead" }, { metric: "trunkLead" }], outcomes: { tambaleo: 3, se_fue: 1 } });
  const ids = f.map((x) => x.id).join(",");
  ok(ids === "cadena,muneca", `fallas: ${ids} (cadera y hombros = una sola falla; 1 «se fue» no es patrón)`);
});

test("Taller: los ejercicios de tu coach van primero", () => {
  const list = drillsFor("muneca", [{ id: "x", name: "Pelota contra la pared 3×20", fault: "muneca" }]);
  ok(list[0].source === "coach", `primero: ${list[0].drill}`);
});

test("Taller: todos los ejercicios tienen instrucciones", () => {
  const missing = THROW_DRILLS.filter((d) => !findExercise(d.drill)).map((d) => d.drill);
  ok(!missing.length, `sin instrucciones: ${missing.join(", ")}`);
});

export { results };
