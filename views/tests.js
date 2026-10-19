// Pruebas: catálogo agrupado por categoría, con último resultado y tendencia.
import { CATEGORIES, TESTS } from "../data/tests.js";
import { entries } from "../store.js";
import { categoryScore, testScore } from "../scoring.js";
import { sparkline, fmt, fmtDate, icon, tierClass } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";

export function render(root, filter) {
  const cats = filter && CATEGORIES.some((c) => c.id === filter) ? CATEGORIES.filter((c) => c.id === filter) : CATEGORIES;

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Pruebas</h1>
      <p class="muted small">Mídete cada 3–4 semanas en condiciones parecidas (calentamiento, superficie, hora).</p>
    </header>

    <nav class="filter-chips" aria-label="Filtrar por categoría">
      <a href="#pruebas" class="${!filter ? "active" : ""}">Todas</a>
      ${CATEGORIES.map((c) => `<a href="#pruebas/${c.id}" class="${filter === c.id ? "active" : ""}">${c.name}</a>`).join("")}
    </nav>

    ${cats.map((c) => {
      const s = categoryScore(c.id);
      return `
        <section>
          <div class="section-title-row">
            <h2 class="section-title">${c.name}</h2>
            <span class="num score ${tierClass(s)} tier-text">${s ?? "–"}</span>
          </div>
          <div class="card list">
            ${TESTS.filter((t) => t.cat === c.id).map(testRow).join("")}
          </div>
        </section>`;
    }).join("")}
  `;

  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
}

function testRow(t) {
  const list = entries(t.id);
  const last = list[list.length - 1];
  const score = last ? testScore(t.id, last.value) : null;
  // La tendencia se dibuja en puntaje, así "arriba" siempre es mejor (incluso en pruebas de tiempo).
  const trend = sparkline(list.map((e) => testScore(t.id, e.value)));
  return `
    <button class="row test-row" data-test="${t.id}">
      <div class="row-main">
        <span>${t.name}</span>
        <span class="muted small">${last ? fmtDate(last.date) : "Sin medir"}</span>
      </div>
      <span class="trend ${tierClass(score)} tier-text">${trend}</span>
      ${last
        ? `<span class="num value">${fmt(last.value, t.decimals)}<small>${t.unit}</small></span>
           <span class="badge ${tierClass(score)}">${score}</span>`
        : `<span class="add-pill">${icon("plus")} Medir</span>`}
    </button>`;
}
