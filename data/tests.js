// Catálogo de pruebas físicas, orientado a lo que pide el ultimate.
// `base` = nivel de entrada (puntaje 0) y `elite` = nivel Excelente (puntaje 100).
// Casi no hay normas publicadas de ultimate: las metas vienen de deportes de campo
// parecidos (fútbol, rugby, fútbol americano) o son estimaciones. Ajústalas aquí.
// Para pruebas de tiempo, elite < base (menos es mejor); el cálculo lo maneja solo.
//
// kind: "single" (un valor), "bilateral" (izquierda y derecha: cuenta el lado débil
//        y se mide la asimetría), "multi" (varias repeticiones: cuenta el promedio).
// timer: "hold" (aguantar), "reactive" (flecha al azar), "interval" (sprints con descanso).

export const CATEGORIES = [
  { id: "velocidad", name: "Velocidad", blurb: "Ganarle a tu marca en los primeros pasos y en el huck." },
  { id: "agilidad", name: "Cambio de dirección", blurb: "Frenar, plantar y salir, también reaccionando a tu marca." },
  { id: "potencia", name: "Potencia", blurb: "Saltar más alto en el layout y en la pelea por el disco." },
  { id: "resistencia", name: "Resistencia", blurb: "Cortar igual de fuerte en el punto 15, y recuperarte entre puntos." },
  { id: "lanzamiento", name: "Lanzamiento", blurb: "Distancia, velocidad y precisión del disco." },
  { id: "fuerza", name: "Fuerza", blurb: "Músculos que protegen y producen cada movimiento." },
  { id: "estabilidad", name: "Estabilidad y control", blurb: "Aterrizar y frenar en una pierna sin que la rodilla o el tobillo cedan." },
  { id: "movilidad", name: "Movilidad", blurb: "Rango para frenar bajo, pivotear amplio y lanzar sin dolor." },
];

const INCLINE = " Mide el ángulo con la app Medidas del iPhone (pestaña Nivel) apoyada en el segmento.";

export const TESTS = [
  // ---------- Velocidad ----------
  {
    id: "sprint10m", cat: "velocidad", name: "Sprint 10 m", unit: "s", decimals: 2, base: 2.15, elite: 1.7,
    how: "Desde parado en posición de 3 apoyos, 10 m. Mejor de 3 intentos con 2 min de descanso. Mide el primer paso: ganarle a tu marca en el corte.",
  },
  {
    id: "sprint40m", cat: "velocidad", name: "Sprint 40 m", unit: "s", decimals: 2, base: 6.1, elite: 5.0,
    how: "Desde parado, 40 m. Mejor de 2 intentos con descanso completo. Mide la velocidad máxima: el corte profundo y la defensa del huck.",
  },
  // ---------- Cambio de dirección ----------
  {
    id: "proAgilityM", cat: "agilidad", name: "5-10-5 m", unit: "s", decimals: 2, base: 5.7, elite: 4.7,
    how: "Tres conos en línea separados 5 m. Sales del centro, 5 m a un lado, 10 m al otro, 5 m de vuelta al centro. Toca la línea con la mano. Mejor de cada lado.",
  },
  {
    id: "test505", cat: "agilidad", name: "Test 505", unit: "s", decimals: 2, base: 2.8, elite: 2.2,
    how: "Corres 15 m de impulso; se cronometra desde la marca de 10 m, frenas y giras 180° en la marca de 15 m y vuelves a la de 10 m. Mide tu frenado y re-aceleración.",
  },
  {
    id: "reactiveAgility", cat: "agilidad", name: "Agilidad reactiva", unit: "s", decimals: 2, base: 3.1, elite: 2.35,
    kind: "multi", reps: 6, timer: "reactive",
    how: "Un cono a 5 m a cada lado. Un compañero sostiene el celular: la app muestra una flecha al azar, corres a ese cono, lo tocas y vuelves a la línea; tu compañero toca Parar. 6 repeticiones, cuenta el promedio. Como en la cancha: reaccionas, no sabes a dónde vas.",
  },
  // ---------- Potencia ----------
  {
    id: "vertJump", cat: "potencia", name: "Salto vertical", unit: "cm", decimals: 0, base: 40, elite: 70,
    how: "Contramovimiento con brazos, desde parado. Marca tu alcance de pie y la marca más alta en la pared. Mejor de 3.",
  },
  {
    id: "broadJump", cat: "potencia", name: "Salto largo", unit: "cm", decimals: 0, base: 200, elite: 290,
    how: "Pies juntos, salto horizontal con brazos. Mide desde la línea hasta el talón más atrasado. Mejor de 3.",
  },
  // ---------- Resistencia ----------
  {
    id: "yoyo", cat: "resistencia", name: "Yo-Yo IR1", unit: "km", decimals: 2, base: 0.8, elite: 2.4,
    how: "Ida y vuelta de 20 m con pitidos que aceleran y 10 s de recuperación activa. Anota la distancia total en km al fallar dos veces (por ejemplo, 1600 m = 1.60 km).",
  },
  {
    id: "rsa", cat: "resistencia", name: "Sprints repetidos (6×30 m)", unit: "s", decimals: 2, base: 5.3, elite: 4.3,
    kind: "multi", reps: 6, timer: "interval", rest: 20,
    how: "6 sprints de 30 m, saliendo cada 20 s (la app cuenta el descanso). Cuenta el promedio; la app también te dice cuánto caes por fatiga. Es lo más parecido a un punto largo de ultimate.",
  },
  {
    id: "hrRecovery", cat: "resistencia", name: "Recuperación cardíaca", unit: "lpm", decimals: 0, base: 20, elite: 50,
    how: "Justo al terminar un esfuerzo máximo (Yo-Yo o sprints repetidos), toma tus pulsaciones (reloj o 15 s × 4). Quédate de pie 60 s y vuelve a tomarlas. Anota cuántas bajaron: más es mejor, significa que te recuperas rápido entre puntos.",
  },
  // ---------- Lanzamiento ----------
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
  {
    id: "throwAccuracy", cat: "lanzamiento", name: "Precisión a 20 m", unit: "de 20", decimals: 0, base: 8, elite: 18,
    how: "Marca un cuadro de 2×2 m a 20 m (o un compañero quieto con los brazos abiertos). 10 forehands y 10 backhands con pivot, como si tuvieras marca. Cuenta los que entran al cuadro a la altura del pecho.",
  },
  // ---------- Fuerza ----------
  {
    id: "nordic", cat: "fuerza", name: "Nordic curl", unit: "reps", decimals: 0, base: 1, elite: 10,
    how: "De rodillas con los tobillos sujetos, baja controlando con isquiotibiales. Cuenta repeticiones con bajada controlada hasta el piso.",
  },
  {
    id: "copenhagen", cat: "fuerza", name: "Plancha Copenhagen", unit: "s", decimals: 0, base: 15, elite: 60, kind: "bilateral",
    how: "Plancha lateral con la pierna de arriba apoyada en un banco (a la altura de la rodilla o el tobillo). Mide cada lado.",
  },
  {
    id: "pistol", cat: "fuerza", name: "Sentadilla a una pierna", unit: "reps", decimals: 0, base: 1, elite: 10, kind: "bilateral",
    how: "Sentadilla a una pierna hasta un banco o cajón bajo, sin apoyar el peso. La rodilla debe ir alineada con el pie, sin irse hacia adentro. Cada lado.",
  },
  {
    id: "gluteBridge", cat: "fuerza", name: "Puente de glúteo a una pierna", unit: "reps", decimals: 0, base: 15, elite: 35, kind: "bilateral",
    how: "Hombros en el piso, una pierna estirada. Sube la cadera hasta la línea recta. Hasta el fallo, cada lado.",
  },
  {
    id: "calfRaise", cat: "fuerza", name: "Elevación de talón a una pierna", unit: "reps", decimals: 0, base: 15, elite: 35, kind: "bilateral",
    how: "En un escalón, rango completo y ritmo de 1 s arriba / 1 s abajo. Hasta el fallo, cada lado.",
  },
  {
    id: "tibialisRaise", cat: "fuerza", name: "Elevación de tibial", unit: "reps", decimals: 0, base: 15, elite: 40,
    how: "Espalda contra la pared, talones a unos 30 cm. Sube las puntas de los pies lo más alto posible y baja controlado. Hasta el fallo. Fortalece el frente de la pierna y protege tobillo y rodilla.",
  },
  {
    id: "plank", cat: "fuerza", name: "Plancha frontal", unit: "s", decimals: 0, base: 60, elite: 180,
    how: "Sobre antebrazos, cuerpo recto. Termina cuando se cae la cadera.",
  },
  {
    id: "sidePlank", cat: "fuerza", name: "Plancha lateral", unit: "s", decimals: 0, base: 45, elite: 120, kind: "bilateral",
    how: "Sobre un antebrazo, cuerpo recto. Mide cada lado.",
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
  // ---------- Estabilidad y control ----------
  {
    id: "balanceEC", cat: "estabilidad", name: "Equilibrio ojos cerrados", unit: "s", decimals: 0, base: 10, elite: 40, kind: "bilateral",
    how: "Descalzo, en una pierna, manos en la cadera, ojos cerrados. Para cuando la otra pierna toca el piso o abres los ojos. Cada lado. Es la mejor alarma de un tobillo que no se recuperó del todo.",
  },
  {
    id: "singleHop", cat: "estabilidad", name: "Salto a una pierna", unit: "cm", decimals: 0, base: 120, elite: 200, kind: "bilateral",
    how: "Desde una pierna, salta hacia adelante lo más lejos posible y aterriza en la misma pierna, quieto 2 s. Mejor de 3 por lado. Una diferencia de más del 10 % entre piernas es bandera roja.",
  },
  // ---------- Movilidad ----------
  {
    id: "kneeToWall", cat: "movilidad", name: "Rodilla a la pared (tobillo)", unit: "cm", decimals: 1, base: 6, elite: 12, kind: "bilateral",
    how: "Dorsiflexión de tobillo: distancia máxima del dedo gordo a la pared tocándola con la rodilla, sin levantar el talón. Cada lado.",
  },
  {
    id: "aslr", cat: "movilidad", name: "Pierna estirada activa", unit: "°", decimals: 0, base: 60, elite: 90, kind: "bilateral",
    how: "Boca arriba, sube una pierna estirada sin ayuda, con la otra pegada al piso." + INCLINE + " (En la espinilla.) Cada lado.",
  },
  {
    id: "hipIR", cat: "movilidad", name: "Rotación interna de cadera", unit: "°", decimals: 0, base: 25, elite: 45, kind: "bilateral",
    how: "Sentado al borde de una mesa, rodillas a 90°. Gira el pie hacia afuera (la cadera rota hacia adentro) sin mover el muslo." + INCLINE + " (En la espinilla, desde la vertical.) Cada lado.",
  },
  {
    id: "thoracicRot", cat: "movilidad", name: "Rotación torácica", unit: "°", decimals: 0, base: 35, elite: 55, kind: "bilateral",
    how: "En cuatro apoyos, siéntate sobre los talones (bloquea la zona lumbar), una mano detrás de la cabeza y gira el codo hacia el techo." + INCLINE + " (Entre los hombros.) Cada lado. Clave para la potencia del lanzamiento.",
  },
  {
    id: "shoulderER", cat: "movilidad", name: "Rotación externa de hombro", unit: "°", decimals: 0, base: 80, elite: 105, kind: "bilateral",
    how: "Boca arriba, brazo a 90° del cuerpo y codo a 90°. Deja caer la mano hacia atrás sin arquear la espalda." + INCLINE + " (En el antebrazo.) Cada lado.",
  },
  {
    id: "shoulderIR", cat: "movilidad", name: "Rotación interna de hombro", unit: "°", decimals: 0, base: 40, elite: 65, kind: "bilateral",
    how: "Igual posición, pero la mano cae hacia adelante (hacia los pies) sin que el hombro se levante del piso." + INCLINE + " Cada lado. Si el brazo que lanza tiene 20° menos que el otro, es un riesgo conocido de lesión en lanzadores.",
  },
];

// Metas para mujeres [base, élite]. Las pruebas que no aparecen usan las mismas metas.
// Igual que las de arriba: referencias aproximadas, ajustables.
const FEMALE_TARGETS = {
  sprint10m: [2.4, 1.95],
  sprint40m: [6.9, 5.7],
  proAgilityM: [6.3, 5.2],
  test505: [3.0, 2.45],
  reactiveAgility: [3.4, 2.6],
  vertJump: [30, 52],
  broadJump: [160, 235],
  yoyo: [0.5, 1.6],
  rsa: [5.9, 4.8],
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
  singleHop: [100, 165],
};

for (const t of TESTS) {
  const f = FEMALE_TARGETS[t.id];
  t.kind ??= "single";
  t.targets = { m: { base: t.base, elite: t.elite }, f: f ? { base: f[0], elite: f[1] } : { base: t.base, elite: t.elite } };
  // Pruebas de aguantar tiempo: se pueden medir con el cronómetro de la app.
  if (!t.timer && t.unit === "s" && ["fuerza", "estabilidad"].includes(t.cat)) t.timer = "hold";
}

// Búsqueda de video en YouTube para ver cómo se hace cada prueba.
const VIDEO_QUERIES = {
  sprint10m: "sprint 10 metros salida test técnica",
  sprint40m: "sprint 40 metros test velocidad",
  proAgilityM: "5-10-5 pro agility drill technique",
  test505: "505 agility test",
  reactiveAgility: "reactive agility drill partner pointing",
  vertJump: "salto vertical contramovimiento test pared",
  broadJump: "standing broad jump test technique",
  yoyo: "Yo-Yo intermittent recovery test level 1",
  rsa: "repeated sprint ability test 6x30m",
  hrRecovery: "heart rate recovery 1 minute test",
  fhDistance: "ultimate frisbee forehand huck technique",
  bhDistance: "ultimate frisbee backhand huck technique",
  fhSpeed: "ultimate frisbee forehand flick technique",
  throwAccuracy: "ultimate frisbee throwing accuracy drill",
  nordic: "nordic hamstring curl técnica",
  copenhagen: "copenhagen plank adductor",
  pistol: "single leg box squat técnica",
  gluteBridge: "single leg glute bridge técnica",
  calfRaise: "single leg calf raise test",
  tibialisRaise: "tibialis raise wall",
  plank: "plancha abdominal técnica correcta",
  sidePlank: "plancha lateral técnica correcta",
  sorensen: "Biering Sorensen test",
  pullups: "dominadas técnica correcta",
  pushups: "flexiones técnica correcta",
  deadHang: "dead hang barra técnica",
  balanceEC: "single leg balance eyes closed test",
  singleHop: "single leg hop test distance",
  kneeToWall: "knee to wall test dorsiflexion",
  aslr: "active straight leg raise test",
  hipIR: "seated hip internal rotation test",
  thoracicRot: "quadruped thoracic rotation test lumbar locked",
  shoulderER: "shoulder external rotation range of motion supine test",
  shoulderIR: "shoulder internal rotation range of motion supine GIRD",
};
for (const t of TESTS) t.video = VIDEO_QUERIES[t.id] ?? `${t.name} prueba técnica`;

export const TESTS_BY_ID = Object.fromEntries(TESTS.map((t) => [t.id, t]));

// Valor que cuenta para el puntaje a partir de lo registrado.
export function entryValue(test, { sides, reps }) {
  if (test.kind === "bilateral") return Math.min(sides.L, sides.R);
  if (test.kind === "multi") return reps.reduce((a, b) => a + b, 0) / reps.length;
  return null;
}
