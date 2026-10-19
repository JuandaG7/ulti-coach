// Zonas de "blindaje": las articulaciones y zonas que más se lesionan en ultimate.
// Cada zona se califica en tres partes:
// - rango: movilidad (¿llegas a la posición?)
// - fuerza: fuerza y control en ese rango (¿la aguantas y la controlas?)
// - simetria: diferencia izquierda/derecha en las pruebas bilaterales (¿un lado es el eslabón débil?)
// Los ejercicios son de prevención (prehab), en versión gimnasio y casa.

export const DIMENSIONS = {
  rango: "Rango",
  fuerza: "Fuerza y control",
  simetria: "Simetría",
};

export const JOINTS = {
  ankle: {
    name: "Tobillo", importance: 1,
    rango: { kneeToWall: 1 },
    fuerza: { calfRaise: 0.35, balanceEC: 0.35, tibialisRaise: 0.3 },
    simetria: ["kneeToWall", "calfRaise", "balanceEC", "singleHop"],
    why: "El esguince de tobillo es de las lesiones más comunes en ultimate, y el mayor factor de riesgo es haber tenido uno antes. Equilibrio, fuerza de pantorrilla y tibial, y buena movilidad reducen las recaídas.",
    drills: {
      gym: ["Elevación de talón con peso a una pierna 3×10", "Equilibrio a una pierna sobre cojín 3×30 s", "Saltos laterales a una pierna, aterrizaje quieto 3×6"],
      casa: ["Equilibrio a una pierna ojos cerrados 3×30 s", "Elevación de tibial 3×20", "Saltos laterales a una pierna, aterrizaje quieto 3×6", "Movilidad rodilla a la pared 2×10"],
    },
  },
  knee: {
    name: "Rodilla", importance: 1,
    rango: {},
    fuerza: { pistol: 0.35, singleHop: 0.35, test505: 0.15, tibialisRaise: 0.15 },
    simetria: ["pistol", "singleHop"],
    why: "Cada frenada y cada corte cargan la rodilla. Lo que más la protege es aterrizar y frenar con la rodilla alineada (sin irse hacia adentro) y tener las dos piernas parejas.",
    drills: {
      gym: ["Sentadilla búlgara 3×8", "Extensión de rodilla lenta 3×12", "Aterrizajes a una pierna desde cajón 3×5"],
      casa: ["Step-down excéntrico (bajar en 3 s) 3×10", "Split squat con rodilla pasando la punta 3×8", "Aterrizajes a una pierna, quieto 2 s 3×6"],
    },
  },
  hipGroin: {
    name: "Cadera e ingle", importance: 0.9,
    rango: { hipIR: 0.5, aslr: 0.5 },
    fuerza: { copenhagen: 0.6, gluteBridge: 0.4 },
    simetria: ["hipIR", "copenhagen", "gluteBridge", "aslr"],
    why: "Los cambios de dirección y el pivot amplio estiran la ingle bajo carga. Aductores fuertes (Copenhagen) y cadera móvil son la mejor prevención de pubalgia y desgarros de aductor.",
    drills: {
      gym: ["Plancha Copenhagen 3×20 s por lado", "Aducción en máquina 3×12", "Hip airplanes 2×5 por lado"],
      casa: ["Plancha Copenhagen 3×20 s por lado", "Rotaciones 90/90 2×8", "Sentadilla Cossack 3×8"],
    },
  },
  hamstring: {
    name: "Isquiotibiales", importance: 1,
    rango: { aslr: 1 },
    fuerza: { nordic: 0.7, sprint40m: 0.3 },
    simetria: ["aslr"],
    why: "El desgarro de isquios es la lesión clásica del sprint. El Nordic curl tiene de las mejores evidencias en prevención de lesiones deportivas: pocas series a la semana bastan.",
    drills: {
      gym: ["Nordic curl 3×5", "Peso muerto rumano 3×8", "Sprints progresivos al 90 % 6×30 m"],
      casa: ["Nordic curl 3×5", "Puente con talones en silla a una pierna 3×10", "Sprints progresivos al 90 % 6×30 m"],
    },
  },
  shoulder: {
    name: "Hombro que lanza", importance: 0.8,
    rango: { shoulderIR: 0.4, shoulderER: 0.4, thoracicRot: 0.2 },
    fuerza: { pullups: 0.5, deadHang: 0.3, pushups: 0.2 },
    simetria: ["shoulderIR", "shoulderER"],
    why: "Cientos de lanzamientos por torneo. El hombro que lanza tiende a perder rotación interna, y eso sobrecarga el hombro y el codo. Fuerza de la espalda alta y rotadores lo frenan.",
    drills: {
      gym: ["Rotación externa en polea a 90° 3×12", "Face pulls 3×15", "Remo con mancuerna 3×10"],
      casa: ["Rotación externa con banda a 90° 3×15", "Y-T-W en el piso 2×10", "Estiramiento cruzado del hombro 2×30 s"],
    },
  },
  lowerBack: {
    name: "Espalda baja", importance: 0.7,
    rango: { thoracicRot: 1 },
    fuerza: { sorensen: 0.5, sidePlank: 0.25, plank: 0.25 },
    simetria: ["sidePlank", "thoracicRot"],
    why: "Postura baja en defensa, frenadas y layouts. Si la espalda alta no rota, la zona lumbar compensa; resistencia del tronco y rotación torácica la protegen.",
    drills: {
      gym: ["Hiperextensiones 3×12", "Pallof press en polea 3×10", "Paseo del granjero a una mano 3×30 m"],
      casa: ["Bird dog 3×10", "Curl-up de McGill 3×8", "Plancha lateral 3×30 s", "Rotación torácica en 4 apoyos 2×10"],
    },
  },
};

export const SIDES = { L: "Izquierda", R: "Derecha", both: "Ambos lados" };
