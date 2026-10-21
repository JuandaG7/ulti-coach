// Clips analizados (tuyos y de pros), guardados SOLO en este celular con IndexedDB.
// Nunca se guarda el video: solo el esqueleto alrededor de la suelta y los datos del clip.
// Clip: { id, kind: "pro"|"mine", name, date, hand: "R"|"L", factor, w, h, frames (compactos, t = 0 en la suelta) }
const DB = "ulti-coach-video";
const STORE = "clips";

let dbPromise = null;

function db() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function listClips(kind) {
  const all = (await run("readonly", (s) => s.getAll())) ?? [];
  return all.filter((c) => !kind || c.kind === kind).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveClip(clip) {
  // Pide al navegador no borrar estos datos si el celular se queda sin espacio.
  navigator.storage?.persist?.().catch(() => {});
  const full = { id: crypto.randomUUID(), createdAt: Date.now(), ...clip };
  await run("readwrite", (s) => s.put(full));
  return full;
}

// Reemplaza un clip ya guardado (mismo id), por ejemplo al corregir la suelta a mano.
export function updateClip(clip) {
  return run("readwrite", (s) => s.put(clip));
}

export function deleteClip(id) {
  return run("readwrite", (s) => s.delete(id));
}
