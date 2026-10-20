// Check-in semanal: tarjeta en Inicio y formulario de 1 minuto.
import { WELLNESS_ITEMS, weekKey } from "../data/checkin.js";
import { JOINTS } from "../data/joints.js";
import * as store from "../store.js";
import { wellness, weeklyLoad, checkinInsights } from "../scoring.js";
import { openSheet, closeSheet } from "./sheet.js";
import { icon, today, sparkline, toast, parseNum } from "../ui.js";

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function previousOf(week) {
  return store.checkins().filter((c) => c.week < week).pop() ?? null;
}

export function checkinCard() {
  const week = weekKey(today());
  const c = store.checkinFor(week);
  if (!c) {
    const last = store.checkins().pop();
    return `
      <section class="card checkin-card pending">
        <div class="checkin-head">
          <span class="shield-icon">${icon("heart")}</span>
          <div class="row-main">
            <span class="eyebrow">Check-in semanal</span>
            <span class="shield-title">¿Cómo llegas a esta semana?</span>
            <span class="muted small">1 minuto: energía, sueño, dolor y carga. Ayuda a ver si tus números suben o bajan por cansancio.${last ? ` Último: ${wellness(last)}/100.` : ""}</span>
          </div>
        </div>
        <button class="btn primary block" data-act="checkin">${icon("check")} Hacer check-in</button>
      </section>`;
  }
  const history = store.checkins().slice(-8).map(wellness);
  const insights = checkinInsights(c, previousOf(week));
  const w = wellness(c);
  return `
    <section class="card checkin-card">
      <div class="checkin-head">
        <div class="wellness">
          <span class="num wellness-num">${w}</span>
          <span class="muted small">bienestar</span>
        </div>
        <div class="row-main">
          <span class="eyebrow">Check-in de esta semana</span>
          <span class="small">${c.sleepHours ? `${c.sleepHours} h de sueño · ` : ""}${c.sessions ?? 0} sesiones · carga ${weeklyLoad(c)}</span>
          ${history.length > 1 ? `<span class="trend show accent" title="Bienestar de las últimas semanas">${sparkline(history, { w: 110, h: 28 })}</span>` : ""}
        </div>
        <button class="icon-btn" data-act="checkin" aria-label="Editar check-in">${icon("edit")}</button>
      </div>
      ${insights.length ? `<ul class="insights">${insights.slice(0, 4).map((i) => `<li class="${i.level}">${icon(i.level === "good" ? "check" : "alert")}<span>${i.text}</span></li>`).join("")}</ul>` : ""}
    </section>`;
}

export function bindCheckin(root) {
  root.querySelectorAll('[data-act="checkin"]').forEach((b) => b.addEventListener("click", openCheckinSheet));
}

function scale(item, value) {
  return `
    <fieldset class="field scale-field">
      <legend>${item.name}</legend>
      <div class="scale">
        ${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="${item.id}" value="${n}" ${value === n ? "checked" : ""}><span>${n}</span></label>`).join("")}
      </div>
      <div class="scale-ends"><span>${item.low}</span><span>${item.high}</span></div>
    </fieldset>`;
}

export function openCheckinSheet() {
  const week = weekKey(today());
  const c = store.checkinFor(week) ?? { pains: {} };
  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">Check-in semanal</p>
      <h2 class="sheet-title">¿Cómo llegas a esta semana?</h2>
      <form class="form checkin-form" novalidate>
        ${WELLNESS_ITEMS.map((it) => scale(it, c[it.id])).join("")}

        <div class="field-row two">
          <label class="field">
            <span>Horas de sueño (promedio)</span>
            <input name="sleepHours" type="text" inputmode="decimal" autocomplete="off" value="${c.sleepHours ?? ""}" placeholder="7,5">
          </label>
          <label class="field">
            <span>Sesiones esta semana</span>
            <input name="sessions" type="number" inputmode="numeric" min="0" max="20" value="${c.sessions ?? ""}" placeholder="4">
          </label>
        </div>

        <label class="field">
          <span>¿Qué tan duras fueron? <output class="muted" data-rpe-out>${c.rpe ?? 5}/10</output></span>
          <input name="rpe" type="range" min="1" max="10" step="1" value="${c.rpe ?? 5}">
          <div class="scale-ends"><span>Muy suaves</span><span>Al máximo</span></div>
        </label>

        <fieldset class="field">
          <legend>¿Te duele alguna zona?</legend>
          <div class="pain-zones">
            ${Object.entries(JOINTS).map(([id, j]) => `
              <label class="pain-zone">
                <input type="checkbox" name="painZone" value="${id}" ${c.pains?.[id] != null ? "checked" : ""}>
                <span class="pain-chip">${j.name}</span>
                <span class="pain-level">
                  <input type="range" name="pain_${id}" min="1" max="10" value="${c.pains?.[id] ?? 3}" aria-label="Dolor en ${j.name}, de 1 a 10">
                  <output class="num">${c.pains?.[id] ?? 3}/10</output>
                </span>
              </label>`).join("")}
          </div>
        </fieldset>

        <label class="field">
          <span>Nota (opcional)</span>
          <input name="note" type="text" maxlength="120" value="${esc(c.note ?? "")}" placeholder="Torneo el sábado, dormí mal por exámenes">
        </label>

        <small class="error" hidden>Responde las 5 preguntas de arriba</small>
        <button type="submit" class="btn primary block">${icon("check")} Guardar check-in</button>
      </form>`;

    const form = root.querySelector(".checkin-form");
    const rpe = form.querySelector("[name=rpe]");
    rpe.addEventListener("input", () => (root.querySelector("[data-rpe-out]").textContent = `${rpe.value}/10`));
    form.querySelectorAll(".pain-level input").forEach((r) =>
      r.addEventListener("input", () => (r.nextElementSibling.textContent = `${r.value}/10`))
    );
    form.addEventListener("change", () => (form.querySelector(".error").hidden = true));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const answers = Object.fromEntries(WELLNESS_ITEMS.map((it) => [it.id, Number(d.get(it.id))]));
      if (Object.values(answers).some((v) => !v)) {
        const err = form.querySelector(".error");
        err.hidden = false;
        err.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      const pains = Object.fromEntries(d.getAll("painZone").map((z) => [z, Number(d.get(`pain_${z}`))]));
      store.saveCheckin({
        week,
        date: today(),
        ...answers,
        sleepHours: parseNum(d.get("sleepHours")) >= 0 ? parseNum(d.get("sleepHours")) : null,
        sessions: d.get("sessions") ? Number(d.get("sessions")) : 0,
        rpe: Number(d.get("rpe")),
        pains,
        note: d.get("note").trim(),
      });
      closeSheet();
      toast(`<div class="toast-head"><span>${icon("check")} Check-in guardado</span><span class="num">${wellness(store.checkinFor(week))}/100</span></div>`, 3500);
    });
  });
}
