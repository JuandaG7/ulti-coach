// Video: análisis de pose del forehand.
// La vista se crea una sola vez y se reutiliza, para no perder el análisis al cambiar de pestaña.
import { LM, speedSeries } from "../metrics.js";
import { icon } from "../ui.js";

const SAMPLE_FPS = 60;

let el = null;
let pose = null; // módulo pose.js, se carga solo al abrir esta pestaña
let landmarker = null;
let drawer = null;
let frames = [];
let wristSpeed = [];
let videoName = "";

export function render(root) {
  if (!el) build();
  root.append(el);
  if (!pose) loadModel();
}

export function leave() {
  el?.querySelector("video").pause();
}

function build() {
  el = document.createElement("div");
  el.innerHTML = `
    <header class="page-head">
      <h1 class="display">Video</h1>
      <p class="muted small">Análisis de forehand: graba de lado, con todo el cuerpo en el cuadro y el celular quieto.</p>
    </header>

    <section class="card">
      <label class="btn primary disabled" id="file-label">
        ${icon("video")} Elegir video
        <input id="file" type="file" accept="video/*" hidden disabled>
      </label>
      <p id="status" class="muted small status">Cargando modelo de pose…</p>
      <progress id="progress" value="0" max="1" hidden></progress>
    </section>

    <section class="card" id="viewer" hidden>
      <div class="stage">
        <video id="video" playsinline muted></video>
        <canvas id="overlay"></canvas>
      </div>
      <div class="controls">
        <button id="play" class="icon-btn solid" aria-label="Reproducir">▶︎</button>
        <input id="seek" type="range" min="0" max="1" step="0.001" value="0" aria-label="Posición">
        <select id="rate" aria-label="Velocidad">
          <option value="1">1×</option>
          <option value="0.5">0.5×</option>
          <option value="0.25" selected>0.25×</option>
        </select>
      </div>

      <h2 class="subhead">Velocidad de muñeca derecha</h2>
      <canvas id="chart"></canvas>
      <p class="muted small">En largos de torso por segundo. El pico suele ser el momento en que sueltas el disco. Toca la gráfica para saltar a ese momento.</p>

      <button id="export" class="btn ghost">${icon("download")} Descargar datos (JSON)</button>
    </section>
  `;
  wire();
}

async function loadModel() {
  const status = el.querySelector("#status");
  try {
    pose = await import("../pose.js");
    landmarker = await pose.createPoseLandmarker();
    drawer = new pose.DrawingUtils(el.querySelector("#overlay").getContext("2d"));
    status.textContent = "Listo. Elige un video de 2–5 segundos.";
    el.querySelector("#file").disabled = false;
    el.querySelector("#file-label").classList.remove("disabled");
  } catch (err) {
    console.error(err);
    pose = null;
    status.textContent = "No se pudo cargar el modelo. Revisa tu conexión y vuelve a abrir esta pestaña.";
  }
}

function wire() {
  const $ = (sel) => el.querySelector(sel);
  const fileInput = $("#file");
  const fileLabel = $("#file-label");
  const status = $("#status");
  const progress = $("#progress");
  const viewer = $("#viewer");
  const video = $("#video");
  const overlay = $("#overlay");
  const playBtn = $("#play");
  const seek = $("#seek");
  const rate = $("#rate");
  const chart = $("#chart");
  const overlayCtx = overlay.getContext("2d");

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    videoName = file.name;
    fileInput.value = "";

    video.src = URL.createObjectURL(file);
    await new Promise((r) => video.addEventListener("loadeddata", r, { once: true }));

    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    viewer.hidden = true;
    progress.hidden = false;
    fileLabel.classList.add("disabled");
    status.textContent = "Analizando… (no cierres la página)";

    const started = performance.now();
    frames = await pose.analyzeVideo(video, landmarker, {
      sampleFps: SAMPLE_FPS,
      onProgress: (p) => (progress.value = p),
    });
    const secs = ((performance.now() - started) / 1000).toFixed(1);
    const detected = frames.filter((f) => f.landmarks).length;
    wristSpeed = speedSeries(frames, video.videoWidth, video.videoHeight, LM.R_WRIST);

    progress.hidden = true;
    fileLabel.classList.remove("disabled");
    status.textContent = `Listo en ${secs}s · cuerpo detectado en ${detected} de ${frames.length} cuadros.`;
    viewer.hidden = false;
    video.playbackRate = Number(rate.value);
    drawChart();
    drawOverlay();
  });

  playBtn.addEventListener("click", () => (video.paused ? video.play() : video.pause()));
  video.addEventListener("play", () => (playBtn.textContent = "❚❚"));
  video.addEventListener("pause", () => (playBtn.textContent = "▶︎"));
  rate.addEventListener("change", () => (video.playbackRate = Number(rate.value)));
  seek.addEventListener("input", () => (video.currentTime = Number(seek.value) * video.duration));
  video.addEventListener("seeked", () => { drawOverlay(); drawChart(); });

  function tick() {
    if (!video.paused && el.isConnected) {
      seek.value = video.currentTime / video.duration;
      drawOverlay();
      drawChart();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function drawOverlay() {
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height);
    if (!frames.length) return;
    const i = Math.min(frames.length - 1, Math.max(0, Math.round(video.currentTime * SAMPLE_FPS)));
    const f = frames[i];
    if (!f?.landmarks) return;
    const scale = overlay.width / 400;
    drawer.drawConnectors(f.landmarks, pose.PoseLandmarker.POSE_CONNECTIONS, { color: "#8cc7a0", lineWidth: 2 * scale });
    drawer.drawLandmarks(f.landmarks, { color: "#f3ecdc", radius: 2 * scale });
    drawer.drawLandmarks([f.landmarks[LM.R_WRIST]], { color: "#e3ecd0", radius: 5 * scale });
  }

  function drawChart() {
    const dpr = window.devicePixelRatio || 1;
    const w = chart.clientWidth;
    const h = chart.clientHeight;
    if (!w) return;
    chart.width = w * dpr;
    chart.height = h * dpr;
    const ctx = chart.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (!wristSpeed.length) return;

    const pad = 8;
    const maxV = Math.max(...wristSpeed.map((p) => p.v)) || 1;
    const x = (t) => pad + (t / video.duration) * (w - 2 * pad);
    const y = (v) => h - pad - (v / maxV) * (h - 2 * pad);

    ctx.strokeStyle = "#8cc7a0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    wristSpeed.forEach((p, i) => (i ? ctx.lineTo(x(p.t), y(p.v)) : ctx.moveTo(x(p.t), y(p.v))));
    ctx.stroke();

    const peak = wristSpeed.reduce((a, b) => (b.v > a.v ? b : a));
    ctx.fillStyle = "#e3ecd0";
    ctx.beginPath();
    ctx.arc(x(peak.t), y(peak.v), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(`pico ${peak.v.toFixed(1)}`, Math.min(x(peak.t) + 6, w - 60), y(peak.v) + 12);

    ctx.strokeStyle = "#93a99b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x(video.currentTime), 0);
    ctx.lineTo(x(video.currentTime), h);
    ctx.stroke();
  }

  chart.addEventListener("click", (e) => {
    if (!video.duration) return;
    const rect = chart.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left - 8) / (rect.width - 16)));
    video.currentTime = ratio * video.duration;
    seek.value = ratio;
  });

  window.addEventListener("resize", () => el.isConnected && drawChart());

  $("#export").addEventListener("click", () => {
    const data = { video: videoName, width: video.videoWidth, height: video.videoHeight, sampleFps: SAMPLE_FPS, frames };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = videoName.replace(/\.[^.]+$/, "") + "-pose.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}
