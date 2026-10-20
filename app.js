// Navegación entre pestañas (por #hash) y redibujado cuando cambian los datos.
import { onChange } from "./store.js";
import { icon } from "./ui.js";
import * as home from "./views/home.js";
import * as body from "./views/body.js";
import * as tests from "./views/tests.js";
import * as video from "./views/video.js";
import * as profile from "./views/profile.js";
import * as blindaje from "./views/blindaje.js";
import * as team from "./views/team.js";
import { profile as getProfile, plays, coaches } from "./store.js";

const ROUTES = { inicio: home, cuerpo: body, blindaje, pruebas: tests, video, equipo: team, perfil: profile };

// Pestañas según el rol (máximo 5). En "ambos", Video se abre desde Pruebas para dejar lugar a Equipo.
const TAB_INFO = {
  inicio: ["home", "Inicio"], cuerpo: ["body", "Cuerpo"], blindaje: ["shield", "Blindaje"],
  pruebas: ["timer", "Pruebas"], video: ["video", "Video"], equipo: ["users", "Equipo"],
};
function tabsForRole() {
  if (!plays()) return ["equipo", "pruebas"];
  if (coaches()) return ["inicio", "cuerpo", "blindaje", "pruebas", "equipo"];
  return ["inicio", "cuerpo", "blindaje", "pruebas", "video"];
}
function renderTabbar() {
  document.querySelector(".tabbar").innerHTML = tabsForRole()
    .map((t) => `<a href="#${t}" data-tab="${t}">${icon(TAB_INFO[t][0])}<span>${TAB_INFO[t][1]}</span></a>`)
    .join("");
}
const view = document.getElementById("view");
let current = null;

document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = icon(el.dataset.icon)));

// Service worker solo en producción: en la Mac de desarrollo cada cambio se ve al instante.
const isDev = ["localhost", "127.0.0.1"].includes(location.hostname);
if ("serviceWorker" in navigator && !isDev) {
  // Si ya había una versión y llega una nueva, recargamos una vez para usarla completa.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function route() {
  let [name, param] = location.hash.slice(1).split("/");
  // Sin perfil, lo primero es la bienvenida (por ejemplo, alguien que abre el link por primera vez).
  if (!getProfile() && name !== "perfil") {
    history.replaceState(null, "", "#perfil/bienvenida");
    [name, param] = ["perfil", "bienvenida"];
  }
  // Un entrenador que no juega no tiene vistas personales: su inicio es Equipo.
  const personal = ["inicio", "cuerpo", "blindaje", "video"];
  const defaultTab = plays() ? "inicio" : "equipo";
  const next = ROUTES[name] && (plays() || !personal.includes(name)) ? name : defaultTab;
  if (next !== name && getProfile()) history.replaceState(null, "", `#${next}`);
  if (current && current !== next) ROUTES[current].leave?.();
  const changedTab = current !== next;
  current = next;

  view.replaceChildren();
  ROUTES[next].render(view, param);

  document.body.classList.toggle("onboarding", !getProfile());
  renderTabbar();
  document.querySelectorAll("[data-tab]").forEach((a) => {
    if (a.dataset.tab === next) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (changedTab) window.scrollTo(0, 0);
}

// "Ver menos": cierra la sección desplegable y deja su título a la vista.
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-collapse]");
  if (!btn) return;
  const details = btn.closest("details");
  details.open = false;
  details.querySelector("summary").scrollIntoView({ behavior: "smooth", block: "nearest" });
});

window.addEventListener("hashchange", route);
onChange(() => current !== "video" && route());
route();
