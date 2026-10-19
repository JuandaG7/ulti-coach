// Grupos musculares que califica la app.
// - importance: qué tanto pesa ese músculo en el rendimiento de ultimate (0–1).
// - tests: pruebas que lo califican y su peso relativo.
// - why: por qué importa en la cancha. drills: ejercicios para subirlo.

export const MUSCLES = {
  glutes: {
    name: "Glúteos", importance: 1,
    tests: { broadJump: 0.35, vertJump: 0.25, gluteBridge: 0.4 },
    why: "Son el motor de la aceleración y lo que frena tu cadera al plantar. Glúteos débiles = cortes lentos y rodillas que sufren.",
    drills: ["Hip thrust pesado 4×6", "Saltos largos 4×3", "Puente a una pierna 3×15"],
  },
  hamstrings: {
    name: "Isquiotibiales", importance: 1,
    tests: { nordic: 0.6, sprint10: 0.2, sprint40: 0.2 },
    why: "Producen la velocidad máxima y son la lesión más común en deportes de sprint. La fuerza excéntrica es tu seguro.",
    drills: ["Nordic curl 3×5", "Peso muerto rumano 3×8", "Sprints al 90 % 6×20 m"],
  },
  quads: {
    name: "Cuádriceps", importance: 0.9,
    tests: { vertJump: 0.35, broadJump: 0.25, pistol: 0.4 },
    why: "Absorben el frenado en cada cambio de dirección y empujan el primer paso.",
    drills: ["Sentadilla búlgara 3×8", "Frenadas en 3 pasos 5×4", "Sentadilla frontal 4×5"],
  },
  adductors: {
    name: "Aductores", importance: 0.9,
    tests: { copenhagen: 1 },
    why: "Estabilizan la pierna al plantar de lado y al pivotear amplio. Su debilidad predice lesiones de ingle.",
    drills: ["Plancha Copenhagen 3×20 s", "Sentadilla lateral 3×8", "Aducción con banda 3×15"],
  },
  calves: {
    name: "Pantorrillas", importance: 0.9,
    tests: { calfRaise: 0.6, kneeToWall: 0.4 },
    why: "Primer contacto en cada paso rápido: reaccionan al piso y protegen el tendón de Aquiles.",
    drills: ["Elevación a una pierna 3×15", "Saltos de pogo 3×20", "Movilidad de tobillo 2×10"],
  },
  obliques: {
    name: "Oblicuos", importance: 0.8,
    tests: { sidePlank: 1 },
    why: "Transfieren la rotación de la cadera al brazo en el lanzamiento y estabilizan el tronco al girar.",
    drills: ["Plancha lateral 3×40 s", "Pallof press 3×10", "Lanzamientos rotacionales con balón 3×8"],
  },
  abs: {
    name: "Abdomen", importance: 0.7,
    tests: { plank: 1 },
    why: "Un tronco rígido hace que la fuerza de las piernas llegue a la carrera y al disco sin fugas.",
    drills: ["Dead bug 3×10", "Plancha con desplazamiento 3×30 s", "Rueda abdominal 3×8"],
  },
  forearms: {
    name: "Antebrazos", importance: 0.7,
    tests: { deadHang: 0.6, fhSpeed: 0.4 },
    why: "Agarre del disco y el golpe de muñeca del forehand: ahí se genera el giro.",
    drills: ["Colgarse 3×40 s", "Flexión de muñeca con disco/pesa 3×15", "Snaps de forehand con toalla 3×20"],
  },
  lowerBack: {
    name: "Zona lumbar", importance: 0.6,
    tests: { sorensen: 1 },
    why: "Sostiene la postura baja de defensa y protege la espalda al frenar y en el layout.",
    drills: ["Hiperextensiones 3×12", "Bird dog 3×10", "Peso muerto rumano 3×8"],
  },
  upperBack: {
    name: "Espalda alta", importance: 0.5,
    tests: { pullups: 1 },
    why: "Equilibra el hombro que lanza y ayuda a desacelerar el brazo después de soltar.",
    drills: ["Dominadas 4×máx-2", "Remo invertido 3×10", "Face pulls 3×15"],
  },
  rearDelts: {
    name: "Deltoides posterior", importance: 0.5,
    tests: { pullups: 1 },
    why: "Frena el brazo después del lanzamiento: clave para lanzar mucho sin dolor de hombro.",
    drills: ["Face pulls 3×15", "Y-T-W en banco 2×10", "Rotación externa con banda 3×15"],
  },
  frontDelts: {
    name: "Deltoides frontal", importance: 0.5,
    tests: { pushups: 1 },
    why: "Acelera el brazo en el backhand y el hammer, y te protege al caer en un layout.",
    drills: ["Press militar 3×8", "Flexiones 3×máx", "Caídas de layout controladas"],
  },
  traps: {
    name: "Trapecio", importance: 0.4,
    tests: { pullups: 0.5, deadHang: 0.5 },
    why: "Estabiliza la escápula: el hombro lanza desde una base sólida.",
    drills: ["Encogimientos 3×12", "Paseo del granjero 3×30 m", "Y-T-W 2×10"],
  },
  chest: {
    name: "Pecho", importance: 0.4,
    tests: { pushups: 1 },
    why: "Aporta fuerza al cruce del backhand y protege en contactos y caídas.",
    drills: ["Flexiones 3×máx", "Press de banca 3×8", "Flexiones pliométricas 3×5"],
  },
  triceps: {
    name: "Tríceps", importance: 0.3,
    tests: { pushups: 1 },
    why: "Extiende el codo al final del forehand y del hammer.",
    drills: ["Fondos 3×10", "Flexiones diamante 3×10", "Extensión con banda 3×15"],
  },
  biceps: {
    name: "Bíceps", importance: 0.3,
    tests: { pullups: 1 },
    why: "Desacelera el codo al soltar el disco; protege el codo en volumen alto de lanzamientos.",
    drills: ["Dominadas supinas 3×8", "Curl martillo 3×12"],
  },
};

// Nombre del polígono SVG → grupo muscular de la app (cabeza, cuello y rodillas no se califican).
export const SVG_TO_MUSCLE = {
  gluteal: "glutes",
  hamstring: "hamstrings",
  quadriceps: "quads",
  adductor: "adductors",
  abductors: "adductors",
  calves: "calves",
  "left-soleus": "calves",
  "right-soleus": "calves",
  obliques: "obliques",
  abs: "abs",
  forearm: "forearms",
  "lower-back": "lowerBack",
  "upper-back": "upperBack",
  "back-deltoids": "rearDelts",
  "front-deltoids": "frontDelts",
  trapezius: "traps",
  chest: "chest",
  triceps: "triceps",
  biceps: "biceps",
};
