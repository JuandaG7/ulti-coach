// Equipo (entrenador): responde "¿cómo está mi equipo y a quién tengo que mirar?".
// Los datos llegan cuando cada jugador envía su progreso (QR o archivo); nada pasa por un servidor.
import { CATEGORIES, TESTS, TESTS_BY_ID } from "../data/tests.js";
import { MUSCLES } from "../data/muscles.js";
import { JOINTS, sidePhrase } from "../data/joints.js";
import { parseSnapshot } from "../data/snapshot.js";
import * as store from "../store.js";
import { POSITIONS, level } from "../scoring.js";
import { openSheet, closeSheet } from "./sheet.js";
import { ring, bar, icon, levelChip, fmt, sparkline, toast, loadScript, tierClass, summary } from "../ui.js";

const JSQR_LIB = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
const STALE_DAYS = 14;

const daysSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
const ago = (iso) => {
  const d = daysSince(iso);
  return d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let rankingTest = null;

function roster() {
  return store
    .teamPlayers()
    .map((p) => ({ ...p, last: p.snaps[p.snaps.length - 1], prev: p.snaps[p.snaps.length - 2] }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

// Lo que el entrenador tiene que mirar primero: una línea por jugador con sus avisos, del más grave al menos.
function teamAlerts(players) {
  const out = [];
  for (const p of players) {
    const s = p.last;
    const red = [];
    const yellow = [];
    for (const [zone, side] of s.inj ?? []) red.push(`lesión en ${JOINTS[zone].name.toLowerCase()}${sidePhrase(side)}`);
    for (const [zone, pain] of Object.entries(s.ci?.pa ?? {})) if (pain >= 6) red.push(`dolor ${pain}/10 en ${JOINTS[zone].name.toLowerCase()}`);
    if (s.ci && s.ci.wb < 50) yellow.push(`bienestar bajo (${s.ci.wb})`);
    const asym = (s.al ?? []).filter(([, pct]) => pct >= 15);
    if (asym.length === 1) yellow.push(`${TESTS_BY_ID[asym[0][0]].name.toLowerCase()} desigual (${asym[0][1]} %)`);
    if (asym.length > 1) yellow.push(`${asym.length} asimetrías fuertes`);
    const stale = daysSince(s.at) > STALE_DAYS;
    if (stale) yellow.push(`sin actualizar ${ago(s.at)}`);
    const issues = [...red, ...yellow];
    if (!issues.length) continue;
    out.push({ id: p.id, level: red.length ? "red" : stale && issues.length === 1 ? "muted" : "yellow", text: `<strong>${esc(p.name)}:</strong> ${issues.join(" · ")}` });
  }
  const order = { red: 0, yellow: 1, muted: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

export function render(root) {
  const players = roster();
  const alerts = teamAlerts(players);
  const measuredTests = TESTS.filter((t) => players.some((p) => p.last.r.some((r) => r[0] === t.id)));
  if (!measuredTests.some((t) => t.id === rankingTest)) rankingTest = measuredTests[0]?.id ?? null;

  root.innerHTML = `
    <header class="page-head">
      <h1 class="display">Equipo</h1>
      <p class="muted small">${players.length ? `${players.length} jugador${players.length > 1 ? "es" : ""}. Se actualiza cada vez que te envían su progreso.` : "Aquí ves a tus jugadores cuando te envían su progreso."}</p>
    </header>

    <div class="btn-row team-actions">
      <button class="btn primary" data-act="scan">${icon("camera")} Escanear QR</button>
      <label class="btn secondary">${icon("upload")} Importar archivo<input type="file" accept="application/json,.json" multiple hidden data-act="import"></label>
    </div>

    ${players.length ? "" : `
      <section class="card how-card">
        <p class="eyebrow">Cómo llegan tus jugadores</p>
        <ol class="tips">
          <li>Cada jugador abre la app y, en su perfil, marca que <strong>tiene entrenador</strong>.</li>
          <li>Al terminar su check-in semanal toca <strong>Enviar a su entrenador</strong>.</li>
          <li>En el entrenamiento te muestra un <strong>QR</strong> y lo escaneas aquí, o te manda el <strong>archivo por WhatsApp</strong> y lo importas.</li>
        </ol>
      </section>`}

    ${alerts.length ? `
      <section>
        <h2 class="section-title">Para mirar</h2>
        <ul class="insights team-alerts">
          ${alerts.map((a) => `<li class="${a.level}"><button data-player="${a.id}">${icon(a.level === "muted" ? "timer" : "alert")}<span>${a.text}</span></button></li>`).join("")}
        </ul>
      </section>` : ""}

    ${players.length ? `
      <section>
        <h2 class="section-title">Plantel</h2>
        <div class="card list">
          ${players.map((p) => {
            const s = p.last;
            const delta = p.prev && s.o != null && p.prev.o != null ? s.o - p.prev.o : null;
            const stale = daysSince(s.at) > STALE_DAYS;
            return `
              <button class="row player-row" data-player="${p.id}">
                <div class="row-main">
                  <span class="player-name">${esc(p.name)}</span>
                  <span class="muted small">${s.p ? POSITIONS[s.p] : ""}${s.a ? ` · ${s.a} años` : ""} · <span class="${stale ? "stale" : ""}">${ago(s.at)}</span></span>
                </div>
                ${delta ? `<span class="delta ${delta > 0 ? "good" : "bad"}">${icon(delta > 0 ? "up" : "down")}${Math.abs(delta)}</span>` : ""}
                <span class="badge ${tierClass(s.o)}">${s.o ?? "–"}</span>
              </button>`;
          }).join("")}
        </div>
      </section>` : ""}

    ${rankingTest ? `
      <section>
        <div class="section-title-row">
          <h2 class="section-title">Ranking</h2>
          <select class="ranking-select" data-act="ranking" aria-label="Prueba del ranking">
            ${measuredTests.map((t) => `<option value="${t.id}" ${t.id === rankingTest ? "selected" : ""}>${t.name}</option>`).join("")}
          </select>
        </div>
        <div class="card list">${rankingRows(players, rankingTest)}</div>
      </section>` : ""}
  `;

  root.querySelector('[data-act="scan"]').addEventListener("click", openScanner);
  root.querySelector('[data-act="import"]').addEventListener("change", async (e) => {
    const results = [];
    for (const file of e.target.files) results.push(importText(await file.text()));
    e.target.value = "";
    summarizeImports(results);
  });
  root.querySelector('[data-act="ranking"]')?.addEventListener("change", (e) => {
    rankingTest = e.target.value;
    render(root);
  });
  root.querySelectorAll("[data-player]").forEach((b) => b.addEventListener("click", () => openPlayerSheet(b.dataset.player)));
}

function rankingRows(players, testId) {
  const t = TESTS_BY_ID[testId];
  const lowerIsBetter = t.targets.m.elite < t.targets.m.base;
  const rows = players
    .map((p) => ({ p, r: p.last.r.find((r) => r[0] === testId) }))
    .filter((x) => x.r)
    .sort((a, b) => (lowerIsBetter ? a.r[1] - b.r[1] : b.r[1] - a.r[1]));
  return rows
    .map(({ p, r }, i) => `
      <button class="row" data-player="${p.id}">
        <span class="focus-rank num">${i + 1}</span>
        <div class="row-main"><span>${esc(p.name)}</span><span class="muted small">medido ${r[3] <= 0 ? "hoy" : r[3] === 1 ? "ayer" : `hace ${r[3]} días`}</span></div>
        <span class="num value">${fmt(r[1], t.decimals)}<small>${t.unit}</small></span>
        <span class="badge ${tierClass(r[2])}">${r[2]}</span>
      </button>`)
    .join("");
}

function importText(text) {
  const snap = parseSnapshot(text);
  if (!snap) return { status: "invalido" };
  return { status: store.importSnapshot(snap), name: snap.n };
}

function summarizeImports(results) {
  const ok = results.filter((r) => r.status === "nuevo" || r.status === "actualizado");
  const bad = results.filter((r) => r.status === "invalido").length;
  const rep = results.filter((r) => r.status === "repetido").length;
  const parts = [];
  if (ok.length) {
    const allNew = ok.every((r) => r.status === "nuevo");
    parts.push(`${ok.map((r) => esc(r.name)).join(", ")} ${allNew ? (ok.length > 1 ? "agregados al equipo" : "agregado al equipo") : ok.length > 1 ? "actualizados" : "actualizado"}`);
  }
  if (rep) parts.push(`${rep} ya lo tenías`);
  if (bad) parts.push(`${bad} archivo${bad > 1 ? "s" : ""} no es de Ulti Coach`);
  toast(`<div class="toast-head"><span>${icon(ok.length ? "check" : "alert")} ${parts.join(" · ")}</span></div>`, 4000);
}

// ---------- Detalle de un jugador ----------

function openPlayerSheet(id) {
  const p = roster().find((x) => x.id === id);
  if (!p) return;
  const s = p.last;
  const history = p.snaps.map((x) => x.o).filter((o) => o != null);
  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">${s.p ? POSITIONS[s.p] : "Jugador"}${s.a ? ` · ${s.a} años` : ""} · actualizado ${ago(s.at)}</p>
      <h2 class="sheet-title">${esc(p.name)}</h2>

      <div class="player-head ${tierClass(s.o)}">
        ${ring(s.o, { size: 84, stroke: 8 })}
        <div>
          <p class="eyebrow">Ulti Score</p>
          <p class="player-level">${level(s.o).name}</p>
          ${history.length > 1 ? `<span class="trend show accent" title="Evolución del Ulti Score">${sparkline(history, { w: 120, h: 30 })}</span><span class="muted small"> ${p.snaps.length} envíos</span>` : ""}
        </div>
      </div>

      ${s.ci ? `
        <h3 class="subhead">Check-in (${s.ci.w.replace("-W", " · semana ")})</h3>
        <p class="small">Bienestar <strong class="num">${s.ci.wb}/100</strong>${s.ci.sh ? ` · ${s.ci.sh} h de sueño` : ""} · ${s.ci.se ?? 0} sesiones, esfuerzo ${s.ci.rpe}/10</p>
        ${Object.entries(s.ci.pa ?? {}).map(([z, v]) => `<p class="small warn-text">${icon("alert")} Dolor ${v}/10 en ${JOINTS[z].name.toLowerCase()}</p>`).join("")}
        ${s.ci.no ? `<p class="small muted">"${esc(s.ci.no)}"</p>` : ""}` : `<p class="muted small">Todavía no ha enviado un check-in.</p>`}

      ${(s.inj ?? []).length ? `<h3 class="subhead">Lesiones activas</h3>${s.inj.map(([z, side]) => `<p class="small warn-text">${icon("bandage")} ${JOINTS[z].name}${sidePhrase(side)}</p>`).join("")}` : ""}

      <h3 class="subhead">Perfil atlético</h3>
      <div class="dims">
        ${CATEGORIES.filter((c) => s.c?.[c.id] != null).map((c) => `
          <div class="dim">
            <div class="row-head small"><span>${c.name}</span><span class="row-score"><span class="num">${s.c[c.id]}</span>${levelChip(s.c[c.id])}</span></div>
            ${bar(s.c[c.id])}
          </div>`).join("") || `<p class="muted small">Sin pruebas medidas.</p>`}
      </div>

      ${(s.f ?? []).length ? `<h3 class="subhead">Su foco</h3><p class="small">${s.f.map((m, i) => `${i + 1}. ${MUSCLES[m]?.name ?? m}`).join(" · ")}</p>` : ""}

      ${(s.al ?? []).length ? `
        <h3 class="subhead">Asimetrías</h3>
        ${s.al.map(([t, pct, weak]) => `<p class="small ${pct >= 15 ? "warn-text" : ""}">${TESTS_BY_ID[t].name}: ${weak === "L" ? "izquierda" : "derecha"} ${pct} % más débil</p>`).join("")}` : ""}

      <details class="protocol">
        ${summary(`Todas sus pruebas · ${s.r.length}`)}
        <ul class="history-list">
          ${s.r.map(([t, v, sc, d, L, R]) => {
            const test = TESTS_BY_ID[t];
            if (!test) return "";
            return `<li><span>${test.name}<br><span class="muted small">${d <= 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`}${L != null ? ` · I ${fmt(L, test.decimals)} · D ${fmt(R, test.decimals)}` : ""}</span></span>
              <span class="num">${fmt(v, test.decimals)} ${test.unit}</span><span class="badge ${tierClass(sc)}">${sc}</span></li>`;
          }).join("")}
        </ul>
      </details>

      <button class="btn ghost danger-text block remove-player" data-act="remove">${icon("trash")} Quitar del equipo</button>`;

    root.querySelector('[data-act="remove"]').addEventListener("click", () => {
      if (confirm(`¿Quitar a ${p.name} del equipo? Se borran sus datos de este celular.`)) {
        store.removePlayer(id);
        closeSheet();
      }
    });
  });
}

// ---------- Escáner de QR ----------

function openScanner() {
  let stream = null;
  let timer = null;
  const stop = () => {
    clearInterval(timer);
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };
  document.getElementById("sheet").addEventListener("close", stop, { once: true });

  openSheet(async (root) => {
    root.innerHTML = `
      <p class="eyebrow">Equipo</p>
      <h2 class="sheet-title">Escanear QR</h2>
      <p class="muted small">Apunta al QR que te muestra el jugador en su app.</p>
      <div class="stage scanner"><video playsinline muted autoplay data-cam></video><span class="scan-frame" aria-hidden="true"></span></div>
      <p class="small scan-status" data-status>Abriendo la cámara…</p>`;
    const video = root.querySelector("[data-cam]");
    const status = root.querySelector("[data-status]");
    try {
      await loadScript(JSQR_LIB);
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      video.srcObject = stream;
      await video.play();
      status.textContent = "Buscando el QR…";
    } catch {
      status.innerHTML = `${icon("alert")} No se pudo abrir la cámara. Revisa el permiso de cámara para este sitio, o pídele al jugador que te mande el archivo.`;
      return;
    }
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    timer = setInterval(() => {
      if (!video.videoWidth) return;
      const w = Math.min(720, video.videoWidth);
      const h = Math.round((video.videoHeight / video.videoWidth) * w);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const code = window.jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (!code) return;
      if (!parseSnapshot(code.data)) {
        status.textContent = "Ese QR no es de Ulti Coach. Intenta con el del jugador.";
        return;
      }
      // Primero apagar la cámara y cerrar: si importáramos con la hoja abierta, se redibujaría y la reabriría.
      stop();
      closeSheet();
      summarizeImports([importText(code.data)]);
    }, 250);
  });
}
