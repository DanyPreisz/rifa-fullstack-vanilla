import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#raffle-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/raffles");
  listEl.innerHTML = "";
  data.raffles.forEach((raffle) => {
    const li = document.createElement("li");
    li.className = "item";
    const text = document.createElement("div");
    text.innerHTML = `<strong>${raffle.title}</strong>${raffle.prize ? ` \u00b7 ${raffle.prize}` : ""}<br>${raffle.entries.join(", ") || "sin participantes"}${raffle.winner ? `<br><span class=\"winner\">Ganador: ${raffle.winner}</span>` : ""}`;
    const add = document.createElement("button");
    add.type = "button";
    add.className = "ghost";
    add.textContent = "Agregar";
    add.addEventListener("click", async () => {
      const name = window.prompt("Participante");
      if (!name) return;
      await api(`/api/raffles/${raffle.id}/entry`, { method: "POST", body: JSON.stringify({ name }) });
      await refresh();
    });
    const draw = document.createElement("button");
    draw.type = "button";
    draw.className = "primary";
    draw.textContent = "Sortear";
    draw.addEventListener("click", async () => { await api(`/api/raffles/${raffle.id}/draw`, { method: "POST" }); await refresh(); });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/raffles/${raffle.id}`, { method: "DELETE" }); await refresh(); });
    li.append(text, add, draw, del);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/raffles", { method: "POST", body: JSON.stringify({ title: document.querySelector("#title").value.trim(), prize: document.querySelector("#prize").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
