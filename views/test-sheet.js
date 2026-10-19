// Detalle de una prueba: resultado, historial, registro (con cronómetro si aplica) y edición.
import { TESTS_BY_ID, CATEGORIES } from "../data/tests.js";
import { MUSCLES } from "../data/muscles.js";
import * as store from "../store.js";
import { testScore, target, isImprovement, level, snapshot } from "../scoring.js";
import { openSheet } from "./sheet.js";
import { icon, fmt, fmtDate, today, historyChart, levelChip, tierClass, toast } from "../ui.js";

let editing = null; // id de la medición que se está editando

export function openTestSheet(testId) {
  editing = null;
  openSheet((root) => render(root, testId));
}

function render(root, testId) {
  const test = TESTS_BY_ID[testId];
  const tgt = target(testId);
  const cat = CATEGORIES.find((c) => c.id === test.cat);
  const list = store.entries(testId);
  const last = list[list.length - 1];
  const prev = list[list.length - 2];
  const score = last ? testScore(testId, last.value) : null;
  const lowerIsBetter = tgt.elite < tgt.base;
  const best = list.length ? list.reduce((a, b) => (isImprovement(testId, a.value, b.value) ? b : a)) : null;

  root.innerHTML = `
    <p class="eyebrow">${cat.name}</p>
    <h2 class="sheet-title">${test.name}</h2>

    <div class="result-hero ${tierClass(score)}">
      <div>
        <span class="stat-label">${last ? `Última · ${fmtDate(last.date)}` : "Sin medir"}</span>
        <span class="result-value num">${last ? fmt(last.value, test.decimals) : "–"}<small>${test.unit}</small></span>
        ${prev ? deltaLine(testId, prev, last, test) : ""}
      </div>
      <div class="result-score">
        <span class="num result-score-num">${score ?? "–"}</span>
        ${score != null ? levelChip(score) : ""}
      </div>
    </div>

    <div class="meta-row">
      <span>${icon("target")} Meta Excelente: <strong class="num">${fmt(tgt.elite, test.decimals)} ${test.unit}</strong></span>
      <span class="muted">${lowerIsBetter ? "Menos es mejor" : "Más es mejor"}</span>
    </div>

    ${list.length >= 3
      ? historyChart(list, test, tgt)
      : list.length
        ? `<p class="muted small chart-hint">Con 3 mediciones aparece tu gráfica de progreso.</p>`
        : ""}

    ${test.timer ? timerBlock() : ""}

    <form class="entry-form">
      <label class="field">
        <span>Resultado (${test.unit})</span>
        <input name="value" type="number" inputmode="decimal" step="any" min="0" required>
        <small class="error" hidden>Escribe un número</small>
      </label>
      <label class="field">
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
      <h3 class="subhead">Historial ${best && list.length > 1 ? `<span class="muted small">· mejor: <span class="num">${fmt(best.value, test.decimals)} ${test.unit}</span></span>` : ""}</h3>
      <ul class="history-list">
        ${[...list].reverse().map((e) => (editing === e.id ? editRow(e, test) : historyRow(e, test, e === best && list.length > 1))).join("")}
      </ul>` : ""}
  `;

  bindForm(root, testId, test);
  if (test.timer) bindTimer(root);

  root.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => {
      editing = b.dataset.edit;
      render(root, testId);
    })
  );
  root.querySelector("[data-cancel]")?.addEventListener("click", () => {
    editing = null;
    render(root, testId);
  });
  root.querySelector(".edit-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const v = Number(data.get("value"));
    if (!(data.get("value") !== "" && v >= 0)) return;
    const id = editing;
    editing = null;
    store.updateEntry(id, v, data.get("date"));
  });
  root.querySelectorAll("[data-remove]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (confirm("¿Borrar esta medición?")) {
        editing = null;
        store.removeEntry(btn.dataset.remove);
      }
    })
  );
}

function deltaLine(testId, prev, last, test) {
  if (prev.value === last.value) return `<span class="delta muted">Igual que la anterior</span>`;
  const good = isImprovement(testId, prev.value, last.value);
  const diff = Math.abs(last.value - prev.value);
  return `<span class="delta ${good ? "good" : "bad"}">${icon(last.value > prev.value ? "up" : "down")}${fmt(diff, test.decimals)} ${test.unit} vs. anterior</span>`;
}

function historyRow(e, test, isBest) {
  return `
    <li>
      <span class="muted">${fmtDate(e.date)}${e.demo ? ' <span class="tag">ejemplo</span>' : ""}${isBest ? ` <span class="tag best">${icon("star")} mejor</span>` : ""}</span>
      <span class="num">${fmt(e.value, test.decimals)} ${test.unit}</span>
      <button class="icon-btn" data-edit="${e.id}" aria-label="Editar medición del ${fmtDate(e.date)}">${icon("edit")}</button>
    </li>`;
}

function editRow(e, test) {
  return `
    <li class="editing">
      <form class="edit-form">
        <input name="value" type="number" inputmode="decimal" step="any" min="0" value="${e.value}" aria-label="Resultado (${test.unit})" required>
        <input name="date" type="date" value="${e.date}" max="${today()}" aria-label="Fecha" required>
        <div class="edit-actions">
          <button type="button" class="icon-btn danger" data-remove="${e.id}" aria-label="Borrar">${icon("trash")}</button>
          <button type="button" class="btn ghost" data-cancel>Cancelar</button>
          <button type="submit" class="btn primary">Guardar</button>
        </div>
      </form>
    </li>`;
}

function bindForm(root, testId, test) {
  const form = root.querySelector(".entry-form");
  form.addEventListener("input", () => (form.querySelector(".error").hidden = true));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const raw = data.get("value");
    const value = Number(raw);
    if (raw === "" || !(value >= 0)) {
      form.querySelector(".error").hidden = false;
      form.querySelector("[name=value]").focus();
      return;
    }
    const before = snapshot();
    store.addEntry(testId, value, data.get("date"));
    announce(testId, test, value, before, snapshot());
  });
}

// Después de registrar: qué significa esa medición y qué cambió en tus músculos y prioridades.
function announce(testId, test, value, before, after) {
  const s = testScore(testId, value);
  const lines = [];
  for (const [id, now] of Object.entries(after.muscles)) {
    const was = before.muscles[id];
    if (now == null || now === was) continue;
    const lvlChanged = level(now).id !== level(was).id;
    if (was == null) lines.push(`<li><strong>${MUSCLES[id].name}</strong> ya tiene puntaje: ${now}</li>`);
    else if (lvlChanged) lines.push(`<li><strong>${MUSCLES[id].name}</strong> pasó a ${level(now).name} (${now})</li>`);
  }
  if (after.top !== before.top && after.top) {
    lines.push(`<li>Tu prioridad #1 ahora: <strong>${MUSCLES[after.top].name}</strong></li>`);
  }
  toast(`
    <div class="toast-head">
      <span>${icon("check")} ${test.name}: <span class="num">${fmt(value, test.decimals)} ${test.unit}</span></span>
      ${levelChip(s)}
    </div>
    ${lines.length ? `<ul>${lines.slice(0, 3).join("")}</ul>` : ""}`);
}

// ---------- Cronómetro ----------

function timerBlock() {
  return `
    <div class="timer" aria-live="polite">
      <span class="timer-display num" data-timer-display>0.0</span>
      <button type="button" class="btn primary timer-btn" data-timer-toggle>${icon("play")} Iniciar</button>
      <p class="muted small">Cuenta 3‑2‑1 con sonido. Al parar, el tiempo pasa al formulario para que lo revises y registres.</p>
    </div>`;
}

let audio = null;
function beep(freq = 880, ms = 140) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.15;
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch {
    // Sin audio: el cronómetro funciona igual.
  }
}

function bindTimer(root) {
  const display = root.querySelector("[data-timer-display]");
  const btn = root.querySelector("[data-timer-toggle]");
  const input = root.querySelector(".entry-form [name=value]");
  let state = "idle"; // idle | countdown | running
  let start = 0;
  let raf = 0;
  let countdown = 0;

  const tick = () => {
    display.textContent = ((performance.now() - start) / 1000).toFixed(1);
    raf = requestAnimationFrame(tick);
  };

  btn.addEventListener("click", () => {
    if (state === "idle") {
      state = "countdown";
      btn.innerHTML = `${icon("stop")} Cancelar`;
      let n = 3;
      display.textContent = n;
      beep(660);
      countdown = setInterval(() => {
        n -= 1;
        if (n > 0) {
          display.textContent = n;
          beep(660);
          return;
        }
        clearInterval(countdown);
        beep(1100, 300);
        state = "running";
        start = performance.now();
        btn.innerHTML = `${icon("stop")} Parar`;
        btn.classList.add("running");
        tick();
      }, 1000);
    } else if (state === "countdown") {
      clearInterval(countdown);
      state = "idle";
      display.textContent = "0.0";
      btn.innerHTML = `${icon("play")} Iniciar`;
    } else {
      cancelAnimationFrame(raf);
      beep(440, 300);
      const secs = Math.round((performance.now() - start) / 1000);
      state = "idle";
      btn.classList.remove("running");
      btn.innerHTML = `${icon("play")} Otra vez`;
      input.value = secs;
      input.focus();
    }
  });
}
