// Detalle de una prueba: resultado, historial, registro (con cronómetro si aplica) y edición.
// Soporta pruebas de un valor, de izquierda/derecha y de varias repeticiones.
import { TESTS_BY_ID, CATEGORIES, entryValue } from "../data/tests.js";
import { MUSCLES } from "../data/muscles.js";
import * as store from "../store.js";
import { testScore, target, isImprovement, level, snapshot, asymmetry, asymmetryFlag, isAgeAdjusted } from "../scoring.js";
import { openSheet } from "./sheet.js";
import { openJumpVideo } from "./jump-video.js";
import { WARMUP, isMaxEffort, zonesForTest } from "../data/safety.js";
import { JOINTS, SIDES, sidePhrase } from "../data/joints.js";
import { icon, fmt, fmtDate, today, historyChart, levelChip, tierClass, toast, summary } from "../ui.js";

let editing = null; // id de la medición que se está editando
let prefill = null; // valor que llega desde otra herramienta (p. ej. salto por video)

export function openTestSheet(testId, opts = {}) {
  editing = null;
  prefill = opts.prefill ?? null;
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
  const valueLabel = test.kind === "bilateral" ? "Lado débil" : test.kind === "multi" ? "Promedio" : "Última";

  root.innerHTML = `
    <p class="eyebrow">${cat.name}</p>
    <h2 class="sheet-title">${test.name}</h2>

    <div class="result-hero ${tierClass(score)}">
      <div>
        <span class="stat-label">${last ? `${valueLabel} · ${fmtDate(last.date)}` : "Sin medir"}</span>
        <span class="result-value num">${last ? fmt(last.value, test.decimals) : "–"}<small>${test.unit}</small></span>
        ${prev ? deltaLine(testId, prev, last, test) : ""}
      </div>
      <div class="result-score">
        <span class="num result-score-num">${score ?? "–"}</span>
        ${score != null ? levelChip(score) : ""}
      </div>
    </div>

    ${last ? extraInsight(test, last) : ""}

    <div class="meta-row">
      <span>${icon("target")} Meta Excelente${isAgeAdjusted(testId) ? ` a tus ${store.profile().age} años` : ""}: <strong class="num">${fmt(tgt.elite, test.decimals)} ${test.unit}</strong></span>
      <span class="muted">${lowerIsBetter ? "Menos es mejor" : "Más es mejor"}</span>
    </div>

    ${list.length >= 3
      ? historyChart(list, test, tgt)
      : list.length
        ? `<p class="muted small chart-hint">Con 3 mediciones aparece tu gráfica de progreso.</p>`
        : ""}

    ${safetyBlock(test)}

    ${test.timer ? timerBlock(test) : ""}
    ${testId === "vertJump" ? `<button type="button" class="btn secondary block video-measure" data-jump-video>${icon("video")} Medir con video (tiempo de vuelo)</button>` : ""}

    <form class="entry-form ${test.kind}">
      ${valueInputs(test)}
      <label class="field date-field">
        <span>Fecha</span>
        <input name="date" type="date" value="${today()}" max="${today()}" required>
      </label>
      <small class="error" hidden>Completa todos los valores con números</small>
      <button type="submit" class="btn primary">${icon("plus")} Registrar</button>
    </form>

    <details class="protocol" ${list.length ? "" : "open"}>
      ${summary("Cómo hacer la prueba")}
      <p>${test.how}</p>
    </details>
    <a class="btn secondary block video-btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(test.video)}" target="_blank" rel="noopener">${icon("video")} Ver cómo se hace en YouTube</a>

    ${list.length ? `
      <h3 class="subhead">Historial ${best && list.length > 1 ? `<span class="muted small">· mejor: <span class="num">${fmt(best.value, test.decimals)} ${test.unit}</span></span>` : ""}</h3>
      <ul class="history-list">
        ${[...list].reverse().map((e) => (editing === e.id ? editRow(e, test) : historyRow(e, test, e === best && list.length > 1))).join("")}
      </ul>` : ""}
  `;

  bindForm(root, testId, test);
  root.querySelector("[data-jump-video]")?.addEventListener("click", () =>
    openJumpVideo((cm) => openTestSheet("vertJump", { prefill: cm }))
  );
  if (prefill != null) {
    const input = root.querySelector(".entry-form [data-value]");
    input.value = prefill;
    input.closest(".field").classList.add("prefilled");
    input.focus();
    prefill = null;
  }
  if (test.timer) bindTimer(root, test);

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
    const parsed = readValues(e.target, test);
    if (!parsed) return;
    const id = editing;
    editing = null;
    store.updateEntry(id, parsed.value, new FormData(e.target).get("date"), parsed.extra);
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

// ---------- Seguridad ----------

function safetyBlock(test) {
  const injured = store.injuries().filter((i) => i.status === "activa" && zonesForTest(test.id).includes(i.zone));
  const minor = (store.profile()?.age ?? 99) < 18;
  return `
    ${injured.map((i) => `
      <div class="banner danger">${icon("alert")}<span>Tienes una lesión activa en <strong>${JOINTS[i.zone].name.toLowerCase()}${sidePhrase(i.side)}</strong> y esta prueba carga esa zona. No la hagas hasta que tu fisio lo autorice.</span></div>`).join("")}
    ${isMaxEffort(test) ? `
      <details class="warmup">
        <summary>${icon("zap")} Prueba de esfuerzo máximo: calienta 10 min antes${minor ? " y hazla con tu entrenador presente" : ""}</summary>
        <ol>${WARMUP.map((w) => `<li><strong>${w.title}</strong> ${w.text}</li>`).join("")}</ol>
      </details>` : ""}`;
}

// ---------- Campos según el tipo de prueba ----------

function valueInputs(test, entry) {
  const num = (name, label, value = "") => `
    <label class="field">
      <span>${label}</span>
      <input name="${name}" type="number" inputmode="decimal" step="any" min="0" value="${value}" data-value required>
    </label>`;
  if (test.kind === "bilateral") {
    return `<div class="value-grid two">${num("L", `Izquierda (${test.unit})`, entry?.sides?.L)}${num("R", `Derecha (${test.unit})`, entry?.sides?.R)}</div>`;
  }
  if (test.kind === "multi") {
    return `<div class="value-grid three">${Array.from({ length: test.reps }, (_, i) => num(`rep${i}`, `Rep ${i + 1}`, entry?.reps?.[i])).join("")}</div>`;
  }
  return num("value", `Resultado (${test.unit})`, entry?.value);
}

// Lee los valores del formulario. Devuelve null si falta alguno.
function readValues(form, test) {
  const inputs = [...form.querySelectorAll("[data-value]")];
  const nums = inputs.map((i) => (i.value === "" ? NaN : Number(i.value)));
  if (nums.some((n) => !(n >= 0))) return null;
  if (test.kind === "bilateral") {
    const extra = { sides: { L: nums[0], R: nums[1] } };
    return { value: entryValue(test, extra), extra };
  }
  if (test.kind === "multi") {
    const extra = { reps: nums };
    return { value: Math.round(entryValue(test, extra) * 100) / 100, extra };
  }
  return { value: nums[0], extra: {} };
}

// Información extra según el tipo: asimetría izquierda/derecha o caída por fatiga.
function extraInsight(test, e) {
  if (e.sides) {
    const a = asymmetry(test.id);
    const flag = a && asymmetryFlag(a.pct);
    return `
      <div class="sides-row">
        <span>Izq <strong class="num">${fmt(e.sides.L, test.decimals)}</strong></span>
        <span>Der <strong class="num">${fmt(e.sides.R, test.decimals)}</strong></span>
        <span class="asym ${flag ?? "ok"}">${flag ? icon("alert") : icon("check")} ${a ? `${a.pct} % de diferencia` : "Parejo"}${flag ? ` · ${a.weak === "L" ? "izquierda" : "derecha"} más débil` : ""}</span>
      </div>`;
  }
  if (e.reps) {
    const lowerIsBetter = target(test.id).elite < target(test.id).base;
    const bestRep = lowerIsBetter ? Math.min(...e.reps) : Math.max(...e.reps);
    const fatigue = lowerIsBetter ? (e.value / bestRep - 1) * 100 : (1 - e.value / bestRep) * 100;
    const flag = fatigue >= 8 ? "red" : fatigue >= 5 ? "yellow" : null;
    return `
      <div class="sides-row">
        <span>Mejor rep <strong class="num">${fmt(bestRep, test.decimals)} ${test.unit}</strong></span>
        <span class="asym ${flag ?? "ok"}">${flag ? icon("alert") : icon("check")} Caída por fatiga: ${fmt(fatigue, 1)} %</span>
      </div>`;
  }
  return "";
}

function deltaLine(testId, prev, last, test) {
  if (prev.value === last.value) return `<span class="delta muted">Igual que la anterior</span>`;
  const good = isImprovement(testId, prev.value, last.value);
  const diff = Math.abs(last.value - prev.value);
  return `<span class="delta ${good ? "good" : "bad"}">${icon(last.value > prev.value ? "up" : "down")}${fmt(diff, test.decimals)} ${test.unit} vs. anterior</span>`;
}

function historyRow(e, test, isBest) {
  const detail = e.sides
    ? `<span class="muted small">I ${fmt(e.sides.L, test.decimals)} · D ${fmt(e.sides.R, test.decimals)}</span>`
    : e.reps
      ? `<span class="muted small">${e.reps.map((r) => fmt(r, test.decimals)).join(" · ")}</span>`
      : "";
  return `
    <li>
      <span class="muted">${fmtDate(e.date)}${e.demo ? ' <span class="tag">ejemplo</span>' : ""}${isBest ? ` <span class="tag best">${icon("star")} mejor</span>` : ""}${detail ? `<br>${detail}` : ""}</span>
      <span class="num">${fmt(e.value, test.decimals)} ${test.unit}</span>
      <button class="icon-btn" data-edit="${e.id}" aria-label="Editar medición del ${fmtDate(e.date)}">${icon("edit")}</button>
    </li>`;
}

function editRow(e, test) {
  return `
    <li class="editing">
      <form class="edit-form">
        ${valueInputs(test, e)}
        <label class="field">
          <span>Fecha</span>
          <input name="date" type="date" value="${e.date}" max="${today()}" required>
        </label>
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
  const error = form.querySelector(".error");
  form.addEventListener("input", () => (error.hidden = true));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const parsed = readValues(form, test);
    if (!parsed) {
      error.hidden = false;
      form.querySelector("[data-value]:placeholder-shown, [data-value]")?.focus();
      return;
    }
    const before = snapshot();
    store.addEntry(testId, parsed.value, new FormData(form).get("date"), parsed.extra);
    announce(testId, test, parsed.value, before, snapshot());
  });
}

// Después de registrar: qué significa esa medición y qué cambió en tus músculos y prioridades.
function announce(testId, test, value, before, after) {
  const s = testScore(testId, value);
  const lines = [];
  const a = test.kind === "bilateral" ? asymmetry(testId) : null;
  if (a && asymmetryFlag(a.pct)) {
    lines.push(`<li>Ojo: ${a.pct} % de diferencia entre lados (${a.weak === "L" ? "izquierda" : "derecha"} más débil)</li>`);
  }
  for (const [id, now] of Object.entries(after.muscles)) {
    const was = before.muscles[id];
    if (now == null || now === was) continue;
    if (was == null) lines.push(`<li><strong>${MUSCLES[id].name}</strong> ya tiene puntaje: ${now}</li>`);
    else if (level(now).id !== level(was).id) lines.push(`<li><strong>${MUSCLES[id].name}</strong> pasó a ${level(now).name} (${now})</li>`);
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

// ---------- Cronómetros ----------
// hold: 3-2-1 y cuenta hacia arriba. reactive: flecha al azar tras una espera aleatoria.
// interval: sprints con salida fija cada `rest` segundos. Todos llenan el siguiente campo vacío.

const TIMER_HELP = {
  hold: "Cuenta 3‑2‑1 con sonido. Al parar, el tiempo pasa al siguiente campo vacío para que lo revises.",
  reactive: "Tu compañero sostiene el celular. Tras una espera al azar aparece la flecha: corre a ese lado y vuelve. Tu compañero toca Parar.",
  interval: "3‑2‑1 y sales. Tu compañero toca Parar al cruzar los 30 m. La siguiente salida suena sola a los 20 s.",
};

function timerBlock(test) {
  return `
    <div class="timer" aria-live="polite">
      <span class="timer-status muted small" data-timer-status>${test.kind === "multi" ? `Rep 1 de ${test.reps}` : ""}</span>
      <span class="timer-arrow" data-timer-arrow hidden></span>
      <span class="timer-display num" data-timer-display>0.0</span>
      <button type="button" class="btn primary timer-btn" data-timer-toggle>${icon("play")} Iniciar</button>
      <p class="muted small">${TIMER_HELP[test.timer]}</p>
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

function bindTimer(root, test) {
  const display = root.querySelector("[data-timer-display]");
  const status = root.querySelector("[data-timer-status]");
  const arrow = root.querySelector("[data-timer-arrow]");
  const btn = root.querySelector("[data-timer-toggle]");
  const inputs = [...root.querySelectorAll(".entry-form [data-value]")];
  let state = "idle"; // idle | waiting | running | resting
  let start = 0;
  let raf = 0;
  let pending = [];

  const clearPending = () => {
    pending.forEach(clearTimeout);
    pending.forEach(clearInterval);
    pending = [];
  };
  const nextEmpty = () => inputs.find((i) => i.value === "");
  const setBtn = (label, ico, running = false) => {
    btn.innerHTML = `${icon(ico)} ${label}`;
    btn.classList.toggle("running", running);
  };
  const updateStatus = () => {
    if (test.kind !== "multi") return;
    const done = inputs.filter((i) => i.value !== "").length;
    status.textContent = done >= inputs.length ? "Listo: revisa y registra" : `Rep ${done + 1} de ${inputs.length}`;
  };
  const tick = () => {
    display.textContent = ((performance.now() - start) / 1000).toFixed(test.timer === "hold" ? 1 : 2);
    raf = requestAnimationFrame(tick);
  };
  const run = () => {
    state = "running";
    start = performance.now();
    setBtn("Parar", "stop", true);
    tick();
  };
  const countdownThen = (fn, from = 3) => {
    state = "waiting";
    setBtn("Cancelar", "stop");
    let n = from;
    display.textContent = n;
    beep(660);
    const iv = setInterval(() => {
      n -= 1;
      if (n > 0) {
        display.textContent = n;
        beep(660);
        return;
      }
      clearInterval(iv);
      beep(1100, 300);
      fn();
    }, 1000);
    pending.push(iv);
  };
  const startRep = () => {
    if (test.timer === "reactive") {
      state = "waiting";
      setBtn("Cancelar", "stop");
      display.textContent = "…";
      arrow.hidden = true;
      const t = setTimeout(() => {
        const left = Math.random() < 0.5;
        arrow.textContent = left ? "←" : "→";
        arrow.hidden = false;
        beep(left ? 700 : 1000, 250);
        run();
      }, 1500 + Math.random() * 2000);
      pending.push(t);
    } else {
      countdownThen(run);
    }
  };
  const reset = () => {
    clearPending();
    cancelAnimationFrame(raf);
    state = "idle";
    arrow.hidden = true;
    display.textContent = "0.0";
    setBtn(nextEmpty() ? "Iniciar" : "Otra vez", "play");
    updateStatus();
  };

  btn.addEventListener("click", () => {
    if (state === "idle") {
      if (!nextEmpty()) inputs.forEach((i) => (i.value = ""));
      updateStatus();
      startRep();
    } else if (state === "waiting" || state === "resting") {
      reset();
    } else {
      // Parar: guardar el tiempo en el siguiente campo vacío.
      cancelAnimationFrame(raf);
      beep(440, 250);
      const secs = (performance.now() - start) / 1000;
      const field = nextEmpty();
      if (field) field.value = test.timer === "hold" ? Math.round(secs) : secs.toFixed(2);
      arrow.hidden = true;
      updateStatus();
      if (!nextEmpty()) {
        state = "idle";
        setBtn("Otra vez", "play");
        return;
      }
      if (test.timer === "interval") {
        // Salida fija: el descanso es lo que falta para completar `rest` segundos desde la salida.
        state = "resting";
        setBtn("Cancelar", "stop");
        let left = Math.max(3, Math.round(test.rest - secs));
        display.textContent = left;
        const iv = setInterval(() => {
          left -= 1;
          if (left > 3) {
            display.textContent = left;
            return;
          }
          clearInterval(iv);
          countdownThen(run, left);
        }, 1000);
        pending.push(iv);
      } else if (test.timer === "reactive") {
        state = "idle";
        setBtn("Siguiente", "play");
      } else {
        state = "idle";
        setBtn("Otra vez", "play");
      }
    }
  });
}
