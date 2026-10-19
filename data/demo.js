// Datos de ejemplo: un jugador "Decente" que mejora durante ~3 meses.
// Tiene el tobillo derecho más débil (como después de un esguince) y el hombro que lanza
// con menos rotación interna, para que se vean las alertas de asimetría.
// Algunas pruebas quedan sin medir a propósito, para ver cómo se ve ese estado.
import { TESTS_BY_ID, entryValue } from "./tests.js";

const PROGRESSIONS = {
  sprint10: [1.86, 1.83, 1.8, 1.78],
  sprint40: [5.21, 5.15, 5.1],
  proAgility: [4.98, 4.9, 4.84, 4.79],
  test505: [2.62, 2.55, 2.51],
  reactiveAgility: [[2.71, 2.65, 2.8, 2.69, 2.74, 2.77], [2.6, 2.58, 2.66, 2.62, 2.7, 2.64]],
  vertJump: [52, 54, 55, 57],
  broadJump: [236, 240, 246],
  yoyo: [1360, 1480, 1600],
  rsa: [[4.62, 4.7, 4.81, 4.9, 4.97, 5.05], [4.55, 4.6, 4.68, 4.74, 4.8, 4.86]],
  hrRecovery: [26, 31],
  fhDistance: [41, 44, 45],
  bhDistance: [55, 57, 58],
  throwAccuracy: [11, 13],
  nordic: [2, 3, 4],
  copenhagen: [{ L: 24, R: 19 }, { L: 28, R: 25 }],
  gluteBridge: [{ L: 26, R: 22 }, { L: 28, R: 26 }],
  calfRaise: [{ L: 24, R: 15 }, { L: 25, R: 18 }],
  tibialisRaise: [18, 22],
  sidePlank: [{ L: 62, R: 58 }, { L: 72, R: 70 }],
  plank: [90, 105, 115],
  pullups: [8, 9, 10],
  pushups: [32, 35, 38],
  deadHang: [55, 60],
  balanceEC: [{ L: 26, R: 9 }, { L: 28, R: 13 }],
  singleHop: [{ L: 172, R: 146 }, { L: 176, R: 155 }],
  kneeToWall: [{ L: 11, R: 7.5 }, { L: 11.5, R: 8.5 }],
  aslr: [{ L: 76, R: 74 }],
  hipIR: [{ L: 36, R: 31 }],
  thoracicRot: [{ L: 46, R: 41 }],
  shoulderER: [{ L: 94, R: 103 }],
  shoulderIR: [{ L: 60, R: 44 }],
};

export function buildDemo() {
  const today = new Date();
  const entries = [];
  for (const [testId, values] of Object.entries(PROGRESSIONS)) {
    const test = TESTS_BY_ID[testId];
    values.forEach((v, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (values.length - 1 - i) * 28 - 3);
      const extra = Array.isArray(v) ? { reps: v } : typeof v === "object" ? { sides: v } : {};
      const value = typeof v === "number" ? v : Math.round(entryValue(test, extra) * 100) / 100;
      entries.push({ id: crypto.randomUUID(), testId, value, date: d.toISOString().slice(0, 10), demo: true, ...extra });
    });
  }
  return entries;
}
