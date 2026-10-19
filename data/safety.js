// Calentamiento antes de medir y reglas de seguridad.
import { JOINTS } from "./joints.js";

// Calentamiento tipo RAMP (~10 min): subir temperatura, movilidad, activación y potenciación.
export const WARMUP = [
  { title: "Subir temperatura · 3 min", text: "Trote suave, desplazamientos laterales y hacia atrás." },
  { title: "Movilidad dinámica · 3 min", text: "Balanceos de pierna adelante y de lado ×10, zancada con rotación ×5 por lado, sentadilla profunda ×8." },
  { title: "Activación · 2 min", text: "Puente de glúteo ×10, saltos de pogo ×20, plancha 20 s." },
  { title: "Progresiones · 2 min", text: "3 sprints de 20 m al 60, 80 y 90 %, y 2 cambios de dirección suaves." },
];

export const SAFETY = [
  "Para si sientes dolor punzante o en una articulación. El cansancio es normal; el dolor no.",
  "En pruebas máximas, descansa por completo entre intentos (2–3 min).",
  "Si tienes menos de 18 años, haz las pruebas máximas con tu entrenador presente.",
  "No midas una zona con una lesión activa hasta que tu fisio lo autorice.",
];

// Pruebas de esfuerzo máximo: piden calentar antes.
const MAX_CATS = new Set(["velocidad", "agilidad", "potencia", "resistencia", "lanzamiento"]);
const MAX_TESTS = new Set(["nordic", "singleHop", "pistol"]);
const NOT_MAX = new Set(["hrRecovery", "throwAccuracy"]);

export function isMaxEffort(test) {
  return (MAX_CATS.has(test.cat) || MAX_TESTS.has(test.id)) && !NOT_MAX.has(test.id);
}

// Zonas de blindaje que carga una prueba (para avisar si hay una lesión activa ahí).
export function zonesForTest(testId) {
  return Object.entries(JOINTS)
    .filter(([, j]) => testId in j.rango || testId in j.fuerza || j.simetria.includes(testId))
    .map(([id]) => id);
}
