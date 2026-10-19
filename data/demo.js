// Datos de ejemplo: un jugador "competitivo" que mejora durante ~3 meses.
// Algunas pruebas quedan sin medir a propósito, para ver cómo se ve ese estado.
const PROGRESSIONS = {
  sprint10: [1.86, 1.83, 1.8, 1.78],
  sprint40: [5.21, 5.15, 5.1],
  proAgility: [4.98, 4.9, 4.84, 4.79],
  test505: [2.62, 2.55, 2.51],
  vertJump: [52, 54, 55, 57],
  broadJump: [236, 240, 246],
  yoyo: [1360, 1480, 1600],
  fhDistance: [41, 44, 45],
  bhDistance: [55, 57, 58],
  nordic: [2, 3, 4],
  copenhagen: [18, 22, 26],
  gluteBridge: [20, 24, 27],
  calfRaise: [18, 21, 22],
  sidePlank: [55, 62, 70],
  plank: [90, 105, 115],
  pullups: [8, 9, 10],
  pushups: [32, 35, 38],
  deadHang: [55, 60],
  kneeToWall: [8.5, 9, 9.5],
};

export function buildDemo() {
  const today = new Date();
  const entries = [];
  for (const [testId, values] of Object.entries(PROGRESSIONS)) {
    values.forEach((value, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (values.length - 1 - i) * 28 - 3);
      entries.push({
        id: crypto.randomUUID(),
        testId,
        value,
        date: d.toISOString().slice(0, 10),
        demo: true,
      });
    });
  }
  return entries;
}
