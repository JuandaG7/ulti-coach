// Video: tu forehand contra jugadores pro.
// - Biblioteca pro: clips de pros (grabaciones de pantalla) → solo esqueleto y métricas, en este celular.
// - Tu forehand: mismas métricas, lado a lado con un pro sincronizado en la suelta y tabla "tú vs rango pro".
// La vista se crea una sola vez y se reutiliza, para no perder el análisis al cambiar de pestaña.
import { profile } from "../store.js";
import { level } from "../scoring.js";
import { MUSCLES } from "../data/muscles.js";
import {
  analyzeForehand, compactFrames, trimAroundRelease, point2D, METRICS, METRICS_BY_ID, BONES,
  proBand, scoreVsPro, gapSide,
} from "../forehand.js";
import { listClips, saveClip, deleteClip } from "../clips.js";
import { icon, levelChip, ring, today, fmtDate, tierClass, toast } from "../ui.js";
import { drillChips, bindDrills } from "./exercise-sheet.js";
import { openForehandGuide } from "./forehand-guide.js";

const MAX_SECONDS = 20;
const SPEEDS = [
  { factor: 1, label: "Real" },
  { factor: 2, label: "×2" },
  { factor: 4, label: "×4" },
  { factor: 8, label: "×8" },
];
// Ventana que se reproduce alrededor de la suelta (segundos reales).
const TAU = { min: -0.8, max: 0.4 };
// Colores de la cadena: del verde oscuro (cadera) al marfil (muñeca), la escala de niveles de la app.
const CHAIN = [
  { key: "hip", name: "Cadera", color: "#2c6b4b" },
  { key: "trunk", name: "Hombros", color: "#42966a" },
  { key: "elbow", name: "Codo", color: "#8cc7a0" },
  { key: "wrist", name: "Muñeca", color: "#e3ecd0" },
];

// Dónde encontrar lanzamientos de pros. Son búsquedas (no videos fijos): siempre traen resultados actuales.
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const PRO_SOURCES = [
  { label: "Forehand en cámara lenta", url: yt("ultimate frisbee forehand slow motion") },
  { label: "Hucks de forehand", url: yt("ultimate frisbee forehand huck") },
  { label: "Liga pro de EE. UU. (UFA)", url: yt("UFA ultimate frisbee highlights") },
  { label: "Mundiales WFDF", url: yt("WFDF world ultimate championships highlights") },
  { label: "TikTok #ultimatefrisbee", url: "https://www.tiktok.com/tag/ultimatefrisbee" },
  { label: "Instagram #ultimatefrisbee", url: "https://www.instagram.com/explore/tags/ultimatefrisbee/" },
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmtVal = (m, v) => (v == null ? "–" : `${Number(v).toFixed(m.decimals)}`);

let el = null;
let pose = null; // módulo pose.js, se carga solo al abrir esta pestaña
let landmarker = null;
let busy = false;

let pros = [];
let mine = [];
const analyses = new Map(); // id → análisis (se recalcula del esqueleto guardado)
let current = null; // { clip, a, video: bool, release, factor }
let proId = null;
let mirror = false;
let tau = 0;
let playing = false;
let lastScores = {}; // puntajes del análisis en pantalla, para la guía

const myHand = () => profile()?.hand ?? "R";
const analysisOf = (clip) => {
  if (!analyses.has(clip.id)) analyses.set(clip.id, analyzeForehand(clip));
  return analyses.get(clip.id);
};

export function render(root) {
  if (!el) build();
  root.append(el);
  if (!pose) loadModel();
  requestAnimationFrame(layout);
}

export function leave() {
  pause();
}

function build() {
  el = document.createElement("div");
  el.className = "fh";
  el.innerHTML = `
    <header class="page-head">
      <h1 class="display">Video</h1>
      <p class="muted small">Tu forehand contra jugadores pro. Graba de lado, con todo el cuerpo en el cuadro, el celular quieto y desde antes del armado.</p>
    </header>

    <section class="card">
      <p class="eyebrow">Tu forehand</p>
      <fieldset class="field">
        <legend>¿Cómo se ve el video?</legend>
        <div class="segmented wide">${speedRadios("my-speed")}</div>
        <small class="muted">Si lo grabaste en cámara lenta y se reproduce lento, elige ×4 (120 fps) o ×8 (240 fps).</small>
      </fieldset>
      <label class="btn primary block disabled" data-pick="mine">
        ${icon("video")} Analizar mi forehand
        <input type="file" accept="video/*" hidden disabled>
      </label>
      <p class="muted small status" data-status="mine">Cargando modelo de pose…</p>
      <progress value="0" max="1" hidden data-progress="mine"></progress>
      <button type="button" class="btn ghost block" data-act="guide">${icon("target")} Cómo es un buen forehand</button>
    </section>

    <div class="fh-result" hidden data-result>
      <div class="banner warn" hidden data-warn></div>

      <section class="card">
        <div class="section-title-row">
          <h2 class="section-title">Lado a lado</h2>
          <button type="button" class="btn ghost small-btn" data-act="mirror" aria-pressed="false">Espejo</button>
        </div>
        <label class="field" data-pro-pick hidden>
          <span>Comparar con</span>
          <select data-pro-select></select>
        </label>
        <div class="duo">
          <figure>
            <div class="stage" data-stage="me">
              <video playsinline muted preload="auto"></video>
              <canvas data-canvas="me"></canvas>
            </div>
            <figcaption>Tú</figcaption>
          </figure>
          <figure>
            <div class="stage skeleton" data-stage="pro">
              <canvas data-canvas="pro"></canvas>
              <p class="stage-empty muted small" data-pro-empty>Agrega un clip en la Biblioteca pro</p>
            </div>
            <figcaption data-pro-name>Pro</figcaption>
          </figure>
        </div>
        <div class="controls">
          <button type="button" class="icon-btn solid" data-act="play" aria-label="Reproducir">▶︎</button>
          <input type="range" step="0.001" value="0" aria-label="Momento del lanzamiento" data-seek>
          <select aria-label="Velocidad" data-rate>
            <option value="1">1×</option>
            <option value="0.5">0.5×</option>
            <option value="0.25" selected>0.25×</option>
          </select>
        </div>
        <div class="sync-row">
          <span class="num tau" data-tau>0 ms</span>
          <button type="button" class="link" data-act="release">Ir a la suelta</button>
        </div>
        <p class="muted small">Los dos videos están sincronizados en el momento de soltar (0 ms). Del pro solo se guardó el esqueleto.</p>
      </section>

      <section class="card">
        <h2 class="section-title">Cadena de lanzamiento</h2>
        <p class="muted small section-sub">Cada línea es la velocidad de una parte del cuerpo. En un buen forehand los picos van en orden, como un látigo.</p>
        <canvas class="chain-chart" data-chain></canvas>
        <ul class="legend chain-legend">${CHAIN.map((c) => `<li><i style="background:${c.color}"></i>${c.name}</li>`).join("")}<li><i class="pro-tick"></i>Pico pro (mediana)</li></ul>
        <p class="small" data-chain-text></p>
      </section>

      <section class="card" data-vs-pro></section>
      <section class="card" data-focus hidden></section>
      <section class="card" data-own></section>

      <button type="button" class="btn ghost" data-act="export">${icon("download")} Descargar datos (JSON)</button>
    </div>

    <section class="card">
      <details data-lib>
        <summary><span class="summary-label"><span class="eyebrow">Biblioteca pro</span> <span class="num" data-pro-count>0</span></span><span class="toggle"><span class="when-closed">Ver más</span><span class="when-open">Ver menos</span>${icon("down")}</span></summary>
        <div class="lib-body">
          <div class="lib-start">
            <p class="eyebrow">La forma rápida</p>
            <p class="small">Si alguien de tu equipo ya armó su biblioteca, pídele que la comparta y la cargas aquí en un toque.</p>
            <label class="btn secondary block">${icon("upload")} Cargar biblioteca del equipo<input type="file" accept="application/json,.json" hidden data-import></label>
          </div>

          <div class="lib-sources">
            <p class="eyebrow">Agregar un pro en 1 minuto</p>
            <ol class="tips">
              <li>Abre una búsqueda y elige un forehand donde se vea <strong>todo el cuerpo</strong>, ojalá de lado.</li>
              <li><strong>Graba la pantalla</strong> (Centro de control → botón de grabar) mientras pasa el lanzamiento.</li>
              <li>En Fotos: <strong>Editar → recorta</strong> a 2–8 s, desde antes del armado.</li>
              <li>Vuelve aquí y toca <strong>Agregar clip de pro</strong>.</li>
            </ol>
            <ul class="source-links">${PRO_SOURCES.map((x) => `<li><a href="${x.url}" target="_blank" rel="noopener">${x.label}${icon("chevron")}</a></li>`).join("")}</ul>
            <p class="muted small">¿Te salió un lanzamiento brutal en TikTok o Instagram? Grábalo igual y agrégalo. El video <strong>no se guarda</strong>: solo el esqueleto y las métricas, y solo en este celular.</p>
          </div>
          <label class="field"><span>Nombre</span><input type="text" maxlength="40" placeholder="Ej.: handler de selección, final 2024" data-pro-name-input></label>
          <fieldset class="field">
            <legend>Mano con la que lanza</legend>
            <div class="segmented wide">
              <label><input type="radio" name="pro-hand" value="R" checked><span>Diestro</span></label>
              <label><input type="radio" name="pro-hand" value="L"><span>Zurdo</span></label>
            </div>
          </fieldset>
          <fieldset class="field">
            <legend>¿Es una repetición en cámara lenta?</legend>
            <div class="segmented wide">${speedRadios("pro-speed")}</div>
          </fieldset>
          <label class="btn secondary block disabled" data-pick="pro">
            ${icon("plus")} Agregar clip de pro
            <input type="file" accept="video/*" hidden disabled>
          </label>
          <p class="muted small status" data-status="pro"></p>
          <progress value="0" max="1" hidden data-progress="pro"></progress>
          <video class="work-video" playsinline muted preload="auto" data-work></video>
          <ul class="clip-list" data-pro-list></ul>
          <button type="button" class="btn ghost block" data-act="share-lib" hidden>${icon("upload")} Compartir biblioteca con mi equipo</button>
        </div>
      </details>
    </section>

    <section class="card">
      <details data-hist>
        <summary><span class="summary-label"><span class="eyebrow">Tus videos</span> <span class="num" data-mine-count>0</span></span><span class="toggle"><span class="when-closed">Ver más</span><span class="when-open">Ver menos</span>${icon("down")}</span></summary>
        <ul class="clip-list" data-mine-list></ul>
      </details>
    </section>
  `;
  wire();
  loadLibrary();
}

function speedRadios(name) {
  return SPEEDS.map((s) => `<label><input type="radio" name="${name}" value="${s.factor}" ${s.factor === 1 ? "checked" : ""}><span>${s.label}</span></label>`).join("");
}

const $ = (sel) => el.querySelector(sel);

async function loadModel() {
  const status = $('[data-status="mine"]');
  try {
    pose = await import("../pose.js");
    landmarker = await pose.createPoseLandmarker();
    status.textContent = "Listo. Elige un video de 2–8 segundos con un forehand.";
    el.querySelectorAll("[data-pick] input").forEach((i) => (i.disabled = false));
    el.querySelectorAll("[data-pick]").forEach((l) => l.classList.remove("disabled"));
  } catch (err) {
    console.error(err);
    pose = null;
    status.textContent = "No se pudo cargar el modelo. Revisa tu conexión y vuelve a abrir esta pestaña.";
  }
}

async function loadLibrary() {
  try {
    [pros, mine] = await Promise.all([listClips("pro"), listClips("mine")]);
  } catch (err) {
    console.error(err);
    $('[data-status="pro"]').textContent = "Este navegador no deja guardar clips (¿modo privado?).";
  }
  $("[data-lib]").open = !pros.length;
  paintLists();
  // Al abrir la pestaña sin video nuevo, mostramos tu último análisis guardado.
  if (!current && mine.length) showClip(mine[0]);
}

// ---------- Analizar un archivo ----------

// Analiza el video y devuelve el clip listo para guardar (sin el video).
async function analyzeFile(video, file, { kind, factor, hand }) {
  const status = $(`[data-status="${kind}"]`);
  const progress = $(`[data-progress="${kind}"]`);
  const url = URL.createObjectURL(file);
  video.src = url;
  await new Promise((resolve, reject) => {
    video.addEventListener("loadeddata", resolve, { once: true });
    video.addEventListener("error", () => reject(new Error("video")), { once: true });
  });
  if (video.duration > MAX_SECONDS) {
    throw new Error(`El clip dura ${Math.round(video.duration)} s. Recórtalo a 2–8 s alrededor del lanzamiento (en Fotos: Editar) y vuelve a intentarlo.`);
  }
  progress.hidden = false;
  status.textContent = "Analizando… (no cierres la página)";
  const raw = await pose.analyzeVideo(video, landmarker, {
    sampleFps: video.duration > 8 ? 30 : 60,
    onProgress: (p) => (progress.value = p),
  });
  progress.hidden = true;
  const frames = compactFrames(raw, factor);
  const w = video.videoWidth;
  const h = video.videoHeight;
  const full = analyzeForehand({ frames, hand, w, h });
  if (!full) throw new Error("No encontramos el lanzamiento: revisa que se vea todo el cuerpo.");
  return {
    clip: { kind, name: file.name.replace(/\.[^.]+$/, ""), date: today(), hand, factor, w, h, frames: trimAroundRelease(frames, full.release) },
    release: full.release,
  };
}

function wire() {
  const meVideo = $('[data-stage="me"] video');

  // Tu forehand
  $('[data-pick="mine"] input').addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || busy) return;
    const factor = Number(el.querySelector("[name=my-speed]:checked").value);
    const status = $('[data-status="mine"]');
    lock(true);
    pause();
    try {
      const { clip, release } = await analyzeFile(meVideo, file, { kind: "mine", factor, hand: myHand() });
      let saved = clip;
      try {
        saved = await saveClip(clip);
        mine.unshift(saved);
      } catch {
        saved = { ...clip, id: "temp" };
      }
      showClip(saved, { video: true, release, factor });
      status.textContent = "Listo. Abajo ves cómo te comparas con los pros.";
      paintLists();
      $("[data-result]").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      console.error(err);
      status.textContent = err.message?.length > 10 ? err.message : "No se pudo analizar ese video.";
      $('[data-progress="mine"]').hidden = true;
      // El video que falló quedó cargado: volvemos a mostrar el análisis anterior (solo esqueleto).
      if (current) showClip(current.clip);
      else meVideo.removeAttribute("src");
    }
    lock(false);
  });

  // Biblioteca pro
  $('[data-pick="pro"] input').addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || busy) return;
    const work = $("[data-work]");
    const status = $('[data-status="pro"]');
    const factor = Number(el.querySelector("[name=pro-speed]:checked").value);
    const hand = el.querySelector("[name=pro-hand]:checked").value;
    const nameInput = $("[data-pro-name-input]");
    lock(true);
    try {
      const { clip } = await analyzeFile(work, file, { kind: "pro", factor, hand });
      clip.name = nameInput.value.trim() || clip.name;
      const saved = await saveClip(clip);
      pros.unshift(saved);
      proId = saved.id;
      nameInput.value = "";
      const a = analysisOf(saved);
      status.textContent = a?.quality.ok ? "Clip agregado. El video no se guardó." : `Clip agregado, con aviso: ${a.quality.warnings[0]}`;
      paintLists();
      if (current) paintResult();
    } catch (err) {
      console.error(err);
      status.textContent = err.message?.length > 10 ? err.message : "No se pudo analizar ese video.";
      $('[data-progress="pro"]').hidden = true;
    }
    // Soltamos el video: no queda nada de él en la app.
    URL.revokeObjectURL(work.src);
    work.removeAttribute("src");
    work.load();
    lock(false);
  });

  // Biblioteca compartida por el equipo
  $("[data-import]").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const added = await importLibrary(await file.text());
      toast(added ? `${icon("check")} ${added} clip${added > 1 ? "s" : ""} de pros cargado${added > 1 ? "s" : ""}.` : "Esos clips ya estaban en tu biblioteca.");
    } catch (err) {
      console.error(err);
      toast(`${icon("alert")} Ese archivo no es una biblioteca de Ulti Coach.`);
    }
  });

  // Listas: abrir o borrar (y el atajo a la biblioteca desde la tabla)
  el.addEventListener("click", async (e) => {
    if (e.target.closest('[data-act="open-lib"]')) return openLib();
    if (e.target.closest('[data-act="guide"]')) return openForehandGuide(current ? lastScores : {});
    if (e.target.closest('[data-act="share-lib"]')) return shareLibrary();
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!confirm("¿Borrar este clip? Se pierden su esqueleto y sus métricas.")) return;
      const id = del.dataset.del;
      await deleteClip(id);
      pros = pros.filter((c) => c.id !== id);
      mine = mine.filter((c) => c.id !== id);
      analyses.delete(id);
      if (proId === id) proId = null;
      if (current?.clip.id === id) {
        current = null;
        $("[data-result]").hidden = true;
      }
      paintLists();
      if (current) paintResult();
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) {
      const clip = mine.find((c) => c.id === open.dataset.open);
      if (clip) {
        showClip(clip);
        $("[data-result]").scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    const pick = e.target.closest("[data-pick-pro]");
    if (pick) {
      proId = pick.dataset.pickPro;
      if (current) {
        paintResult();
        $("[data-result]").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  // Reproductor
  const seek = $("[data-seek]");
  const rate = $("[data-rate]");
  $('[data-act="play"]').addEventListener("click", () => (playing ? pause() : play()));
  rate.addEventListener("change", () => playing && play());
  seek.addEventListener("input", () => {
    pause();
    setTau(Number(seek.value));
  });
  $('[data-act="release"]').addEventListener("click", () => {
    pause();
    setTau(0);
  });
  $('[data-act="mirror"]').addEventListener("click", () => {
    mirror = !mirror;
    $('[data-act="mirror"]').setAttribute("aria-pressed", mirror);
    draw();
  });
  $("[data-pro-select]").addEventListener("change", (e) => {
    proId = e.target.value;
    paintResult();
  });
  meVideo.addEventListener("seeked", draw);
  $("[data-chain]").addEventListener("click", (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const { x0, x1, pad } = chainAxis(r.width);
    pause();
    setTau(Math.min(x1, Math.max(x0, x0 + ((e.clientX - r.left - pad) / (r.width - 2 * pad)) * (x1 - x0))));
  });
  window.addEventListener("resize", () => el.isConnected && layout());

  $('[data-act="export"]').addEventListener("click", () => {
    if (!current) return;
    const blob = new Blob([JSON.stringify(current.clip)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${current.clip.name}-forehand.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  let last = performance.now();
  const tick = (now) => {
    if (playing && current && el.isConnected) {
      const { min, max } = tauRange();
      if (current.video) tau = meVideo.currentTime / current.factor - current.release;
      else tau += ((now - last) / 1000) * Number(rate.value);
      if (tau > max) setTau(min, true);
      else draw();
    }
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function lock(on) {
  busy = on;
  el.querySelectorAll("[data-pick]").forEach((l) => l.classList.toggle("disabled", on || !pose));
}

// ---------- Resultado ----------

function showClip(clip, live = null) {
  const a = analysisOf(clip);
  if (!a) return;
  const video = $('[data-stage="me"] video');
  if (!live) {
    pause();
    video.removeAttribute("src");
    video.load();
  }
  current = { clip, a, video: !!live, release: live?.release ?? 0, factor: live?.factor ?? 1 };
  $('[data-stage="me"]').classList.toggle("skeleton", !live);
  $("[data-result]").hidden = false;
  paintResult();
  setTau(0);
}

function tauRange() {
  const f = current.clip.frames;
  return { min: Math.max(TAU.min, f[0].t), max: Math.min(TAU.max, f[f.length - 1].t) };
}

function setTau(value, resume = false) {
  tau = value;
  if (current?.video) {
    const v = $('[data-stage="me"] video');
    v.currentTime = Math.max(0, (current.release + tau) * current.factor);
    if (resume) v.play().catch(() => {});
  }
  draw();
}

function play() {
  if (!current) return;
  playing = true;
  const { min, max } = tauRange();
  if (tau >= max - 0.01) setTau(min);
  if (current.video) {
    const v = $('[data-stage="me"] video');
    v.playbackRate = Math.min(16, Math.max(0.0625, Number($("[data-rate]").value) * current.factor));
    v.play().catch(() => {});
  }
  $('[data-act="play"]').textContent = "❚❚";
}

function pause() {
  playing = false;
  el?.querySelector('[data-stage="me"] video')?.pause();
  if (el) $('[data-act="play"]').textContent = "▶︎";
}

const validPros = () => pros.filter((c) => analysisOf(c));

function paintResult() {
  const { clip, a } = current;
  const usable = validPros();
  if (!usable.some((c) => c.id === proId)) proId = usable[0]?.id ?? null;
  const pro = usable.find((c) => c.id === proId);
  mirror = pro ? pro.hand !== clip.hand : false;
  $('[data-act="mirror"]').setAttribute("aria-pressed", mirror);

  // Avisos de calidad
  const warn = $("[data-warn]");
  warn.hidden = a.quality.ok;
  warn.innerHTML = `${icon("alert")}<span>${a.quality.warnings.join(" ")} Toma estos números con cautela.</span>`;

  // Lado a lado
  const meStage = $('[data-stage="me"]');
  const proStage = $('[data-stage="pro"]');
  meStage.style.aspectRatio = `${clip.w} / ${clip.h}`;
  proStage.style.aspectRatio = `${clip.w} / ${clip.h}`;
  $("[data-pro-empty]").hidden = !!pro;
  $("[data-pro-name]").textContent = pro ? pro.name : "Pro";
  $("[data-pro-pick]").hidden = usable.length < 2;
  $("[data-pro-select]").innerHTML = usable.map((c) => `<option value="${c.id}" ${c.id === proId ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  const seek = $("[data-seek]");
  const { min, max } = tauRange();
  seek.min = min;
  seek.max = max;

  // Comparación
  const bands = Object.fromEntries(
    METRICS.filter((m) => m.scope === "pro").map((m) => [m.id, proBand(usable.map((c) => analysisOf(c).metrics[m.id]))])
  );
  const rows = METRICS.filter((m) => m.scope === "pro").map((m) => {
    const value = a.metrics[m.id];
    const band = bands[m.id];
    return { m, value, band, score: scoreVsPro(m.id, value, band) };
  });
  const scored = rows.filter((r) => r.score != null);
  const overall = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : null;

  lastScores = Object.fromEntries(rows.map((r) => [r.m.id, r.score]));
  $("[data-vs-pro]").innerHTML = vsProCard(rows, overall, usable.length);
  paintFocus(rows);
  $("[data-own]").innerHTML = ownCard(clip, a);
  paintChainText(a);
  layout();
}

function vsProCard(rows, overall, n) {
  if (!n) {
    return `
      <h2 class="section-title">Tú vs rango pro</h2>
      <p class="muted">Para ver tu nivel en cada métrica falta con quién compararte. Carga la biblioteca de tu equipo o agrega 3 lanzamientos de pros: hay links listos.</p>
      <button type="button" class="btn primary block" data-act="open-lib">${icon("plus")} Armar mi biblioteca pro</button>
      <ul class="metric-list">${rows.map(({ m, value }) => metricRow(m, value, null, null)).join("")}</ul>`;
  }
  return `
    <div class="vs-head ${tierClass(overall)}">
      ${ring(overall, { size: 76, stroke: 8 })}
      <div>
        <p class="eyebrow">Tú vs rango pro</p>
        <h2 class="section-title">${level(overall).name}</h2>
        <p class="muted small">Contra ${n} clip${n > 1 ? "s" : ""} de pros${n < 3 ? " · con menos de 3 el rango es preliminar" : ""}</p>
      </div>
    </div>
    <ul class="metric-list">${rows.map(({ m, value, band, score }) => metricRow(m, value, band, score)).join("")}</ul>
    <p class="muted small">Estas métricas casi no dependen del ángulo de la cámara. Dentro del rango pro = 100 puntos; las tolerancias fuera del rango son estimaciones.</p>`;
}

function metricRow(m, value, band, score) {
  const lo = band?.lo.toFixed(m.decimals);
  const hi = band?.hi.toFixed(m.decimals);
  const range = !band ? "–" : lo === hi ? lo : `${lo}–${hi}`;
  return `
    <li>
      <details class="metric">
        <summary>
          <span class="metric-name">${m.name}</span>
          <span class="metric-you num">${fmtVal(m, value)}<small>${m.unit}</small></span>
          <span class="metric-pro muted small">pro <span class="num">${range}</span></span>
          <span class="metric-level">${score != null ? levelChip(score) : `<span class="chip tier-none">Sin datos</span>`}</span>
        </summary>
        <p class="muted small">${m.what}</p>
      </details>
    </li>`;
}

// Brecha más grande → qué trabajar, conectado con Cuerpo y los ejercicios.
function paintFocus(rows) {
  const box = $("[data-focus]");
  const gaps = rows.filter((r) => r.score != null && r.score < 85).sort((x, y) => x.score - y.score);
  if (!rows.some((r) => r.score != null)) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  if (!gaps.length) {
    box.innerHTML = `
      <p class="eyebrow">Qué trabajar</p>
      <h2 class="step-title">En rango pro en todo lo que medimos</h2>
      <p class="muted small">Sigue sumando clips de pros para afinar el rango, y repite el análisis cada pocas semanas.</p>`;
    return;
  }
  const { m, value, band } = gaps[0];
  const side = m.dir === "up" ? "low" : gapSide(m.id, value, band);
  const muscle = MUSCLES[m.muscle];
  box.innerHTML = `
    <p class="eyebrow">Qué trabajar</p>
    <h2 class="step-title">${m.name}</h2>
    <p class="small">${m[side]}</p>
    ${drillChips(m.drills)}
    ${muscle ? `<a class="btn secondary block" href="#cuerpo/${m.muscle}">${icon("body")} Ver ${muscle.name.toLowerCase()} en Cuerpo</a>` : ""}
    <button type="button" class="link" data-act="guide">Ver la guía del forehand</button>
    ${gaps.length > 1 ? `<p class="muted small">También: ${gaps.slice(1, 3).map((g) => g.m.name.toLowerCase()).join(" y ")}.</p>` : ""}`;
  bindDrills(box);
}

// Métricas que dependen del ángulo: solo contra tus videos anteriores.
function ownCard(clip, a) {
  const before = mine.filter((c) => c.id !== clip.id && c.createdAt < (clip.createdAt ?? Infinity)).map(analysisOf).filter(Boolean);
  const rows = METRICS.filter((m) => m.scope === "own").map((m) => {
    const value = a.metrics[m.id];
    const prev = before.map((x) => x.metrics[m.id]).filter((v) => v != null);
    const avg = prev.length ? prev.reduce((s, v) => s + v, 0) / prev.length : null;
    return `
      <li>
        <details class="metric">
          <summary>
            <span class="metric-name">${m.name}</span>
            <span class="metric-you num">${fmtVal(m, value)}<small>${m.unit}</small></span>
            <span class="metric-pro muted small">${avg != null ? `antes <span class="num">${avg.toFixed(m.decimals)}</span> (${prev.length})` : "sin videos anteriores"}</span>
          </summary>
          <p class="muted small">${m.what}</p>
        </details>
      </li>`;
  });
  return `
    <h2 class="section-title">Contra tus videos</h2>
    <p class="muted small section-sub">Dependen de dónde pusiste la cámara: compáralas solo entre videos grabados igual.</p>
    <ul class="metric-list">${rows.join("")}</ul>`;
}

function paintChainText(a) {
  const { peaks, metrics } = a;
  const order = metrics.chainOrder;
  const fmtMs = (v) => (v == null ? "–" : `${Math.round(v) < 0 ? "−" : ""}${Math.abs(Math.round(v))} ms`);
  const text =
    order == null
      ? "No pudimos medir la cadena en este video."
      : order === 3
        ? `${icon("check")} Orden correcto: cadera (${fmtMs(peaks.hip)}) → hombros (${fmtMs(peaks.trunk)}) → codo (${fmtMs(peaks.elbow)}) → muñeca (0 ms).`
        : `${icon("alert")} ${order} de 3 eslabones en orden: cadera ${fmtMs(peaks.hip)}, hombros ${fmtMs(peaks.trunk)}, codo ${fmtMs(peaks.elbow)}, muñeca 0 ms.`;
  $("[data-chain-text]").innerHTML = `<span class="chain-text">${text}</span>`;
}

// ---------- Dibujo ----------

function layout() {
  if (!current || !el.isConnected) return;
  for (const c of el.querySelectorAll("[data-canvas], [data-chain]")) {
    const dpr = window.devicePixelRatio || 1;
    c.width = Math.round(c.clientWidth * dpr);
    c.height = Math.round(c.clientHeight * dpr);
  }
  draw();
}

function frameAt(frames, t) {
  let lo = 0;
  let hi = frames.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (frames[m].t < t) lo = m;
    else hi = m;
  }
  return Math.abs(frames[lo].t - t) <= Math.abs(frames[hi].t - t) ? frames[lo] : frames[hi];
}

// Caja que encierra todo el clip (en píxeles del video original), para centrar el esqueleto.
const boxCache = new WeakMap();
function bbox(clip) {
  if (!boxCache.has(clip)) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of clip.frames) {
      if (!f.p) continue;
      for (const [a, b] of BONES) {
        for (const i of [a, b]) {
          const p = point2D(f, i);
          x0 = Math.min(x0, p.x * clip.w); x1 = Math.max(x1, p.x * clip.w);
          y0 = Math.min(y0, p.y * clip.h); y1 = Math.max(y1, p.y * clip.h);
        }
      }
    }
    boxCache.set(clip, { x0, y0, x1, y1 });
  }
  return boxCache.get(clip);
}

function drawSkeleton(canvas, clip, t, { fit, flip, bone }) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!clip) return;
  const f = frameAt(clip.frames, t);
  if (!f?.p) return;
  let map;
  if (fit) {
    const b = bbox(clip);
    const s = Math.min((W * 0.86) / (b.x1 - b.x0 || 1), (H * 0.86) / (b.y1 - b.y0 || 1));
    const ox = (W - (b.x1 - b.x0) * s) / 2;
    const oy = (H - (b.y1 - b.y0) * s) / 2;
    map = (p) => ({ x: ox + (p.x * clip.w - b.x0) * s, y: oy + (p.y * clip.h - b.y0) * s });
  } else {
    map = (p) => ({ x: p.x * W, y: p.y * H });
  }
  const pt = (i) => {
    const q = map(point2D(f, i));
    return flip ? { x: W - q.x, y: q.y } : q;
  };
  const dpr = window.devicePixelRatio || 1;
  const arm = clip.hand === "L" ? [11, 13, 15] : [12, 14, 16];
  ctx.lineCap = "round";
  for (const [a, b] of BONES) {
    const thick = arm.includes(a) && arm.includes(b);
    ctx.strokeStyle = bone;
    ctx.lineWidth = (thick ? 4 : 2.5) * dpr;
    const p = pt(a);
    const q = pt(b);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  const wr = pt(arm[2]);
  ctx.fillStyle = "#f3ecdc";
  ctx.beginPath();
  ctx.arc(wr.x, wr.y, 5 * dpr, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  if (!current || !el.isConnected) return;
  const pro = pros.find((c) => c.id === proId);
  drawSkeleton($('[data-canvas="me"]'), current.clip, tau, { fit: !current.video, flip: false, bone: "#8cc7a0" });
  drawSkeleton($('[data-canvas="pro"]'), pro, tau, { fit: true, flip: mirror, bone: "#cfc8b4" });
  $("[data-seek]").value = tau;
  const ms = Math.round(tau * 1000);
  $("[data-tau]").textContent = ms === 0 ? "Suelta · 0 ms" : `${ms > 0 ? "+" : "−"}${Math.abs(ms)} ms`;
  drawChain();
}

function chainAxis(width) {
  return { x0: -0.6, x1: 0.15, pad: Math.min(14, width * 0.04) };
}

function drawChain() {
  const canvas = $("[data-chain]");
  const { a } = current;
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width / dpr;
  const H = canvas.height / dpr;
  if (!W) return;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const { x0, x1, pad } = chainAxis(W);
  const top = 18;
  const bottom = 22;
  const x = (t) => pad + ((t - x0) / (x1 - x0)) * (W - 2 * pad);
  const y = (v) => H - bottom - Math.max(0, Math.min(1.1, v)) / 1.1 * (H - top - bottom);

  // Línea de la suelta
  ctx.strokeStyle = "#20392f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x(0), top - 8);
  ctx.lineTo(x(0), H - bottom);
  ctx.stroke();
  ctx.fillStyle = "#93a99b";
  ctx.font = "11px Barlow, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("suelta", x(0), H - 6);
  ctx.textAlign = "left";
  ctx.fillText("−600 ms", pad, H - 6);

  // Picos pro (mediana) como marcas arriba
  const proPeaks = validPros().map((c) => analysisOf(c).peaks);
  if (proPeaks.length) {
    for (const c of CHAIN.slice(0, 3)) {
      const vals = proPeaks.map((p) => p[c.key]).filter((v) => v != null).sort((p, q) => p - q);
      if (!vals.length) continue;
      const med = vals[Math.floor(vals.length / 2)] / 1000;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x(med), 2);
      ctx.lineTo(x(med), 12);
      ctx.stroke();
    }
  }

  // Curvas
  const { tau: ts } = a.chain;
  for (const c of CHAIN) {
    const vals = a.chain[c.key];
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    vals.forEach((v, i) => {
      if (v == null || ts[i] < x0 || ts[i] > x1) return (started = false);
      if (started) ctx.lineTo(x(ts[i]), y(v));
      else ctx.moveTo(x(ts[i]), y(v));
      started = true;
    });
    ctx.stroke();
    const peak = c.key === "wrist" ? 0 : a.peaks[c.key];
    if (peak != null) {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(x(peak / 1000), y(1), 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Momento actual
  if (tau >= x0 && tau <= x1) {
    ctx.strokeStyle = "#cfc8b4";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x(tau), top);
    ctx.lineTo(x(tau), H - bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ---------- Listas ----------

function paintLists() {
  $("[data-pro-count]").textContent = pros.length;
  $('[data-act="share-lib"]').hidden = !pros.length;
  $("[data-mine-count]").textContent = mine.length;
  $("[data-pro-list]").innerHTML = pros.length
    ? pros.map((c) => {
        const a = analysisOf(c);
        const ws = a?.metrics.wristSpeed;
        return `
          <li class="clip-row">
            <button type="button" class="clip-main" data-pick-pro="${c.id}">
              <span class="clip-name">${esc(c.name)}</span>
              <span class="muted small">${c.hand === "L" ? "Zurdo" : "Diestro"} · ${fmtDate(c.date)}${ws != null ? ` · muñeca ${ws.toFixed(1)}` : ""}${!a ? " · sin lanzamiento" : !a.quality.ok ? ` · ${icon("alert")} revisar` : ""}</span>
            </button>
            <button type="button" class="icon-btn danger" data-del="${c.id}" aria-label="Borrar ${esc(c.name)}">${icon("trash")}</button>
          </li>`;
      }).join("")
    : `<li class="muted small">Sin clips todavía. Con 3 o más el rango pro empieza a ser útil.</li>`;
  $("[data-mine-list]").innerHTML = mine.length
    ? mine.map((c) => {
        const a = analysisOf(c);
        return `
          <li class="clip-row">
            <button type="button" class="clip-main" data-open="${c.id}">
              <span class="clip-name">${fmtDate(c.date)} · ${esc(c.name)}</span>
              <span class="muted small">${a ? `muñeca ${a.metrics.wristSpeed.toFixed(1)} · cadena ${a.metrics.chainOrder ?? "–"} de 3` : "sin lanzamiento"}</span>
            </button>
            <button type="button" class="icon-btn danger" data-del="${c.id}" aria-label="Borrar video del ${fmtDate(c.date)}">${icon("trash")}</button>
          </li>`;
      }).join("")
    : `<li class="muted small">Cada forehand que analices queda aquí (solo el esqueleto) para ver tu progreso.</li>`;
}

function openLib() {
  const lib = $("[data-lib]");
  lib.open = true;
  lib.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Compartir la biblioteca ----------
// Se comparte como archivo (WhatsApp, AirDrop): nunca pasa por el repositorio ni por un servidor.
const LIB_TYPE = "ulti-coach/biblioteca-pro";

async function shareLibrary() {
  // 3 decimales (≈ 1 mm) bastan para las métricas y el archivo pesa menos.
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const slim = (f) => ({ t: r3(f.t), p: f.p && f.p.map(r3), w: f.w && f.w.map(r3) });
  const data = { type: LIB_TYPE, version: 1, clips: pros.map(({ id, name, date, hand, factor, w, h, frames }) => ({ id, name, date, hand, factor, w, h, frames: frames.map(slim) })) };
  const file = new File([JSON.stringify(data)], "biblioteca-pro-ulti-coach.json", { type: "application/json" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Biblioteca pro · Ulti Coach" });
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importLibrary(text) {
  const data = JSON.parse(text);
  if (data.type !== LIB_TYPE || !Array.isArray(data.clips)) throw new Error("formato");
  const have = new Set(pros.map((c) => c.id));
  let added = 0;
  for (const c of data.clips) {
    if (!Array.isArray(c.frames) || !c.frames.length || have.has(c.id)) continue;
    const saved = await saveClip({ id: c.id, kind: "pro", name: String(c.name ?? "Pro").slice(0, 40), date: c.date ?? today(), hand: c.hand === "L" ? "L" : "R", factor: c.factor ?? 1, w: c.w, h: c.h, frames: c.frames });
    pros.unshift(saved);
    added++;
  }
  paintLists();
  if (current) paintResult();
  return added;
}
