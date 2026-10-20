// Respaldo de datos. En iPhone abre el menú de compartir con el archivo (Archivos, WhatsApp,
// correo); donde no se puede, lo descarga.
import * as store from "../store.js";
import { icon, today, toast } from "../ui.js";

const REMIND_AFTER_DAYS = 30;

export async function backupNow() {
  const name = `ulti-coach-respaldo-${today()}.json`;
  const blob = new Blob([store.exportJSON()], { type: "application/json" });
  const file = new File([blob], name, { type: "application/json" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Respaldo de Ulti Coach" });
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }
    store.markBackup();
    toast(`<div class="toast-head"><span>${icon("check")} Respaldo listo. Guárdalo en Archivos o mándatelo.</span></div>`, 3500);
  } catch {
    // Se canceló el menú de compartir: no se marca como respaldado.
  }
}

// ¿Toca recordar el respaldo? Solo si hay datos propios y nunca se respaldó o pasó un mes.
export function needsBackup() {
  if (!store.storageOk || store.ownEntriesCount() < 3) return false;
  const last = store.lastBackup();
  if (!last) return true;
  return (Date.now() - new Date(last + "T12:00:00").getTime()) / 86400000 > REMIND_AFTER_DAYS;
}
