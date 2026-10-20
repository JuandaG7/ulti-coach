// Inicio: responde "¿qué hago hoy?". Ulti Score, una sola acción recomendada, tu foco #1
// y tres accesos rápidos. El detalle vive en las otras pestañas.
import { TESTS, TESTS_BY_ID } from "../data/tests.js";
import { buildDemo } from "../data/demo.js";
import { weekKey } from "../data/checkin.js";
import * as store from "../store.js";
import { overallScore, level, nextLevel, priorities, POSITIONS, jointPriorities, wellness, nextStep, checkinInsights } from "../scoring.js";
import { ring, bar, icon, fmt, today, tierClass, levelChip } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";
import { drillChips, bindDrills } from "./exercise-sheet.js";
import { openShareSheet } from "./share.js";
import { openSendSheet } from "./send.js";
import { openCheckinSheet } from "./checkin.js";
import { backupNow, needsBackup } from "./backup.js";

export function render(root) {
  const p = store.profile();
  const hasData = store.entries().length > 0;
  const overall = overallScore();
  const week = weekKey(today());
  const checkin = store.checkinFor(week);
  const mode = p?.mode ?? "casa";

  root.innerHTML = `
    ${!store.storageOk ? `<div class="banner warn">${icon("alert")}<span>Este navegador no deja guardar datos (¿modo privado?). Lo que registres se perderá al cerrar. Abre la app en una pestaña normal.</span></div>` : ""}
    ${store.hasDemo() ? `<div class="banner">Estás viendo datos de ejemplo. <button class="link" data-act="clear-demo">Quitarlos</button></div>` : ""}
    ${needsBackup() ? `
      <div class="banner backup">${icon("download")}<span>Tus datos viven solo en este celular. ${store.lastBackup() ? "Hace más de un mes que no haces un respaldo." : "Todavía no has hecho ningún respaldo."}</span>
        <button class="btn secondary small-btn" data-act="backup">Respaldar</button>
      </div>` : ""}

    ${hasData ? scoreCard(overall, p) : emptyScoreCard(p)}

    ${stepCard(checkin)}

    ${hasData ? focusCard(mode) : ""}

    ${tiles(checkin)}
  `;

  root.querySelectorAll('[data-act="demo"]').forEach((b) => b.addEventListener("click", () => store.loadDemo(buildDemo())));
  root.querySelectorAll('[data-act="clear-demo"]').forEach((b) => b.addEventListener("click", () => store.clearDemo()));
  root.querySelector('[data-act="share"]')?.addEventListener("click", () => (p?.hasCoach ? openSendSheet() : openShareSheet()));
  root.querySelector('[data-act="backup"]')?.addEventListener("click", async () => {
    await backupNow();
    render(root);
  });
  root.querySelectorAll('[data-act="checkin"]').forEach((b) => b.addEventListener("click", openCheckinSheet));
  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
  bindDrills(root);
}

function scoreCard(overall, p) {
  const next = nextLevel(overall);
  return `
    <section class="card score-card ${tierClass(overall)}">
      ${ring(overall, { size: 92, stroke: 9 })}
      <div class="score-text">
        <p class="eyebrow">Ulti Score${p?.position ? ` · ${POSITIONS[p.position]}` : ""}</p>
        <h1 class="display">${level(overall).name}</h1>
        <p class="muted small">${next ? `${next.min - overall} pts para ${next.name}` : "Nivel máximo"}</p>
      </div>
      <button class="icon-btn" data-act="share" aria-label="${p?.hasCoach ? "Enviar a mi entrenador" : "Compartir mis resultados"}">${icon(p?.hasCoach ? "send" : "upload")}</button>
    </section>`;
}

function emptyScoreCard(p) {
  return `
    <section class="card score-card empty">
      ${ring(null, { size: 92, stroke: 9 })}
      <div class="score-text">
        <p class="eyebrow">Ulti Score</p>
        <h1 class="display">${p?.name ? `Vamos, ${p.name}` : "Empieza"}</h1>
        <p class="muted small">Se llena con tus pruebas. <button class="link" data-act="demo">Ver un ejemplo</button></p>
      </div>
    </section>`;
}

// La única acción recomendada para hoy.
function stepCard(checkin) {
  const step = nextStep({ checkinDone: !!checkin, wellnessNow: checkin ? wellness(checkin) : null });
  const prev = checkin ? store.checkins().filter((c) => c.week < checkin.week).pop() : null;
  const alert = checkin ? checkinInsights(checkin, prev).find((i) => i.level === "red") : null;
  const action = {
    checkin: `<button class="btn primary block" data-act="checkin">${icon("check")} Hacer check-in</button>`,
    rest: `<a class="btn primary block" href="#blindaje">${icon("shield")} Ver ejercicios de blindaje</a>`,
    test: `<button class="btn primary block" data-test="${step.testId}">${icon("timer")} Medir ahora</button>`,
    train: `<a class="btn primary block" href="#cuerpo/${step.muscleId}">${icon("body")} Ver ejercicios</a>`,
  }[step.kind];
  return `
    <section class="card step-card">
      <p class="eyebrow">Tu siguiente paso</p>
      <h2 class="step-title">${step.title}</h2>
      <p class="muted small">${step.text}</p>
      ${alert ? `<p class="step-alert">${icon("alert")}<span>${alert.text}</span></p>` : ""}
      ${action}
    </section>`;
}

// Foco #1 a la vista; los otros dos, plegados.
function focusCard(mode) {
  const [first, ...rest] = priorities().slice(0, 3);
  const row = ({ id, muscle, score }, i) => `
    <a class="focus-line" href="#cuerpo/${id}">
      <span class="focus-rank num">${i + 1}</span>
      <span class="focus-name">${muscle.name}</span>
      <span class="row-score"><span class="num score">${score ?? "–"}</span>${score != null ? levelChip(score) : ""}</span>
    </a>`;
  const untested = Object.keys(first.muscle.tests).find((t) => !store.latest(t));
  return `
    <section class="card focus-card">
      <p class="eyebrow">Tu foco</p>
      ${row(first, 0)}
      ${bar(first.score)}
      ${first.score == null && untested
        ? `<button class="add-pill" data-test="${untested}">${icon("plus")} Mídelo: ${TESTS_BY_ID[untested].name}</button>`
        : drillChips(first.muscle.drills[mode].slice(0, 2))}
      <details class="more-focus">
        <summary><span class="summary-label muted small">Focos 2 y 3</span><span class="toggle"><span class="when-closed">Ver más</span><span class="when-open">Ver menos</span>${icon("down")}</span></summary>
        <div class="focus-rest">${rest.map((x, i) => row(x, i + 1)).join("")}</div>
      </details>
    </section>`;
}

// Tres accesos rápidos: blindaje, bienestar y última medición.
function tiles(checkin) {
  const joints = jointPriorities();
  const top = joints[0];
  const alerts = new Set(joints.flatMap((j) => j.alerts.map((a) => a.testId))).size;
  const lastEntry = store.entries().pop();
  const lastTest = lastEntry ? TESTS_BY_ID[lastEntry.testId] : null;
  return `
    <section class="tiles">
      <a class="card tile" href="#blindaje">
        <span class="eyebrow">Blindaje</span>
        <span class="tile-value">${top.joint.name}</span>
        <span class="muted small">${alerts ? `${alerts} alerta${alerts > 1 ? "s" : ""}` : top.score != null ? `${top.score} pts` : "Sin medir"}</span>
      </a>
      <button class="card tile" data-act="checkin">
        <span class="eyebrow">Bienestar</span>
        <span class="tile-value num">${checkin ? wellness(checkin) : "–"}</span>
        <span class="muted small">${checkin ? "esta semana" : "sin check-in"}</span>
      </button>
      ${lastTest
        ? `<button class="card tile" data-test="${lastTest.id}">
            <span class="eyebrow">Última</span>
            <span class="tile-value num">${fmt(lastEntry.value, lastTest.decimals)}<small>${lastTest.unit}</small></span>
            <span class="muted small">${lastTest.name}</span>
          </button>`
        : `<a class="card tile" href="#pruebas">
            <span class="eyebrow">Pruebas</span>
            <span class="tile-value num">${TESTS.length}</span>
            <span class="muted small">por medir</span>
          </a>`}
    </section>`;
}
