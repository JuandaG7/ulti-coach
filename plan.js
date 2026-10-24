// Plan de entrenamiento: arma la semana con todo lo que la app sabe de ti.
// - Fuerza: los músculos con más prioridad (importancia en ultimate × lo que falta para Excelente).
// - Potencia y velocidad: saltos y sprints de esos músculos, si nada lo impide.
// - Blindaje: las zonas con más riesgo (lesiones, asimetrías, dolor).
// - Lanzamiento: los ejercicios de la métrica del forehand más lejos del rango pro.
// - Vuelta tras lesión: si hay una lesión activa, su etapa va primero y el resto del plan no carga la zona.
// - Check-in: semana pesada = descarga (sin saltos ni sprints); dolor en una zona = no se carga.
import { MUSCLES } from "./data/muscles.js";
import { JOINTS } from "./data/joints.js";
import { STAGES, stageDrills, LOWER, ZONE_MUSCLES, SPORT_TEST } from "./data/return.js";
import { weekKey } from "./data/checkin.js";
import { METRICS_BY_ID } from "./forehand.js";
import { findExercise } from "./data/exercises.js";
import * as store from "./store.js";
import { priorities, jointPriorities, testScore, wellness } from "./scoring.js";

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

// ---------- Semana ----------

// throwFocus: { metric, score } de tu forehand (lo calcula la vista, porque los clips son asíncronos).
export function weekPlan({ days = 3, mode = "casa", throwFocus = null, today }) {
  const injury = activeInjury();
  const stage = injury ? injury.rtpStage ?? 1 : null;
  const c = recentCheckin(today);
  const w = c ? wellness(c) : null;
  const deload = w != null && w < 50;
  const painful = Object.entries(c?.pains ?? {}).filter(([, p]) => p >= 4).map(([z]) => z);

  const lowerHurt = (injury && LOWER.has(injury.zone)) || painful.some((z) => LOWER.has(z));
  const noImpact = deload || painful.some((z) => LOWER.has(z)) || (injury && LOWER.has(injury.zone) && stage < 3);
  const noSpeed = deload || painful.some((z) => LOWER.has(z)) || (injury && LOWER.has(injury.zone) && stage < 4);
  const blocked = new Set([...(injury && stage <= 2 ? ZONE_MUSCLES[injury.zone] : []), ...painful.flatMap((z) => ZONE_MUSCLES[z])]);
  const allowed = (d) => !(noImpact && IMPACT.test(d)) && !(noSpeed && SPEED.test(d));
  const isPower = (d) => IMPACT.test(d) || SPEED.test(d);

  const muscles = priorities().filter((p) => !blocked.has(p.id)).slice(0, days * 3);
  const joints = jointPriorities().filter((j) => j.id !== injury?.zone).slice(0, 2);
  const throwOk = throwFocus && !(injury?.zone === "shoulder" && stage < 4) && !painful.includes("shoulder");

  const sessions = Array.from({ length: days }, (_, i) => {
    const used = new Set();
    const pick = (list, test) => {
      const d = list.find((x) => !used.has(exKey(x)) && test(x));
      if (d) used.add(exKey(d));
      return d;
    };
    const blocks = [];

    if (injury) {
      const items = stageItems(injury, mode);
      items.forEach((it) => used.add(exKey(it.drill)));
      blocks.push({ kind: "vuelta", title: `Vuelta de lesión · ${STAGES[stage - 1].name}`, items });
    }

    // Potencia: un ejercicio explosivo por sesión, rotando entre los músculos con prioridad.
    if (!noImpact || !noSpeed) {
      for (let k = 0; k < muscles.length; k++) {
        const m = muscles[(i + k) % muscles.length];
        const d = pick(m.muscle.drills[mode], (x) => isPower(x) && allowed(x));
        if (d) {
          blocks.push({ kind: "potencia", title: "Potencia y velocidad", items: [{ drill: d, reason: m.muscle.name, score: m.score }] });
          break;
        }
      }
    }

    // Fuerza: tres músculos distintos por sesión (la semana reparte los de más prioridad).
    const strength = [i, i + days, i + 2 * days]
      .map((k) => muscles[k])
      .filter(Boolean)
      .map((m) => {
        const d = pick(m.muscle.drills[mode], (x) => !isPower(x));
        return d && { drill: d, reason: m.muscle.name, score: m.score };
      })
      .filter(Boolean);
    if (strength.length) blocks.push({ kind: "fuerza", title: "Fuerza", items: strength });

    // Blindaje: alternando entre las dos zonas con más riesgo.
    const joint = joints[i % joints.length];
    if (joint) {
      const items = [];
      for (let k = 0; k < 2; k++) {
        const d = pick(joint.joint.drills[mode], allowed);
        if (d) items.push({ drill: d, reason: `Blindaje · ${joint.joint.name}`, score: joint.score });
      }
      if (items.length) blocks.push({ kind: "blindaje", title: "Blindaje", items });
    }

    // Lanzamiento: lo que más le falta a tu forehand, en días alternos.
    if (throwOk && (i % 2 === 0 || days <= 2)) {
      const m = METRICS_BY_ID[throwFocus.metric];
      const items = (m.drills ?? []).filter((x) => !used.has(exKey(x)) && allowed(x)).slice(0, 2)
        .map((drill) => ({ drill, reason: `Tu forehand · ${m.name.toLowerCase()}`, score: throwFocus.score }));
      if (items.length) blocks.push({ kind: "lanzamiento", title: "Lanzamiento", items });
    }

    const focus = strength.map((s) => s.reason);
    return { n: i + 1, title: focus.length ? focus.slice(0, 2).join(" · ") : injury ? "Vuelta de lesión" : "Sesión", blocks };
  });

  const notes = [];
  if (deload) notes.push({ level: "yellow", text: `Semana de descarga: tu check-in dio ${w} de bienestar. Haz 2 series en vez de 3–4, sin llegar al fallo, y sin saltos ni sprints.` });
  for (const z of painful) notes.push({ level: "yellow", text: `Dolor en ${JOINTS[z].name.toLowerCase()} esta semana: quitamos los ejercicios que la cargan.` });
  if (injury && lowerHurt && stage < 3) notes.push({ level: "info", text: "Sin saltos ni sprints hasta la etapa 3 de tu vuelta." });

  return { injury, stage, deload, wellness: w, sessions, notes };
}

// ---------- Registro de sesiones hechas ----------

export function doneThisWeek(today) {
  const week = weekKey(today);
  return new Set(store.planLog().filter((l) => l.week === week).map((l) => l.n));
}

export { STAGES, MUSCLES };
