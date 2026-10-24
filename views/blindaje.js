// Blindaje: salud de articulaciones y zonas que más se lesionan en ultimate.
// Muestra rango, fuerza/control y simetría por zona, alertas izquierda/derecha y el historial de lesiones.
import { JOINTS, DIMENSIONS, SIDES, sidePhrase } from "../data/joints.js";
import { TESTS_BY_ID } from "../data/tests.js";
import * as store from "../store.js";
import { jointPriorities, jointDimensions, asymmetryFlag, latestPains, jointWarnings } from "../scoring.js";
import { ring, bar, icon, levelChip, fmt, fmtDate, today, summary, lessButton, exclusive, bodySwitch } from "../ui.js";
import { openTestSheet } from "./test-sheet.js";
import { drillChips, bindDrills } from "./exercise-sheet.js";
import { openSheet, closeSheet } from "./sheet.js";

export function render(root) {
  const mode = store.profile()?.mode ?? "casa";
  const active = store.injuries().filter((i) => i.status === "activa");

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Cuerpo</h1>
      ${bodySwitch("blindaje", jointWarnings())}
      <p class="muted small">Las articulaciones que más se lesionan en ultimate, de la más vulnerable a la más fuerte. Toca una para ver qué hacer.</p>
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
  exclusive(root.querySelectorAll("[data-acc]"));
  root.querySelector('[data-act="add-injury"]').addEventListener("click", () => openInjurySheet());
  root.querySelectorAll("[data-injury]").forEach((b) =>
    b.addEventListener("click", () => openInjurySheet(store.injuries().find((i) => i.id === b.dataset.injury)))
  );
}

function jointCard({ id, joint, score, injury, alerts }, i, mode) {
  const dims = jointDimensions(id);
  const pain = latestPains()[id];
  const missing = [...Object.keys(joint.rango), ...Object.keys(joint.fuerza)].filter((t) => !store.latest(t));
  return `
    <details class="card joint-acc ${i === 0 ? "top" : ""}" data-acc ${i === 0 ? "open" : ""}>
      <summary>
        ${ring(score, { size: 54, stroke: 6 })}
        <div class="joint-title">
          <span class="joint-name">${joint.name}</span>
          <div class="joint-tags">
            ${score != null ? levelChip(score) : `<span class="muted small">Sin datos</span>`}
            ${i === 0 ? `<span class="tag focus-tag">Prioridad #1</span>` : ""}
            ${injury ? `<span class="tag injury">${icon("bandage")} ${injury.status === "activa" ? "Lesión" : "Lesión previa"}</span>` : ""}
            ${pain ? `<span class="tag pain ${pain >= 6 ? "high" : ""}">${icon("heart")} Dolor ${pain}/10</span>` : ""}
            ${alerts.length ? `<span class="tag alert-tag">${icon("alert")} ${alerts.length}</span>` : ""}
          </div>
        </div>
        <span class="chev" aria-hidden="true">${icon("down")}</span>
      </summary>

      <div class="joint-body">
        <div class="dims">
          ${Object.entries(DIMENSIONS).map(([d, name]) => {
            if (d === "rango" && !Object.keys(joint.rango).length) return "";
            const s = dims[d];
            return `
              <div class="dim">
                <div class="row-head small"><span>${name}</span><span class="num">${s ?? "–"}</span></div>
                ${bar(s)}
              </div>`;
          }).join("")}
        </div>

        ${alerts.length ? `
          <div class="asym-box">
            <p class="asym-head">${icon("alert")}<span>Un lado más débil que el otro</span></p>
            <table class="asym-table">
              <thead><tr><th>Prueba</th><th>Izq.</th><th>Der.</th><th>Dif.</th></tr></thead>
              <tbody>${alerts.map((a) => {
                const t = TESTS_BY_ID[a.testId];
                return `
                <tr>
                  <td><button type="button" class="link-row" data-test="${a.testId}">${t.name}</button></td>
                  <td class="num ${a.weak === "L" ? "weak" : ""}">${fmt(a.L, t.decimals)}</td>
                  <td class="num ${a.weak === "R" ? "weak" : ""}">${fmt(a.R, t.decimals)}</td>
                  <td><span class="asym-pct ${asymmetryFlag(a.pct)}">${a.weak === "L" ? "Izq." : "Der."} −${a.pct} %</span></td>
                </tr>`;
              }).join("")}</tbody>
            </table>
          </div>` : ""}

        <h3 class="subhead">Blindaje · ${mode === "gym" ? "gimnasio" : "casa"}</h3>
        ${drillChips(joint.drills[mode])}

        ${missing.length ? `
          <h3 class="subhead">Falta medir</h3>
          <div class="btn-row">${missing.map((t) => `<button class="add-pill" data-test="${t}">${icon("plus")} ${TESTS_BY_ID[t].name}</button>`).join("")}</div>` : ""}

        <details class="why-more">
          ${summary("Por qué importa")}
          <p class="why">${joint.why}</p>
        </details>
        ${lessButton()}
      </div>
    </details>`;
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
