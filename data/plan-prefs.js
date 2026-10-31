// Diagnóstico del plan: lo que quieres mejorar, lo que te pasa en partido, tu equipo y tu tiempo.
// Cada objetivo o síntoma suma peso a categorías de pruebas (data/tests.js): los músculos que esas
// pruebas miden suben de prioridad en tu plan. "lesiones" sube el blindaje.

export const GOALS = [
  { id: "velocidad", name: "Ganar el primer paso", cats: ["velocidad"] },
  { id: "agilidad", name: "Frenar y cambiar de dirección", cats: ["agilidad", "estabilidad"] },
  { id: "salto", name: "Saltar más (discos en el aire, layout)", cats: ["potencia"] },
  { id: "resistencia", name: "Aguantar todo el partido", cats: ["resistencia"] },
  { id: "lanzamiento", name: "Lanzar más lejos y preciso", cats: ["lanzamiento"] },
  { id: "lesiones", name: "No lesionarme", cats: ["estabilidad", "movilidad"] },
];

export const FEELS = [
  { id: "primerPaso", name: "Me ganan en el primer paso", cats: ["velocidad"] },
  { id: "frenar", name: "Me cuesta frenar o cambiar de dirección", cats: ["agilidad"] },
  { id: "aire", name: "Pierdo los discos en el aire", cats: ["potencia"] },
  { id: "cansancio", name: "Me canso al final de los puntos o del partido", cats: ["resistencia"] },
  { id: "hucks", name: "Mis lanzamientos largos no llegan", cats: ["lanzamiento"] },
  { id: "molestias", name: "Tengo molestias que vuelven", cats: ["estabilidad", "movilidad"] },
];

// Equipo en casa (en el gimnasio se asume que hay de todo). Si no lo tienes, esos ejercicios se cambian.
export const EQUIPMENT = [
  { id: "barra", name: "Barra para colgarse", needs: /dominadas|colgarse|colgado/i },
  { id: "pesas", name: "Mancuernas o pesas", needs: /mancuerna|con peso|con barra|trap bar|lastrad|con pesa/i },
  { id: "bandas", name: "Bandas elásticas", needs: /banda|pallof|face pulls/i },
  { id: "balon", name: "Balón medicinal", needs: /balón medicinal/i },
  { id: "cajon", name: "Cajón o escalón alto", needs: /cajón/i },
];

export const MINUTES = [30, 45, 60];

// Cuántos ejercicios de cada tipo caben en la sesión según el tiempo.
export const SIZE = {
  30: { fuerza: 2, blindaje: 1, lanzamiento: 1 },
  45: { fuerza: 3, blindaje: 2, lanzamiento: 2 },
  60: { fuerza: 4, blindaje: 2, lanzamiento: 2 },
};

// Peso de cada categoría según tus respuestas (0 = no la marcaste).
export function categoryWeights(prefs) {
  const w = {};
  for (const list of [[GOALS, prefs?.goals], [FEELS, prefs?.feels]]) {
    for (const item of list[0]) {
      if (!list[1]?.includes(item.id)) continue;
      for (const c of item.cats) w[c] = (w[c] ?? 0) + 1;
    }
  }
  return w;
}

export function wantsInjuryPrevention(prefs) {
  return !!(prefs?.goals?.includes("lesiones") || prefs?.feels?.includes("molestias"));
}
