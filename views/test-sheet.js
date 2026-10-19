// Detalle de una prueba: protocolo, historial y registro de nuevas mediciones.
import { TESTS_BY_ID, CATEGORIES } from "../data/tests.js";
import { entries, addEntry, removeEntry } from "../store.js";
import { testScore, level } from "../scoring.js";
import { openSheet } from "./sheet.js";
import { icon, fmt, fmtDate, today, historyChart, tierClass } from "../ui.js";

export function openTestSheet(testId) {
  openSheet((root) => render(root, testId));
}

function render(root, testId) {
  const test = TESTS_BY_ID[testId];
  const cat = CATEGORIES.find((c) => c.id === test.cat);
  const list = entries(testId);
  const last = list[list.length - 1];
  const score = last ? testScore(testId, last.value) : null;
  const lowerIsBetter = test.elite < test.base;

  root.innerHTML = `
    <p class="eyebrow">${cat.name}</p>
    <h2 class="sheet-title">${test.name}</h2>

    <div class="stat-row">
      <div class="stat">
        <span class="stat-label">Última</span>
        <span class="stat-value num">${last ? fmt(last.value, test.decimals) : "–"}<small>${test.unit}</small></span>
      </div>
      <div class="stat">
        <span class="stat-label">Meta élite</span>
        <span class="stat-value num">${fmt(test.elite, test.decimals)}<small>${test.unit}</small></span>
      </div>
      <div class="stat">
        <span class="stat-label">Puntaje</span>
        <span class="stat-value num ${tierClass(score)} tier-text">${score ?? "–"}</span>
      </div>
    </div>
    ${score != null ? `<p class="muted small">Nivel ${level(score).name.toLowerCase()} · ${lowerIsBetter ? "menos es mejor" : "más es mejor"}</p>` : ""}

    ${list.length ? historyChart(list, test) : ""}

    <form class="entry-form">
      <label>
        <span>Resultado (${test.unit})</span>
        <input name="value" type="number" inputmode="decimal" step="any" min="0" required>
      </label>
      <label>
        <span>Fecha</span>
        <input name="date" type="date" value="${today()}" max="${today()}" required>
      </label>
      <button type="submit" class="btn primary">${icon("plus")} Registrar</button>
    </form>

    <details class="protocol" ${list.length ? "" : "open"}>
      <summary>Cómo hacer la prueba</summary>
      <p>${test.how}</p>
    </details>

    ${list.length ? `
      <h3 class="subhead">Historial</h3>
      <ul class="history-list">
        ${[...list].reverse().map((e) => `
          <li>
            <span class="muted">${fmtDate(e.date)}${e.demo ? ' <span class="tag">ejemplo</span>' : ""}</span>
            <span class="num">${fmt(e.value, test.decimals)} ${test.unit}</span>
            <button class="icon-btn" data-remove="${e.id}" aria-label="Borrar medición del ${fmtDate(e.date)}">${icon("trash")}</button>
          </li>`).join("")}
      </ul>` : ""}
  `;

  root.querySelector(".entry-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    addEntry(testId, Number(form.get("value")), form.get("date"));
  });

  root.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (confirm("¿Borrar esta medición?")) removeEntry(btn.dataset.remove);
    })
  );
}
