// Piezas visuales reutilizables: íconos, anillo de puntaje, gráficas.
import { level } from "./scoring.js";

// Íconos estilo Lucide (trazo 2px, 24×24).
const ICONS = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .7-1.5l7-6a2 2 0 0 1 2.6 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  body: '<circle cx="12" cy="4.5" r="2"/><path d="m9 21 3-7 3 7"/><path d="M5 8.5 12 10l7-1.5"/><path d="M12 10v4"/>',
  timer: '<path d="M10 2h4"/><path d="m12 14 3-3"/><circle cx="12" cy="14" r="8"/>',
  video: '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
};

export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function tierClass(score) {
  return `tier-${level(score).id}`;
}

export function fmt(value, decimals) {
  return Number(value).toFixed(decimals);
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Anillo de progreso con el puntaje en el centro.
export function ring(score, { size = 140, stroke = 10, label = "" } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : score / 100;
  return `
    <div class="ring ${tierClass(score)}" style="width:${size}px;height:${size}px">
      <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"/>
        <circle class="ring-value" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" fill="none"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" stroke-linecap="round"
          transform="rotate(-90 ${size / 2} ${size / 2})"/>
      </svg>
      <div class="ring-center">
        <span class="ring-score num" style="font-size:${Math.round(size * 0.32)}px">${score ?? "–"}</span>
        ${label ? `<span class="ring-label">${label}</span>` : ""}
      </div>
    </div>`;
}

// Barra horizontal de puntaje.
export function bar(score) {
  return `<div class="bar ${tierClass(score)}" role="img" aria-label="${score ?? "sin datos"} de 100">
    <div class="bar-fill" style="width:${score ?? 0}%"></div>
  </div>`;
}

// Mini gráfica de tendencia (sin ejes).
export function sparkline(values, { w = 80, h = 28 } = {}) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${h - 2 - ((v - min) / span) * (h - 4)}`)
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

// Historial de una prueba, con líneas de referencia de base y élite.
export function historyChart(list, test) {
  const w = 320;
  const h = 160;
  const padL = 36;
  const padR = 12;
  const padY = 16;
  const values = list.map((e) => e.value);
  const lo = Math.min(...values, test.base, test.elite);
  const hi = Math.max(...values, test.base, test.elite);
  const span = hi - lo || 1;
  // Para pruebas de tiempo, invertimos el eje: "mejor" siempre hacia arriba.
  const better = test.elite > test.base ? 1 : -1;
  const y = (v) => {
    const t = (v - lo) / span;
    return padY + (better > 0 ? 1 - t : t) * (h - 2 * padY);
  };
  const x = (i) => (list.length === 1 ? (padL + w - padR) / 2 : padL + (i / (list.length - 1)) * (w - padL - padR));
  const pts = list.map((e, i) => `${x(i)},${y(e.value)}`).join(" ");
  const refLine = (v, cls, name) => `
    <line x1="${padL}" x2="${w - padR}" y1="${y(v)}" y2="${y(v)}" class="${cls}"/>
    <text x="${padL - 6}" y="${y(v) + 4}" text-anchor="end" class="chart-ref-label">${name}</text>`;

  return `<svg class="history" viewBox="0 0 ${w} ${h}" role="img" aria-label="Historial de ${test.name}">
    ${refLine(test.elite, "chart-ref elite", "élite")}
    ${refLine(test.base, "chart-ref base", "base")}
    <polyline points="${pts}" fill="none" class="chart-line"/>
    ${list.map((e, i) => `<circle cx="${x(i)}" cy="${y(e.value)}" r="4" class="chart-dot"/>`).join("")}
  </svg>`;
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}
