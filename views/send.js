// Enviar el progreso al entrenador: QR para mostrarlo en el entrenamiento o archivo por WhatsApp.
// El jugador ve qué se envía y lo manda él; nunca es automático.
import * as store from "../store.js";
import { buildSnapshot, encodeSnapshot, fitsInQr } from "../data/snapshot.js";
import { openSheet } from "./sheet.js";
import { openShareSheet } from "./share.js";
import { icon, today, toast, loadScript } from "../ui.js";

const QR_LIB = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";

function coachLabel() {
  return store.profile()?.coachName || "tu entrenador";
}

export function openSendSheet({ afterCheckin = false } = {}) {
  const snap = buildSnapshot();
  const text = encodeSnapshot(snap);
  const tests = snap.r.length;
  const last = store.lastSent();

  openSheet((root) => {
    root.innerHTML = `
      <p class="eyebrow">${afterCheckin ? "Check-in guardado" : "Tu progreso"}</p>
      <h2 class="sheet-title">Enviar a ${coachLabel()}</h2>
      <p class="muted small">Le llega una foto de cómo estás hoy. ${last ? `Último envío: ${new Date(last).toLocaleDateString("es", { day: "numeric", month: "long" })}.` : "Es tu primer envío."}</p>

      <ul class="send-includes">
        <li>${icon("check")} Ulti Score y tus ${tests} pruebas medidas</li>
        <li>${icon("check")} ${snap.ci ? "Tu check-in de la semana (bienestar, sueño, carga y dolor)" : "Sin check-in todavía"}</li>
        <li>${icon("check")} Lesiones activas y alertas de asimetría</li>
      </ul>

      <div class="send-actions">
        <button class="btn primary block" data-act="qr" ${fitsInQr(text) ? "" : "disabled"}>${icon("qr")} Mostrar QR (en el entrenamiento)</button>
        <button class="btn secondary block" data-act="file">${icon("send")} Enviar archivo (WhatsApp)</button>
        ${fitsInQr(text) ? "" : `<p class="muted small">Tienes demasiados datos para un QR: usa el archivo.</p>`}
      </div>

      <div class="qr-box" data-qr hidden></div>

      <button class="link small" data-act="text">O comparte un resumen en texto</button>`;

    root.querySelector('[data-act="qr"]').addEventListener("click", async (e) => {
      const box = root.querySelector("[data-qr]");
      e.currentTarget.disabled = true;
      try {
        await loadScript(QR_LIB);
        const qr = window.qrcode(0, "L");
        qr.addData(text, "Byte");
        qr.make();
        box.innerHTML = `${qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true })}
          <p class="muted small">Que ${coachLabel()} lo escanee desde su app: Equipo → Escanear. Sube el brillo de tu pantalla.</p>`;
        box.hidden = false;
        box.scrollIntoView({ behavior: "smooth", block: "center" });
        store.markSent();
      } catch {
        toast(`<div class="toast-head"><span>No se pudo crear el QR sin internet. Usa el archivo.</span></div>`, 3500);
        e.currentTarget.disabled = false;
      }
    });

    root.querySelector('[data-act="file"]').addEventListener("click", async () => {
      const name = `progreso-${(snap.n || "jugador").toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-${today()}.json`;
      const file = new File([text], name, { type: "application/json" });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: `Progreso de ${snap.n}` });
        } else {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(file);
          a.download = name;
          a.click();
          URL.revokeObjectURL(a.href);
        }
        store.markSent();
        toast(`<div class="toast-head"><span>${icon("check")} Listo. ${coachLabel()} lo abre en Equipo → Importar.</span></div>`, 4000);
      } catch {
        // Se canceló el menú de compartir.
      }
    });

    root.querySelector('[data-act="text"]').addEventListener("click", openShareSheet);
  });
}
