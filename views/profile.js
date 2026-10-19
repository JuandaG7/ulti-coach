// Perfil del atleta. La primera vez que se abre la app funciona como bienvenida.
import * as store from "../store.js";
import { POSITIONS, jumpPower, ageFactor } from "../scoring.js";
import { buildDemo } from "../data/demo.js";
import { icon, today, fmtDate, sparkline, toast } from "../ui.js";

const POSITION_HELP = {
  handler: "Lanzas y mueves el disco. Pesa más lanzamiento y cambio de dirección.",
  cutter: "Cortas y atacas el espacio. Pesa más velocidad y resistencia.",
  hibrido: "Haces de todo. Todas las categorías pesan igual.",
};

export function render(root, param) {
  const welcome = param === "bienvenida" || !store.profile();
  const p = store.profile() ?? {};
  const kg = store.currentWeight();

  root.innerHTML = `
    <header class="page-head">
      ${welcome ? `<p class="eyebrow">Bienvenido a Ulti Coach</p>` : ""}
      <h1 class="display">${welcome ? "Arma tu perfil" : "Tu perfil"}</h1>
      <p class="muted">${welcome
        ? "Con esto ajustamos tus metas (según edad y sexo), tus prioridades (según posición) y los ejercicios (gym o casa). Lo puedes cambiar cuando quieras."
        : "Tus metas y prioridades se recalculan cuando cambias algo aquí."}</p>
      ${!welcome && ageFactor() !== 1 ? `<p class="hint-chip">${icon("target")} Metas ajustadas a tus ${p.age} años (estimación)</p>` : ""}
    </header>

    <form class="card form profile-form" novalidate>
      <label class="field">
        <span>Nombre</span>
        <input name="name" type="text" autocomplete="given-name" value="${escapeAttr(p.name ?? "")}" placeholder="Juan" required>
        <small class="error" hidden>Escribe tu nombre</small>
      </label>

      <fieldset class="field">
        <legend>Sexo <span class="muted small">(ajusta las metas)</span></legend>
        <div class="segmented wide">
          ${radio("sex", "m", "Hombre", p.sex)}
          ${radio("sex", "f", "Mujer", p.sex)}
        </div>
        <small class="error" hidden>Elige una opción</small>
      </fieldset>

      <div class="field-row">
        <label class="field">
          <span>Edad</span>
          <input name="age" type="number" inputmode="numeric" min="10" max="90" value="${p.age ?? ""}" placeholder="25" required>
          <small class="error" hidden>Entre 10 y 90</small>
        </label>
        <label class="field">
          <span>Altura (cm)</span>
          <input name="heightCm" type="number" inputmode="numeric" min="120" max="230" value="${p.heightCm ?? ""}" placeholder="178" required>
          <small class="error" hidden>Entre 120 y 230</small>
        </label>
        <label class="field">
          <span>Peso (kg)</span>
          <input name="kg" type="number" inputmode="decimal" step="0.1" min="30" max="200" value="${kg ?? ""}" placeholder="72" required>
          <small class="error" hidden>Entre 30 y 200</small>
        </label>
      </div>

      <fieldset class="field">
        <legend>Mano con la que lanzas</legend>
        <div class="segmented wide">
          ${radio("hand", "R", "Derecha", p.hand ?? "R")}
          ${radio("hand", "L", "Izquierda", p.hand)}
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>Posición</legend>
        <div class="choice-grid">
          ${Object.entries(POSITIONS).map(([id, name]) => `
            <label class="choice">
              <input type="radio" name="position" value="${id}" ${(p.position ?? "hibrido") === id ? "checked" : ""}>
              <span class="choice-title">${name}</span>
              <span class="choice-help">${POSITION_HELP[id]}</span>
            </label>`).join("")}
        </div>
      </fieldset>

      <fieldset class="field">
        <legend>¿Dónde entrenas?</legend>
        <div class="choice-grid two">
          <label class="choice">
            <input type="radio" name="mode" value="gym" ${(p.mode ?? "casa") === "gym" ? "checked" : ""}>
            <span class="choice-title">Gimnasio</span>
            <span class="choice-help">Barras, mancuernas y máquinas. Lo mejor para fuerza máxima y potencia.</span>
          </label>
          <label class="choice">
            <input type="radio" name="mode" value="casa" ${(p.mode ?? "casa") === "casa" ? "checked" : ""}>
            <span class="choice-title">Casa / sin equipo</span>
            <span class="choice-help">Peso corporal y bandas. Ideal para empezar y para blindar articulaciones.</span>
          </label>
        </div>
      </fieldset>

      <button type="submit" class="btn primary block">${welcome ? `Empezar ${icon("arrow")}` : `${icon("check")} Guardar cambios`}</button>
    </form>

    ${welcome ? "" : weightSection()}
    ${welcome ? "" : dataSection()}
  `;
  if (!welcome) bindData(root);

  const form = root.querySelector(".profile-form");
  form.addEventListener("input", (e) => {
    const err = e.target.closest(".field")?.querySelector(".error");
    if (err) err.hidden = true;
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const checks = [
      ["name", (v) => v.trim().length > 0],
      ["sex", (v) => v === "m" || v === "f"],
      ["age", (v) => v >= 10 && v <= 90],
      ["heightCm", (v) => v >= 120 && v <= 230],
      ["kg", (v) => v >= 30 && v <= 200],
    ];
    let firstBad = null;
    for (const [name, ok] of checks) {
      const raw = data.get(name) ?? "";
      const val = ["age", "heightCm", "kg"].includes(name) ? Number(raw || NaN) : raw;
      const field = form.querySelector(`[name="${name}"]`).closest(".field");
      const valid = ok(val);
      field.querySelector(".error").hidden = valid;
      if (!valid && !firstBad) firstBad = field;
    }
    if (firstBad) {
      firstBad.querySelector("input")?.focus();
      return;
    }
    const newKg = Number(data.get("kg"));
    store.saveProfile({
      name: data.get("name").trim(),
      sex: data.get("sex"),
      age: Number(data.get("age")),
      heightCm: Number(data.get("heightCm")),
      hand: data.get("hand"),
      position: data.get("position"),
      mode: data.get("mode"),
    });
    if (newKg !== store.currentWeight()) store.addWeight(newKg, today());
    if (welcome) location.hash = "#inicio";
    else toast(`<div class="toast-head"><span>${icon("check")} Perfil guardado. Metas y prioridades recalculadas.</span></div>`, 3500);
  });

  root.querySelector(".weight-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = Number(new FormData(e.target).get("kg"));
    if (v >= 30 && v <= 200) store.addWeight(v, today());
  });
}

function weightSection() {
  const list = store.weights();
  const power = jumpPower();
  return `
    <section>
      <h2 class="section-title">Peso</h2>
      <div class="card">
        <div class="weight-head">
          <div>
            <span class="stat-label">Actual</span>
            <span class="stat-value num">${store.currentWeight() ?? "–"}<small>kg</small></span>
          </div>
          <span class="trend accent">${sparkline(list.map((w) => w.kg).length > 1 ? normalize(list.map((w) => w.kg)) : [])}</span>
        </div>
        <form class="weight-form inline-form">
          <label class="field grow">
            <span>Registrar peso de hoy (kg)</span>
            <input name="kg" type="number" inputmode="decimal" step="0.1" min="30" max="200" required>
          </label>
          <button class="btn secondary" type="submit">${icon("plus")} Agregar</button>
        </form>
        ${list.length > 1 ? `<ul class="history-list compact">${[...list].reverse().slice(0, 5).map((w) => `<li><span class="muted">${fmtDate(w.date)}</span><span class="num">${w.kg} kg</span></li>`).join("")}</ul>` : ""}
      </div>
      ${power ? `
        <div class="card insight">
          ${icon("zap", "accent")}
          <div>
            <p class="insight-title">Potencia de salto: <span class="num">${power.watts} W</span> · <span class="num">${power.perKg} W/kg</span></p>
            <p class="muted small">Calculada con tu salto vertical y tu peso. Si bajas grasa sin perder salto, los W/kg suben: eso es lo que te hace más explosivo.</p>
          </div>
        </div>` : ""}
    </section>`;
}

function dataSection() {
  return `
    <section>
      <h2 class="section-title">Tus datos</h2>
      <div class="card data-card">
        <p class="muted small">Se guardan solo en este celular. Haz un respaldo para pasarlos a otro dispositivo o no perderlos.</p>
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

function bindData(root) {
  root.querySelector('[data-act="demo"]')?.addEventListener("click", () => {
    store.loadDemo(buildDemo());
    location.hash = "#inicio";
  });
  root.querySelector('[data-act="clear-demo"]')?.addEventListener("click", () => store.clearDemo());
  root.querySelector('[data-act="export"]').addEventListener("click", () => {
    const blob = new Blob([store.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ulti-coach-respaldo-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  root.querySelector('[data-act="import"]').addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      store.importJSON(await file.text());
      toast(`<div class="toast-head"><span>${icon("check")} Datos restaurados</span></div>`, 3000);
    } catch {
      alert("Ese archivo no es un respaldo válido de Ulti Coach.");
    }
  });
}

function normalize(values) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return values.map((v) => ((v - lo) / (hi - lo || 1)) * 100);
}

function radio(name, value, label, current) {
  return `<label><input type="radio" name="${name}" value="${value}" ${current === value ? "checked" : ""}><span>${label}</span></label>`;
}

function escapeAttr(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
