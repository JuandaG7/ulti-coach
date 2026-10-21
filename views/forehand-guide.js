// Guía del forehand: las fases del lanzamiento, qué buscar en cada una y qué métrica de la app la mide.
// Son claves de entrenamiento (consenso de entrenadores), no reglas exactas: cada pro tiene su estilo.
import { openSheet } from "./sheet.js";
import { icon, levelChip } from "../ui.js";
import { METRICS_BY_ID } from "../forehand.js";

const PHASES = [
  {
    name: "Agarre",
    key: "Dedo medio contra el borde de adentro, índice apoyado en la parte de abajo o apuntando al centro, pulgar arriba apretando. El disco no se mueve en la mano.",
    error: "Agarre suelto: el disco sale bamboleándose (wobble) y pierde distancia.",
    drill: "Pasa el disco a 5 m solo con muñeca, sin mover el brazo, hasta que salga plano y girando.",
  },
  {
    name: "Pivot y paso",
    key: "Pie de pivot fijo (el izquierdo si eres diestro). Paso largo y bajo hacia el lado del forehand, rodilla doblada, como en una zancada lateral.",
    error: "Pararse derecho con los pies juntos: la marca te tapa y no hay palanca.",
    metrics: ["pivotWidth"],
  },
  {
    name: "Armado",
    key: "Codo cerca del cuerpo y por delante de la cadera, disco atrás con la palma hacia arriba. El peso empieza sobre el pie de pivot.",
    error: "Codo separado del cuerpo o detrás de la espalda: menos control y más carga en el codo.",
    metrics: ["weightShift"],
  },
  {
    name: "Cadena: cadera → hombros → brazo",
    key: "La cadera gira primero, los hombros la siguen y el brazo llega al final, con el codo liderando. Como un látigo: cada parte acelera a la siguiente.",
    error: "Lanzar solo con el brazo: la cadera no se mueve y el disco sale sin fuerza (y el hombro y el codo pagan).",
    metrics: ["chainOrder", "hipLead", "trunkLead"],
  },
  {
    name: "Golpe de muñeca y suelta",
    key: "Al final, un golpe seco de muñeca y antebrazo: ahí nace el giro. Suelta delante del cuerpo, más o menos a la altura de la cadera, con el ángulo que quieres darle al disco.",
    error: "Romper la muñeca hacia arriba o soltar tarde, al lado del cuerpo: el disco se va hacia afuera.",
    metrics: ["wristSpeed", "releaseHeight", "elbowAngle"],
  },
  {
    name: "Final",
    key: "El brazo sigue hacia el objetivo y terminas equilibrado, con el peso sobre el pie de paso. Podrías quedarte quieto en esa posición.",
    error: "Caerte hacia adelante o quedarte atrás: el peso no acompañó al lanzamiento.",
    metrics: ["weightShift"],
  },
];

// scores: { metricId: puntaje 0–100 } de tu último análisis (opcional).
export function openForehandGuide(scores = {}) {
  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">Guía</p>
      <h2 class="sheet-title">El forehand, fase por fase</h2>
      <p class="muted small guide-intro">Lo que buscan los entrenadores en cada fase. Cada pro tiene su estilo: úsalo como referencia, no como molde.</p>
      <ol class="guide">
        ${PHASES.map((p, i) => `
          <li class="guide-phase">
            <p class="guide-head"><span class="focus-rank num">${i + 1}</span><strong>${p.name}</strong></p>
            <p>${p.key}</p>
            <p class="guide-error">${icon("alert")}<span>${p.error}</span></p>
            ${p.drill ? `<p class="muted small">${icon("target")} ${p.drill}</p>` : ""}
            ${p.metrics ? `<ul class="guide-metrics">${p.metrics.map((id) => `
              <li><span>${METRICS_BY_ID[id].name}</span>${scores[id] != null ? levelChip(scores[id]) : `<span class="muted small">${METRICS_BY_ID[id].scope === "own" ? "contra tus videos" : "mídelo con video"}</span>`}</li>`).join("")}
            </ul>` : ""}
          </li>`).join("")}
      </ol>`;
  });
}
