// Taller de lanzamiento: ejercicios de aislamiento técnico por falla, los que te tocan primero,
// y los ejercicios que te enseñó tu coach.
import * as store from "../store.js";
import { FAULTS, FAULTS_BY_ID, drillsFor } from "../data/throw-drills.js";
import { METRICS_BY_ID } from "../forehand.js";
import { openSheet } from "./sheet.js";
import { bindDrills } from "./exercise-sheet.js";
import { icon } from "../ui.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const SOURCE = { entrenadores: "De entrenadores", estudios: "Con estudios", coach: "De tu coach" };
const OUTCOME_TEXT = { tambaleo: "tambalearon", se_fue: "se fueron" };

// Por qué una falla te toca, en palabras.
function whyMine(why) {
  if (why.metric) return `Tu forehand: ${METRICS_BY_ID[why.metric].name.toLowerCase()} lejos del rango pro`;
  if (why.outcome) return `${why.count} de tus lanzamientos ${OUTCOME_TEXT[why.outcome]}`;
  return "";
}

// mine: [{ id, why }] de data/throw-drills.js · faultsFor (las fallas que te tocan).
export function openTaller({ mine = [] } = {}) {
  openSheet(paint);

  function paint(root) {
    const custom = store.customDrills();
    const mineIds = new Set(mine.map((f) => f.id));
    const faultCard = (f, why) => `
      <section class="taller-fault ${why ? "mine" : ""}">
        <p class="taller-fault-name">${f.name}</p>
        ${why ? `<p class="taller-why">${icon("target")} ${esc(whyMine(why))}</p>` : ""}
        <p class="muted small">${f.why}</p>
        <ul class="taller-drills">${drillsFor(f.id, custom).map((d) => `
          <li>
            <button type="button" class="drill plan-drill" data-drill="${esc(d.drill)}">${esc(d.drill)}${icon("chevron")}</button>
            <span class="taller-source ${d.source}">${SOURCE[d.source]}</span>
            ${d.custom ? `<button type="button" class="link small" data-del-drill="${d.custom.id}">Quitar</button>` : ""}
          </li>`).join("")}
        </ul>
      </section>`;

    root.innerHTML = `
      <p class="eyebrow">Lanzamiento</p>
      <h2 class="sheet-title">Taller de lanzamiento</h2>
      <p class="muted small">Ejercicios que aíslan una parte del gesto para sentirla y corregirla. No te hacen más fuerte: te hacen lanzar mejor esa parte. 5–10 min, al inicio de la sesión o antes de lanzar con disco.</p>

      ${mine.length ? `<p class="subhead">Para ti</p>${mine.map((m) => faultCard(FAULTS_BY_ID[m.id], m.why)).join("")}` : `
        <p class="banner">Cuando analices tus lanzamientos (y los marques: salió bien, se fue, tambaleó), aquí aparecen primero los ejercicios de tus fallas.</p>`}

      <p class="subhead">${mine.length ? "Todas las fallas" : "Por falla"}</p>
      ${FAULTS.filter((f) => !mineIds.has(f.id)).map((f) => faultCard(f)).join("")}

      <p class="subhead">Agregar un ejercicio de tu coach</p>
      <form class="taller-form">
        <label class="field"><span>Nombre y dosis</span><input type="text" name="name" maxlength="60" required placeholder="Pelota contra la pared 3×20"></label>
        <label class="field"><span>Para qué falla</span>
          <select name="fault">${FAULTS.map((f) => `<option value="${f.id}">${f.name}</option>`).join("")}</select></label>
        <label class="field"><span>Cómo se hace (opcional)</span><textarea name="how" rows="3" maxlength="400" placeholder="Lo que te explicó tu coach"></textarea></label>
        <button type="submit" class="btn secondary block">${icon("plus")} Agregar al taller</button>
      </form>
      <p class="muted small">«De entrenadores» = experiencia de entrenadores (casi nada está estudiado en ultimate). «Con estudios» = hay estudios en lanzamientos parecidos. Si algo duele, para.</p>`;

    bindDrills(root);
    root.querySelector(".taller-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(e.target);
      const name = d.get("name").trim();
      if (!name) return;
      store.saveCustomDrill({ name, fault: d.get("fault"), how: d.get("how").trim() });
      paint(root);
    });
    root.querySelectorAll("[data-del-drill]").forEach((b) => b.addEventListener("click", () => {
      if (!confirm("¿Quitar este ejercicio del taller?")) return;
      store.removeCustomDrill(b.dataset.delDrill);
      paint(root);
    }));
  }
}
