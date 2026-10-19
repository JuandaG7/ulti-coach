// Grupos musculares que califica la app.
// - importance: qué tanto pesa ese músculo en el rendimiento de ultimate (0–1).
// - tests: pruebas que lo califican y su peso relativo.
// - why: por qué importa en la cancha.
// - drills: ejercicios para subirlo, en versión gimnasio y sin equipo (casa).

export const MUSCLES = {
  glutes: {
    name: "Glúteos", importance: 1,
    tests: { broadJump: 0.35, vertJump: 0.25, gluteBridge: 0.4 },
    why: "Son el motor de la aceleración y lo que frena tu cadera al plantar. Glúteos débiles = cortes lentos y rodillas que sufren.",
    drills: {
      gym: ["Hip thrust con barra 4×6", "Peso muerto trap bar 4×5", "Saltos largos 4×3"],
      casa: ["Puente a una pierna 3×15", "Hip thrust a una pierna en sofá 3×12", "Saltos largos 4×3"],
    },
  },
  hamstrings: {
    name: "Isquiotibiales", importance: 1,
    tests: { nordic: 0.6, sprint10m: 0.2, sprint40m: 0.2 },
    why: "Producen la velocidad máxima y son la lesión más común en deportes de sprint. La fuerza excéntrica es tu seguro.",
    drills: {
      gym: ["Peso muerto rumano 3×8", "Nordic curl 3×5", "Curl femoral en máquina 3×10"],
      casa: ["Nordic curl 3×5", "Puente con talones en silla 3×12", "Sprints al 90 % 6×20 m"],
    },
  },
  quads: {
    name: "Cuádriceps", importance: 0.9,
    tests: { vertJump: 0.35, broadJump: 0.25, pistol: 0.4 },
    why: "Absorben el frenado en cada cambio de dirección y empujan el primer paso.",
    drills: {
      gym: ["Sentadilla frontal 4×5", "Sentadilla búlgara con mancuernas 3×8", "Frenadas en 3 pasos 5×4"],
      casa: ["Sentadilla búlgara 3×12", "Sentadilla a una pierna a cajón 3×6", "Frenadas en 3 pasos 5×4"],
    },
  },
  adductors: {
    name: "Aductores", importance: 0.9,
    tests: { copenhagen: 1 },
    why: "Estabilizan la pierna al plantar de lado y al pivotear amplio. Su debilidad predice lesiones de ingle.",
    drills: {
      gym: ["Aducción en máquina 3×12", "Sentadilla lateral con pesa 3×8", "Plancha Copenhagen 3×20 s"],
      casa: ["Plancha Copenhagen 3×20 s", "Sentadilla Cossack 3×8", "Aducción con banda 3×15"],
    },
  },
  calves: {
    name: "Pantorrillas", importance: 0.9,
    tests: { calfRaise: 0.5, kneeToWall: 0.3, tibialisRaise: 0.2 },
    why: "Primer contacto en cada paso rápido: reaccionan al piso y protegen el tendón de Aquiles.",
    drills: {
      gym: ["Elevación de talón con peso 4×10", "Elevación sentado (sóleo) 3×12", "Saltos de pogo 3×20"],
      casa: ["Elevación a una pierna 3×15", "Saltos de pogo 3×20", "Movilidad de tobillo 2×10"],
    },
  },
  obliques: {
    name: "Oblicuos", importance: 0.8,
    tests: { sidePlank: 1 },
    why: "Transfieren la rotación de la cadera al brazo en el lanzamiento y estabilizan el tronco al girar.",
    drills: {
      gym: ["Pallof press en polea 3×10", "Lanzamiento rotacional con balón medicinal 3×8", "Plancha lateral 3×40 s"],
      casa: ["Plancha lateral 3×40 s", "Pallof press con banda 3×10", "Rotación rusa 3×12"],
    },
  },
  abs: {
    name: "Abdomen", importance: 0.7,
    tests: { plank: 1 },
    why: "Un tronco rígido hace que la fuerza de las piernas llegue a la carrera y al disco sin fugas.",
    drills: {
      gym: ["Rueda abdominal 3×8", "Elevación de piernas colgado 3×10", "Dead bug con peso 3×10"],
      casa: ["Dead bug 3×10", "Plancha con desplazamiento 3×30 s", "Hollow hold 3×20 s"],
    },
  },
  forearms: {
    name: "Antebrazos", importance: 0.7,
    tests: { deadHang: 0.6, fhSpeed: 0.4 },
    why: "Agarre del disco y el golpe de muñeca del forehand: ahí se genera el giro.",
    drills: {
      gym: ["Paseo del granjero 3×30 m", "Curl de muñeca con barra 3×15", "Colgarse 3×40 s"],
      casa: ["Colgarse 3×40 s", "Snaps de forehand con toalla 3×20", "Flexión de muñeca con botella 3×15"],
    },
  },
  lowerBack: {
    name: "Zona lumbar", importance: 0.6,
    tests: { sorensen: 1 },
    why: "Sostiene la postura baja de defensa y protege la espalda al frenar y en el layout.",
    drills: {
      gym: ["Hiperextensiones con peso 3×12", "Peso muerto rumano 3×8", "Bird dog 3×10"],
      casa: ["Superman 3×12", "Bird dog 3×10", "Puente 3×15"],
    },
  },
  upperBack: {
    name: "Espalda alta", importance: 0.5,
    tests: { pullups: 1 },
    why: "Equilibra el hombro que lanza y ayuda a desacelerar el brazo después de soltar.",
    drills: {
      gym: ["Dominadas lastradas 4×5", "Remo con mancuerna 3×10", "Face pulls 3×15"],
      casa: ["Dominadas 4×máx-2", "Remo invertido bajo una mesa 3×10", "Y-T-W en el piso 2×10"],
    },
  },
  rearDelts: {
    name: "Deltoides posterior", importance: 0.5,
    tests: { pullups: 1 },
    why: "Frena el brazo después del lanzamiento: clave para lanzar mucho sin dolor de hombro.",
    drills: {
      gym: ["Face pulls 3×15", "Pájaros con mancuerna 3×12", "Rotación externa en polea 3×15"],
      casa: ["Rotación externa con banda 3×15", "Y-T-W en el piso 2×10", "Face pulls con banda 3×15"],
    },
  },
  frontDelts: {
    name: "Deltoides frontal", importance: 0.5,
    tests: { pushups: 1 },
    why: "Acelera el brazo en el backhand y el hammer, y te protege al caer en un layout.",
    drills: {
      gym: ["Press militar 3×8", "Press inclinado con mancuernas 3×10"],
      casa: ["Flexiones pica 3×8", "Flexiones 3×máx", "Caídas de layout controladas"],
    },
  },
  traps: {
    name: "Trapecio", importance: 0.4,
    tests: { pullups: 0.5, deadHang: 0.5 },
    why: "Estabiliza la escápula: el hombro lanza desde una base sólida.",
    drills: {
      gym: ["Encogimientos con barra 3×12", "Paseo del granjero 3×30 m"],
      casa: ["Y-T-W en el piso 2×10", "Colgarse activo (escápulas abajo) 3×20 s"],
    },
  },
  chest: {
    name: "Pecho", importance: 0.4,
    tests: { pushups: 1 },
    why: "Aporta fuerza al cruce del backhand y protege en contactos y caídas.",
    drills: {
      gym: ["Press de banca 3×8", "Flexiones pliométricas 3×5"],
      casa: ["Flexiones 3×máx", "Flexiones pliométricas 3×5", "Flexiones con pies elevados 3×10"],
    },
  },
  triceps: {
    name: "Tríceps", importance: 0.3,
    tests: { pushups: 1 },
    why: "Extiende el codo al final del forehand y del hammer.",
    drills: {
      gym: ["Fondos lastrados 3×8", "Extensión en polea 3×12"],
      casa: ["Fondos en silla 3×12", "Flexiones diamante 3×10"],
    },
  },
  biceps: {
    name: "Bíceps", importance: 0.3,
    tests: { pullups: 1 },
    why: "Desacelera el codo al soltar el disco; protege el codo en volumen alto de lanzamientos.",
    drills: {
      gym: ["Curl martillo 3×12", "Dominadas supinas 3×8"],
      casa: ["Dominadas supinas 3×8", "Curl con mochila 3×12"],
    },
  },
};

// Ajuste de prioridad según posición: sube la importancia de lo que más usa cada rol.
export const POSITION_BONUS = {
  handler: { forearms: 0.25, obliques: 0.15, rearDelts: 0.1 },
  cutter: { hamstrings: 0.15, calves: 0.15, adductors: 0.1, glutes: 0.1 },
  hibrido: {},
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
