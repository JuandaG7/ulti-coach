// Pruebas: responde "¿qué mido hoy?". Arriba las 3 sugeridas; abajo tu perfil atlético por
// categoría, cada una plegable con sus pruebas adentro (se abre de a una).
import { CATEGORIES, TESTS } from "../data/tests.js";
import { entries } from "../store.js";
import { categoryScore, testScore, suggestedTests } from "../scoring.js";
import { sparkline, fmt, fmtDate, icon, tierClass, levelChip, bar, summary, lessButton, exclusive } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";
import { WARMUP, SAFETY } from "../data/safety.js";

export function render(root, openCat) {
  const suggested = suggestedTests(3);

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Pruebas</h1>
      <p class="muted small">Mídete cada 3–4 semanas, con calentamiento y en condiciones parecidas.</p>
    </header>

    ${suggested.length ? `
      <section>
        <h2 class="section-title">Sugeridas para ti</h2>
        <div class="card list">${suggested.map(({ test, last, age }) => testRow(test, last == null ? "Nunca la mediste" : `Hace ${age} días`)).join("")}</div>
      </section>` : ""}

    <section>
      <h2 class="section-title">Tu perfil atlético</h2>
      <div class="cat-list">
        ${CATEGORIES.map((c) => {
          const s = categoryScore(c.id);
          const tests = TESTS.filter((t) => t.cat === c.id);
          const measured = tests.filter((t) => entries(t.id).length).length;
          return `
            <details class="card cat-acc" data-acc ${openCat === c.id ? "open" : ""}>
              <summary>
                <div class="cat-head">
                  <div class="row-head"><span class="cat-name">${c.name}</span><span class="row-score"><span class="num score">${s ?? "–"}</span>${s != null ? levelChip(s) : ""}</span></div>
                  ${bar(s)}
                  <span class="muted small">${measured} de ${tests.length} medidas · ${c.blurb}</span>
                </div>
              </summary>
              <div class="list inner">${tests.map((t) => testRow(t)).join("")}</div>
            </details>`;
        }).join("")}
      </div>
    </section>

    <details class="card warmup-card">
      ${summary(`${icon("zap")} Calentamiento y seguridad`)}
      <h3 class="subhead">Calentamiento · 10 min</h3>
      <ol class="warmup-steps">${WARMUP.map((w) => `<li><strong>${w.title}</strong><span>${w.text}</span></li>`).join("")}</ol>
      <h3 class="subhead">Seguridad</h3>
      <ul class="safety-list">${SAFETY.map((r) => `<li>${icon("shield")}<span>${r}</span></li>`).join("")}</ul>
      ${lessButton()}
    </details>
  `;

  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
  exclusive(root.querySelectorAll("[data-acc]"));
}

function testRow(t, note) {
  const list = entries(t.id);
  const last = list[list.length - 1];
  const score = last ? testScore(t.id, last.value) : null;
  // La tendencia se dibuja en puntaje, así "arriba" siempre es mejor (incluso en pruebas de tiempo).
  const trend = sparkline(list.map((e) => testScore(t.id, e.value)));
  return `
    <button class="row test-row" data-test="${t.id}">
      <div class="row-main">
        <span>${t.name}${t.timer ? ` <span class="timer-tag" title="Con cronómetro">${icon("timer")}</span>` : ""}</span>
        <span class="muted small">${note ?? (last ? fmtDate(last.date) : "Sin medir")}</span>
      </div>
      <span class="trend">${trend}</span>
      ${last
        ? `<span class="num value">${fmt(last.value, t.decimals)}<small>${t.unit}</small></span>
           <span class="badge ${tierClass(score)}">${score}</span>`
        : `<span class="add-pill">${icon("plus")} Medir</span>`}
    </button>`;
}
