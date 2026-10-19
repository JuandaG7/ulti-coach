// Compartir resultados: arma un resumen en texto (pensado para WhatsApp) y lo comparte o copia.
import { CATEGORIES, TESTS } from "../data/tests.js";
import { JOINTS, SIDES, sidePhrase } from "../data/joints.js";
import * as store from "../store.js";
import { overallScore, categoryScore, level, priorities, jointPriorities, testScore, POSITIONS, ageFactor, wellness, weeklyLoad } from "../scoring.js";
import { TESTS_BY_ID } from "../data/tests.js";
import { openSheet } from "./sheet.js";
import { icon, fmt, fmtDate, today, toast } from "../ui.js";

export function buildSummary() {
  const p = store.profile() ?? {};
  const overall = overallScore();
  const lines = [];
  const who = [p.age ? `${p.age} años` : "", p.position ? POSITIONS[p.position].toLowerCase() : ""].filter(Boolean).join(", ");

  lines.push(`🥏 Ulti Coach · ${p.name ?? "Atleta"}${who ? ` (${who})` : ""}`);
  lines.push(fmtDate(today(), { day: "numeric", month: "long", year: "numeric" }));
  lines.push("");
  lines.push(`ULTI SCORE: ${overall ?? "–"}/100 · ${level(overall).name}`);
  if (ageFactor() !== 1) lines.push("(metas ajustadas a la edad)");

  lines.push("", "PERFIL ATLÉTICO");
  for (const c of CATEGORIES) {
    const s = categoryScore(c.id);
    if (s != null) lines.push(`• ${c.name}: ${s} (${level(s).name})`);
  }

  lines.push("", "FOCO DE ENTRENAMIENTO");
  priorities().slice(0, 3).forEach((x, i) => lines.push(`${i + 1}. ${x.muscle.name}${x.score != null ? ` (${x.score})` : " (sin medir)"}`));

  const joints = jointPriorities();
  const active = store.injuries().filter((i) => i.status === "activa");
  const alerts = [...new Map(joints.flatMap((j) => j.alerts).map((a) => [a.testId, a])).values()];
  lines.push("", "BLINDAJE");
  lines.push(`• Zona a cuidar: ${joints[0].joint.name}${joints[0].score != null ? ` (${joints[0].score})` : ""}`);
  active.forEach((i) => lines.push(`• Lesión activa: ${JOINTS[i.zone].name.toLowerCase()}${sidePhrase(i.side)}`));
  alerts.forEach((a) => lines.push(`• Asimetría: ${TESTS_BY_ID[a.testId].name}, ${a.weak === "L" ? "izquierda" : "derecha"} ${a.pct} % más débil`));
  if (!active.length && !alerts.length) lines.push("• Sin lesiones activas ni asimetrías");

  const checks = store.checkins();
  if (checks.length) {
    const c = checks[checks.length - 1];
    lines.push("", `CHECK-IN (semana del ${fmtDate(c.date)})`);
    lines.push(`• Bienestar: ${wellness(c)}/100${checks.length > 1 ? ` (semana anterior: ${wellness(checks[checks.length - 2])})` : ""}`);
    lines.push(`• Sueño: ${c.sleepHours ? `${c.sleepHours} h, ` : ""}calidad ${c.sleep}/5 · Energía ${c.energy}/5 · Ánimo ${c.mood}/5`);
    lines.push(`• Carga: ${c.sessions ?? 0} sesiones, esfuerzo ${c.rpe}/10 (${weeklyLoad(c)})`);
    for (const [z, p] of Object.entries(c.pains ?? {})) lines.push(`• Dolor en ${JOINTS[z].name.toLowerCase()}: ${p}/10`);
    if (c.note) lines.push(`• Nota: ${c.note}`);
  }

  lines.push("", "ÚLTIMAS MEDICIONES");
  for (const c of CATEGORIES) {
    for (const t of TESTS.filter((x) => x.cat === c.id)) {
      const e = store.latest(t.id);
      if (!e) continue;
      const sides = e.sides ? ` (I ${fmt(e.sides.L, t.decimals)} · D ${fmt(e.sides.R, t.decimals)})` : "";
      lines.push(`• ${t.name}: ${fmt(e.value, t.decimals)} ${t.unit}${sides} → ${testScore(t.id, e.value)}`);
    }
  }
  return lines.join("\n");
}

export function openShareSheet() {
  openSheet((root) => {
    const text = buildSummary();
    root.innerHTML = `
      <p class="eyebrow">Compartir</p>
      <h2 class="sheet-title">Tus resultados</h2>
      <p class="muted small">Así le llega a tu entrenador. Solo se comparte este resumen, nada más de tu celular.</p>
      <pre class="share-preview">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</pre>
      <div class="btn-row share-actions">
        ${navigator.share ? `<button class="btn primary" data-act="share">${icon("upload")} Compartir</button>` : ""}
        <button class="btn ${navigator.share ? "secondary" : "primary"}" data-act="copy">${icon("check")} Copiar texto</button>
      </div>`;

    root.querySelector('[data-act="share"]')?.addEventListener("click", async () => {
      try {
        await navigator.share({ title: "Mis resultados en Ulti Coach", text });
      } catch {
        // Se canceló el menú de compartir: no pasa nada.
      }
    });
    root.querySelector('[data-act="copy"]').addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        toast(`<div class="toast-head"><span>${icon("check")} Copiado. Pégalo en WhatsApp.</span></div>`, 3000);
      } catch {
        toast(`<div class="toast-head"><span>No se pudo copiar. Mantén presionado el texto para copiarlo.</span></div>`, 4000);
      }
    });
  });
}
