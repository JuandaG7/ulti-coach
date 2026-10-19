// Navegación entre pestañas (por #hash) y redibujado cuando cambian los datos.
import { onChange } from "./store.js";
import { icon } from "./ui.js";
import * as home from "./views/home.js";
import * as body from "./views/body.js";
import * as tests from "./views/tests.js";
import * as video from "./views/video.js";
import * as profile from "./views/profile.js";
import { profile as getProfile } from "./store.js";

const ROUTES = { inicio: home, cuerpo: body, pruebas: tests, video, perfil: profile };
const view = document.getElementById("view");
let current = null;

document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function route() {
  let [name, param] = location.hash.slice(1).split("/");
  // Sin perfil, lo primero es la bienvenida (por ejemplo, alguien que abre el link por primera vez).
  if (!getProfile() && name !== "perfil") {
    history.replaceState(null, "", "#perfil/bienvenida");
    [name, param] = ["perfil", "bienvenida"];
  }
  const next = ROUTES[name] ? name : "inicio";
  if (current && current !== next) ROUTES[current].leave?.();
  const changedTab = current !== next;
  current = next;

  view.replaceChildren();
  ROUTES[next].render(view, param);

  document.body.classList.toggle("onboarding", !getProfile());
  document.querySelectorAll("[data-tab]").forEach((a) => {
    if (a.dataset.tab === next) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (changedTab) window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
onChange(() => current !== "video" && route());
route();
