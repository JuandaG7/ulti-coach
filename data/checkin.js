// Check-in semanal. Las 5 preguntas de bienestar siguen el formato de los cuestionarios
// que usan los equipos profesionales (fatiga, sueño, dolor muscular, estrés, ánimo),
// todas en escala de 1 a 5 donde 5 es lo mejor.

export const WELLNESS_ITEMS = [
  { id: "energy", name: "Energía", low: "Agotado", high: "Con toda" },
  { id: "sleep", name: "Calidad de sueño", low: "Muy mala", high: "Excelente" },
  { id: "soreness", name: "Dolor muscular general", low: "Mucho", high: "Nada" },
  { id: "stress", name: "Estrés", low: "Mucho", high: "Nada" },
  { id: "mood", name: "Ánimo y motivación", low: "Bajo", high: "A tope" },
];

// Semana ISO ("2026-W42"): el check-in es uno por semana, de lunes a domingo.
export function weekKey(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
