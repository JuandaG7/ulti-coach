// Cuerpo: mapa muscular coloreado por puntaje + detalle de cada músculo.
import { FRONT, BACK } from "../data/body-map.js";
import { MUSCLES, SVG_TO_MUSCLE } from "../data/muscles.js";
import { TESTS_BY_ID } from "../data/tests.js";
import { latest, profile } from "../store.js";
import { muscleScore, testScore, level, nextLevel, priorities, target, muscleImportance, LEVELS, jointWarnings } from "../scoring.js";
import { ring, bar, icon, fmt, tierClass, levelChip, summary, bodySwitch } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";
import { drillChips, bindDrills } from "./exercise-sheet.js";

const SIDES = { front: FRONT, back: BACK };
const sideOf = (muscleId) =>
  FRONT.some((p) => SVG_TO_MUSCLE[p.svg] === muscleId) ? "front" : "back";

let side = "front";
let scrollToDetail = false;

export function render(root, selected) {
  if (selected && MUSCLES[selected]) side = sideOf(selected);
  else selected = null;
  const ranking = priorities();
  const rankRow = ({ id, muscle, score }) => `
    <a class="row muscle-row ${id === selected ? "selected" : ""}" href="#cuerpo/${id}">
      <div class="row-main">
        <div class="row-head"><span>${muscle.name}</span><span class="row-score"><span class="num score">${score ?? "–"}</span>${score != null ? levelChip(score) : ""}</span></div>
        ${bar(score)}
      </div>
      ${icon("chevron", "muted")}
    </a>`;

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Cuerpo</h1>
      ${bodySwitch("musculos", jointWarnings())}
      <p class="muted small">Cada músculo se califica con las pruebas que lo miden, contra el nivel Excelente.</p>
    </header>

    <div class="body-layout">
      <section class="card map-card">
        <div class="segmented" role="tablist">
          <button role="tab" aria-selected="${side === "front"}" data-side="front">Frente</button>
          <button role="tab" aria-selected="${side === "back"}" data-side="back">Espalda</button>
        </div>
        ${bodySvg(selected)}
        <ul class="legend">
          ${LEVELS.map((l) => `<li><i class="tier-${l.id}"></i>${l.name}</li>`).join("")}
          <li><i class="tier-none"></i>Sin datos</li>
        </ul>
      </section>

      <section class="card detail-card">
        ${selected ? detail(selected) : `<div class="detail-empty">${icon("body")}<p>Toca un músculo para ver su puntaje y cómo mejorarlo.</p></div>`}
      </section>
    </div>

    <section>
      <h2 class="section-title">Ranking de prioridades</h2>
      <div class="card list">${ranking.slice(0, 5).map(rankRow).join("")}</div>
      <details class="more-rank">
        ${summary(`<span class="muted small">Los otros ${ranking.length - 5} músculos</span>`)}
        <div class="card list">${ranking.slice(5).map(rankRow).join("")}</div>
      </details>
    </section>
  `;

  root.querySelectorAll("[data-side]").forEach((b) =>
    b.addEventListener("click", () => {
      side = b.dataset.side;
      render(root, selected);
    })
  );
  root.querySelectorAll("polygon[data-muscle]").forEach((p) =>
    p.addEventListener("click", () => {
      scrollToDetail = true;
      location.hash = `#cuerpo/${p.dataset.muscle}`;
    })
  );
  // En celular el detalle queda debajo del mapa: bajamos hasta él al tocar un músculo.
  if (scrollToDetail && selected && window.innerWidth < 900) {
    root.querySelector(".detail-card").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  scrollToDetail = false;
  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
  bindDrills(root);
}

function bodySvg(selected) {
  const polys = SIDES[side].map(({ svg, points }) => {
    const id = SVG_TO_MUSCLE[svg];
    if (!id) return points.map((p) => `<polygon points="${p}" class="bone"/>`).join("");
    const cls = `muscle ${tierClass(muscleScore(id))} ${id === selected ? "selected" : ""}`;
    return points.map((p) => `<polygon points="${p}" class="${cls}" data-muscle="${id}"><title>${MUSCLES[id].name}</title></polygon>`).join("");
  });
  return `<svg class="body-map" viewBox="0 0 100 200" role="img" aria-label="Mapa muscular, vista de ${side === "front" ? "frente" : "espalda"}">${polys.join("")}</svg>`;
}

function detail(id) {
  const m = MUSCLES[id];
  const score = muscleScore(id);
  const imp = muscleImportance(id);
  const importance = imp >= 0.9 ? "Crítica" : imp >= 0.6 ? "Alta" : "Media";
  const mode = profile()?.mode ?? "casa";
  const next = nextLevel(score);

  return `
    <div class="detail-head">
      ${ring(score, { size: 96, stroke: 8 })}
      <div>
        <p class="eyebrow">Importancia en ultimate: ${importance}</p>
        <h2 class="detail-title">${m.name}</h2>
        <div class="detail-level">${score == null ? `<span class="muted small">Sin datos todavía</span>` : `${levelChip(score)}<span class="muted small">${next ? `${next.min - score} pts para ${next.name}` : "Nivel máximo"}</span>`}</div>
      </div>
    </div>

    <p class="why">${m.why}</p>

    <h3 class="subhead">Cómo se calcula</h3>
    <ul class="test-breakdown">
      ${Object.entries(m.tests).map(([testId, w]) => {
        const t = TESTS_BY_ID[testId];
        const e = latest(testId);
        const s = e ? testScore(testId, e.value) : null;
        return `
          <li>
            <button class="row" data-test="${testId}">
              <div class="row-main">
                <div class="row-head">
                  <span>${t.name} <span class="muted small">· ${Math.round(w * 100)} %</span></span>
                  <span class="small">${e ? `<span class="num">${fmt(e.value, t.decimals)}</span> / ${fmt(target(testId).elite, t.decimals)} ${t.unit}` : `<span class="accent">Medir</span>`}</span>
                </div>
                ${bar(s)}
              </div>
            </button>
          </li>`;
      }).join("")}
    </ul>

    <h3 class="subhead">Para subirlo · ${mode === "gym" ? "gimnasio" : "casa"}</h3>
    ${drillChips(m.drills[mode])}
  `;
}
