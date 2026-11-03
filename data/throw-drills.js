// Taller de lanzamiento: ejercicios de aislamiento técnico, ordenados por la falla que corrigen.
// No te hacen más fuerte en general: exageran o aíslan UNA parte del gesto para sentirla y corregirla.
// Dosis corta (5–10 min), al inicio de la sesión o antes de lanzar con disco.
//
// source: "entrenadores" (experiencia de entrenadores: casi nada de esto está estudiado en ultimate)
//         "estudios" (hay estudios en lanzamientos parecidos, p. ej. potencia rotacional en béisbol o handball).
// Las instrucciones de cada ejercicio están en data/exercises.js (mismo nombre).

export const FAULTS = [
  {
    id: "muneca", name: "Muñeca y giro",
    why: "El giro del disco nace del golpe final de muñeca. Poco giro = disco que tambalea y no llega.",
    metrics: ["wristSpeed"], outcomes: ["tambaleo"],
  },
  {
    id: "codo", name: "Codo y brazo",
    why: "Si el codo se separa del cuerpo o va por detrás, lanzas solo con el brazo: menos control y más carga en el codo.",
    metrics: ["elbowAngle"], outcomes: [],
  },
  {
    id: "cadena", name: "Cadena cadera → hombros → brazo",
    why: "La potencia viene de abajo: la cadera gira primero, luego los hombros y al final el brazo, como un látigo.",
    metrics: ["chainOrder", "hipLead", "trunkLead"], outcomes: [],
  },
  {
    id: "pivot", name: "Pivot y paso",
    why: "Un paso largo y bajo te da espacio contra la marca y palanca para lanzar.",
    metrics: ["pivotWidth", "weightShift"], outcomes: [],
  },
  {
    id: "suelta", name: "Suelta y ángulo",
    why: "Dónde y con qué ángulo sueltas decide hacia dónde se va el disco. Si «se te va», casi siempre es esto.",
    metrics: ["releaseHeight"], outcomes: ["se_fue"],
  },
  {
    id: "control", name: "Control y sensación",
    why: "Sentir el disco sin pensar: para que el lanzamiento salga igual bajo presión.",
    metrics: [], outcomes: [],
  },
];

export const FAULTS_BY_ID = Object.fromEntries(FAULTS.map((f) => [f.id, f]));

export const THROW_DRILLS = [
  // Muñeca y giro
  { fault: "muneca", drill: "Pelota de tenis al piso 3×15", source: "entrenadores" },
  { fault: "muneca", drill: "Flick solo de muñeca a 5 m 3×20", source: "entrenadores" },
  { fault: "muneca", drill: "Snaps de forehand con toalla 3×20", source: "entrenadores" },
  { fault: "muneca", drill: "Disco al aire con giro 3×15", source: "entrenadores" },
  { fault: "muneca", drill: "Agarre firme con disco 3×30 s", source: "entrenadores" },
  // Codo y brazo
  { fault: "codo", drill: "Forehand con toalla bajo la axila 3×10", source: "entrenadores" },
  { fault: "codo", drill: "Forehand junto a la pared 3×10", source: "entrenadores" },
  { fault: "codo", drill: "Forehand con el codo guiando 3×10", source: "entrenadores" },
  // Cadena
  { fault: "cadena", drill: "Forehand de rodillas 3×10", source: "entrenadores" },
  { fault: "cadena", drill: "Lanzamiento a dos tiempos 3×10", source: "entrenadores" },
  { fault: "cadena", drill: "Pivot con banda en la cintura 3×8", source: "entrenadores", needs: "bandas" },
  { fault: "cadena", drill: "Forehand con pausa en el armado 3×10", source: "entrenadores" },
  { fault: "cadena", drill: "Lanzamiento rotacional con balón medicinal 3×8", source: "estudios", needs: "balon" },
  // Pivot y paso
  { fault: "pivot", drill: "Pivot con paso largo y forehand 3×10", source: "entrenadores" },
  { fault: "pivot", drill: "Pivot al cono 3×10 por lado", source: "entrenadores" },
  { fault: "pivot", drill: "Pivot contra la marca 3×8", source: "entrenadores" },
  // Suelta y ángulo
  { fault: "suelta", drill: "Lanzar al blanco a 10 m 3×10", source: "entrenadores" },
  { fault: "suelta", drill: "Final congelado 3×10", source: "entrenadores" },
  { fault: "suelta", drill: "Ángulos a propósito 3×10", source: "entrenadores" },
  // Control y sensación
  { fault: "control", drill: "Pases con los ojos cerrados 2×10", source: "entrenadores" },
  { fault: "control", drill: "Forehand con la otra mano 2×10", source: "entrenadores" },
];

// Fallas que te tocan: las métricas de tu forehand más lejos del rango pro y cómo marcaste tus lanzamientos.
// gaps: [{ metric }] (forehand.js · throwGaps); outcomes: { tambaleo: n, se_fue: n } de tus últimos videos.
export function faultsFor({ gaps = [], outcomes = {} } = {}) {
  const out = [];
  const add = (id, why) => {
    if (!out.some((f) => f.id === id)) out.push({ id, why });
  };
  for (const g of gaps) {
    const f = FAULTS.find((x) => x.metrics.includes(g.metric));
    if (f) add(f.id, { metric: g.metric });
  }
  // Dos o más lanzamientos marcados igual ya son un patrón (aunque el video no muestre una falla clara).
  for (const f of FAULTS) {
    for (const o of f.outcomes) if ((outcomes[o] ?? 0) >= 2) add(f.id, { outcome: o, count: outcomes[o] });
  }
  return out;
}

// Ejercicios de una falla: primero los de tu coach, luego los del taller.
export function drillsFor(faultId, custom = []) {
  return [
    ...custom.filter((c) => c.fault === faultId).map((c) => ({ fault: faultId, drill: c.name, source: "coach", custom: c })),
    ...THROW_DRILLS.filter((d) => d.fault === faultId),
  ];
}
