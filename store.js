// Guarda perfil y mediciones en este dispositivo (localStorage).
// Medición: { id, testId, value, date: "YYYY-MM-DD", createdAt, sides?: { L, R }, reps?: [..], demo? }
// Perfil: { name, sex: "m"|"f", age, heightCm, hand: "R"|"L", position, mode: "gym"|"casa",
//          weights: [{ date, kg }], injuries: [{ id, zone, side, date, status: "activa"|"recuperada", note }] }
const KEY = "ulti-coach:v1";
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { entries: data.entries ?? [], profile: data.profile ?? null };
  } catch {
    return { entries: [], profile: null };
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

// ---------- Perfil ----------

export function profile() {
  return state.profile;
}

export function saveProfile(p) {
  state.profile = { ...state.profile, ...p };
  save();
}

export function weights() {
  return [...(state.profile?.weights ?? [])].sort((a, b) => a.date.localeCompare(b.date));
}

export function currentWeight() {
  const w = weights();
  return w.length ? w[w.length - 1].kg : null;
}

export function addWeight(kg, date) {
  const list = (state.profile.weights ?? []).filter((w) => w.date !== date);
  state.profile = { ...state.profile, weights: [...list, { date, kg }] };
  save();
}

// ---------- Lesiones ----------

export function injuries() {
  return [...(state.profile?.injuries ?? [])].sort((a, b) => b.date.localeCompare(a.date));
}

export function saveInjury(injury) {
  const list = (state.profile.injuries ?? []).filter((i) => i.id !== injury.id);
  state.profile = { ...state.profile, injuries: [...list, { id: crypto.randomUUID(), ...injury }] };
  save();
}

export function removeInjury(id) {
  state.profile = { ...state.profile, injuries: (state.profile.injuries ?? []).filter((i) => i.id !== id) };
  save();
}

// ---------- Mediciones ----------

export function entries(testId) {
  // Orden cronológico: por fecha y, dentro del mismo día, por el momento en que se registró.
  // (Las mediciones viejas sin createdAt conservan su orden de registro gracias al índice.)
  const list = state.entries
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => !testId || e.testId === testId);
  list.sort((a, b) => a.e.date.localeCompare(b.e.date) || (a.e.createdAt ?? 0) - (b.e.createdAt ?? 0) || a.i - b.i);
  return list.map(({ e }) => e);
}

export function latest(testId) {
  const list = entries(testId);
  return list[list.length - 1] ?? null;
}

// extra: { sides: { L, R } } en pruebas bilaterales o { reps: [...] } en pruebas de repeticiones.
export function addEntry(testId, value, date, extra = {}) {
  state.entries.push({ id: crypto.randomUUID(), testId, value, date, createdAt: Date.now(), ...extra });
  save();
}

export function updateEntry(id, value, date, extra = {}) {
  state.entries = state.entries.map((e) => (e.id === id ? { ...e, value, date, ...extra } : e));
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
  state = { entries: data.entries, profile: data.profile ?? state.profile };
  save();
}
