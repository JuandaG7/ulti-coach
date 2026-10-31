// Plan: tu semana de entrenamiento, armada con todo lo que la app sabe de ti, y tu vuelta tras lesión.
import * as store from "../store.js";
import { JOINTS, sidePhrase } from "../data/joints.js";
import { WARMUP } from "../data/safety.js";
import { STAGES } from "../data/return.js";
import { weekKey } from "../data/checkin.js";
import { weekPlan, stageCriteria, doneThisWeek, RETEST_DAYS } from "../plan.js";
import { GOALS, FEELS, EQUIPMENT, MINUTES } from "../data/plan-prefs.js";
import { TESTS_BY_ID } from "../data/tests.js";
import { analyzeForehand, proBand, scoreVsPro, consistency, METRICS } from "../forehand.js";
import { listClips } from "../clips.js";
import { icon, today, tierClass, fmtDate } from "../ui.js";
import { openSheet, closeSheet } from "./sheet.js";
import { bindDrills } from "./exercise-sheet.js";
import { openTestSheet } from "./test-sheet.js";
import { openCheckinSheet } from "./checkin.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DAYS = [2, 3, 4, 5];

// La métrica de tu forehand más lejos del rango pro (sin contar las que saltan mucho entre videos).
// Los clips viven en IndexedDB (asíncrono): se calcula una vez y se redibuja cuando está lista.
let throwFocus;
let justDone = null; // la sesión recién marcada queda abierta para decir cómo te fue
let throwKey = null;
async function loadThrowFocus(root) {
  try {
    const [pros, mine] = await Promise.all([listClips("pro"), listClips("mine")]);
    const key = `${pros.length}:${mine.length}:${mine[0]?.id}:${mine[0]?.shift ?? 0}`;
    if (key === throwKey) return;
    throwKey = key;
    const proA = pros.map(analyzeForehand).filter(Boolean);
    const myA = mine.map(analyzeForehand).filter(Boolean);
    let focus = null;
    if (proA.length && myA.length) {
      const bands = Object.fromEntries(METRICS.filter((m) => m.scope === "pro").map((m) => [m.id, proBand(proA.map((a) => a.metrics[m.id]))]));
      const steady = consistency(myA, bands);
      const rows = METRICS.filter((m) => m.scope === "pro" && m.drills && steady[m.id]?.level !== "muy variable")
        .map((m) => ({ metric: m.id, score: scoreVsPro(m.id, myA[0].metrics[m.id], bands[m.id]), value: myA[0].metrics[m.id], band: bands[m.id] }))
        .filter((r) => r.score != null && r.score < 85)
        .sort((a, b) => a.score - b.score);
      focus = rows[0] ?? null;
    }
    throwFocus = focus;
    if (root.isConnected) render(root);
  } catch (err) {
    console.error(err);
  }
}

export function render(root) {
  const p = store.profile();
  const mode = p?.mode ?? "casa";
  const days = p?.planDays ?? 3;
  const date = today();
  const plan = weekPlan({ days, mode, throwFocus, today: date });
  const done = doneThisWeek(date);
  const next = plan.sessions.find((s) => !done.has(s.n));
  const week = weekKey(date);
  const feels = Object.fromEntries(store.planLog().filter((l) => l.week === week).map((l) => [l.n, l.feel ?? null]));

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Plan</h1>
      <p class="muted small">Tu semana, armada con tus pruebas, tu blindaje, tu forehand y tu check-in. Cambia cuando te mides de nuevo.</p>
    </header>

    <section class="card plan-settings">
      <div class="field">
        <span class="eyebrow">Días por semana</span>
        <div class="segmented wide">${DAYS.map((d) => `<label><input type="radio" name="days" value="${d}" ${d === days ? "checked" : ""}><span>${d}</span></label>`).join("")}</div>
      </div>
      <div class="field">
        <span class="eyebrow">Dónde entrenas</span>
        <div class="segmented wide">
          <label><input type="radio" name="mode" value="casa" ${mode === "casa" ? "checked" : ""}><span>Casa</span></label>
          <label><input type="radio" name="mode" value="gym" ${mode === "gym" ? "checked" : ""}><span>Gimnasio</span></label>
        </div>
      </div>
      <div class="field">
        <span class="eyebrow">Minutos por sesión</span>
        <div class="segmented wide">${MINUTES.map((m) => `<label><input type="radio" name="minutes" value="${m}" ${m === (plan.prefs?.minutes ?? 45) ? "checked" : ""}><span>${m}</span></label>`).join("")}</div>
      </div>
    </section>

    ${diagnosisCard(plan.prefs)}

    ${reasonsCard(plan)}

    ${plan.notes.map((n) => `<div class="banner ${n.level === "yellow" ? "warn" : ""}">${icon("alert")}<span>${n.text}</span></div>`).join("")}

    ${plan.injury ? returnCard(plan.injury, date) : ""}

    <section class="plan-week">
      <div class="section-title-row">
        <h2 class="section-title">Esta semana</h2>
        <span class="muted small num">${done.size} de ${plan.sessions.length} hechas</span>
      </div>
      <details class="card plan-warmup">
        <summary><span class="summary-label">${icon("zap")} Antes de cada sesión: calentamiento de 10 min</span>${icon("down")}</summary>
        <ol class="tips">${WARMUP.map((w) => `<li><strong>${w.title}.</strong> ${w.text}</li>`).join("")}</ol>
      </details>
      ${plan.sessions.map((s) => sessionCard(s, done.has(s.n), s === next, feels[s.n], date)).join("")}
    </section>

    <p class="muted small plan-foot">${icon("shield")} Si algo duele (no cansancio), para. El plan se arma con estimaciones: tu entrenador o fisio pueden ajustarlo.</p>
  `;

  root.querySelectorAll("[name=days]").forEach((i) => i.addEventListener("change", () => store.saveProfile({ planDays: Number(i.value) })));
  root.querySelectorAll("[name=mode]").forEach((i) => i.addEventListener("change", () => store.saveProfile({ mode: i.value })));
  root.querySelectorAll("[name=minutes]").forEach((i) => i.addEventListener("change", () => savePrefs({ minutes: Number(i.value) })));
  root.querySelectorAll('[data-act="diagnosis"]').forEach((b) => b.addEventListener("click", openDiagnosis));
  root.querySelectorAll("[data-done]").forEach((b) => b.addEventListener("click", () => {
    justDone = Number(b.dataset.done);
    store.toggleSession({ date, week, n: justDone });
  }));
  root.querySelectorAll("[data-feel]").forEach((b) => b.addEventListener("click", () => {
    justDone = Number(b.dataset.n);
    store.setSessionFeel({ week, n: justDone, feel: b.dataset.feel });
  }));
  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
  root.querySelectorAll('[data-act="checkin"]').forEach((b) => b.addEventListener("click", openCheckinSheet));
  root.querySelector('[data-act="stage-next"]')?.addEventListener("click", (e) => moveStage(plan.injury, 1, e.currentTarget.dataset.ready === "1"));
  root.querySelector('[data-act="stage-back"]')?.addEventListener("click", () => moveStage(plan.injury, -1, true));
  root.querySelector('[data-act="recovered"]')?.addEventListener("click", () => {
    if (confirm("¿Marcar la lesión como recuperada? El plan vuelve a ser de rendimiento.")) store.saveInjury({ ...plan.injury, status: "recuperada" });
  });
  bindDrills(root);
  loadThrowFocus(root);
}

function moveStage(injury, delta, ready) {
  const stage = injury.rtpStage ?? 1;
  if (delta > 0 && !ready && !confirm("Todavía no cumples todo lo de esta etapa. ¿Tu fisio te dio el visto bueno para pasar?")) return;
  store.saveInjury({ ...injury, rtpStage: Math.max(1, Math.min(STAGES.length, stage + delta)) });
}

// ---------- Vuelta tras lesión ----------

function returnCard(injury, date) {
  const stage = injury.rtpStage ?? 1;
  const st = STAGES[stage - 1];
  const crit = stageCriteria(injury, date);
  const ready = crit.length > 0 && crit.every((c) => c.ok === true);
  const mark = (c) => (c.ok === true ? `<span class="crit-mark ok">${icon("check")}</span>` : c.ok === false ? `<span class="crit-mark no">${icon("x")}</span>` : `<span class="crit-mark todo"></span>`);
  const action = (c) =>
    c.ok === true ? `<span class="muted small num">${esc(c.value)}</span>`
      : c.act === "checkin" && c.ok == null ? `<button type="button" class="link" data-act="checkin">${esc(c.value)}</button>`
      : c.testId ? `<button type="button" class="link" data-test="${c.testId}">${c.ok == null ? "Medir" : esc(c.value)}</button>`
      : `<span class="muted small num">${esc(c.value)}</span>`;

  return `
    <section class="card return-card">
      <p class="eyebrow">Vuelta tras lesión · ${JOINTS[injury.zone].name}${sidePhrase(injury.side)}</p>
      <ol class="stage-track" aria-label="Etapa ${stage} de ${STAGES.length}">
        ${STAGES.map((s) => `<li class="${s.n < stage ? "past" : s.n === stage ? "now" : ""}"><span class="num">${s.n}</span></li>`).join("")}
      </ol>
      <div>
        <h2 class="step-title">Etapa ${stage}: ${st.name}</h2>
        <p class="muted small">${st.goal}</p>
      </div>
      ${stage < STAGES.length ? `
        <div class="criteria">
          <p class="subhead">Para pasar a la etapa ${stage + 1}</p>
          <ul>${crit.map((c) => `<li>${mark(c)}<span class="crit-text">${c.text}</span>${action(c)}</li>`).join("")}</ul>
          ${crit.some((c) => c.ok == null) ? `<p class="muted small">Las pruebas cuentan solo si las mediste después de la lesión.</p>` : ""}
        </div>
        <button type="button" class="btn ${ready ? "primary" : "secondary"} block" data-act="stage-next" data-ready="${ready ? 1 : 0}">${icon("arrow")} Pasar a etapa ${stage + 1}: ${STAGES[stage].name}</button>`
        : `<p class="small">Cuando completes 2 prácticas completas sin dolor, márcala como recuperada.</p>
           <button type="button" class="btn primary block" data-act="recovered">${icon("check")} Lesión recuperada</button>`}
      ${stage > 1 ? `<button type="button" class="link" data-act="stage-back">Volver a la etapa ${stage - 1}</button>` : ""}
      <p class="muted small">Criterios estimados, adaptados a ultimate. Tu fisio tiene la última palabra.</p>
    </section>`;
}

// ---------- Diagnóstico ----------

function savePrefs(patch) {
  store.saveProfile({ planPrefs: { minutes: 45, goals: [], feels: [], equip: [], ...(store.profile()?.planPrefs ?? {}), ...patch } });
}

function diagnosisCard(prefs) {
  if (!prefs?.goals) {
    return `
      <section class="card diag-card">
        <p class="eyebrow">Afina tu plan · 1 minuto</p>
        <h2 class="step-title">¿Qué quieres mejorar y qué te pasa en partido?</h2>
        <p class="muted small">Con eso el plan prioriza lo que más te sirve, y usa solo el equipo que tienes.</p>
        <button type="button" class="btn primary block" data-act="diagnosis">${icon("target")} Hacer el diagnóstico</button>
      </section>`;
  }
  const names = (list, ids) => list.filter((x) => ids?.includes(x.id)).map((x) => x.name.toLowerCase());
  const goals = [...names(GOALS, prefs.goals), ...names(FEELS, prefs.feels)];
  return `
    <button type="button" class="card diag-summary" data-act="diagnosis">
      <span class="plan-card-icon">${icon("target")}</span>
      <span class="plan-card-text">
        <span class="eyebrow">Tu diagnóstico</span>
        <span class="small">${goals.length ? goals.slice(0, 3).join(" · ") + (goals.length > 3 ? ` y ${goals.length - 3} más` : "") : "Sin objetivos marcados"}</span>
      </span>
      <span class="link small">Editar</span>
    </button>`;
}

function openDiagnosis() {
  const prefs = { minutes: 45, goals: [], feels: [], equip: [], ...(store.profile()?.planPrefs ?? {}) };
  const checks = (name, list, selected) => list.map((x) => `
    <label class="choice compact"><input type="checkbox" name="${name}" value="${x.id}" ${selected.includes(x.id) ? "checked" : ""}><span class="choice-title">${x.name}</span></label>`).join("");
  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">Plan</p>
      <h2 class="sheet-title">Diagnóstico</h2>
      <form class="diag-form">
        <fieldset class="field"><legend>¿Qué quieres mejorar?</legend><div class="choice-grid">${checks("goals", GOALS, prefs.goals)}</div></fieldset>
        <fieldset class="field"><legend>En partido me pasa que…</legend><div class="choice-grid">${checks("feels", FEELS, prefs.feels)}</div></fieldset>
        <fieldset class="field"><legend>Qué tienes en casa</legend><div class="choice-grid">${checks("equip", EQUIPMENT, prefs.equip)}</div>
          <small class="muted">En el gimnasio se asume que hay de todo.</small></fieldset>
        <button type="submit" class="btn primary block">${icon("check")} Armar mi plan</button>
      </form>`;
    root.querySelector(".diag-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(e.target);
      savePrefs({ goals: d.getAll("goals"), feels: d.getAll("feels"), equip: d.getAll("equip") });
      closeSheet();
    });
  });
}

// Tus falencias concretas, con su número: lo que el plan está atacando.
function reasonsCard(plan) {
  if (!plan.reasons.length) return "";
  return `
    <section class="card reasons-card">
      <h2 class="section-title">Por qué este plan</h2>
      <ul class="reasons">${plan.reasons.map((r) => `
        <li>
          <i class="dot ${r.score != null ? tierClass(r.score) : "tier-none"}"></i>
          <span><strong>${esc(r.title)}${r.score != null ? ` · <span class="num">${r.score}</span>` : ""}</strong><span class="muted small">${esc(r.detail)}</span></span>
          ${r.testId ? `<button type="button" class="link small" data-test="${r.testId}">Medir</button>` : ""}
        </li>`).join("")}
      </ul>
      ${plan.level ? `<p class="muted small">${icon("up")} Progresión nivel ${plan.level} de 3: las dosis subieron porque vienes cumpliendo tus semanas.</p>` : ""}
    </section>`;
}

// ---------- Sesiones ----------

const FEEL = [["facil", "Fácil"], ["bien", "Bien"], ["duro", "Muy duro"]];

// "Medir hoy" en ejercicios que también son pruebas (si no la mediste en los últimos 14 días).
function measureHint(testId, date) {
  const e = store.latest(testId);
  const ago = e ? Math.round((new Date(date + "T12:00:00") - new Date(e.date + "T12:00:00")) / 86400000) : null;
  if (ago != null && ago < 14) return `<span class="muted small">Medida el ${fmtDate(e.date)}</span>`;
  return `<button type="button" class="measure-btn" data-test="${testId}">${icon("timer")} Medir hoy</button>`;
}

function sessionCard(s, isDone, isNext, feel, date) {
  return `
    <details class="card session ${isDone ? "done" : ""}" ${isNext || s.n === justDone ? "open" : ""}>
      <summary>
        <span class="session-head">
          <span class="session-n num">${isDone ? icon("check") : s.n}</span>
          <span><span class="eyebrow">Día ${s.n}${isNext ? " · Siguiente" : ""}</span><span class="session-title">${esc(s.title)}</span></span>
        </span>
        ${icon("down")}
      </summary>
      <div class="session-body">
        ${s.blocks.map((b) => `
          <div class="plan-block ${b.kind}">
            <p class="subhead">${b.title}</p>
            ${b.kind === "medicion" ? `<p class="muted small">Llevas ${RETEST_DAYS}+ días sin medir esto. Hazlo fresco: si lo mides cansado, parecerá que empeoraste.</p>` : ""}
            <ul class="plan-items">${b.items.map((it) => b.kind === "medicion" ? `
              <li>
                <button type="button" class="drill plan-drill" data-test="${it.testId}">${icon("timer")} ${esc(TESTS_BY_ID[it.testId].name)}${icon("chevron")}</button>
                <span class="plan-why">${esc(it.reason)} · ${it.last == null ? "nunca la mediste" : `hace ${it.last} días`}</span>
              </li>` : `
              <li>
                <button type="button" class="drill plan-drill" data-drill="${esc(it.drill)}">${esc(it.drill)}${icon("chevron")}</button>
                <span class="plan-why"><i class="dot ${it.score != null ? tierClass(it.score) : "tier-none"}"></i>${esc(it.reason)}${it.score != null ? ` · <span class="num">${it.score}</span>` : ""}</span>
                ${it.testId ? measureHint(it.testId, date) : ""}
              </li>`).join("")}
            </ul>
          </div>`).join("")}
        <button type="button" class="btn ${isDone ? "ghost" : "primary"} block" data-done="${s.n}">${icon("check")} ${isDone ? "Hecha · desmarcar" : "Marcar como hecha"}</button>
        ${isDone ? `
          <div class="feel-row">
            <span class="small">¿Cómo te fue?</span>
            <div class="segmented wide">${FEEL.map(([id, name]) => `<button type="button" data-feel="${id}" data-n="${s.n}" aria-selected="${feel === id}">${name}</button>`).join("")}</div>
          </div>` : ""}
      </div>
    </details>`;
}

// Para Inicio: la siguiente sesión de la semana.
export function nextSession() {
  const p = store.profile();
  const date = today();
  const plan = weekPlan({ days: p?.planDays ?? 3, mode: p?.mode ?? "casa", throwFocus, today: date });
  const done = doneThisWeek(date);
  return { plan, done, next: plan.sessions.find((s) => !done.has(s.n)) ?? null };
}
