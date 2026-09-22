"use strict";

const VIA_CEP_URL = "https://viacep.com.br/ws";
const HISTORY_KEY = "buscador-cep:history";
const HISTORY_LIMIT = 5;
const THEME_KEY = "buscador-cep:theme";

const elements = {
  cepInput: document.querySelector("#cep"),
  inputSpinner: document.querySelector("#input-spinner"),
  status: document.querySelector("#status-message"),
  resultSection: document.querySelector("#result-section"),
  resultCep: document.querySelector("#result-cep"),
  street: document.querySelector("#address-street"),
  neighborhood: document.querySelector("#address-neighborhood"),
  city: document.querySelector("#address-city"),
  historyList: document.querySelector("#history-list"),
  emptyHistory: document.querySelector("#empty-history"),
  clearHistory: document.querySelector("#clear-history"),
  themeToggle: document.querySelector("#theme-toggle"),
  themeIcon: document.querySelector("#theme-icon"),
  themeLabel: document.querySelector("#theme-label"),
};

let activeRequest = null;
let lastSearchedCep = "";

/** Normaliza qualquer valor para no máximo 8 dígitos. */
function onlyDigits(value) {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Aplica a máscara brasileira de CEP: 00000-000. */
function formatCep(value) {
  const digits = onlyDigits(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/** Serviço independente para consulta à API ViaCEP. */
async function fetchAddressByCep(cep, signal) {
  const response = await fetch(`${VIA_CEP_URL}/${cep}/json/`, { signal });

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP agora.");
  }

  const address = await response.json();
  if (address.erro) {
    throw new Error("CEP não encontrado. Confira os números e tente novamente.");
  }

  return address;
}

function setLoading(isLoading) {
  elements.inputSpinner.classList.toggle("hidden", !isLoading);
  elements.inputSpinner.classList.toggle("flex", isLoading);
  elements.cepInput.setAttribute("aria-busy", String(isLoading));
}

function showStatus(message, type = "error") {
  const colorClass = type === "error" ? "text-red-600" : "text-emerald-600";
  elements.status.textContent = message;
  elements.status.className = `mt-2 text-sm font-medium ${colorClass}`;
}

function clearStatus() {
  elements.status.textContent = "";
  elements.status.className = "mt-2 hidden text-sm font-medium";
}

function hideResult() {
  elements.resultSection.classList.add("hidden");
}

function renderAddress(address) {
  elements.resultCep.textContent = formatCep(address.cep);
  elements.street.textContent = address.logradouro || "Não informado";
  elements.neighborhood.textContent = address.bairro || "Não informado";
  elements.city.textContent = [address.localidade, address.uf].filter(Boolean).join(" / ") || "Não informado";
  elements.resultSection.classList.remove("hidden");
}

function getHistory() {
  try {
    const savedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(savedHistory) ? savedHistory : [];
  } catch {
    return [];
  }
}

function saveHistory(address) {
  const item = {
    cep: onlyDigits(address.cep),
    label: `${address.localidade || "Cidade não informada"} / ${address.uf || "—"}`,
  };
  const history = getHistory().filter((entry) => entry.cep !== item.cep);
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_LIMIT)));
}

function removeHistoryItem(cep) {
  const updatedHistory = getHistory().filter((item) => item.cep !== cep);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();
  elements.historyList.replaceChildren();
  elements.emptyHistory.classList.toggle("hidden", history.length > 0);
  elements.clearHistory.classList.toggle("hidden", history.length === 0);

  history.forEach((item) => {
    const row = document.createElement("li");
    row.className = "flex items-center gap-2 rounded-xl border border-slate-200 transition hover:border-indigo-200 dark:border-slate-700 dark:hover:border-indigo-500";

    const button = document.createElement("button");
    button.type = "button";
    button.dataset.cep = item.cep;
    button.className = "flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800";

    const cep = document.createElement("span");
    cep.className = "font-semibold text-slate-800 dark:text-slate-100";
    cep.textContent = formatCep(item.cep);

    const label = document.createElement("span");
    label.className = "truncate text-sm text-slate-500 dark:text-slate-400";
    label.textContent = item.label;

    button.append(cep, label);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.dataset.removeCep = item.cep;
    removeButton.className = "mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-red-950";
    removeButton.setAttribute("aria-label", `Excluir o CEP ${formatCep(item.cep)} do histórico`);
    removeButton.textContent = "×";

    row.append(button, removeButton);
    elements.historyList.append(row);
  });
}

async function searchCep(rawCep) {
  const cep = onlyDigits(rawCep);
  if (cep.length !== 8 || cep === lastSearchedCep) return;

  activeRequest?.abort();
  const requestController = new AbortController();
  activeRequest = requestController;
  lastSearchedCep = cep;
  clearStatus();
  hideResult();
  setLoading(true);

  try {
    const address = await fetchAddressByCep(cep, requestController.signal);
    renderAddress(address);
    saveHistory(address);
    renderHistory();
  } catch (error) {
    if (error.name !== "AbortError") {
      lastSearchedCep = "";
      showStatus(error.message || "Ocorreu um erro inesperado. Tente novamente.");
    }
  } finally {
    if (activeRequest === requestController) {
      setLoading(false);
    }
  }
}

function handleInput(event) {
  const formattedCep = formatCep(event.target.value);
  event.target.value = formattedCep;
  const cep = onlyDigits(formattedCep);

  if (cep.length < 8) {
    activeRequest?.abort();
    lastSearchedCep = "";
    setLoading(false);
    clearStatus();
    hideResult();
    return;
  }

  searchCep(cep);
}

function handleHistoryClick(event) {
  const removeButton = event.target.closest("button[data-remove-cep]");
  if (removeButton) {
    removeHistoryItem(removeButton.dataset.removeCep);
    return;
  }

  const button = event.target.closest("button[data-cep]");
  if (!button) return;

  lastSearchedCep = "";
  elements.cepInput.value = formatCep(button.dataset.cep);
  elements.cepInput.focus();
  searchCep(button.dataset.cep);
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  elements.themeToggle.setAttribute("aria-pressed", String(isDark));
  elements.themeIcon.textContent = isDark ? "☀" : "☾";
  elements.themeLabel.textContent = isDark ? "Modo claro" : "Modo escuro";
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));
}

elements.cepInput.addEventListener("input", handleInput);
elements.historyList.addEventListener("click", handleHistoryClick);
elements.clearHistory.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});
elements.themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
});

initializeTheme();
renderHistory();
