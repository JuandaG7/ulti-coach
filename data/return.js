// Vuelta tras lesión: 5 etapas, de calmar la zona a volver a jugar.
// Inspirado en los protocolos de vuelta al deporte por criterios (no por días): se pasa de etapa
// cuando la zona cumple, no cuando pasa cierto tiempo. Los criterios exactos son ESTIMACIONES
// adaptadas a ultimate; la última palabra la tiene el fisio.
//
// Cada etapa: qué buscas, ejercicios por zona y cómo se sabe que puedes pasar (ver plan.js).

export const LOWER = new Set(["ankle", "knee", "hipGroin", "hamstring", "lowerBack"]);

export const STAGES = [
  {
    n: 1, name: "Calmar y mover",
    goal: "Que la zona deje de doler y recupere su movimiento, sin cargarla.",
    drills: {
      ankle: ["Movilidad de tobillo 2×15", "Isométrico de pantorrilla 5×30 s", "Equilibrio a una pierna 3×30 s"],
      knee: ["Sentadilla isométrica en pared 5×30 s", "Extensión de rodilla lenta 3×12", "Puente 3×12"],
      hipGroin: ["Isométrico de aductores con balón 5×30 s", "Puente 3×12", "Rotaciones 90/90 2×8"],
      hamstring: ["Isométrico de isquios en puente 5×30 s", "Puente 3×12", "Bird dog 3×8"],
      shoulder: ["Rotación externa isométrica 5×30 s", "Y-T-W sin peso 2×8", "Rotación torácica 2×10"],
      lowerBack: ["Curl-up de McGill 3×8", "Bird dog 3×8", "Plancha lateral 3×20 s"],
    },
  },
  {
    n: 2, name: "Fuerza",
    goal: "Devolverle la fuerza a la zona: el lado lesionado tiene que alcanzar al sano.",
    // Usa los ejercicios de blindaje de la zona (sin saltos) más estos.
    drills: {
      ankle: ["Elevación de talón con peso a una pierna 3×10"],
      knee: ["Step-down excéntrico 3×8", "Split squat con rodilla pasando la punta 3×8"],
      hipGroin: ["Plancha Copenhagen 3×20 s", "Sentadilla Cossack 3×6"],
      hamstring: ["Puente con talones en silla 3×10", "Peso muerto rumano 3×8"],
      shoulder: ["Rotación externa con banda 3×12", "Face pulls 3×12", "Remo con mancuerna 3×10"],
      lowerBack: ["Hiperextensiones 3×10", "Pallof press 3×10"],
    },
  },
  {
    n: 3, name: "Carrera y saltos",
    goal: "Volver a correr y a saltar: impacto progresivo, siempre sin dolor al día siguiente.",
    drills: {
      lower: ["Trote continuo 15–20 min", "Saltos de pogo 3×20", "Aterrizajes a una pierna 3×6", "Sprints progresivos al 70 % 6×30 m"],
      shoulder: ["Pases cortos de forehand y backhand 3×20 a 10 m", "Rotación externa con banda 3×12", "Snaps de forehand con toalla 3×20"],
    },
  },
  {
    n: 4, name: "Cortes y lanzamientos",
    goal: "Lo específico de ultimate: frenar, cambiar de dirección y lanzar a distancia, cada vez más rápido.",
    drills: {
      lower: ["Cambios de dirección al 75 % 6×", "Frenadas en 3 pasos 5×4", "Sprints al 90 % 6×20 m", "Cortes de ultimate sin marca 8×"],
      shoulder: ["Lanzamientos a 25–30 m 3×15", "Hucks al 70 % 2×8", "Lanzamiento rotacional con balón medicinal 3×8"],
    },
  },
  {
    n: 5, name: "Vuelta al juego",
    goal: "Practicar con el equipo y volver a jugar partidos, de menos a más.",
    drills: {
      lower: ["Práctica con el equipo sin defensa", "Práctica completa", "Medio partido"],
      shoulder: ["Práctica con el equipo sin defensa", "Práctica completa", "Medio partido"],
    },
  },
];

// Ejercicios de la etapa para una zona (las etapas 3–5 se agrupan en tren inferior / hombro).
export function stageDrills(stage, zone) {
  const d = STAGES[stage - 1].drills;
  return d[zone] ?? d[LOWER.has(zone) ? "lower" : "shoulder"] ?? [];
}

// Prueba que confirma, en la etapa 4, que la zona aguanta lo específico de ultimate.
export const SPORT_TEST = { lower: "test505", shoulder: "fhDistance" };

// Músculos que carga cada zona: mientras la zona se recupera (etapas 1–2), el resto del plan no los carga.
export const ZONE_MUSCLES = {
  ankle: ["calves"],
  knee: ["quads"],
  hipGroin: ["adductors", "glutes"],
  hamstring: ["hamstrings"],
  shoulder: ["frontDelts", "rearDelts", "chest", "triceps"],
  lowerBack: ["lowerBack"],
};
