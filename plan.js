// Plan de entrenamiento: arma la semana con todo lo que la app sabe de ti.
// - Fuerza: los músculos con más prioridad (importancia en ultimate × lo que falta para Excelente).
// - Potencia y velocidad: saltos y sprints de esos músculos, si nada lo impide.
// - Blindaje: las zonas con más riesgo (lesiones, asimetrías, dolor).
// - Lanzamiento: los ejercicios de la métrica del forehand más lejos del rango pro.
// - Vuelta tras lesión: si hay una lesión activa, su etapa va primero y el resto del plan no carga la zona.
// - Check-in: semana pesada = descarga (sin saltos ni sprints); dolor en una zona = no se carga.
// - Diagnóstico (profile.planPrefs): tus objetivos y lo que te pasa en partido suben de prioridad los
//   músculos que importan para eso; tu equipo y tu tiempo deciden qué ejercicios y cuántos.
// - Ejercicios que también son pruebas: se pueden medir ese día. Cada 3 semanas, una medición de tus falencias.
// - Progresión: las dosis suben con las semanas completas y con cómo te fue (fácil / bien / muy duro).
import { MUSCLES } from "./data/muscles.js";
import { JOINTS } from "./data/joints.js";
import { STAGES, stageDrills, LOWER, ZONE_MUSCLES, SPORT_TEST } from "./data/return.js";
import { weekKey } from "./data/checkin.js";
import { METRICS_BY_ID } from "./forehand.js";
import { findExercise } from "./data/exercises.js";
import * as store from "./store.js";
import { priorities, jointPriorities, testScore, wellness, target } from "./scoring.js";
import { TESTS_BY_ID } from "./data/tests.js";
import { categoryWeights, wantsInjuryPrevention, EQUIPMENT, SIZE } from "./data/plan-prefs.js";

// Impacto (saltos, aterrizajes, lanzamientos explosivos) y velocidad (sprints, frenadas, cortes).
const IMPACT = /salto|pogo|aterriza|pliom|lanzamiento rotacional/i;
const SPEED = /sprint|frenada|cambios de direcci|cortes|huck/i;

// El mismo ejercicio escrito distinto ("Plancha Copenhagen 3×20 s" y "… por lado") cuenta como uno.
const exKey = (d) => (findExercise(d)?.name ?? d).toLowerCase();

export function activeInjury() {
  return store.injuries().find((i) => i.status === "activa") ?? null;
}

// Último check-in de esta semana o la anterior (más viejo ya no dice cómo estás).
function recentCheckin(date) {
  const list = store.checkins();
  const last = list[list.length - 1];
  if (!last) return null;
  const prev = new Date(date + "T12:00:00");
  prev.setDate(prev.getDate() - 7);
  return last.week >= weekKey(prev.toISOString().slice(0, 10)) ? last : null;
}

// ---------- Vuelta tras lesión: criterios para pasar de etapa ----------

// Puntaje de una zona con mediciones hechas DESPUÉS de la lesión (las de antes no dicen cómo está hoy).
function scoreSince(weights, date) {
  let sum = 0;
  let total = 0;
  let missing = null;
  for (const [testId, w] of Object.entries(weights)) {
    const e = store.latest(testId);
    if (!e || e.date < date) {
      missing ??= testId;
      continue;
    }
    const s = testScore(testId, e.value);
    if (s == null) continue;
    sum += s * w;
    total += w;
  }
  return { score: total ? Math.round(sum / total) : null, missing };
}

function worstAsymmetrySince(testIds, date) {
  let worst = null;
  let missing = null;
  for (const testId of testIds) {
    const e = store.latest(testId);
    if (!e?.sides || e.date < date) {
      missing ??= testId;
      continue;
    }
    const hi = Math.max(e.sides.L, e.sides.R);
    if (!hi) continue;
    const pct = Math.round(((hi - Math.min(e.sides.L, e.sides.R)) / hi) * 100);
    worst = Math.max(worst ?? 0, pct);
  }
  return { pct: worst, missing };
}

// Lo que pide cada etapa para pasar a la siguiente. ok: true (cumple), false (no) o null (falta medir).
// Umbrales estimados: Decente (40) para empezar a correr, Bueno (65) para cortar; asimetría < 15 % y < 10 %.
export function stageCriteria(injury, today) {
  const stage = injury.rtpStage ?? 1;
  const zone = injury.zone;
  const j = JOINTS[zone];
  const since = injury.date;
  const out = [];

  const c = recentCheckin(today);
  const painNow = c && c.week >= weekKey(since) ? c.pains?.[zone] ?? 0 : null;
  const pain = (max) => ({
    text: `Dolor en la zona de ${max}/10 o menos en tu check-in`,
    ok: painNow == null ? null : painNow <= max,
    value: painNow == null ? "Haz tu check-in" : `${painNow}/10`,
    act: "checkin",
  });
  const strength = (min) => {
    const { score, missing } = scoreSince(j.fuerza, since);
    return { text: `Fuerza de la zona en ${min >= 65 ? "Bueno" : "Decente"} o más (${min}+)`, ok: score == null ? null : score >= min, value: score == null ? "Mídela" : `${score}`, testId: missing ?? Object.keys(j.fuerza)[0] };
  };
  const symmetry = (max) => {
    if (!j.simetria.length) return null;
    const { pct, missing } = worstAsymmetrySince(j.simetria, since);
    return { text: `El lado lesionado a menos de ${max} % del sano`, ok: pct == null ? null : pct < max, value: pct == null ? "Mídela" : `${pct} %`, testId: missing ?? j.simetria[0] };
  };

  if (stage === 1) {
    out.push(pain(2));
    if (Object.keys(j.rango).length) {
      const { score, missing } = scoreSince(j.rango, since);
      out.push({ text: "Movilidad de la zona en Decente o más (40+)", ok: score == null ? null : score >= 40, value: score == null ? "Mídela" : `${score}`, testId: missing });
    }
  } else if (stage === 2) {
    out.push(pain(2), strength(40), symmetry(15));
  } else if (stage === 3) {
    out.push(pain(2), strength(65), symmetry(10));
  } else if (stage === 4) {
    const testId = SPORT_TEST[LOWER.has(zone) ? "lower" : "shoulder"];
    const e = store.latest(testId);
    out.push(pain(2), { text: LOWER.has(zone) ? "Test 505 medido sin dolor" : "Distancia de forehand medida sin dolor", ok: e && e.date >= since ? true : null, value: e && e.date >= since ? "Hecho" : "Mídelo", testId });
  }
  return out.filter(Boolean);
}

// Ejercicios de la etapa: en la etapa 2 se suman los de blindaje de la zona (sin saltos).
function stageItems(injury, mode) {
  const stage = injury.rtpStage ?? 1;
  const own = stageDrills(stage, injury.zone);
  const extra = stage === 2 ? JOINTS[injury.zone].drills[mode].filter((d) => !IMPACT.test(d)) : [];
  return [...new Set([...own, ...extra])].slice(0, 5).map((drill) => ({ drill, reason: `Etapa ${stage}` }));
}

// ---------- Ejercicios que también son pruebas ----------
// El texto del ejercicio empieza igual que la prueba (misma forma de hacerlo): se puede medir ese día.
const DRILL_TESTS = [
  [/^plancha copenhagen/i, "copenhagen"],
  [/^nordic curl/i, "nordic"],
  [/^puente a una pierna/i, "gluteBridge"],
  [/^elevación a una pierna/i, "calfRaise"],
  [/^elevación de tibial/i, "tibialisRaise"],
  [/^plancha lateral/i, "sidePlank"],
  [/^equilibrio a una pierna ojos cerrados/i, "balanceEC"],
  [/^saltos largos/i, "broadJump"],
  [/^sentadilla a una pierna a cajón/i, "pistol"],
  [/^dominadas (\d|4×)/i, "pullups"],
  [/^flexiones \d/i, "pushups"],
  [/^colgarse \d/i, "deadHang"],
  [/^movilidad rodilla a la pared/i, "kneeToWall"],
];
export function drillTest(drill) {
  return DRILL_TESTS.find(([re]) => re.test(drill))?.[1] ?? null;
}

export const RETEST_DAYS = 21;
const daysSince = (iso, today) => Math.round((new Date(today + "T12:00:00") - new Date(iso + "T12:00:00")) / 86400000);

// ---------- Progresión ----------
// Nivel 0–3: semanas completas recientes (con la mayoría de las sesiones hechas), ajustado por cómo te fue.
export function progressionLevel(days, today) {
  const log = store.planLog();
  const week = weekKey(today);
  const byWeek = new Map();
  for (const l of log) if (l.week < week) byWeek.set(l.week, (byWeek.get(l.week) ?? 0) + 1);
  const recent = [...byWeek.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  let level = recent.filter(([, n]) => n >= Math.max(1, days - 1)).length;
  const feels = log.filter((l) => l.feel).slice(-2).map((l) => l.feel);
  if (feels.length === 2 && feels.every((f) => f === "duro")) level -= 1;
  if (feels.length === 2 && feels.every((f) => f === "facil")) level += 1;
  return Math.max(0, Math.min(3, level));
}

// "3×20 s" → con nivel 2: "4×26 s". Más repeticiones o tiempo (+15 % por nivel) y una serie más desde el nivel 2.
// En descarga: una serie menos.
function dose(drill, level, deload) {
  return drill.replace(/(\d+)×(\d+)(\s?s\b|\s?m\b)?/, (m, sets, reps, unit) => {
    let s = Number(sets);
    let r = Number(reps);
    if (deload) return `${Math.max(1, s - 1)}×${r}${unit ?? ""}`;
    if (!level) return m;
    r = r * (1 + 0.15 * level);
    // Tiempos, distancias y repeticiones altas, de 5 en 5 (29 → 30); repeticiones bajas, de 1 en 1.
    r = unit || r >= 15 ? Math.round(r / 5) * 5 : Math.round(r);
    if (level >= 2 && s < 4) s += 1;
    return `${s}×${r}${unit ?? ""}`;
  });
}

// ---------- Por qué este plan ----------
const fmtV = (v, t) => `${Number(v).toFixed(t.decimals)}${t.unit === "°" ? "°" : ` ${t.unit}`}`;

// La prueba más floja de un músculo, con su valor y la meta Excelente.
function weakestTest(muscle) {
  let worst = null;
  for (const testId of Object.keys(muscle.tests)) {
    const e = store.latest(testId);
    if (!e) continue;
    const s = testScore(testId, e.value);
    if (!worst || s < worst.score) worst = { testId, value: e.value, score: s };
  }
  return worst;
}

export function planReasons({ prefs, throwFocus, muscles, joints }) {
  const out = [];
  for (const m of muscles.slice(0, 2)) {
    const w = weakestTest(m.muscle);
    if (w) {
      const t = TESTS_BY_ID[w.testId];
      out.push({ kind: "musculo", score: m.score, title: m.muscle.name, detail: `${t.name}: ${fmtV(w.value, t)} · Excelente: ${fmtV(target(w.testId).elite, t)}`, testId: w.testId });
    } else {
      const testId = Object.keys(m.muscle.tests)[0];
      out.push({ kind: "musculo", score: null, title: m.muscle.name, detail: `Sin medir: mide ${TESTS_BY_ID[testId].name.toLowerCase()} para afinar el plan`, testId });
    }
  }
  const j = joints[0];
  if (j) {
    const a = [...j.alerts].sort((x, y) => y.pct - x.pct)[0];
    out.push(a
      ? { kind: "blindaje", score: j.score, title: `Blindaje · ${j.joint.name}`, detail: `Lado ${a.weak === "L" ? "izquierdo" : "derecho"} ${a.pct} % más débil en ${TESTS_BY_ID[a.testId].name.toLowerCase()}`, testId: a.testId }
      : { kind: "blindaje", score: j.score, title: `Blindaje · ${j.joint.name}`, detail: j.injury?.status === "activa" ? "Lesión activa" : j.score == null ? "Sin medir" : `Zona con más riesgo (${j.score})` });
  }
  if (throwFocus) {
    const m = METRICS_BY_ID[throwFocus.metric];
    const band = throwFocus.band;
    out.push({ kind: "lanzamiento", score: throwFocus.score, title: `Tu forehand · ${m.name.toLowerCase()}`, detail: band ? `Tú ${Number(throwFocus.value).toFixed(m.decimals)} ${m.unit} · pros ${band.lo.toFixed(m.decimals)}–${band.hi.toFixed(m.decimals)}` : "" });
  }
  return out;
}

// ---------- Semana ----------

// throwFocus: { metric, score, value, band } de tu forehand (lo calcula la vista: los clips son asíncronos).
export function weekPlan({ days = 3, mode = "casa", throwFocus = null, today }) {
  const prefs = store.profile()?.planPrefs ?? null;
  const size = SIZE[prefs?.minutes ?? 45];
  const injury = activeInjury();
  const stage = injury ? injury.rtpStage ?? 1 : null;
  const c = recentCheckin(today);
  const w = c ? wellness(c) : null;
  const deload = w != null && w < 50;
  const painful = Object.entries(c?.pains ?? {}).filter(([, p]) => p >= 4).map(([z]) => z);
  const level = deload ? 0 : progressionLevel(days, today);

  const lowerHurt = (injury && LOWER.has(injury.zone)) || painful.some((z) => LOWER.has(z));
  const noImpact = deload || painful.some((z) => LOWER.has(z)) || (injury && LOWER.has(injury.zone) && stage < 3);
  const noSpeed = deload || painful.some((z) => LOWER.has(z)) || (injury && LOWER.has(injury.zone) && stage < 4);
  const blocked = new Set([...(injury && stage <= 2 ? ZONE_MUSCLES[injury.zone] : []), ...painful.flatMap((z) => ZONE_MUSCLES[z])]);
  // Equipo: en casa, sin lo que no tienes (si no hiciste el diagnóstico, no se filtra nada).
  const missing = mode === "gym" || !prefs?.equip ? [] : EQUIPMENT.filter((e) => !prefs.equip.includes(e.id));
  const hasEquip = (d) => !missing.some((e) => e.needs.test(d));
  const allowed = (d) => !(noImpact && IMPACT.test(d)) && !(noSpeed && SPEED.test(d)) && hasEquip(d);
  const isPower = (d) => IMPACT.test(d) || SPEED.test(d);

  // Prioridad de cada músculo: la de siempre × lo que quieres mejorar (sus pruebas en tus categorías).
  const cw = categoryWeights(prefs);
  const muscles = priorities()
    .filter((p) => !blocked.has(p.id))
    .map((p) => {
      const cats = new Set(Object.keys(p.muscle.tests).map((t) => TESTS_BY_ID[t]?.cat));
      const boost = 1 + 0.35 * [...cats].reduce((sum, cat) => sum + (cw[cat] ?? 0), 0);
      return { ...p, priority: p.priority * boost };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, days * size.fuerza);
  const joints = jointPriorities().filter((j) => j.id !== injury?.zone).slice(0, 2);
  const throwOk = !(injury?.zone === "shoulder" && stage < 4) && !painful.includes("shoulder");
  const wantsThrow = (cw.lanzamiento ?? 0) > 0;
  const wantsEndurance = (cw.resistencia ?? 0) > 0;
  const blindajeN = size.blindaje + (wantsInjuryPrevention(prefs) ? 1 : 0);

  // Medición: pruebas de tus falencias sin medir hace 3 semanas o más (máx. 3), el día 1.
  const retest = [];
  for (const m of muscles.slice(0, 3)) {
    const testId = Object.keys(m.muscle.tests).find((t) => TESTS_BY_ID[t]);
    const e = store.latest(testId);
    if (testId && !retest.some((r) => r.testId === testId) && (!e || daysSince(e.date, today) >= RETEST_DAYS)) {
      retest.push({ testId, reason: m.muscle.name, last: e ? daysSince(e.date, today) : null });
    }
  }
  const measureDue = !deload && !injury && retest.length > 0;

  const item = (drill, reason, score) => {
    const d = dose(drill, level, deload);
    return { drill: d, reason, score, testId: drillTest(d) };
  };

  const sessions = Array.from({ length: days }, (_, i) => {
    const used = new Set();
    const pick = (list, test) => {
      const d = list.find((x) => !used.has(exKey(x)) && test(x));
      if (d) used.add(exKey(d));
      return d;
    };
    const blocks = [];

    if (measureDue && i === 0) {
      blocks.push({ kind: "medicion", title: "Medición · al inicio, después de calentar", items: retest.slice(0, 3) });
    }

    if (injury) {
      const items = stageItems(injury, mode).filter((it) => hasEquip(it.drill)).map((it) => ({ ...item(it.drill, it.reason), score: null }));
      items.forEach((it) => used.add(exKey(it.drill)));
      blocks.push({ kind: "vuelta", title: `Vuelta de lesión · ${STAGES[stage - 1].name}`, items });
    }

    // Potencia: un ejercicio explosivo por sesión, rotando entre los músculos con prioridad.
    if (!noImpact || !noSpeed) {
      for (let k = 0; k < muscles.length; k++) {
        const m = muscles[(i + k) % muscles.length];
        const d = pick(m.muscle.drills[mode], (x) => isPower(x) && allowed(x));
        if (d) {
          blocks.push({ kind: "potencia", title: "Potencia y velocidad", items: [item(d, m.muscle.name, m.score)] });
          break;
        }
      }
    }

    // Fuerza: músculos distintos por sesión (la semana reparte los de más prioridad).
    const strength = Array.from({ length: size.fuerza }, (_, k) => muscles[i + k * days])
      .filter(Boolean)
      .map((m) => {
        const d = pick(m.muscle.drills[mode], (x) => !isPower(x) && allowed(x));
        return d && item(d, m.muscle.name, m.score);
      })
      .filter(Boolean);
    if (strength.length) blocks.push({ kind: "fuerza", title: "Fuerza", items: strength });

    // Blindaje: alternando entre las dos zonas con más riesgo.
    const joint = joints[i % joints.length];
    if (joint) {
      const items = [];
      for (let k = 0; k < blindajeN; k++) {
        const d = pick(joint.joint.drills[mode], allowed);
        if (d) items.push(item(d, `Blindaje · ${joint.joint.name}`, joint.score));
      }
      if (items.length) blocks.push({ kind: "blindaje", title: "Blindaje", items });
    }

    // Lanzamiento: lo que más le falta a tu forehand; si no hay video pero es tu objetivo, ejercicios generales.
    if (throwOk && (throwFocus || wantsThrow) && (i % 2 === 0 || days <= 2)) {
      const m = throwFocus ? METRICS_BY_ID[throwFocus.metric] : null;
      const list = m?.drills ?? ["Snaps de forehand con toalla 3×20", "Lanzamiento rotacional con balón medicinal 3×8", "Pivot con paso largo y forehand 3×10"];
      const items = list.filter((x) => !used.has(exKey(x)) && allowed(x)).slice(0, size.lanzamiento)
        .map((d) => item(d, m ? `Tu forehand · ${m.name.toLowerCase()}` : "Tu objetivo: lanzar", throwFocus?.score ?? null));
      if (items.length) blocks.push({ kind: "lanzamiento", title: "Lanzamiento", items });
    }

    // Resistencia: si es tu objetivo, sprints repetidos en días alternos (como un punto largo).
    if (wantsEndurance && !noSpeed && i % 2 === 1) {
      blocks.push({ kind: "resistencia", title: "Resistencia", items: [item("Sprints repetidos 6×30 m (salida cada 20 s)", "Tu objetivo: aguantar el partido", null)] });
    }

    const focus = strength.map((s) => s.reason);
    return { n: i + 1, title: focus.length ? focus.slice(0, 2).join(" · ") : injury ? "Vuelta de lesión" : "Sesión", blocks };
  });

  const notes = [];
  if (deload) notes.push({ level: "yellow", text: `Semana de descarga: tu check-in dio ${w} de bienestar. Una serie menos en cada ejercicio, sin llegar al fallo, y sin saltos ni sprints.` });
  for (const z of painful) notes.push({ level: "yellow", text: `Dolor en ${JOINTS[z].name.toLowerCase()} esta semana: quitamos los ejercicios que la cargan.` });
  if (injury && lowerHurt && stage < 3) notes.push({ level: "info", text: "Sin saltos ni sprints hasta la etapa 3 de tu vuelta." });

  const reasons = planReasons({ prefs, throwFocus, muscles, joints });
  return { injury, stage, deload, wellness: w, level, measureDue, sessions, notes, reasons, prefs };
}

// ---------- Registro de sesiones hechas ----------

export function doneThisWeek(today) {
  const week = weekKey(today);
  return new Set(store.planLog().filter((l) => l.week === week).map((l) => l.n));
}

export { STAGES, MUSCLES };
