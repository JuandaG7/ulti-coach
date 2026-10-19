// Hoja inferior (bottom sheet) reutilizable, basada en <dialog>.
import { onChange } from "../store.js";
import { icon } from "../ui.js";

const dialog = document.getElementById("sheet");
const body = dialog.querySelector(".sheet-body");
let current = null;

dialog.addEventListener("click", (e) => {
  if (e.target === dialog) closeSheet();
});
dialog.addEventListener("close", () => (current = null));

// Si cambian los datos con la hoja abierta, se vuelve a dibujar.
onChange(() => current && paint());

function paint() {
  body.innerHTML = `<button class="icon-btn sheet-close" aria-label="Cerrar">${icon("x")}</button>`;
  body.querySelector(".sheet-close").addEventListener("click", closeSheet);
  const content = document.createElement("div");
  body.append(content);
  current(content);
}

export function openSheet(render) {
  current = render;
  paint();
  if (!dialog.open) dialog.showModal();
}

export function closeSheet() {
  dialog.close();
}
