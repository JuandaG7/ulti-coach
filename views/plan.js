// Plan: tu semana de entrenamiento, armada con todo lo que la app sabe de ti, y tu vuelta tras lesión.
import * as store from "../store.js";
import { JOINTS, sidePhrase } from "../data/joints.js";
import { WARMUP } from "../data/safety.js";
import { STAGES } from "../data/return.js";
import { weekKey } from "../data/checkin.js";
import { weekPlan, stageCriteria, doneThisWeek } from "../plan.js";
import { analyzeForehand, proBand, scoreVsPro, consistency, METRICS } from "../forehand.js";
import { listClips } from "../clips.js";
import { icon, today, tierClass } from "../ui.js";
import { bindDrills } from "./exercise-sheet.js";
import { openTestSheet } from "./test-sheet.js";
import { openCheckinSheet } from "./checkin.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const DAYS = [2, 3, 4, 5];

// La métrica de tu forehand más lejos del rango pro (sin contar las que saltan mucho entre videos).
// Los clips viven en IndexedDB (asíncrono): se calcula una vez y se redibuja cuando está lista.
let throwFocus;
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
        .map((m) => ({ metric: m.id, score: scoreVsPro(m.id, myA[0].metrics[m.id], bands[m.id]) }))
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
    </section>

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
      ${plan.sessions.map((s) => sessionCard(s, done.has(s.n), s === next)).join("")}
    </section>

    <p class="muted small plan-foot">${icon("shield")} Si algo duele (no cansancio), para. El plan se arma con estimaciones: tu entrenador o fisio pueden ajustarlo.</p>
  `;

  root.querySelectorAll("[name=days]").forEach((i) => i.addEventListener("change", () => store.saveProfile({ planDays: Number(i.value) })));
  root.querySelectorAll("[name=mode]").forEach((i) => i.addEventListener("change", () => store.saveProfile({ mode: i.value })));
  root.querySelectorAll("[data-done]").forEach((b) => b.addEventListener("click", () => {
    store.toggleSession({ date, week: weekKey(date), n: Number(b.dataset.done) });
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

// ---------- Sesiones ----------

function sessionCard(s, isDone, isNext) {
  return `
    <details class="card session ${isDone ? "done" : ""}" ${isNext ? "open" : ""}>
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
            <ul class="plan-items">${b.items.map((it) => `
              <li>
                <button type="button" class="drill plan-drill" data-drill="${esc(it.drill)}">${esc(it.drill)}${icon("chevron")}</button>
                <span class="plan-why"><i class="dot ${it.score != null ? tierClass(it.score) : "tier-none"}"></i>${esc(it.reason)}${it.score != null ? ` · <span class="num">${it.score}</span>` : ""}</span>
              </li>`).join("")}
            </ul>
          </div>`).join("")}
        <button type="button" class="btn ${isDone ? "ghost" : "primary"} block" data-done="${s.n}">${icon("check")} ${isDone ? "Hecha · desmarcar" : "Marcar como hecha"}</button>
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
