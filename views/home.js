// Inicio: el reporte general del atleta.
import { CATEGORIES, TESTS, TESTS_BY_ID } from "../data/tests.js";
import { buildDemo } from "../data/demo.js";
import * as store from "../store.js";
import { overallScore, categoryScore, level, nextLevel, priorities, testsMeasured, isImprovement, POSITIONS } from "../scoring.js";
import { ring, bar, icon, fmt, fmtDate, tierClass, levelChip } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";

export function render(root) {
  const all = store.entries();
  if (!all.length) return renderEmpty(root);

  const p = store.profile();
  const overall = overallScore();
  const measured = testsMeasured();
  const lastDate = all[all.length - 1].date;
  const mode = p?.mode ?? "casa";

  root.innerHTML = `
    ${store.hasDemo() ? `<div class="banner">Estás viendo datos de ejemplo. <button class="link" data-act="clear-demo">Quitarlos</button></div>` : ""}

    <section class="card hero ${tierClass(overall)}">
      ${ring(overall, { size: 156, stroke: 12, label: "de 100" })}
      <div class="hero-text">
        <p class="eyebrow">Ulti Score${p?.position ? ` · ${POSITIONS[p.position]}` : ""}</p>
        <h1 class="display">${level(overall).name}</h1>
        <p class="muted small">${measured} de ${TESTS.length} pruebas medidas · última ${fmtDate(lastDate)}</p>
        ${nextLevelHint(overall)}
      </div>
    </section>

    <section>
      <h2 class="section-title">Tu foco ahora</h2>
      <p class="muted small section-sub">Lo que más rinde entrenar: importancia en ultimate${p?.position ? ` para un ${POSITIONS[p.position].toLowerCase()}` : ""} × lo que te falta. Ejercicios en modo ${mode === "gym" ? "gimnasio" : "casa"}.</p>
      <div class="focus-grid">
        ${priorities().slice(0, 3).map((x, i) => focusCard(x, i, mode)).join("")}
      </div>
    </section>

    <section>
      <h2 class="section-title">Perfil atlético</h2>
      <div class="card list">
        ${CATEGORIES.map((c) => {
          const s = categoryScore(c.id);
          return `
            <a class="row cat-row" href="#pruebas/${c.id}">
              <div class="row-main">
                <div class="row-head"><span>${c.name}</span><span class="row-score"><span class="num score">${s ?? "–"}</span>${s != null ? levelChip(s) : ""}</span></div>
                ${bar(s)}
                <p class="muted small">${c.blurb}</p>
              </div>
            </a>`;
        }).join("")}
      </div>
    </section>

    <section>
      <h2 class="section-title">Últimas mediciones</h2>
      <div class="card list">${recentRows()}</div>
    </section>

    ${dataSection()}
  `;

  bind(root);
}

function nextLevelHint(score) {
  const next = nextLevel(score);
  if (score == null) return "";
  if (!next) return `<p class="hint-chip">${icon("star")} Nivel máximo. Ahora a sostenerlo.</p>`;
  return `<p class="hint-chip">${icon("target")} ${next.min - score} puntos para ${next.name}</p>`;
}

function focusCard({ id, muscle, score }, i, mode) {
  const untested = Object.keys(muscle.tests).find((t) => !store.latest(t));
  return `
    <a class="card focus" href="#cuerpo/${id}">
      <div class="focus-head">
        <span class="focus-rank num">${i + 1}</span>
        <span class="focus-name">${muscle.name}</span>
        <span class="row-score"><span class="num score">${score ?? "–"}</span>${score != null ? levelChip(score) : ""}</span>
      </div>
      ${bar(score)}
      <p class="small">${muscle.why}</p>
      ${score == null && untested
        ? `<p class="small accent">Mídelo primero: ${TESTS_BY_ID[untested].name}</p>`
        : `<ul class="chips">${muscle.drills[mode].map((d) => `<li>${d}</li>`).join("")}</ul>`}
    </a>`;
}

function recentRows() {
  const latestPerTest = TESTS.map((t) => store.entries(t.id)).filter((l) => l.length);
  latestPerTest.sort((a, b) => b[b.length - 1].date.localeCompare(a[a.length - 1].date));
  return latestPerTest.slice(0, 5).map((list) => {
    const last = list[list.length - 1];
    const prev = list[list.length - 2];
    const t = TESTS_BY_ID[last.testId];
    let delta = `<span class="delta"></span>`;
    if (prev && prev.value !== last.value) {
      const good = isImprovement(t.id, prev.value, last.value);
      const diff = Math.abs(last.value - prev.value);
      delta = `<span class="delta ${good ? "good" : "bad"}" aria-label="${good ? "mejoró" : "empeoró"} ${fmt(diff, t.decimals)}">${icon(last.value > prev.value ? "up" : "down")}${fmt(diff, t.decimals)}</span>`;
    }
    return `
      <button class="row recent-row" data-test="${t.id}">
        <div class="row-main">
          <span>${t.name}</span>
          <span class="muted small">${fmtDate(last.date)}</span>
        </div>
        <span class="num value">${fmt(last.value, t.decimals)}<small>${t.unit}</small></span>
        ${delta}
      </button>`;
  }).join("");
}

function dataSection() {
  return `
    <section>
      <h2 class="section-title">Tus datos</h2>
      <div class="card data-card">
        <p class="muted small">Se guardan solo en este dispositivo. Haz un respaldo para pasarlos entre la Mac y el iPhone.</p>
        <div class="btn-row">
          <button class="btn secondary" data-act="export">${icon("download")} Respaldar</button>
          <label class="btn secondary">${icon("upload")} Restaurar<input type="file" accept="application/json" data-act="import" hidden></label>
          ${store.hasDemo()
            ? `<button class="btn ghost" data-act="clear-demo">Quitar ejemplo</button>`
            : `<button class="btn ghost" data-act="demo">Cargar ejemplo</button>`}
        </div>
      </div>
    </section>`;
}

function renderEmpty(root) {
  const name = store.profile()?.name;
  root.innerHTML = `
    <section class="card hero empty">
      ${ring(null, { size: 156, stroke: 12, label: "de 100" })}
      <div class="hero-text">
        <p class="eyebrow">Ulti Score</p>
        <h1 class="display">${name ? `Vamos, ${name}` : "Empieza a medirte"}</h1>
        <p class="muted">Registra pruebas de velocidad, cambio de dirección, potencia y fuerza. Con cada una se llena tu perfil y el mapa de tu cuerpo.</p>
        <div class="btn-row">
          <a class="btn primary" href="#pruebas">${icon("timer")} Ver pruebas</a>
          <button class="btn ghost" data-act="demo">Ver con datos de ejemplo</button>
        </div>
      </div>
    </section>
    ${dataSection()}
  `;
  bind(root);
}

function bind(root) {
  root.querySelectorAll('[data-act="demo"]').forEach((b) => b.addEventListener("click", () => store.loadDemo(buildDemo())));
  root.querySelectorAll('[data-act="clear-demo"]').forEach((b) => b.addEventListener("click", () => store.clearDemo()));
  root.querySelector('[data-act="export"]')?.addEventListener("click", () => {
    const blob = new Blob([store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ulti-coach-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  root.querySelector('[data-act="import"]')?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      store.importJSON(await file.text());
    } catch {
      alert("Ese archivo no es un respaldo válido de Ulti Coach.");
    }
  });
  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
}
