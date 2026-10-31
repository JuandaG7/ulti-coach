// Pruebas de los ángulos medidos con video (views/angle-video.js): cuerpos sintéticos con ángulos conocidos.
import { VIDEO_ANGLE_TESTS, angles } from "../views/angle-video.js";
import { LM } from "../metrics.js";

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, msg: err.message });
  }
}
function near(actual, expected, tol, what) {
  if (actual == null || Math.abs(actual - expected) > tol) throw new Error(`${what}: esperaba ${expected} ±${tol}, salió ${actual}`);
}

// Un cuadro con los puntos dados en píxeles (imagen de 1000×1000); el resto en el centro.
const W = 1000;
function frame(points) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [i, x, y] of points) landmarks[i] = { x: x / W, y: y / W };
  return { t: 0, landmarks };
}
const rad = (d) => (d * Math.PI) / 180;
const valueOf = (testId, f, side = "L") => VIDEO_ANGLE_TESTS[testId].angle((i) => ({ x: f.landmarks[i].x * W, y: f.landmarks[i].y * W }), side);

test("Pierna estirada: pierna a 60° del piso = 60°", () => {
  // De lado: cadera en (500,600). Pierna derecha en el piso hacia la derecha; izquierda sube 60°.
  const f = frame([[LM.R_HIP, 500, 600], [LM.R_ANKLE, 900, 600], [LM.L_HIP, 500, 600], [LM.L_ANKLE, 500 + 400 * Math.cos(rad(60)), 600 - 400 * Math.sin(rad(60))]]);
  near(valueOf("aslr", f, "L"), 60, 0.5, "ángulo");
});

test("Rotación de cadera: espinilla a 30° de la vertical = 30°", () => {
  const f = frame([[LM.L_KNEE, 500, 500], [LM.L_ANKLE, 500 + 300 * Math.sin(rad(30)), 500 + 300 * Math.cos(rad(30))]]);
  near(valueOf("hipIR", f, "L"), 30, 0.5, "ángulo");
});

test("Hombro: antebrazo a 80° de la vertical = 80°", () => {
  const f = frame([[LM.R_ELBOW, 500, 500], [LM.R_WRIST, 500 + 250 * Math.sin(rad(80)), 500 - 250 * Math.cos(rad(80))]]);
  near(valueOf("shoulderER", f, "R"), 80, 0.5, "ángulo");
});

test("Rotación torácica: hombros inclinados 40° = 40°", () => {
  const f = frame([[LM.L_SHOULDER, 400, 500], [LM.R_SHOULDER, 400 + 300 * Math.cos(rad(40)), 500 - 300 * Math.sin(rad(40))]]);
  near(valueOf("thoracicRot", f), 40, 0.5, "ángulo");
});

test("Elige el lado que se movió y el máximo del movimiento", () => {
  // La pierna izquierda sube de 0° a 70° y baja; la derecha queda quieta en el piso.
  const seq = [0, 20, 45, 70, 70, 40, 10].map((d) =>
    frame([[LM.R_HIP, 500, 600], [LM.R_ANKLE, 900, 600], [LM.L_HIP, 500, 600], [LM.L_ANKLE, 500 + 400 * Math.cos(rad(d)), 600 - 400 * Math.sin(rad(d))]])
  );
  const { side, values } = angles(seq, VIDEO_ANGLE_TESTS.aslr, W, W);
  if (side !== "L") throw new Error(`eligió el lado ${side}`);
  near(Math.max(...values.filter((v) => v != null)), 70, 4, "máximo (suavizado)");
});

export { results };
