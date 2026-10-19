// Salto vertical medido con video: tiempo de vuelo → altura = g · t² / 8.
// Marcas el último cuadro con los pies en el piso (despegue) y el primero al tocarlo (aterrizaje).
import { openSheet, closeSheet } from "./sheet.js";
import { icon } from "../ui.js";

const G = 9.81;
// Un video en cámara lenta compartido desde el iPhone a veces queda "estirado" (más lento que la realidad).
const SPEEDS = [
  { factor: 1, label: "Tiempo real" },
  { factor: 4, label: "Lenta ×4" },
  { factor: 8, label: "Lenta ×8" },
];

const heightCm = (flight) => (G * flight * flight) / 8 * 100;

export function openJumpVideo(onResult) {
  let frame = 1 / 30;
  let takeoff = null;
  let landing = null;
  let factor = 1;
  let url = null;

  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">Salto vertical</p>
      <h2 class="sheet-title">Medir con video</h2>
      <ol class="tips">
        <li>Celular <strong>quieto en el piso o en trípode</strong>, de lado, que se vean bien los pies.</li>
        <li>Graba en <strong>cámara lenta</strong> si puedes: más cuadros, más precisión.</li>
        <li>Salta y <strong>aterriza con las piernas estiradas</strong>, como despegaste. Si caes doblando las rodillas, el tiempo de vuelo sale más largo y el salto "crece".</li>
      </ol>

      <label class="btn secondary block">${icon("video")} Elegir video<input type="file" accept="video/*" hidden data-file></label>

      <div class="jump-tool" hidden data-tool>
        <div class="stage"><video playsinline muted preload="auto" data-video></video></div>
        <input type="range" min="0" max="1" step="0.0001" value="0" aria-label="Posición del video" data-seek>
        <div class="frame-controls">
          <button type="button" class="icon-btn solid-2" data-step="-10" aria-label="Retroceder 10 cuadros">«</button>
          <button type="button" class="icon-btn solid-2" data-step="-1" aria-label="Retroceder 1 cuadro">‹</button>
          <span class="num frame-time" data-time>0.000 s</span>
          <button type="button" class="icon-btn solid-2" data-step="1" aria-label="Avanzar 1 cuadro">›</button>
          <button type="button" class="icon-btn solid-2" data-step="10" aria-label="Avanzar 10 cuadros">»</button>
        </div>

        <div class="mark-row">
          <button type="button" class="mark" data-mark="takeoff"><span>Despegue</span><strong class="num" data-out="takeoff">Marcar</strong></button>
          <button type="button" class="mark" data-mark="landing"><span>Aterrizaje</span><strong class="num" data-out="landing">Marcar</strong></button>
        </div>
        <p class="muted small">Despegue: el <strong>último</strong> cuadro con los pies en el piso. Aterrizaje: el <strong>primer</strong> cuadro en que lo tocan.</p>

        <fieldset class="field">
          <legend>¿Cómo se ve el video?</legend>
          <div class="segmented wide" data-speeds>
            ${SPEEDS.map((s) => `<label><input type="radio" name="speed" value="${s.factor}" ${s.factor === 1 ? "checked" : ""}><span>${s.label}</span></label>`).join("")}
          </div>
          <small class="muted">Si al reproducirlo el salto se ve en cámara lenta, elige ×8 (240 fps) o ×4 (120 fps).</small>
        </fieldset>

        <div class="jump-result" data-result hidden></div>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    const video = $("[data-video]");
    const seek = $("[data-seek]");
    const time = $("[data-time]");

    const showTime = () => {
      time.textContent = `${video.currentTime.toFixed(3)} s`;
      if (video.duration) seek.value = video.currentTime / video.duration;
    };
    video.addEventListener("seeked", showTime);
    video.addEventListener("timeupdate", showTime);

    $("[data-file]").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(file);
      takeoff = landing = null;
      video.src = url;
      await new Promise((r) => video.addEventListener("loadeddata", r, { once: true }));
      $("[data-tool]").hidden = false;
      frame = await estimateFrame(video);
      video.currentTime = 0;
      update();
    });

    seek.addEventListener("input", () => (video.currentTime = Number(seek.value) * video.duration));
    root.querySelectorAll("[data-step]").forEach((b) =>
      b.addEventListener("click", () => {
        video.pause();
        video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + Number(b.dataset.step) * frame));
      })
    );
    root.querySelectorAll("[data-mark]").forEach((b) =>
      b.addEventListener("click", () => {
        if (b.dataset.mark === "takeoff") takeoff = video.currentTime;
        else landing = video.currentTime;
        update();
      })
    );
    root.querySelectorAll("[name=speed]").forEach((r) =>
      r.addEventListener("change", () => {
        factor = Number(r.value);
        update();
      })
    );

    function update() {
      $('[data-out="takeoff"]').textContent = takeoff == null ? "Marcar" : `${takeoff.toFixed(3)} s`;
      $('[data-out="landing"]').textContent = landing == null ? "Marcar" : `${landing.toFixed(3)} s`;
      root.querySelector('[data-mark="takeoff"]').classList.toggle("set", takeoff != null);
      root.querySelector('[data-mark="landing"]').classList.toggle("set", landing != null);
      const box = $("[data-result]");
      if (takeoff == null || landing == null) return (box.hidden = true);
      box.hidden = false;
      const raw = landing - takeoff;
      if (raw <= 0) {
        box.innerHTML = `<p class="error">El aterrizaje tiene que ir después del despegue.</p>`;
        return;
      }
      const flight = raw / factor;
      const h = heightCm(flight);
      // Si la altura no es posible para un humano, sugerimos el tipo de video que sí da un valor razonable.
      const plausible = h >= 10 && h <= 110;
      // Entre las opciones posibles, la más cercana a un salto típico (~45 cm).
      const hint = plausible
        ? null
        : SPEEDS.filter((s) => s.factor !== factor && heightCm(raw / s.factor) >= 10 && heightCm(raw / s.factor) <= 110)
            .sort((a, b) => Math.abs(heightCm(raw / a.factor) - 45) - Math.abs(heightCm(raw / b.factor) - 45))[0];
      box.innerHTML = `
        <div class="jump-numbers">
          <div><span class="stat-label">Tiempo de vuelo</span><span class="num stat-value">${flight.toFixed(3)}<small>s</small></span></div>
          <div><span class="stat-label">Altura</span><span class="num jump-height">${Math.round(h)}<small>cm</small></span></div>
        </div>
        ${plausible
          ? `<button type="button" class="btn primary block" data-use>${icon("check")} Usar este salto</button>`
          : `<p class="banner warn">${icon("alert")}<span>${Math.round(h)} cm no es posible.${hint ? ` Parece que el video está en <strong>${hint.label.toLowerCase()}</strong>: elígelo arriba.` : " Revisa las marcas de despegue y aterrizaje."}</span></p>`}`;
      box.querySelector("[data-use]")?.addEventListener("click", () => {
        closeSheet();
        onResult(Math.round(h));
      });
    }
  });
}

// Estima la duración de un cuadro reproduciendo un instante el video y midiendo los cuadros
// que entrega el navegador. Si no se puede, asume 30 fps.
async function estimateFrame(video) {
  if (!("requestVideoFrameCallback" in HTMLVideoElement.prototype)) return 1 / 30;
  const times = [];
  try {
    await new Promise((resolve, reject) => {
      const onFrame = (_, meta) => {
        times.push(meta.mediaTime);
        if (times.length < 12) video.requestVideoFrameCallback(onFrame);
        else resolve();
      };
      video.requestVideoFrameCallback(onFrame);
      video.play().catch(reject);
      setTimeout(resolve, 1500);
    });
  } catch {
    // Reproducción bloqueada: seguimos con 30 fps.
  }
  video.pause();
  const diffs = times.slice(1).map((t, i) => t - times[i]).filter((d) => d > 0.001 && d < 0.2).sort((a, b) => a - b);
  return diffs.length ? diffs[Math.floor(diffs.length / 2)] : 1 / 30;
}
