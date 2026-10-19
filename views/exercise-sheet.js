// Ejercicios tocables: cada uno abre una hoja con posición, movimiento, error común y video.
import { findExercise } from "../data/exercises.js";
import { openSheet } from "./sheet.js";
import { icon } from "../ui.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function drillChips(drills) {
  return `<ul class="chips drills">${drills.map((d) => `<li><button type="button" class="drill" data-drill="${esc(d)}">${esc(d)}${icon("chevron")}</button></li>`).join("")}</ul>`;
}

export function bindDrills(root) {
  root.querySelectorAll("[data-drill]").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExercise(b.dataset.drill);
    })
  );
}

function openExercise(drill) {
  const ex = findExercise(drill);
  openSheet((root) => {
    const dose = ex ? drill.slice(ex.name.length).trim() : "";
    const query = encodeURIComponent(`${ex?.name ?? drill} ejercicio técnica`);
    root.innerHTML = `
      <p class="eyebrow">Ejercicio</p>
      <h2 class="sheet-title">${esc(ex?.name ?? drill)}</h2>
      ${dose ? `<p class="dose">${icon("target")} ${esc(dose)}</p>` : ""}
      ${ex ? `
        <ol class="steps">
          <li><span class="step-label">Posición</span>${ex.pos}</li>
          <li><span class="step-label">Movimiento</span>${ex.mov}</li>
          <li class="step-error"><span class="step-label">${icon("alert")} Error común</span>${ex.error}</li>
        </ol>` : `<p class="muted">Todavía no hay instrucciones para este ejercicio.</p>`}
      <a class="btn secondary block" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener">${icon("video")} Buscar video en YouTube</a>
      <p class="muted small sheet-foot">Si sientes dolor (no cansancio) en una articulación, para y consúltalo con tu entrenador o fisio.</p>`;
  });
}
