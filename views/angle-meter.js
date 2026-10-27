// Medidor de ángulos con el celular (pruebas de movilidad).
// El celular se apoya en el segmento (espinilla, antebrazo o espalda alta). Cada prueba parte de una
// posición conocida, que es el cero: la app guarda hacia dónde apunta la gravedad ahí, y el ángulo es
// cuánto giró el celular desde ese cero. No importa de qué lado apoyes el celular ni cómo lo gires sobre sí mismo.
// Todo se hace sin mirar la pantalla: la app pone el cero y toma la medida sola cuando te quedas quieto,
// y lo dice en voz alta.
import { openSheet } from "./sheet.js";
import { icon } from "../ui.js";

export const ANGLE_TESTS = {
  aslr: {
    place: "a lo largo de la espinilla de la pierna que vas a subir. Que alguien lo sostenga apoyado o sujétalo con una media o banda",
    start: "Boca arriba, las dos piernas estiradas en el piso",
    end: "Sube la pierna estirada lo más alto que puedas, sin ayuda, y quédate quieto arriba",
  },
  hipIR: {
    place: "a lo largo de la espinilla, por delante (sujétalo con una media o banda)",
    start: "Sentado al borde de la mesa, la pierna colgando derecha hacia abajo",
    end: "Gira el pie hacia afuera sin mover el muslo y aguanta",
  },
  thoracicRot: {
    place: "atravesado sobre tu espalda alta, de hombro a hombro. Que un compañero lo sostenga ahí",
    start: "En cuatro apoyos, sentado sobre los talones, una mano detrás de la cabeza, espalda quieta",
    end: "Gira el codo hacia el techo lo más que puedas y aguanta",
  },
  shoulderER: {
    place: "a lo largo del antebrazo. Que un compañero lo sostenga apoyado",
    start: "Boca arriba, brazo a 90° del cuerpo, codo a 90°, la mano apuntando al techo",
    end: "Deja caer la mano hacia atrás, hacia la cabeza, sin arquear la espalda, y aguanta",
  },
  shoulderIR: {
    place: "a lo largo del antebrazo. Que un compañero lo sostenga apoyado",
    start: "Boca arriba, brazo a 90° del cuerpo, codo a 90°, la mano apuntando al techo",
    end: "Deja caer la mano hacia adelante, hacia los pies, sin que el hombro se levante, y aguanta",
  },
};

const STILL_MS = 1500; // quieto este tiempo = cero o medida
const STILL_DEG = 1.5; // "quieto" = no se mueve más que esto
const MIN_MOVE = 8; // la medida solo se toma si te moviste al menos esto desde el cero
const SIDES = [["L", "izquierdo"], ["R", "derecho"]];

const norm = (v) => Math.hypot(v.x, v.y, v.z) || 1;
const angleBetween = (a, b) => (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y + a.z * b.z) / (norm(a) * norm(b))))) * 180) / Math.PI;

let audio = null;
function beep(freq = 880, ms = 160) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.frequency.value = freq;
    g.gain.value = 0.15;
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch {}
}
function say(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    speechSynthesis.speak(u);
  } catch {}
}

// onResult({ L, R }): ángulos en grados.
export function openAngleMeter(test, onResult) {
  const info = ANGLE_TESTS[test.id];
  let gravity = null; // gravedad suavizada, en ejes del celular
  let zero = null;
  let side = 0;
  let stage = "zero"; // zero → measure → (siguiente lado) → done
  const result = {};
  let history = []; // [{t, v}] últimos vectores, para saber si está quieto
  let listening = false;

  const onMotion = (e) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null) return;
    gravity = gravity ? { x: gravity.x * 0.8 + a.x * 0.2, y: gravity.y * 0.8 + a.y * 0.2, z: gravity.z * 0.8 + a.z * 0.2 } : { x: a.x, y: a.y, z: a.z };
    const now = performance.now();
    history.push({ t: now, v: gravity });
    history = history.filter((h) => now - h.t <= STILL_MS);
    tick(now);
  };

  const still = (now) =>
    history.length > 5 && now - history[0].t >= STILL_MS * 0.9 && history.every((h) => angleBetween(h.v, gravity) < STILL_DEG);

  function tick(now) {
    const live = zero ? Math.round(angleBetween(zero, gravity)) : 0;
    const big = document.querySelector("[data-angle]");
    if (!big) return stop(); // se cerró la hoja
    big.textContent = stage === "done" ? "✓" : zero ? `${live}°` : "–";
    if (stage === "zero" && still(now)) {
      zero = { ...gravity };
      stage = "measure";
      history = [];
      beep(660);
      say("Cero. Ahora muévete.");
      paint();
    } else if (stage === "measure" && live >= MIN_MOVE && still(now)) {
      result[SIDES[side][0]] = live;
      beep(1100, 300);
      say(`${live} grados`);
      side++;
      zero = null;
      history = [];
      stage = side < SIDES.length ? "zero" : "done";
      paint();
    }
  }

  function stop() {
    if (listening) window.removeEventListener("devicemotion", onMotion);
    listening = false;
  }

  async function start() {
    // iPhone: hay que pedir permiso para leer el movimiento, y solo se puede desde un toque.
    try {
      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const r = await DeviceMotionEvent.requestPermission();
        if (r !== "granted") throw new Error("permiso");
      }
    } catch {
      document.querySelector("[data-angle-status]").textContent = "Sin permiso para leer el movimiento del celular. Ciérralo y vuelve a intentarlo, y toca Permitir.";
      return;
    }
    beep(440, 80); // desbloquea el audio en iPhone
    say("Listo. Ponte en la posición inicial y quédate quieto.");
    window.addEventListener("devicemotion", onMotion);
    listening = true;
    stage = "zero";
    paint();
    // Si a los 3 s no llegó ningún dato, este dispositivo no tiene sensor (o el navegador no lo da).
    setTimeout(() => {
      if (listening && !gravity) document.querySelector("[data-angle-status]").textContent = "Este dispositivo no da la inclinación. Usa un iPhone o un celular con sensores.";
    }, 3000);
  }

  function paint() {
    const root = document.querySelector("[data-angle-root]");
    if (!root) return;
    const [, sideName] = SIDES[Math.min(side, 1)];
    const steps = {
      zero: `<strong>Lado ${sideName} · 1.</strong> ${info.start}. Quédate quieto: la app pone el cero sola.`,
      measure: `<strong>Lado ${sideName} · 2.</strong> ${info.end}. Al quedarte quieto, la app toma la medida.`,
      done: "Listo, los dos lados medidos.",
    };
    root.querySelector("[data-angle-step]").innerHTML = listening || stage === "done" ? steps[stage] : "";
    root.querySelector("[data-angle-sides]").innerHTML = SIDES.map(([k, n]) => `<li><span>${n[0].toUpperCase() + n.slice(1)}</span><span class="num">${result[k] != null ? `${result[k]}°` : "–"}</span></li>`).join("");
    root.querySelector("[data-angle-start]").hidden = listening || stage === "done";
    root.querySelector("[data-angle-manual]").hidden = !listening;
    root.querySelector("[data-angle-manual]").textContent = stage === "zero" ? "Poner en cero ahora" : "Tomar medida ahora";
    root.querySelector("[data-angle-use]").hidden = stage !== "done";
    root.querySelector("[data-angle-redo]").hidden = side === 0 && stage === "zero";
  }

  openSheet((root) => {
    root.innerHTML = `
      <div data-angle-root class="angle-meter">
        <p class="eyebrow">${test.name}</p>
        <h2 class="sheet-title">Medir con el celular</h2>
        <ol class="tips">
          <li>Apoya el celular ${info.place}.</li>
          <li>Sube el volumen: la app te habla, no tienes que mirar la pantalla.</li>
        </ol>
        <p class="angle-live num" data-angle>–</p>
        <p class="angle-step" data-angle-step></p>
        <p class="muted small" data-angle-status></p>
        <ul class="angle-sides" data-angle-sides></ul>
        <button type="button" class="btn primary block" data-angle-start>${icon("play")} Empezar</button>
        <button type="button" class="btn secondary block" data-angle-manual hidden></button>
        <button type="button" class="btn primary block" data-angle-use hidden>${icon("check")} Anotar en la prueba</button>
        <button type="button" class="link" data-angle-redo hidden>Empezar de nuevo</button>
      </div>`;
    root.querySelector("[data-angle-start]").addEventListener("click", start);
    root.querySelector("[data-angle-manual]").addEventListener("click", () => {
      if (!gravity) return;
      // Botón por si quedarse quieto no alcanza (por ejemplo, un compañero que tiembla).
      history = Array.from({ length: 8 }, () => ({ t: performance.now() - STILL_MS, v: gravity }));
      if (stage === "measure" && Math.round(angleBetween(zero, gravity)) < MIN_MOVE) return;
      tick(performance.now());
    });
    root.querySelector("[data-angle-redo]").addEventListener("click", () => {
      side = 0;
      zero = null;
      history = [];
      delete result.L;
      delete result.R;
      stage = "zero";
      paint();
    });
    root.querySelector("[data-angle-use]").addEventListener("click", () => {
      stop();
      onResult({ ...result });
    });
    paint();
  });
}
