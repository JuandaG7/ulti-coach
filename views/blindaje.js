// Blindaje: salud de articulaciones y zonas que más se lesionan en ultimate.
// Muestra rango, fuerza/control y simetría por zona, alertas izquierda/derecha y el historial de lesiones.
import { JOINTS, DIMENSIONS, SIDES, sidePhrase } from "../data/joints.js";
import { TESTS_BY_ID } from "../data/tests.js";
import * as store from "../store.js";
import { jointPriorities, jointDimensions, asymmetryFlag } from "../scoring.js";
import { ring, bar, icon, levelChip, fmt, fmtDate, today } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";
import { drillChips, bindDrills } from "./exercise-sheet.js";
import { openSheet, closeSheet } from "./sheet.js";

export function render(root) {
  const mode = store.profile()?.mode ?? "casa";
  const active = store.injuries().filter((i) => i.status === "activa");

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Blindaje</h1>
      <p class="muted small">Las zonas que más se lesionan en ultimate. Cada una mide rango, fuerza y control, y si un lado es más débil que el otro.</p>
    </header>

    ${active.map((i) => `
      <div class="banner warn">${icon("alert")}<span>Lesión activa: <strong>${JOINTS[i.zone].name}${sidePhrase(i.side)}</strong>. No hagas pruebas ni ejercicios que te duelan en esa zona y sigue las indicaciones de tu fisio.</span></div>`).join("")}

    <div class="joint-list">
      ${jointPriorities().map((p, i) => jointCard(p, i, mode)).join("")}
    </div>

    <section>
      <div class="section-title-row">
        <h2 class="section-title">Lesiones</h2>
        <button class="btn secondary small-btn" data-act="add-injury">${icon("plus")} Registrar</button>
      </div>
      <div class="card list">
        ${store.injuries().length
          ? store.injuries().map(injuryRow).join("")
          : `<p class="empty-row muted small">Registra lesiones pasadas o actuales: la zona sube de prioridad y su blindaje pesa más en tu plan.</p>`}
      </div>
    </section>

    <p class="muted small disclaimer">${icon("shield")} Esto previene y fortalece; no reemplaza a un fisioterapeuta ni sirve para diagnosticar una lesión.</p>
  `;

  root.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => openTestSheet(b.dataset.test)));
  bindDrills(root);
  root.querySelector('[data-act="add-injury"]').addEventListener("click", () => openInjurySheet());
  root.querySelectorAll("[data-injury]").forEach((b) =>
    b.addEventListener("click", () => openInjurySheet(store.injuries().find((i) => i.id === b.dataset.injury)))
  );
}

function jointCard({ id, joint, score, injury, alerts }, i, mode) {
  const dims = jointDimensions(id);
  const missing = [...Object.keys(joint.rango), ...Object.keys(joint.fuerza)].filter((t) => !store.latest(t));
  return `
    <article class="card joint-card ${i === 0 ? "top" : ""}">
      <div class="joint-head">
        ${ring(score, { size: 72, stroke: 7 })}
        <div class="joint-title">
          <h2>${joint.name}</h2>
          <div class="joint-tags">
            ${score != null ? levelChip(score) : `<span class="muted small">Sin datos</span>`}
            ${injury ? `<span class="tag injury">${icon("bandage")} ${injury.status === "activa" ? "Lesión activa" : "Lesión previa"}</span>` : ""}
            ${i === 0 ? `<span class="tag focus-tag">Prioridad #1</span>` : ""}
          </div>
        </div>
      </div>

      <div class="dims">
        ${Object.entries(DIMENSIONS).map(([d, name]) => {
          const s = dims[d];
          const notApplicable = d === "rango" && !Object.keys(joint.rango).length;
          if (notApplicable) return "";
          return `
            <div class="dim">
              <div class="row-head small"><span>${name}</span><span class="num">${s ?? "–"}</span></div>
              ${bar(s)}
            </div>`;
        }).join("")}
      </div>

      ${alerts.length ? `
        <ul class="alerts">
          ${alerts.map((a) => `
            <li class="${asymmetryFlag(a.pct)}">
              <button data-test="${a.testId}">
                ${icon("alert")}
                <span><strong>${TESTS_BY_ID[a.testId].name}:</strong> ${a.weak === "L" ? "izquierda" : "derecha"} ${a.pct} % más débil
                (I ${fmt(a.L, TESTS_BY_ID[a.testId].decimals)} · D ${fmt(a.R, TESTS_BY_ID[a.testId].decimals)})</span>
              </button>
            </li>`).join("")}
        </ul>` : ""}

      <details class="joint-more" ${i === 0 ? "open" : ""}>
        <summary>Por qué importa y qué hacer</summary>
        <p class="why">${joint.why}</p>
        <h3 class="subhead">Blindaje · ${mode === "gym" ? "gimnasio" : "casa"}</h3>
        ${drillChips(joint.drills[mode])}
        ${missing.length ? `
          <h3 class="subhead">Falta medir</h3>
          <div class="btn-row">${missing.map((t) => `<button class="add-pill" data-test="${t}">${icon("plus")} ${TESTS_BY_ID[t].name}</button>`).join("")}</div>` : ""}
      </details>
    </article>`;
}

function injuryRow(i) {
  return `
    <button class="row" data-injury="${i.id}">
      <span class="injury-dot ${i.status}" aria-hidden="true"></span>
      <div class="row-main">
        <span>${JOINTS[i.zone].name}${sidePhrase(i.side)}</span>
        <span class="muted small">${fmtDate(i.date, { day: "numeric", month: "short", year: "numeric" })} · ${i.status === "activa" ? "activa" : "recuperada"}${i.note ? ` · ${escapeHtml(i.note)}` : ""}</span>
      </div>
      ${icon("edit", "muted")}
    </button>`;
}

function openInjurySheet(existing) {
  openSheet((root) => {
    const i = existing ?? { zone: "ankle", side: "R", date: today(), status: "activa", note: "" };
    root.innerHTML = `
      <p class="eyebrow">Blindaje</p>
      <h2 class="sheet-title">${existing ? "Editar lesión" : "Registrar lesión"}</h2>
      <form class="form injury-form">
        <fieldset class="field">
          <legend>Zona</legend>
          <div class="choice-grid three">
            ${Object.entries(JOINTS).map(([id, j]) => `
              <label class="choice compact"><input type="radio" name="zone" value="${id}" ${i.zone === id ? "checked" : ""}><span class="choice-title">${j.name}</span></label>`).join("")}
          </div>
        </fieldset>
        <fieldset class="field">
          <legend>Lado</legend>
          <div class="segmented wide">
            ${Object.entries(SIDES).map(([v, name]) => `<label><input type="radio" name="side" value="${v}" ${i.side === v ? "checked" : ""}><span>${name}</span></label>`).join("")}
          </div>
        </fieldset>
        <div class="field-row two">
          <label class="field">
            <span>Fecha</span>
            <input name="date" type="date" value="${i.date}" max="${today()}" required>
          </label>
          <fieldset class="field">
            <legend>Estado</legend>
            <div class="segmented wide">
              <label><input type="radio" name="status" value="activa" ${i.status === "activa" ? "checked" : ""}><span>Activa</span></label>
              <label><input type="radio" name="status" value="recuperada" ${i.status === "recuperada" ? "checked" : ""}><span>Recuperada</span></label>
            </div>
          </fieldset>
        </div>
        <label class="field">
          <span>Nota (opcional)</span>
          <input name="note" type="text" maxlength="80" value="${escapeHtml(i.note ?? "")}" placeholder="Esguince grado 2 jugando">
        </label>
        <div class="btn-row end">
          ${existing ? `<button type="button" class="btn ghost danger-text" data-act="delete">${icon("trash")} Borrar</button>` : ""}
          <button type="submit" class="btn primary">${icon("check")} Guardar</button>
        </div>
      </form>`;

    const form = root.querySelector(".injury-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      store.saveInjury({
        ...(existing ? { id: existing.id } : {}),
        zone: d.get("zone"),
        side: d.get("side"),
        date: d.get("date"),
        status: d.get("status"),
        note: d.get("note").trim(),
      });
      closeSheet();
    });
    root.querySelector('[data-act="delete"]')?.addEventListener("click", () => {
      if (confirm("¿Borrar esta lesión del historial?")) {
        store.removeInjury(existing.id);
        closeSheet();
      }
    });
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
