// Cómo medir cada prueba, paso a paso: qué necesitas, los pasos y qué anotas en la app.
// Complementa el resumen corto de data/tests.js ("how"). Si una prueba no está aquí, se muestra solo el resumen.
//
// Regla para que tus mediciones sirvan: mídete siempre igual (mismo lugar, superficie, calzado,
// calentamiento y forma de cronometrar). Cambiar el método cambia el número aunque tú no hayas cambiado.

// Pruebas de ángulo: se miden con video (views/angle-video.js). La app detecta tu cuerpo, busca el
// momento de máximo rango y calcula el ángulo.
const METER = "Toca «Medir con video» (arriba). Celular quieto en el piso donde te indica, graba el movimiento y la app calcula el ángulo. Un video por lado.";
const HAND_TIMER = "Un compañero con el cronómetro del celular. Arranca cuando tu primer pie se despega del piso (no con la voz) y para cuando tu pecho cruza la línea. Siempre la misma persona, para que el error sea el mismo.";

export const PROTOCOLS = {
  // ---------- Velocidad ----------
  sprint10m: {
    need: ["Cinta métrica o 10 pasos largos medidos", "2 conos", "Un compañero con cronómetro"],
    steps: [
      "Calienta 10 min (trote, movilidad y 3 aceleraciones suaves).",
      "Pon un cono en la salida y otro a 10 m.",
      "Sal desde parado, en posición de 3 apoyos (una mano en el piso).",
      HAND_TIMER,
      "Haz 3 intentos con 2 min de descanso completo entre cada uno.",
    ],
    record: "El mejor de los 3 tiempos, en segundos (por ejemplo 1.85).",
  },
  sprint40m: {
    need: ["Cinta métrica", "2 conos", "Un compañero con cronómetro"],
    steps: [
      "Calienta 10 min y haz 2 aceleraciones de 30 m al 80 %.",
      "Conos en la salida y a 40 m.",
      "Sal desde parado, de pie o en 3 apoyos (siempre igual).",
      HAND_TIMER,
      "2 intentos con 3–4 min de descanso.",
    ],
    record: "El mejor tiempo, en segundos.",
  },
  // ---------- Cambio de dirección ----------
  proAgilityM: {
    need: ["3 conos en línea, separados 5 m (10 m entre los de las puntas)", "Un compañero con cronómetro"],
    steps: [
      "Ponte en el cono del centro, de lado, con las piernas a los dos lados de la línea.",
      "Corre 5 m hacia la derecha y toca la línea con la mano derecha.",
      "Corre 10 m hasta el otro extremo y toca la línea con la mano izquierda.",
      "Vuelve corriendo al centro: ahí se para el cronómetro.",
      "2 intentos saliendo hacia cada lado, con 2 min de descanso.",
    ],
    record: "El mejor tiempo, en segundos.",
  },
  test505: {
    need: ["Cinta métrica", "3 conos: salida, 10 m y 15 m", "Un compañero con cronómetro en el cono de 10 m"],
    steps: [
      "Sal desde el cono de salida y acelera fuerte.",
      "Cuando cruzas el cono de 10 m, tu compañero arranca el cronómetro.",
      "Frena en la línea de 15 m, gira 180° (pie en la línea) y vuelve.",
      "Al cruzar otra vez el cono de 10 m se para el cronómetro: mide solo 5 m de ida y 5 de vuelta.",
      "2 intentos girando sobre cada pie.",
    ],
    record: "El mejor tiempo, en segundos.",
  },
  reactiveAgility: {
    need: ["2 conos a 5 m a cada lado de una línea central", "Un compañero que sostenga el celular con la app abierta"],
    steps: [
      "Toca Iniciar en el cronómetro de esta prueba y dale el celular a tu compañero: lo sostiene frente a ti.",
      "Al aparecer la flecha, corre al cono de ese lado, tócalo y vuelve a la línea central.",
      "Tu compañero toca Parar cuando cruzas la línea.",
      "La app repite 6 veces con flechas al azar.",
    ],
    record: "La app calcula el promedio de las 6.",
  },
  // ---------- Potencia ----------
  vertJump: {
    need: ["Una pared alta", "Tiza, cinta o los dedos mojados para marcar", "Cinta métrica (o el botón de medir con video)"],
    steps: [
      "De lado a la pared, estira el brazo y marca tu alcance de pie.",
      "Baja rápido (contramovimiento) con impulso de brazos y salta lo más alto posible.",
      "Marca la pared en lo más alto del salto.",
      "Mide la distancia entre las dos marcas.",
      "3 intentos con 1 min de descanso.",
    ],
    record: "El mejor, en centímetros. También puedes usar «Medir con video».",
  },
  broadJump: {
    need: ["Una línea en el piso", "Cinta métrica"],
    steps: [
      "Pies juntos detrás de la línea.",
      "Balancea los brazos, baja y salta hacia adelante lo más lejos posible.",
      "Aterriza con los dos pies y quédate quieto: si te caes hacia atrás, no cuenta.",
      "Mide desde la línea hasta el talón que quedó más atrás.",
      "3 intentos.",
    ],
    record: "El mejor, en centímetros.",
  },
  // ---------- Resistencia ----------
  yoyo: {
    need: ["20 m medidos con conos y 5 m más detrás para la recuperación", "El audio del Yo-Yo IR1 (búscalo en YouTube o en una app)", "Parlante"],
    steps: [
      "Corre los 20 m de ida y vuelta siguiendo los pitidos.",
      "Después de cada ida y vuelta tienes 10 s de trote suave en la zona de 5 m.",
      "Los pitidos se aceleran cada nivel.",
      "Si no llegas a tiempo una vez, es aviso; la segunda vez termina la prueba.",
    ],
    record: "Distancia total en km (1600 m = 1.60). El audio o la app te la dice.",
  },
  rsa: {
    need: ["30 m medidos", "2 conos", "Un compañero con cronómetro"],
    steps: [
      "Calienta bien: es una prueba muy exigente.",
      "Toca Iniciar en el cronómetro de esta prueba: te avisa con sonido cada 20 s cuándo salir.",
      "Haz 6 sprints de 30 m al máximo; tu compañero anota cada tiempo.",
      "Entre sprints vuelves trotando a la salida dentro de los 20 s.",
    ],
    record: "Los 6 tiempos: la app saca el promedio y cuánto caes por fatiga.",
  },
  hrRecovery: {
    need: ["Reloj con pulso, o tus dedos en el cuello y un cronómetro"],
    steps: [
      "Haz esta prueba justo al terminar el Yo-Yo o los sprints repetidos.",
      "Toma tus pulsaciones apenas terminas (o cuenta 15 s y multiplica por 4).",
      "Quédate de pie, quieto, 60 s.",
      "Toma tus pulsaciones de nuevo.",
    ],
    record: "Cuántas pulsaciones bajaron en ese minuto (por ejemplo 180 → 145 = 35).",
  },
  // ---------- Lanzamiento ----------
  fhDistance: {
    need: ["Discos", "Cancha con líneas o cinta métrica", "Un compañero que marque dónde cae"],
    steps: [
      "Calienta el brazo con 5 min de pases.",
      "Lanza forehands al máximo con un vuelo que se pueda atrapar (los que se van de lado no cuentan).",
      "Tu compañero marca dónde toca el piso o dónde lo atrapa.",
      "Con viento, lanza en las dos direcciones y promedia.",
      "5 lanzamientos.",
    ],
    record: "El mejor, en metros.",
  },
  bhDistance: {
    need: ["Discos", "Cancha con líneas o cinta métrica", "Un compañero que marque dónde cae"],
    steps: [
      "Calienta el brazo con 5 min de pases.",
      "Lanza backhands al máximo con un vuelo que se pueda atrapar.",
      "Tu compañero marca dónde cae.",
      "Con viento, lanza en las dos direcciones y promedia.",
      "5 lanzamientos.",
    ],
    record: "El mejor, en metros.",
  },
  fhSpeed: {
    need: ["Un radar de velocidad o una app de radar en el celular"],
    steps: [
      "Pon el radar detrás de ti o detrás del receptor, alineado con el lanzamiento.",
      "Lanza forehands fuertes y planos.",
      "Anota la lectura de cada uno.",
      "5 lanzamientos.",
    ],
    record: "El más rápido, en km/h.",
  },
  throwAccuracy: {
    need: ["Discos (ojalá 10)", "Un cuadro de 2×2 m marcado con conos a 20 m, o un compañero quieto con los brazos abiertos"],
    steps: [
      "Párate a 20 m del objetivo.",
      "Lanza 10 forehands y 10 backhands, pivoteando como si tuvieras marca.",
      "Cuenta los que entran al cuadro a la altura del pecho (o que el compañero atrapa sin moverse).",
    ],
    record: "Cuántos entraron de los 20.",
  },
  // ---------- Fuerza ----------
  nordic: {
    need: ["Alguien que te sujete los tobillos, o un sofá o barra donde engancharlos", "Un cojín para las rodillas"],
    steps: [
      "De rodillas, cuerpo recto de las rodillas a la cabeza, tobillos sujetos.",
      "Déjate caer hacia adelante lo más lento posible, frenando con los isquiotibiales.",
      "Pon las manos solo al final para no golpearte.",
      "Vuelve a subir empujándote con las manos.",
      "Repite mientras la bajada siga siendo controlada.",
    ],
    record: "Cuántas repeticiones controlaste hasta el piso.",
  },
  copenhagen: {
    need: ["Un banco, silla o sofá a la altura de la rodilla", "Cronómetro (la app tiene uno)"],
    steps: [
      "De lado, apoyado en el antebrazo.",
      "Pon la pierna de arriba sobre el banco (a la altura de la rodilla es más fácil; en el tobillo, más difícil). Elige una y usa siempre la misma.",
      "Sube la cadera hasta que el cuerpo quede recto; la pierna de abajo cuelga o se pega a la de arriba.",
      "Aguanta hasta que la cadera baje.",
      "Haz los dos lados.",
    ],
    record: "Segundos de cada lado.",
  },
  pistol: {
    need: ["Un cajón, banco o silla baja (~45 cm)"],
    steps: [
      "De pie delante del cajón, sobre una pierna, la otra estirada adelante.",
      "Baja lento hasta tocar el cajón con los glúteos, sin dejarte caer ni apoyar el peso.",
      "Sube sin impulso. La rodilla apunta a los dedos del pie todo el tiempo.",
      "Cuenta hasta que la técnica se rompa (la rodilla se va hacia adentro o te dejas caer).",
      "Los dos lados.",
    ],
    record: "Repeticiones de cada lado.",
  },
  gluteBridge: {
    need: ["El piso"],
    steps: [
      "Boca arriba, rodillas dobladas, pies en el piso.",
      "Estira una pierna en el aire, alineada con el otro muslo.",
      "Sube la cadera hasta que hombros, cadera y rodilla queden en línea recta, y baja hasta rozar el piso.",
      "Ritmo constante, sin pausas largas, hasta que no puedas subir a la línea recta.",
      "Los dos lados.",
    ],
    record: "Repeticiones de cada lado.",
  },
  calfRaise: {
    need: ["Un escalón", "Una pared para apoyar un dedo (solo equilibrio)"],
    steps: [
      "De pie sobre un escalón, con un pie, el talón por fuera del borde.",
      "Baja el talón hasta abajo del todo y sube lo más alto posible.",
      "Ritmo de 1 s arriba y 1 s abajo.",
      "Cuenta hasta que no puedas subir del todo.",
      "Los dos lados.",
    ],
    record: "Repeticiones de cada lado.",
  },
  tibialisRaise: {
    need: ["Una pared"],
    steps: [
      "Espalda y glúteos apoyados en la pared, talones a unos 30 cm de ella.",
      "Sube las puntas de los pies lo más alto posible, dejando los talones en el piso.",
      "Bájalas controlado sin tocar el piso con fuerza.",
      "Cuenta hasta el fallo.",
    ],
    record: "Repeticiones.",
  },
  plank: {
    need: ["El piso", "Cronómetro (la app tiene uno)"],
    steps: [
      "Sobre antebrazos y puntas de pies, codos bajo los hombros.",
      "Cuerpo recto de la cabeza a los talones, glúteos y abdomen apretados.",
      "Aguanta. Termina cuando la cadera se cae o se sube y no la puedes corregir.",
    ],
    record: "Segundos.",
  },
  sidePlank: {
    need: ["El piso", "Cronómetro (la app tiene uno)"],
    steps: [
      "De lado, sobre un antebrazo, codo bajo el hombro, pies uno sobre otro.",
      "Sube la cadera hasta quedar recto.",
      "Aguanta hasta que la cadera baje.",
      "Los dos lados.",
    ],
    record: "Segundos de cada lado.",
  },
  sorensen: {
    need: ["Un banco o cama firme", "Alguien que te sujete las piernas (o un sofá debajo del cual engancharlas)", "Cronómetro"],
    steps: [
      "Boca abajo con la cadera justo en el borde del banco y el torso fuera.",
      "Que te sujeten las piernas.",
      "Brazos cruzados sobre el pecho, sube el torso hasta quedar horizontal.",
      "Aguanta hasta que el torso baje.",
    ],
    record: "Segundos.",
  },
  pullups: {
    need: ["Una barra"],
    steps: [
      "Agarre con las palmas hacia adelante, un poco más ancho que los hombros.",
      "Desde brazos totalmente estirados, sube hasta que la barbilla pase la barra.",
      "Sin balanceo ni patadas.",
      "Cuenta hasta que no puedas pasar la barbilla.",
    ],
    record: "Repeticiones completas.",
  },
  pushups: {
    need: ["El piso", "Un puño o un objeto de ~10 cm como referencia bajo el pecho"],
    steps: [
      "Manos un poco más anchas que los hombros, cuerpo recto.",
      "Baja hasta que el pecho quede a un puño del piso.",
      "Sube hasta estirar los brazos.",
      "Sin pausas de más de 2 s; cuenta hasta el fallo.",
    ],
    record: "Repeticiones completas.",
  },
  deadHang: {
    need: ["Una barra", "Cronómetro (la app tiene uno)"],
    steps: [
      "Agarre con las palmas hacia adelante, a la anchura de los hombros.",
      "Cuelga con los brazos estirados y los pies sin tocar el piso.",
      "Aguanta hasta que se te suelten las manos.",
    ],
    record: "Segundos.",
  },
  // ---------- Estabilidad ----------
  balanceEC: {
    need: ["Piso firme y descalzo", "Cronómetro (la app tiene uno)", "Algo cerca para agarrarte si pierdes el equilibrio"],
    steps: [
      "Párate en una pierna, manos en la cadera.",
      "Cierra los ojos y arranca el cronómetro.",
      "Termina cuando el otro pie toca el piso, abres los ojos o sacas las manos de la cadera.",
      "Mejor de 3 por lado.",
    ],
    record: "Segundos de cada lado.",
  },
  singleHop: {
    need: ["Una línea en el piso", "Cinta métrica"],
    steps: [
      "Sobre una pierna, punta del pie en la línea.",
      "Salta hacia adelante lo más lejos posible y aterriza en la MISMA pierna.",
      "Quédate quieto 2 s sin apoyar el otro pie: si no, no cuenta.",
      "Mide desde la línea hasta el talón.",
      "Mejor de 3 por lado.",
    ],
    record: "Centímetros de cada lado.",
  },
  // ---------- Movilidad ----------
  kneeToWall: {
    need: ["Una pared", "Cinta métrica o regla", "Descalzo"],
    steps: [
      "Arrodíllate con una rodilla en el piso y el pie de la otra pierna frente a la pared.",
      "Pon ese pie con el dedo gordo a unos 5 cm de la pared, apuntando derecho hacia ella.",
      "Lleva la rodilla hacia adelante hasta tocar la pared, SIN levantar el talón del piso.",
      "Si la tocas, aleja el pie 1 cm y repite. Si el talón se levanta o no llegas, acércalo.",
      "Busca la distancia más lejana a la que la rodilla aún toca la pared con el talón en el piso.",
      "Mide del dedo gordo a la pared. Los dos lados.",
    ],
    record: "Centímetros de cada lado (por ejemplo 9.5).",
  },
  aslr: {
    need: ["El piso", "Tu celular apoyado en el piso o en un trípode"],
    steps: [
      METER,
      "Boca arriba, las dos piernas estiradas.",
      "Sube una pierna estirada lo más alto posible sin ayuda de las manos; la otra queda pegada al piso.",
      "Mantén la rodilla estirada arriba.",
    ],
    record: "Grados de cada lado.",
  },
  hipIR: {
    need: ["Una mesa o cama alta", "Tu celular apoyado frente a ti, a la altura de las rodillas"],
    steps: [
      METER,
      "Sentado al borde de la mesa, rodillas dobladas a 90° y muslos quietos.",
      "Gira el pie hacia AFUERA, como un péndulo: la cadera rota hacia adentro. El muslo no se mueve.",
    ],
    record: "Grados de cada lado.",
  },
  thoracicRot: {
    need: ["El piso", "Tu celular apoyado en el piso o en un trípode"],
    steps: [
      METER,
      "En cuatro apoyos y siéntate sobre los talones: esto bloquea la zona lumbar.",
      "Pon una mano detrás de la cabeza.",
      "Gira ese codo hacia el techo lo más que puedas, sin despegar los glúteos de los talones.",
    ],
    record: "Grados de cada lado.",
  },
  shoulderER: {
    need: ["El piso", "Tu celular apoyado en el piso"],
    steps: [
      METER,
      "Boca arriba, brazo a 90° del cuerpo y codo doblado a 90° (la mano apunta al techo).",
      "Deja caer la mano hacia atrás, hacia la cabeza, sin arquear la espalda.",
    ],
    record: "Grados de cada lado.",
  },
  shoulderIR: {
    need: ["El piso", "Tu celular apoyado en el piso"],
    steps: [
      METER,
      "Misma posición: boca arriba, brazo a 90° y codo a 90°.",
      "Si puedes, que alguien te sujete el hombro contra el piso (para que no se levante).",
      "Deja caer la mano hacia adelante, hacia los pies, sin que el hombro se levante.",
    ],
    record: "Grados de cada lado.",
  },
};
