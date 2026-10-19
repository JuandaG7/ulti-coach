// Catálogo de pruebas físicas.
// `base` = nivel de entrada (puntaje 0) y `elite` = nivel élite (puntaje 100).
// Son referencias aproximadas de deportes de campo, no normas oficiales de ultimate:
// ajústalas aquí a medida que tengas datos de tu equipo o de jugadores que admires.
// Para pruebas de tiempo, elite < base (menos es mejor); el cálculo lo maneja solo.

export const CATEGORIES = [
  { id: "velocidad", name: "Velocidad", blurb: "Ganarle a tu marca en los primeros pasos y en el huck." },
  { id: "agilidad", name: "Cambio de dirección", blurb: "Frenar, plantar y salir: la base de cada corte." },
  { id: "potencia", name: "Potencia", blurb: "Saltar más alto en el layout y en la pelea por el disco." },
  { id: "resistencia", name: "Resistencia", blurb: "Cortar igual de fuerte en el punto 15 que en el 1." },
  { id: "lanzamiento", name: "Lanzamiento", blurb: "Distancia y velocidad del disco." },
  { id: "fuerza", name: "Fuerza", blurb: "Músculos que protegen y producen cada movimiento." },
  { id: "movilidad", name: "Movilidad", blurb: "Rango para frenar bajo y pivotear amplio sin lesionarte." },
];

export const TESTS = [
  // Velocidad
  {
    id: "sprint10", cat: "velocidad", name: "Sprint 10 yd", unit: "s", decimals: 2, base: 2.0, elite: 1.6,
    how: "Desde parado en posición de 3 apoyos, 10 yardas (9.14 m). Mejor de 3 intentos con 2 min de descanso.",
  },
  {
    id: "sprint40", cat: "velocidad", name: "Sprint 40 yd", unit: "s", decimals: 2, base: 5.6, elite: 4.6,
    how: "Desde parado, 40 yardas (36.6 m). Mejor de 2 intentos con descanso completo.",
  },
  // Cambio de dirección
  {
    id: "proAgility", cat: "agilidad", name: "5-10-5 (Pro agility)", unit: "s", decimals: 2, base: 5.3, elite: 4.3,
    how: "Tres conos a 5 yd. Sales del centro, 5 yd a un lado, 10 yd al otro, 5 yd de vuelta al centro. Toca la línea con la mano. Mejor de cada lado.",
  },
  {
    id: "test505", cat: "agilidad", name: "Test 505", unit: "s", decimals: 2, base: 2.8, elite: 2.2,
    how: "Corres 15 m de impulso; se cronometra desde la marca de 10 m, frenas y giras 180° en la marca de 15 m y vuelves a la de 10 m. Mide tu frenado y re-aceleración.",
  },
  // Potencia
  {
    id: "vertJump", cat: "potencia", name: "Salto vertical", unit: "cm", decimals: 0, base: 40, elite: 70,
    how: "Contramovimiento con brazos, desde parado. Marca tu alcance de pie y la marca más alta en la pared. Mejor de 3.",
  },
  {
    id: "broadJump", cat: "potencia", name: "Salto largo", unit: "cm", decimals: 0, base: 200, elite: 290,
    how: "Pies juntos, salto horizontal con brazos. Mide desde la línea hasta el talón más atrasado. Mejor de 3.",
  },
  // Resistencia
  {
    id: "yoyo", cat: "resistencia", name: "Yo-Yo IR1", unit: "m", decimals: 0, base: 800, elite: 2400,
    how: "Ida y vuelta de 20 m con pitidos que aceleran y 10 s de recuperación activa. Anota la distancia total al fallar dos veces.",
  },
  // Lanzamiento
  {
    id: "fhDistance", cat: "lanzamiento", name: "Distancia forehand", unit: "m", decimals: 0, base: 30, elite: 65,
    how: "Lanzamiento máximo con buen vuelo (que se pueda atrapar). Sin viento o promedia ida y vuelta. Mejor de 5.",
  },
  {
    id: "bhDistance", cat: "lanzamiento", name: "Distancia backhand", unit: "m", decimals: 0, base: 35, elite: 75,
    how: "Igual que el forehand: lanzamiento máximo con vuelo controlado. Mejor de 5.",
  },
  {
    id: "fhSpeed", cat: "lanzamiento", name: "Velocidad forehand", unit: "km/h", decimals: 0, base: 50, elite: 95,
    how: "Velocidad del disco al soltar. Mídela con un radar o, más adelante, con el análisis de video.",
  },
  // Fuerza
  {
    id: "nordic", cat: "fuerza", name: "Nordic curl", unit: "reps", decimals: 0, base: 1, elite: 10,
    how: "De rodillas con los tobillos sujetos, baja controlando con isquiotibiales. Cuenta repeticiones con bajada controlada hasta el piso.",
  },
  {
    id: "copenhagen", cat: "fuerza", name: "Plancha Copenhagen", unit: "s", decimals: 0, base: 15, elite: 60,
    how: "Plancha lateral con la pierna de arriba apoyada en un banco (a la altura de la rodilla o el tobillo). Anota el lado más débil.",
  },
  {
    id: "pistol", cat: "fuerza", name: "Sentadilla a una pierna", unit: "reps", decimals: 0, base: 1, elite: 10,
    how: "Sentadilla a una pierna hasta un banco o cajón bajo, sin apoyar el peso. Anota el lado más débil.",
  },
  {
    id: "gluteBridge", cat: "fuerza", name: "Puente de glúteo a una pierna", unit: "reps", decimals: 0, base: 15, elite: 35,
    how: "Hombros en el piso, una pierna estirada. Sube la cadera hasta la línea recta. Hasta el fallo, lado más débil.",
  },
  {
    id: "calfRaise", cat: "fuerza", name: "Elevación de talón a una pierna", unit: "reps", decimals: 0, base: 15, elite: 35,
    how: "En un escalón, rango completo y ritmo de 1 s arriba / 1 s abajo. Hasta el fallo, lado más débil.",
  },
  {
    id: "plank", cat: "fuerza", name: "Plancha frontal", unit: "s", decimals: 0, base: 60, elite: 180,
    how: "Sobre antebrazos, cuerpo recto. Termina cuando se cae la cadera.",
  },
  {
    id: "sidePlank", cat: "fuerza", name: "Plancha lateral", unit: "s", decimals: 0, base: 45, elite: 120,
    how: "Sobre un antebrazo, cuerpo recto. Anota el lado más débil.",
  },
  {
    id: "sorensen", cat: "fuerza", name: "Test de Sorensen", unit: "s", decimals: 0, base: 60, elite: 180,
    how: "Boca abajo con la cadera al borde de un banco y las piernas sujetas, mantén el torso horizontal.",
  },
  {
    id: "pullups", cat: "fuerza", name: "Dominadas", unit: "reps", decimals: 0, base: 3, elite: 15,
    how: "Agarre prono, desde brazos estirados hasta la barbilla sobre la barra. Sin balanceo.",
  },
  {
    id: "pushups", cat: "fuerza", name: "Flexiones", unit: "reps", decimals: 0, base: 15, elite: 50,
    how: "Pecho a un puño del piso, cuerpo recto. Sin pausa arriba más de 2 s.",
  },
  {
    id: "deadHang", cat: "fuerza", name: "Colgarse de la barra", unit: "s", decimals: 0, base: 30, elite: 90,
    how: "Colgado con brazos estirados, agarre prono. Mide la resistencia del agarre.",
  },
  // Movilidad
  {
    id: "kneeToWall", cat: "movilidad", name: "Rodilla a la pared", unit: "cm", decimals: 1, base: 6, elite: 12,
    how: "Dorsiflexión de tobillo: distancia máxima del dedo gordo a la pared tocándola con la rodilla, sin levantar el talón. Lado más débil.",
  },
];

// Metas para mujeres [base, élite]. Las pruebas que no aparecen usan las mismas metas.
// Igual que las de arriba: referencias aproximadas, ajustables.
const FEMALE_TARGETS = {
  sprint10: [2.2, 1.8],
  sprint40: [6.3, 5.3],
  proAgility: [5.8, 4.8],
  test505: [3.0, 2.45],
  vertJump: [30, 52],
  broadJump: [160, 235],
  yoyo: [500, 1600],
  fhDistance: [22, 50],
  bhDistance: [25, 58],
  fhSpeed: [40, 80],
  nordic: [0, 6],
  copenhagen: [12, 50],
  pistol: [0, 8],
  calfRaise: [12, 30],
  sidePlank: [40, 100],
  pullups: [0, 8],
  pushups: [8, 35],
  deadHang: [20, 70],
};

for (const t of TESTS) {
  const f = FEMALE_TARGETS[t.id];
  t.targets = { m: { base: t.base, elite: t.elite }, f: f ? { base: f[0], elite: f[1] } : { base: t.base, elite: t.elite } };
  // Pruebas de aguantar tiempo: se pueden medir con el cronómetro de la app.
  t.timer = t.unit === "s" && t.cat === "fuerza";
}

export const TESTS_BY_ID = Object.fromEntries(TESTS.map((t) => [t.id, t]));
