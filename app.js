// Navegación entre pestañas (por #hash) y redibujado cuando cambian los datos.
import { onChange } from "./store.js";
import { icon } from "./ui.js";
import * as home from "./views/home.js";
import * as body from "./views/body.js";
import * as tests from "./views/tests.js";
import * as video from "./views/video.js";

const ROUTES = { inicio: home, cuerpo: body, pruebas: tests, video };
const view = document.getElementById("view");
let current = null;

document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function route() {
  const [name, param] = location.hash.slice(1).split("/");
  const next = ROUTES[name] ? name : "inicio";
  if (current && current !== next) ROUTES[current].leave?.();
  const changedTab = current !== next;
  current = next;

  view.replaceChildren();
  ROUTES[next].render(view, param);

  document.querySelectorAll("[data-tab]").forEach((a) => {
    if (a.dataset.tab === next) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (changedTab) window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
onChange(() => current !== "video" && route());
route();
