// Paquete de progreso que el jugador le envía al entrenador (por QR o archivo).
// Es una foto completa del estado actual, no solo lo nuevo: si se envía dos veces o se salta
// una semana, el entrenador simplemente actualiza a ese jugador. Claves cortas para que quepa en un QR.
import { CATEGORIES, TESTS } from "./tests.js";
import * as store from "../store.js";
import { overallScore, categoryScore, testScore, priorities, jointPriorities, wellness } from "../scoring.js";

export const SNAP_TYPE = "uc-snap";

// Códigos cortos de las pruebas para el QR (cada prueba viaja como un número).
// SOLO SE AGREGAN AL FINAL: cambiar el orden haría que los paquetes viejos se lean mal.
const CODES = [
  "sprint10m", "sprint40m", "proAgilityM", "test505", "reactiveAgility", "vertJump", "broadJump", "yoyo",
  "rsa", "hrRecovery", "fhDistance", "bhDistance", "fhSpeed", "throwAccuracy", "nordic", "copenhagen",
  "pistol", "gluteBridge", "calfRaise", "tibialisRaise", "plank", "sidePlank", "sorensen", "pullups",
  "pushups", "deadHang", "balanceEC", "singleHop", "kneeToWall", "aslr", "hipIR", "thoracicRot",
  "shoulderER", "shoulderIR",
];
const toCode = (id) => (CODES.includes(id) ? CODES.indexOf(id) : id);
const fromCode = (c) => (typeof c === "number" ? CODES[c] : c);
const MAX_QR_BYTES = 2300; // margen bajo el límite de un QR con corrección baja (~2950 bytes)

const daysAgo = (iso, from) => Math.round((new Date(from).getTime() - new Date(iso + "T12:00:00").getTime()) / 86400000);
const round = (v) => Math.round(v * 100) / 100;

export function buildSnapshot() {
  const p = store.profile();
  const at = new Date().toISOString();
  const latestTests = TESTS.map((t) => [t.id, store.latest(t.id)]).filter(([, e]) => e);
  const checks = store.checkins();
  const ci = checks[checks.length - 1];
  return {
    t: SNAP_TYPE,
    v: 1,
    id: store.playerId(),
    n: p.name,
    a: p.age,
    s: p.sex,
    p: p.position,
    at,
    o: overallScore(),
    c: Object.fromEntries(CATEGORIES.map((c) => [c.id, categoryScore(c.id)]).filter(([, s]) => s != null)),
    // [prueba, valor, puntaje, días desde la medición, izq?, der?]
    r: latestTests.map(([id, e]) => {
      const row = [toCode(id), round(e.value), testScore(id, e.value), daysAgo(e.date, at)];
      if (e.sides) row.push(round(e.sides.L), round(e.sides.R));
      return row;
    }),
    f: priorities().slice(0, 3).map((x) => x.id),
    al: [...new Map(jointPriorities().flatMap((j) => j.alerts).map((a) => [a.testId, [toCode(a.testId), a.pct, a.weak]])).values()],
    inj: store.injuries().filter((i) => i.status === "activa").map((i) => [i.zone, i.side]),
    ci: ci
      ? { w: ci.week, wb: wellness(ci), sh: ci.sleepHours, se: ci.sessions, rpe: ci.rpe, pa: ci.pains ?? {}, no: ci.note || undefined }
      : undefined,
  };
}

// Texto para el QR: JSON en ASCII puro (los acentos van escapados) para que cualquier lector lo lea igual.
export function encodeSnapshot(snap) {
  return JSON.stringify(snap).replace(/[\u0080-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

export function fitsInQr(text) {
  return text.length <= MAX_QR_BYTES;
}

// Valida lo que llega (QR o archivo). Devuelve el paquete o null si no es de Ulti Coach.
export function parseSnapshot(text) {
  try {
    const s = JSON.parse(text);
    if (s?.t !== SNAP_TYPE || !s.id || !s.n || !Array.isArray(s.r)) return null;
    // Volver a los nombres internos de las pruebas (y descartar pruebas que esta versión no conozca).
    s.r = s.r.map(([c, ...rest]) => [fromCode(c), ...rest]).filter(([id]) => id);
    s.al = (s.al ?? []).map(([c, ...rest]) => [fromCode(c), ...rest]).filter(([id]) => id);
    return s;
  } catch {
    return null;
  }
}
