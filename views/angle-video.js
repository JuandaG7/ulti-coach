// Movilidad medida con video: el celular quieto en el piso, grabas el movimiento y la app detecta tu
// cuerpo (MediaPipe), busca el momento de máximo rango y calcula el ángulo. Te muestra ese cuadro con
// las líneas dibujadas para que verifiques, y puedes elegir otro cuadro si el de la app no es el bueno.
// Más estable que sostener el celular: nada se mueve salvo tú. El video no se guarda.
import { openSheet } from "./sheet.js";
import { icon } from "../ui.js";
import { LM } from "../metrics.js";

const SIDES = [["L", "izquierdo"], ["R", "derecho"]];
const MAX_SECONDS = 20;

// Cada prueba: dónde va la cámara, qué haces y cómo se calcula el ángulo en la imagen (2D).
// angle(p, s): p(i) = punto en píxeles; s = "L" o "R". Devuelve grados o null.
const deg = (r) => (r * 180) / Math.PI;
const vec = (a, b) => ({ x: b.x - a.x, y: b.y - a.y });
const between = (u, v) => deg(Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1)))));
const id = (s, name) => LM[`${s}_${name}`];
const other = (s) => (s === "L" ? "R" : "L");

export const VIDEO_ANGLE_TESTS = {
  aslr: {
    camera: "En el piso, de lado, a 2–3 m, que se vea todo tu cuerpo acostado.",
    move: "Sube la pierna estirada lo más alto que puedas, aguanta 2 s y bájala.",
    // Ángulo entre la pierna que sube y la que queda en el piso (cadera → tobillo).
    angle: (p, s) => between(vec(p(id(s, "HIP")), p(id(s, "ANKLE"))), vec(p(id(other(s), "HIP")), p(id(other(s), "ANKLE")))),
    lines: (s) => [[id(s, "HIP"), id(s, "ANKLE")], [id(other(s), "HIP"), id(other(s), "ANKLE")]],
  },
  hipIR: {
    camera: "De frente, a la altura de tus rodillas, a unos 2 m: que se vean cadera, rodillas y pies.",
    move: "Sentado al borde, gira el pie hacia afuera sin mover el muslo, aguanta 2 s y vuelve.",
    // Cuánto se separa la espinilla (rodilla → tobillo) de la vertical.
    angle: (p, s) => between(vec(p(id(s, "KNEE")), p(id(s, "ANKLE"))), { x: 0, y: 1 }),
    lines: (s) => [[id(s, "KNEE"), id(s, "ANKLE")]],
    vertical: (s) => id(s, "KNEE"),
  },
  thoracicRot: {
    camera: "En el piso detrás de ti, a tus pies, mirando hacia tu cabeza, a 1.5–2 m: que se vean tus hombros.",
    move: "En cuatro apoyos sentado en los talones, gira el codo hacia el techo, aguanta 2 s y vuelve.",
    // Inclinación de la línea de hombros respecto a la horizontal.
    angle: (p) => {
      const v = vec(p(LM.L_SHOULDER), p(LM.R_SHOULDER));
      const a = between(v, { x: 1, y: 0 });
      return Math.min(a, 180 - a);
    },
    lines: () => [[LM.L_SHOULDER, LM.R_SHOULDER]],
    bothSides: true,
  },
  shoulderER: {
    camera: "En el piso, más allá de tu mano, mirando hacia tu hombro (en la línea del brazo), a 1.5 m.",
    move: "Brazo a 90° y codo a 90°: deja caer la mano hacia atrás, aguanta 2 s y vuelve.",
    // Cuánto bajó el antebrazo (codo → muñeca) desde la vertical.
    angle: (p, s) => between(vec(p(id(s, "ELBOW")), p(id(s, "WRIST"))), { x: 0, y: -1 }),
    lines: (s) => [[id(s, "ELBOW"), id(s, "WRIST")]],
    vertical: (s) => id(s, "ELBOW"),
  },
  shoulderIR: {
    camera: "En el piso, más allá de tu mano, mirando hacia tu hombro (en la línea del brazo), a 1.5 m.",
    move: "Brazo a 90° y codo a 90°: deja caer la mano hacia los pies, aguanta 2 s y vuelve.",
    angle: (p, s) => between(vec(p(id(s, "ELBOW")), p(id(s, "WRIST"))), { x: 0, y: -1 }),
    lines: (s) => [[id(s, "ELBOW"), id(s, "WRIST")]],
    vertical: (s) => id(s, "ELBOW"),
  },
};

let pose = null;
let landmarker = null;
async function model() {
  pose ??= await import("../pose.js");
  landmarker ??= await pose.createPoseLandmarker();
  return landmarker;
}

// Ángulo en cada cuadro, para el lado que se movió (el que más cambió). Mediana de 3 cuadros: quita
// saltos sueltos de la detección sin bajar el máximo (un promedio lo bajaría si aguantas poco).
export function angles(frames, test, w, h) {
  const at = (f) => (i) => ({ x: f.landmarks[i].x * w, y: f.landmarks[i].y * h });
  const series = (s) => {
    const raw = frames.map((f) => (f.landmarks ? test.angle(at(f), s) : null));
    return raw.map((v, i) => {
      const win = raw.slice(Math.max(0, i - 1), i + 2).filter((x) => x != null).sort((a, b) => a - b);
      return v == null || !win.length ? null : win[Math.floor(win.length / 2)];
    });
  };
  const range = (vals) => {
    const ok = vals.filter((v) => v != null);
    return ok.length ? Math.max(...ok) - Math.min(...ok) : 0;
  };
  if (test.bothSides) return { side: "L", values: series("L") };
  const L = series("L");
  const R = series("R");
  return range(L) >= range(R) ? { side: "L", values: L } : { side: "R", values: R };
}

const argmax = (vals) => vals.reduce((best, v, i) => (v != null && (best < 0 || v > vals[best]) ? i : best), -1);

// onResult({ L, R }): ángulos en grados.
export function openAngleVideo(testDef, onResult) {
  const test = VIDEO_ANGLE_TESTS[testDef.id];
  let side = 0;
  const result = {};
  let current = null; // { frames, values, idx, w, h, url, limb }

  openSheet((root) => {
    root.innerHTML = `
      <div class="angle-video">
        <p class="eyebrow">${testDef.name}</p>
        <h2 class="sheet-title">Medir con video</h2>
        <ol class="tips">
          <li><strong>Cámara:</strong> ${test.camera} El celular quieto (apoyado o en trípode) y derecho.</li>
          <li><strong>Movimiento:</strong> ${test.move}</li>
          <li>Un video por lado, de 3 a 10 segundos.</li>
        </ol>
        <p class="angle-step" data-step></p>
        <label class="btn primary block" data-pick>${icon("video")} <span data-pick-label></span>
          <input type="file" accept="video/*" hidden>
        </label>
        <p class="muted small" data-status></p>
        <progress value="0" max="1" hidden data-progress></progress>
        <div class="angle-frame" data-frame hidden>
          <div class="stage"><video playsinline muted preload="auto" data-video></video><canvas data-canvas></canvas></div>
          <p class="angle-live num" data-value></p>
          <label class="field"><span class="small muted">¿No es el momento de máximo rango? Muévete al cuadro correcto</span>
            <input type="range" min="0" max="1" step="1" value="0" data-scrub></label>
          <button type="button" class="btn secondary block" data-keep>${icon("check")} Usar este valor</button>
        </div>
        <ul class="angle-sides" data-sides></ul>
        <button type="button" class="btn primary block" data-use hidden>${icon("check")} Anotar en la prueba</button>
      </div>`;

    const $ = (sel) => root.querySelector(sel);
    const video = $("[data-video]");
    const canvas = $("[data-canvas]");
    const status = $("[data-status]");

    const paint = () => {
      const done = side >= SIDES.length;
      $("[data-step]").innerHTML = done ? "Listo, los dos lados medidos." : `<strong>Lado ${SIDES[side][1]}.</strong> Graba o elige el video.`;
      $("[data-pick]").hidden = done;
      $("[data-pick-label]").textContent = `Video del lado ${done ? "" : SIDES[side][1]}`;
      $("[data-sides]").innerHTML = SIDES.map(([k, n]) => `<li><span>${n[0].toUpperCase() + n.slice(1)}</span><span class="num">${result[k] != null ? `${result[k]}°` : "–"}</span></li>`).join("");
      $("[data-use]").hidden = !done;
    };

    // Dibuja el cuadro elegido con las líneas que miden el ángulo.
    const drawFrame = async (idx) => {
      const f = current.frames[idx];
      current.idx = idx;
      await new Promise((r) => {
        if (Math.abs(video.currentTime - f.t) < 1e-3) return r();
        video.addEventListener("seeked", r, { once: true });
        video.currentTime = f.t;
      });
      const { w, h } = current;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      const v = current.values[idx];
      $("[data-value]").textContent = v == null ? "–" : `${Math.round(v)}°`;
      if (!f.landmarks) return;
      const p = (i) => ({ x: f.landmarks[i].x * w, y: f.landmarks[i].y * h });
      const lw = Math.max(3, w / 160);
      ctx.lineCap = "round";
      ctx.strokeStyle = "#edb04f";
      ctx.lineWidth = lw;
      for (const [a, b] of test.lines(current.limb)) {
        ctx.beginPath();
        ctx.moveTo(p(a).x, p(a).y);
        ctx.lineTo(p(b).x, p(b).y);
        ctx.stroke();
      }
      // Referencia vertical punteada (desde la rodilla o el codo).
      if (test.vertical) {
        const o = p(test.vertical(current.limb));
        ctx.setLineDash([lw * 2, lw * 2]);
        ctx.strokeStyle = "#f3ecdc";
        ctx.beginPath();
        const len = h * 0.25;
        const up = test === VIDEO_ANGLE_TESTS.hipIR ? 1 : -1;
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x, o.y + up * len);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    $("[data-pick] input").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const progress = $("[data-progress]");
      $("[data-frame]").hidden = true;
      try {
        status.textContent = "Cargando el detector de cuerpo…";
        const lm = await model();
        status.textContent = "Abriendo el video…";
        if (current?.url) URL.revokeObjectURL(current.url);
        $("[data-frame]").hidden = false; // el iPhone solo carga videos visibles
        $("[data-value]").textContent = "";
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        const url = URL.createObjectURL(file);
        video.src = url;
        video.load();
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error("No se pudo abrir el video.")), 20000);
          video.addEventListener("loadedmetadata", () => (clearTimeout(timer), resolve()), { once: true });
          video.addEventListener("error", () => (clearTimeout(timer), reject(new Error("Este video no se puede abrir aquí."))), { once: true });
        });
        if (!Number.isFinite(video.duration) || video.duration > MAX_SECONDS) throw new Error(`El video debe durar menos de ${MAX_SECONDS} s. Recórtalo en Fotos.`);
        status.textContent = "Buscando tu cuerpo en el video…";
        progress.hidden = false;
        const frames = await pose.analyzeVideo(video, lm, { sampleFps: 15, dedupe: true, onProgress: (x) => (progress.value = x) });
        progress.hidden = true;
        const w = video.videoWidth;
        const h = video.videoHeight;
        const detected = frames.filter((f) => f.landmarks).length;
        if (detected < frames.length * 0.5) throw new Error("No se ve bien tu cuerpo en el video. Revisa que entres completo en el cuadro y que haya buena luz.");
        const { side: limb, values } = angles(frames, test, w, h);
        const idx = argmax(values);
        if (idx < 0) throw new Error("No pudimos medir el ángulo en este video.");
        current = { frames, values, idx, w, h, url, limb };
        const scrub = $("[data-scrub]");
        scrub.max = frames.length - 1;
        scrub.value = idx;
        await drawFrame(idx);
        status.textContent = "Este es el momento de máximo rango que encontramos. Revisa que las líneas sigan tu pierna o brazo.";
      } catch (err) {
        console.error(err);
        progress.hidden = true;
        status.textContent = err.message?.length > 10 ? err.message : "No se pudo analizar ese video.";
        $("[data-frame]").hidden = true;
      }
    });

    $("[data-scrub]").addEventListener("input", (e) => current && drawFrame(Number(e.target.value)));
    $("[data-keep]").addEventListener("click", () => {
      const v = current?.values[current.idx];
      if (v == null) return;
      result[SIDES[side][0]] = Math.round(v);
      side++;
      $("[data-frame]").hidden = true;
      status.textContent = "";
      paint();
    });
    $("[data-use]").addEventListener("click", () => {
      if (current?.url) URL.revokeObjectURL(current.url);
      onResult({ ...result });
    });
    paint();
  });
}
