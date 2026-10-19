// Guarda las mediciones en este dispositivo (localStorage).
// Cada medición: { id, testId, value, date: "YYYY-MM-DD", demo? }
const KEY = "ulti-coach:v1";
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { entries: [] };
  } catch {
    return { entries: [] };
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento (modo privado): la app sigue funcionando en memoria.
  }
  listeners.forEach((fn) => fn());
}

export function onChange(fn) {
  listeners.add(fn);
}

export function entries(testId) {
  const list = testId ? state.entries.filter((e) => e.testId === testId) : state.entries;
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function latest(testId) {
  const list = entries(testId);
  return list[list.length - 1] ?? null;
}

export function addEntry(testId, value, date) {
  state.entries.push({ id: crypto.randomUUID(), testId, value, date });
  save();
}

export function removeEntry(id) {
  state.entries = state.entries.filter((e) => e.id !== id);
  save();
}

export function hasDemo() {
  return state.entries.some((e) => e.demo);
}

export function clearDemo() {
  state.entries = state.entries.filter((e) => !e.demo);
  save();
}

export function loadDemo(demoEntries) {
  state.entries = [...state.entries.filter((e) => !e.demo), ...demoEntries];
  save();
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data.entries)) throw new Error("Archivo inválido");
  state = { entries: data.entries };
  save();
}
