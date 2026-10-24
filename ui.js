// Piezas visuales reutilizables: íconos, anillo de puntaje, etiquetas de nivel, gráficas.
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
  edit: '<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  upload: '<path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  play: '<path d="M6 4v16l14-8z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  scale: '<path d="M12 3v18"/><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"/><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"/><path d="M7 21h10"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3z"/><path d="M20 14v.01"/><path d="M14 20h.01"/><path d="M17 20h4v-3"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>',
  bandage: '<path d="M10 10.01h.01"/><path d="M10 14.01h.01"/><path d="M14 10.01h.01"/><path d="M14 14.01h.01"/><path d="M18 6v12"/><path d="M6 6v12"/><rect x="2" y="6" width="20" height="12" rx="2"/>',
};

export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function tierClass(score) {
  return `tier-${level(score).id}`;
}

// Etiqueta de nivel: el color acompaña al texto, nunca lo reemplaza.
export function levelChip(score) {
  const l = level(score);
  return `<span class="chip ${tierClass(score)}">${l.id === "t4" ? icon("star") : ""}${l.name}</span>`;
}

// Lee un número escrito por el usuario. Acepta coma o punto decimal ("1,85" o "1.85"),
// porque el teclado del iPhone en español trae coma. Devuelve NaN si está vacío o no es número.
export function parseNum(text) {
  const t = String(text ?? "").trim().replace(",", ".");
  return t === "" || !/^-?\d*\.?\d+$/.test(t) ? NaN : Number(t);
}

export function fmt(value, decimals) {
  return Number(value).toFixed(decimals);
}

export function fmtDate(iso, opts = { day: "numeric", month: "short" }) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es", opts);
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
  return `<div class="bar ${tierClass(score)}" role="img" aria-label="${score ?? "sin datos"} de 100, ${level(score).name}">
    <div class="bar-fill" style="width:${score ?? 0}%"></div>
  </div>`;
}

// Mini gráfica de tendencia (sin ejes). Recibe puntajes: arriba siempre es mejor.
export function sparkline(values, { w = 72, h = 26 } = {}) {
  if (values.length < 2) return "";
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * (w - 4) + 2},${h - 2 - (v / 100) * (h - 4)}`)
    .join(" ");
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

// Historial de una prueba en el tiempo. Eje X con fechas reales (lo más nuevo a la derecha),
// eje Y orientado para que "mejor" sea siempre hacia arriba, y línea de la meta Excelente.
export function historyChart(list, test, tgt) {
  const w = 340;
  const h = 190;
  const padL = 12;
  const padR = 20;
  const padT = 26;
  const padB = 28;
  const values = list.map((e) => e.value);
  const lo = Math.min(...values, tgt.elite, tgt.base);
  const hi = Math.max(...values, tgt.elite, tgt.base);
  const span = hi - lo || 1;
  const better = tgt.elite > tgt.base ? 1 : -1;
  const y = (v) => {
    const t = (v - lo) / span;
    return padT + (better > 0 ? 1 - t : t) * (h - padT - padB);
  };
  const time = (e) => new Date(e.date + "T12:00:00").getTime() + (e.createdAt ?? 0) % 1000;
  const t0 = time(list[0]);
  const t1 = time(list[list.length - 1]);
  const x = (e, i) => {
    if (t1 === t0) return padL + (i / Math.max(1, list.length - 1)) * (w - padL - padR);
    return padL + ((time(e) - t0) / (t1 - t0)) * (w - padL - padR);
  };
  const pts = list.map((e, i) => [x(e, i), y(e.value)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  const area = `${pts[0][0]},${h - padB} ${line} ${pts[pts.length - 1][0]},${h - padB}`;
  const last = list[list.length - 1];
  const [lx, ly] = pts[pts.length - 1];
  const d = test.decimals;

  return `<svg class="history" viewBox="0 0 ${w} ${h}" role="img" aria-label="Historial de ${test.name}: de ${fmt(list[0].value, d)} a ${fmt(last.value, d)} ${test.unit}">
    <line x1="${padL}" x2="${w - padR}" y1="${y(tgt.elite)}" y2="${y(tgt.elite)}" class="chart-goal"/>
    <text x="${padL}" y="${y(tgt.elite) - 6}" class="chart-goal-label">Meta ${fmt(tgt.elite, d)}</text>
    <polygon points="${area}" class="chart-area"/>
    <polyline points="${line}" fill="none" class="chart-line"/>
    ${pts.slice(0, -1).map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="3.5" class="chart-dot"/>`).join("")}
    <circle cx="${lx}" cy="${ly}" r="6" class="chart-dot last"/>
    <text x="${Math.min(lx, w - padR - 4)}" y="${ly - 12}" text-anchor="${lx > w - padR - 30 ? "end" : "middle"}" class="chart-value">${fmt(last.value, d)}</text>
    <text x="${padL}" y="${h - 8}" class="chart-axis">${fmtDate(list[0].date)}</text>
    <text x="${w - padR}" y="${h - 8}" text-anchor="end" class="chart-axis">${fmtDate(last.date)}</text>
  </svg>`;
}

// Secciones desplegables: el título siempre visible y a la derecha "Ver más" / "Ver menos".
export function summary(label) {
  return `<summary><span class="summary-label">${label}</span><span class="toggle"><span class="when-closed">Ver más</span><span class="when-open">Ver menos</span>${icon("down")}</span></summary>`;
}

// Botón al final del contenido para cerrar sin tener que volver arriba.
export function lessButton() {
  return `<button type="button" class="less-btn" data-collapse>${icon("up")} Ver menos</button>`;
}

// Acordeón: al abrir una sección se cierran las demás (menos información a la vez).
export function exclusive(list) {
  list.forEach((d) =>
    d.addEventListener("toggle", () => {
      if (!d.open) return;
      list.forEach((o) => o !== d && (o.open = false));
    })
  );
}

// Carga un script externo una sola vez (librerías UMD que dejan una variable global).
const loadedScripts = new Map();
export function loadScript(src) {
  if (!loadedScripts.has(src)) {
    loadedScripts.set(src, new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.onload = resolve;
      el.onerror = () => {
        loadedScripts.delete(src);
        reject(new Error("No se pudo cargar " + src));
      };
      document.head.append(el);
    }));
  }
  return loadedScripts.get(src);
}

// Aviso flotante (toast) que se oculta solo.
let toastTimer = null;
export function toast(html, ms = 6500) {
  const el = document.getElementById("toast");
  // Una hoja abierta (<dialog> modal) queda por encima de todo: el aviso tiene que vivir dentro de ella.
  const sheet = document.querySelector("dialog[open]");
  (sheet ?? document.body).append(el);
  el.innerHTML = html;
  el.hidden = false;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => (el.hidden = true), 250);
  }, ms);
}
