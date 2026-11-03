// Torneos: el plan se organiza según cuánto falta (periodización) y llega a la fecha con una puesta
// a punto (tapering): menos volumen, misma intensidad. Los estudios de puesta a punto (deportes de
// resistencia y de equipo) muestran ~2–3 % más de rendimiento bajando el volumen 40–60 % en 1–2
// semanas sin bajar la intensidad. Los cortes de cada fase son estimaciones adaptadas a ultimate.

// d = días que faltan para el primer día del torneo (0 = hoy empieza).
export const PHASES = {
  construir: { name: "Construir", text: "Faltan más de 6 semanas: el plan normal, fuerza, potencia y tus falencias." },
  especifico: { name: "Específico", text: "Lo que pide un torneo: sprints repetidos, cambios de dirección y aguantar puntos seguidos." },
  puesta: { name: "Puesta a punto", text: "Menos series, igual de rápido: llegas fresco sin perder lo ganado. Nada nuevo." },
  activacion: { name: "Activación", text: "Sesiones cortas y explosivas, dormir bien y comer más carbohidratos." },
  torneo: { name: "Torneo", text: "Hoy se juega: sigue la guía del día." },
  recuperacion: { name: "Recuperación", text: "Días suaves para recuperarte antes de volver al plan normal." },
};

const dayMs = 86400000;
export const daysBetween = (from, to) => Math.round((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / dayMs);
export function addDays(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const RECOVERY_DAYS = 4;

// Fase de hoy respecto al torneo. null si el torneo ya pasó hace más de RECOVERY_DAYS.
export function tournamentPhase(t, today) {
  const d = daysBetween(today, t.start);
  const end = addDays(t.start, (t.days ?? 1) - 1);
  const afterEnd = daysBetween(end, today);
  if (d > 0) {
    const phase = d >= 42 ? "construir" : d >= 14 ? "especifico" : d >= 4 ? "puesta" : "activacion";
    return { phase, daysTo: d, end };
  }
  if (afterEnd <= 0) return { phase: "torneo", daysTo: 0, day: 1 - d, end };
  if (afterEnd <= RECOVERY_DAYS) return { phase: "recuperacion", daysTo: 0, backOn: addDays(end, RECOVERY_DAYS + 1), end };
  return null;
}

// Guía del torneo: la semana antes, el día antes, cada día del torneo y después.
export const GUIDE = [
  {
    title: "La semana antes",
    items: [
      "Nada nuevo: ni ejercicios que no conoces ni cargas máximas (dejan dolor muscular justo cuando no lo quieres).",
      "Menos series, igual de rápido: los sprints y cambios de dirección se mantienen cortos e intensos.",
      "Duerme 8 h o más: es cuando el cuerpo termina de recuperarse.",
    ],
  },
  {
    title: "Los 2 días antes",
    items: [
      "Come más carbohidratos (arroz, pasta, pan, papa, fruta): llenas las reservas de energía para varios partidos.",
      "Toma agua durante el día; la orina clara es buena señal.",
      "El día antes, solo una activación de 20 min. Prepara el bolso: tacos, ropa de cambio, protector solar, botella, comida para entre partidos, cinta o venda si la usas.",
    ],
  },
  {
    title: "Cada mañana del torneo",
    items: [
      "Revisa tu molestia de 0 a 10. Si amaneció peor que ayer, juega menos puntos y avísale a tu capitán.",
      "Haz 5 min de los ejercicios de blindaje de tu zona (los isométricos suelen bajar el dolor).",
      "Desayuno con carbohidratos 2–3 h antes del primer partido.",
    ],
  },
  {
    title: "Antes de cada partido",
    items: [
      "Primer partido del día: calentamiento de 15–20 min (trote, movilidad, aceleraciones, cambios de dirección, pases).",
      "Entre partidos: un calentamiento corto de 8–10 min antes de volver a jugar.",
    ],
  },
  {
    title: "Entre partidos",
    items: [
      "En los primeros 30 min: 400–600 ml de líquido con electrolitos y algo con carbohidratos (plátano, sándwich, gomitas).",
      "Sombra y muévete suave: no te quedes tirado ni frío.",
      "Cámbiate la polera mojada y ponte protector solar otra vez.",
    ],
  },
  {
    title: "Al terminar cada día",
    items: [
      "10 min de vuelta a la calma: trote suave y movilidad.",
      "Comida con carbohidratos y proteína en la primera hora.",
      "Piernas en alto un rato y a dormir temprano.",
    ],
  },
  {
    title: "Tu molestia durante el torneo",
    items: [
      "Hasta 3/10 jugando y que no empeore a la mañana siguiente: puedes seguir.",
      "5/10 o más, o amanece peor: menos puntos, y si sigue subiendo, para. Un torneo no vale una lesión de meses.",
      "Lo que diga tu fisio va por encima de esta guía.",
    ],
  },
  {
    title: "Después del torneo",
    items: [
      `${RECOVERY_DAYS} días suaves: trote corto, movilidad y blindaje. El plan normal vuelve solo.`,
      "Haz tu check-in: con el cansancio y el dolor de esa semana, la app ajusta lo que viene.",
    ],
  },
];
