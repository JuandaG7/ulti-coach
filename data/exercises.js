// Instrucciones cortas por ejercicio: posición, movimiento y error común.
// Cada ejercicio de la app ("Nordic curl 3×5") se busca aquí por el prefijo más largo que coincida,
// así "Dominadas lastradas 4×5" usa "Dominadas lastradas" si existe, o si no "Dominadas".

export const EXERCISES = {
  "Aducción con banda": {
    pos: "Banda atada a un poste a la altura del tobillo, de lado, con la pierna más cercana dentro de la banda.",
    mov: "Lleva la pierna hacia la otra cruzando por delante y vuelve lento en 2–3 s.",
    error: "Inclinar el tronco para ayudarte: el movimiento sale solo de la cadera.",
  },
  "Aducción en máquina": {
    pos: "Sentado en la máquina, espalda apoyada, almohadillas por dentro de las rodillas.",
    mov: "Junta las piernas con fuerza y abre lento en 3 s.",
    error: "Dejar que el peso te abra de golpe: la parte lenta es la que protege la ingle.",
  },
  "Aterrizajes a una pierna": {
    pos: "De pie sobre un cajón bajo (20–30 cm) o en el piso.",
    mov: "Déjate caer o salta y aterriza en una pierna, rodilla flexionada, y quédate quieto 2 s.",
    error: "Que la rodilla se vaya hacia adentro: debe apuntar a los dedos del pie.",
  },
  "Bird dog": {
    pos: "En cuatro apoyos, manos bajo los hombros, rodillas bajo la cadera, espalda neutra.",
    mov: "Estira el brazo y la pierna contrarios hasta la línea del cuerpo, pausa 2 s y vuelve.",
    error: "Girar la cadera o arquear la espalda baja; imagina un vaso de agua sobre la espalda.",
  },
  "Caídas de layout controladas": {
    pos: "Sobre pasto o colchoneta, de rodillas o agachado, brazos adelante.",
    mov: "Cae hacia adelante y de lado, primero el antebrazo y luego el costado del cuerpo, deslizando.",
    error: "Frenar con las manos y el brazo recto: así se lesionan muñeca y hombro.",
  },
  "Colgarse activo": {
    pos: "Colgado de la barra con brazos estirados.",
    mov: "Baja los hombros lejos de las orejas sin doblar los codos y aguanta.",
    error: "Quedarte 'colgado de los ligamentos' con los hombros pegados a las orejas.",
  },
  "Colgarse": {
    pos: "Agarre prono en la barra, a la anchura de los hombros.",
    mov: "Cuelga con los brazos estirados y el cuerpo quieto el tiempo indicado.",
    error: "Balancearte: el trabajo es de agarre y hombros, no de inercia.",
  },
  "Curl con mochila": {
    pos: "De pie, mochila con peso agarrada por las asas, codos pegados al cuerpo.",
    mov: "Sube doblando los codos y baja lento en 3 s.",
    error: "Mover los codos hacia adelante o balancear el cuerpo.",
  },
  "Curl martillo": {
    pos: "De pie, mancuernas a los lados con las palmas mirándose.",
    mov: "Sube doblando el codo sin girar la muñeca y baja lento.",
    error: "Balancear el tronco para subir el peso.",
  },
  "Curl de muñeca con barra": {
    pos: "Sentado, antebrazos sobre los muslos, palmas hacia arriba, muñecas fuera de las rodillas.",
    mov: "Sube la barra solo con la muñeca y baja lento hasta abajo del todo.",
    error: "Mover los antebrazos: solo trabaja la muñeca.",
  },
  "Flexión de muñeca con botella": {
    pos: "Antebrazo apoyado en una mesa, mano fuera del borde con una botella llena.",
    mov: "Sube y baja la botella solo con la muñeca, rango completo.",
    error: "Hacerlo rápido: lento y controlado fortalece el golpe de muñeca del forehand.",
  },
  "Curl femoral en máquina": {
    pos: "Acostado boca abajo en la máquina, rodillo justo encima de los talones.",
    mov: "Lleva los talones hacia los glúteos y baja en 3 s.",
    error: "Levantar la cadera del banco para ayudarte.",
  },
  "Curl-up de McGill": {
    pos: "Boca arriba, una pierna doblada y la otra estirada, manos bajo la zona lumbar.",
    mov: "Despega apenas cabeza y hombros del piso, aguanta 8–10 s y baja.",
    error: "Hacer un abdominal completo: la espalda baja no se mueve.",
  },
  "Dead bug": {
    pos: "Boca arriba, brazos al techo, caderas y rodillas a 90°, espalda baja pegada al piso.",
    mov: "Estira el brazo y la pierna contrarios hasta casi tocar el piso y vuelve.",
    error: "Que la espalda baja se despegue del piso: acorta el rango hasta controlarlo.",
  },
  "Dominadas supinas": {
    pos: "Colgado con las palmas hacia ti, manos a la anchura de los hombros.",
    mov: "Sube hasta pasar la barbilla sobre la barra y baja controlado hasta estirar los brazos.",
    error: "Medias repeticiones: baja hasta abajo del todo.",
  },
  "Dominadas lastradas": {
    pos: "Con peso en un cinturón o mochila, agarre prono un poco más ancho que los hombros.",
    mov: "Sube hasta la barbilla sobre la barra y baja en 2–3 s.",
    error: "Agregar peso antes de hacer 10 dominadas limpias sin peso.",
  },
  "Dominadas": {
    pos: "Colgado con agarre prono, un poco más ancho que los hombros.",
    mov: "Sube llevando el pecho hacia la barra hasta pasar la barbilla y baja controlado.",
    error: "Patear o balancearte; si no salen, usa una banda elástica de ayuda.",
  },
  "Elevación de talón con peso a una pierna": {
    pos: "En un escalón, solo la punta de un pie apoyada, mancuerna en la mano del mismo lado.",
    mov: "Sube lo más alto posible, pausa 1 s y baja hasta estirar la pantorrilla.",
    error: "Rebotar abajo: el estiramiento controlado es clave para el tendón de Aquiles.",
  },
  "Elevación de talón con peso": {
    pos: "En un escalón o máquina, puntas apoyadas, peso en hombros o manos.",
    mov: "Sube lo más alto posible, pausa 1 s y baja hasta estirar.",
    error: "Medio rango: sube y baja del todo.",
  },
  "Elevación a una pierna": {
    pos: "En un escalón, solo la punta de un pie apoyada, mano en la pared para equilibrio.",
    mov: "Sube lo más alto posible y baja lento hasta estirar la pantorrilla.",
    error: "Doblar la rodilla para ayudarte: la pierna va estirada.",
  },
  "Elevación de tibial": {
    pos: "Espalda contra la pared, talones a unos 30 cm de ella, piernas estiradas.",
    mov: "Sube las puntas de los pies lo más alto posible y bájalas lento sin tocar el piso.",
    error: "Despegar la espalda de la pared o hacerlo rápido.",
  },
  "Elevación sentado": {
    pos: "Sentado, rodillas a 90°, peso sobre los muslos, puntas en un escalón.",
    mov: "Sube los talones al máximo y baja lento. Trabaja el sóleo, clave para correr.",
    error: "Rango corto: baja hasta estirar.",
  },
  "Elevación de piernas colgado": {
    pos: "Colgado de la barra, hombros activos.",
    mov: "Sube las piernas (dobladas o estiradas) enrollando la pelvis y baja sin balanceo.",
    error: "Usar impulso: si te balanceas, baja más lento.",
  },
  "Encogimientos con barra": {
    pos: "De pie, barra o mancuernas en las manos, brazos estirados.",
    mov: "Sube los hombros hacia las orejas, pausa 1 s y baja.",
    error: "Girar los hombros en círculo: solo arriba y abajo.",
  },
  "Equilibrio a una pierna": {
    pos: "Descalzo, en una pierna con la rodilla levemente flexionada (sobre cojín si se indica).",
    mov: "Aguanta el tiempo indicado; para progresar cierra los ojos o mueve la cabeza.",
    error: "Bloquear la rodilla estirada o agarrarte: deja que el tobillo trabaje.",
  },
  "Estiramiento cruzado del hombro": {
    pos: "Acostado de lado sobre el hombro que lanza, o de pie.",
    mov: "Lleva el brazo cruzado por delante del pecho con la otra mano y sostén 30 s, sin dolor.",
    error: "Forzar hasta sentir pinchazo: debe ser un estiramiento suave atrás del hombro.",
  },
  "Extensión de rodilla lenta": {
    pos: "Sentado en la máquina, rodillo sobre los tobillos.",
    mov: "Estira las rodillas en 1 s y baja en 3 s.",
    error: "Peso tan alto que tienes que patear: aquí manda el control.",
  },
  "Extensión en polea": {
    pos: "De pie frente a la polea alta, codos pegados al cuerpo.",
    mov: "Estira los codos hacia abajo y vuelve lento.",
    error: "Mover los codos hacia adelante.",
  },
  "Face pulls": {
    pos: "Cuerda o banda a la altura de la cara, brazos estirados al frente.",
    mov: "Tira hacia la frente separando las manos y girando los puños hacia atrás; pausa 1 s.",
    error: "Tirar con la espalda baja inclinándote hacia atrás.",
  },
  "Flexiones pica": {
    pos: "En V invertida: manos y pies en el piso, cadera arriba.",
    mov: "Baja la cabeza hacia el piso entre las manos y empuja de vuelta.",
    error: "Abrir los codos a los lados: llévalos hacia atrás a 45°.",
  },
  "Flexiones diamante": {
    pos: "Plancha alta con las manos juntas formando un diamante bajo el pecho.",
    mov: "Baja con los codos pegados al cuerpo y sube.",
    error: "Dejar caer la cadera.",
  },
  "Flexiones pliométricas": {
    pos: "Plancha alta, manos a la anchura de los hombros.",
    mov: "Baja controlado y empuja explosivo para que las manos se despeguen; aterriza suave.",
    error: "Aterrizar con los brazos rígidos: amortigua doblando los codos.",
  },
  "Flexiones con pies elevados": {
    pos: "Pies sobre un banco o silla, manos en el piso.",
    mov: "Baja el pecho hasta casi tocar el piso y sube.",
    error: "Hundir la cadera: cuerpo recto de cabeza a talones.",
  },
  "Flexiones": {
    pos: "Plancha alta, manos un poco más anchas que los hombros, cuerpo recto.",
    mov: "Baja el pecho hasta un puño del piso con los codos a 45° y sube.",
    error: "Cadera caída o en pico: aprieta glúteos y abdomen.",
  },
  "Fondos": {
    pos: "Manos en una silla o paralelas, brazos estirados.",
    mov: "Baja hasta que los codos lleguen a 90° y sube.",
    error: "Bajar más de 90° con los hombros adelante: molesta el hombro.",
  },
  "Frenadas": {
    pos: "Trote o carrera a 70–80 %.",
    mov: "Frena por completo en el número de pasos indicado, cadera baja y pie adelante del cuerpo.",
    error: "Frenar con el tronco erguido y la rodilla hacia adentro.",
  },
  "Hip airplanes": {
    pos: "En una pierna, tronco inclinado hacia adelante como en peso muerto a una pierna, mano en una pared si hace falta.",
    mov: "Abre la cadera rotando el tronco hacia afuera y ciérrala hacia adentro, lento.",
    error: "Perder el equilibrio por ir rápido: es control, no velocidad.",
  },
  "Hip thrust": {
    pos: "Espalda alta apoyada en un banco o sofá, pies firmes, peso sobre la cadera (si aplica).",
    mov: "Sube la cadera hasta la línea recta apretando glúteos, pausa 1 s y baja.",
    error: "Arquear la espalda baja arriba: mete la pelvis y mira al frente.",
  },
  "Hiperextensiones": {
    pos: "En el banco de hiperextensiones, cadera en el borde, pies sujetos.",
    mov: "Baja el tronco y sube hasta la línea del cuerpo, sin pasarte.",
    error: "Subir de más arqueando la espalda.",
  },
  "Hollow hold": {
    pos: "Boca arriba, espalda baja pegada al piso.",
    mov: "Despega hombros y piernas del piso formando una banana y aguanta.",
    error: "Que la espalda baja se despegue: dobla las rodillas si hace falta.",
  },
  "Lanzamiento rotacional": {
    pos: "De lado a una pared, balón medicinal a la altura de la cadera.",
    mov: "Gira desde la cadera y lanza el balón contra la pared, como un forehand o backhand.",
    error: "Lanzar solo con los brazos: el giro empieza en las piernas y la cadera.",
  },
  "Movilidad de tobillo": {
    pos: "Frente a una pared en posición de zancada, pie adelante a unos centímetros.",
    mov: "Lleva la rodilla hacia la pared sin levantar el talón y vuelve; repite.",
    error: "Que el talón se despegue o que el arco del pie colapse.",
  },
  "Movilidad rodilla a la pared": {
    pos: "Frente a una pared en posición de zancada, pie adelante a unos centímetros.",
    mov: "Lleva la rodilla hacia la pared sin levantar el talón; aleja el pie cuando lo logres.",
    error: "Que el talón se despegue o que la rodilla se vaya hacia adentro.",
  },
  "Nordic curl": {
    pos: "De rodillas sobre una superficie blanda, tobillos sujetos por un compañero o un mueble firme.",
    mov: "Inclínate hacia adelante con el cuerpo recto frenando con los isquios lo más lento posible; empújate con las manos para volver.",
    error: "Doblar la cadera: si te 'sientas', los isquios dejan de trabajar.",
  },
  "Pallof press": {
    pos: "De lado a una polea o banda a la altura del pecho, manos juntas en el pecho.",
    mov: "Estira los brazos al frente sin dejar que el tronco gire, pausa 2 s y vuelve.",
    error: "Girar hacia la banda: el ejercicio es resistir la rotación.",
  },
  "Paseo del granjero": {
    pos: "De pie, pesas pesadas en las manos (o en una sola mano si se indica).",
    mov: "Camina erguido con pasos cortos y firmes la distancia indicada.",
    error: "Inclinarte hacia el lado del peso.",
  },
  "Peso muerto rumano": {
    pos: "De pie, barra o mancuernas frente a los muslos, rodillas levemente dobladas.",
    mov: "Lleva la cadera hacia atrás bajando el peso pegado a las piernas hasta sentir los isquios y sube.",
    error: "Redondear la espalda o doblar mucho las rodillas.",
  },
  "Peso muerto trap bar": {
    pos: "Dentro de la barra hexagonal, pies a la anchura de la cadera, espalda neutra.",
    mov: "Empuja el piso con las piernas y sube hasta estar erguido; baja controlado.",
    error: "Tirar con la espalda redondeada: pecho arriba y espalda recta.",
  },
  "Plancha Copenhagen": {
    pos: "Plancha lateral con la pierna de arriba apoyada en un banco (rodilla para empezar, tobillo para avanzar).",
    mov: "Levanta la cadera y aguanta el cuerpo recto el tiempo indicado; cada lado.",
    error: "Dejar caer la cadera: mejor menos tiempo con buena forma.",
  },
  "Plancha con desplazamiento": {
    pos: "Plancha sobre antebrazos, cuerpo recto.",
    mov: "Desplaza el cuerpo adelante y atrás unos centímetros, o alterna tocar los hombros.",
    error: "Mover la cadera de lado a lado.",
  },
  "Plancha lateral": {
    pos: "De lado, apoyado en el antebrazo y el borde del pie, codo bajo el hombro.",
    mov: "Sube la cadera hasta la línea recta y aguanta; cada lado.",
    error: "Cadera hacia atrás o hundida.",
  },
  "Press de banca": {
    pos: "Acostado en el banco, pies firmes, omóplatos juntos.",
    mov: "Baja la barra al pecho controlado y empuja hacia arriba.",
    error: "Rebotar la barra en el pecho o despegar la cadera.",
  },
  "Press inclinado con mancuernas": {
    pos: "Banco a 30–45°, mancuernas a la altura del pecho.",
    mov: "Empuja hacia arriba juntando las mancuernas y baja lento.",
    error: "Abrir los codos a 90°: llévalos a unos 45°.",
  },
  "Press militar": {
    pos: "De pie, barra o mancuernas a la altura de los hombros, abdomen apretado.",
    mov: "Empuja hacia arriba hasta estirar los brazos y baja controlado.",
    error: "Arquear la espalda para empujar.",
  },
  "Puente con talones en silla": {
    pos: "Boca arriba, talones sobre una silla, rodillas levemente dobladas (una pierna si se indica).",
    mov: "Sube la cadera empujando con los talones y baja lento. Trabaja isquiotibiales.",
    error: "Empujar con las puntas de los pies en vez de los talones.",
  },
  "Puente": {
    pos: "Boca arriba, rodillas dobladas, pies apoyados (una pierna estirada si es a una pierna).",
    mov: "Sube la cadera apretando glúteos hasta la línea recta, pausa 1 s y baja.",
    error: "Empujar con la espalda baja en vez de los glúteos.",
  },
  "Pájaros con mancuerna": {
    pos: "Tronco inclinado hacia adelante, mancuernas colgando, codos levemente doblados.",
    mov: "Abre los brazos a los lados hasta la altura de los hombros y baja lento.",
    error: "Usar mucho peso y balancear el tronco.",
  },
  "Remo con mancuerna": {
    pos: "Una mano y una rodilla apoyadas en un banco, espalda plana.",
    mov: "Lleva la mancuerna hacia la cadera con el codo pegado y baja lento.",
    error: "Girar el tronco para subir el peso.",
  },
  "Remo invertido": {
    pos: "Acostado bajo una mesa firme o barra baja, agarrado del borde, cuerpo recto.",
    mov: "Tira llevando el pecho hacia el borde y baja controlado.",
    error: "Dejar caer la cadera.",
  },
  "Rotaciones 90/90": {
    pos: "Sentado en el piso con ambas piernas dobladas a 90°, una adelante y otra de lado.",
    mov: "Gira las rodillas al otro lado sin usar las manos, manteniendo el tronco erguido.",
    error: "Echarte hacia atrás con las manos: si cuesta, apóyalas solo al principio.",
  },
  "Rotación externa": {
    pos: "Banda o polea a la altura del codo; brazo a 90° del cuerpo (o pegado al costado) y codo a 90°.",
    mov: "Gira el antebrazo hacia atrás/arriba sin mover el codo y vuelve lento.",
    error: "Mover el codo o el tronco: solo gira el hombro.",
  },
  "Rotación rusa": {
    pos: "Sentado, rodillas dobladas, tronco inclinado atrás, pies en el piso o elevados.",
    mov: "Gira el tronco de lado a lado llevando las manos (o un peso) junto a la cadera.",
    error: "Mover solo los brazos: gira desde el pecho.",
  },
  "Rotación torácica": {
    pos: "En cuatro apoyos sentado sobre los talones, una mano detrás de la cabeza.",
    mov: "Gira el codo hacia el techo siguiéndolo con la mirada y vuelve.",
    error: "Despegar la cadera de los talones: así gira la espalda baja y no la alta.",
  },
  "Rueda abdominal": {
    pos: "De rodillas, manos en la rueda bajo los hombros.",
    mov: "Rueda hacia adelante con el cuerpo recto hasta donde controles y vuelve.",
    error: "Hundir la espalda baja: acorta el recorrido.",
  },
  "Saltos de pogo": {
    pos: "De pie, piernas casi estiradas.",
    mov: "Rebota en el piso con las puntas, contactos cortísimos, como un resorte.",
    error: "Doblar mucho las rodillas o apoyar los talones.",
  },
  "Saltos largos": {
    pos: "De pie, pies a la anchura de la cadera.",
    mov: "Balancea los brazos, salta hacia adelante lo más lejos posible y aterriza suave y quieto.",
    error: "Aterrizar con las rodillas hacia adentro o rígidas.",
  },
  "Saltos laterales a una pierna": {
    pos: "En una pierna, rodilla levemente flexionada.",
    mov: "Salta de lado a la misma pierna y quédate quieto 2 s antes del siguiente.",
    error: "Encadenar saltos sin estabilizarte: la pausa es el ejercicio.",
  },
  "Sentadilla Cossack": {
    pos: "Piernas muy abiertas, puntas un poco hacia afuera.",
    mov: "Baja hacia un lado doblando esa rodilla con la otra pierna estirada; sube y cambia.",
    error: "Levantar el talón de la pierna doblada.",
  },
  "Sentadilla a una pierna": {
    pos: "En una pierna frente a un cajón o banco bajo, brazos al frente.",
    mov: "Baja hasta tocar el cajón con los glúteos sin dejarte caer y sube.",
    error: "Que la rodilla se vaya hacia adentro.",
  },
  "Sentadilla búlgara": {
    pos: "Pie de atrás apoyado en un banco, pie de adelante a un paso largo.",
    mov: "Baja hasta que la rodilla de atrás casi toque el piso y sube empujando con la de adelante.",
    error: "Paso muy corto (talón se levanta) o rodilla hacia adentro.",
  },
  "Sentadilla frontal": {
    pos: "Barra apoyada sobre los hombros por delante, codos altos.",
    mov: "Baja con el tronco erguido lo más profundo que controles y sube.",
    error: "Dejar caer los codos y redondear la espalda.",
  },
  "Sentadilla lateral con pesa": {
    pos: "Piernas abiertas, pesa al pecho.",
    mov: "Desplaza el peso hacia un lado bajando la cadera hacia atrás; vuelve al centro.",
    error: "Que la rodilla pase hacia adentro del pie.",
  },
  "Snaps de forehand con toalla": {
    pos: "Posición de forehand, toalla enrollada o disco en la mano.",
    mov: "Haz el movimiento del forehand terminando con un golpe seco de muñeca (que la toalla 'chasquee').",
    error: "Mover todo el brazo: el golpe es de antebrazo y muñeca.",
  },
  "Split squat con rodilla pasando la punta": {
    pos: "En zancada, pie de adelante plano en el piso.",
    mov: "Baja llevando la rodilla de adelante más allá de los dedos del pie, con el talón apoyado.",
    error: "Levantar el talón: baja solo hasta donde lo mantengas apoyado.",
  },
  "Sprints": {
    pos: "Calentado, en una recta de 20–30 m.",
    mov: "Acelera progresivo hasta la intensidad indicada (90 %), camina de vuelta para recuperar.",
    error: "Ir al 100 % sin calentar o con fatiga: ahí aparecen los desgarros.",
  },
  "Step-down excéntrico": {
    pos: "De pie en un escalón, en una pierna.",
    mov: "Baja el otro talón hacia el piso en 3 s doblando la rodilla de apoyo y sube.",
    error: "Que la rodilla de apoyo se vaya hacia adentro o caerte rápido.",
  },
  "Superman": {
    pos: "Boca abajo, brazos estirados adelante.",
    mov: "Despega brazos, pecho y piernas del piso, aguanta 2 s y baja.",
    error: "Levantar la cabeza mirando al frente: mira al piso.",
  },
  "Y-T-W": {
    pos: "Boca abajo en el piso o en un banco inclinado, brazos colgando o estirados.",
    mov: "Sube los brazos formando una Y, luego una T, luego una W, con los pulgares hacia arriba.",
    error: "Encoger los hombros hacia las orejas: llévalos hacia atrás y abajo.",
  },
};

// Busca el ejercicio por el prefijo más largo que coincida con el texto del ejercicio.
export function findExercise(drill) {
  const text = drill.toLowerCase();
  let best = null;
  for (const name of Object.keys(EXERCISES)) {
    if (text.startsWith(name.toLowerCase()) && (!best || name.length > best.length)) best = name;
  }
  return best ? { name: best, ...EXERCISES[best] } : null;
}
