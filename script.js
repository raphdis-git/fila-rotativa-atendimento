const STORAGE_KEY = "rodizioSuporteTelefonico";

const defaultAgents = ["Atendente 1", "Atendente 2", "Atendente 3", "Atendente 4"].map((name) => ({
  id: createId("agent"),
  name,
  active: true,
  calls: 0
}));

const initialState = {
  agents: defaultAgents,
  currentAgentId: defaultAgents[0].id,
  history: [],
  lastFinished: null
};

let state = loadState();

const elements = {
  clock: document.querySelector("#clock"),
  currentAgentName: document.querySelector("#currentAgentName"),
  currentAgentStatus: document.querySelector("#currentAgentStatus"),
  mainAgentList: document.querySelector("#mainAgentList"),
  lastFinishedTitle: document.querySelector("#lastFinishedTitle"),
  lastFinishedDetail: document.querySelector("#lastFinishedDetail"),
  finishList: document.querySelector("#finishList"),
  agentForm: document.querySelector("#agentForm"),
  agentName: document.querySelector("#agentName"),
  agentList: document.querySelector("#agentList"),
  resetRotationBtn: document.querySelector("#resetRotationBtn"),
  clearHistoryBtn: document.querySelector("#clearHistoryBtn"),
  historyList: document.querySelector("#historyList")
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return structuredClone(initialState);

    const hydrated = { ...initialState, ...stored };
    if (!hydrated.currentAgentId || !hydrated.agents.some((agent) => agent.id === hydrated.currentAgentId && agent.active)) {
      hydrated.currentAgentId = getFirstActiveAgent(hydrated.agents)?.id || null;
    }
    return hydrated;
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getActiveAgents(agents = state.agents) {
  return agents.filter((agent) => agent.active);
}

function getFirstActiveAgent(agents = state.agents) {
  return agents.find((agent) => agent.active) || null;
}

function getCurrentAgent() {
  const current = state.agents.find((agent) => agent.id === state.currentAgentId && agent.active);
  if (current) return current;

  const firstActive = getFirstActiveAgent();
  state.currentAgentId = firstActive?.id || null;
  return firstActive;
}

function getNextAgentAfter(agentId) {
  const activeAgents = getActiveAgents();
  if (!activeAgents.length) return null;

  const currentActiveIndex = activeAgents.findIndex((agent) => agent.id === agentId);
  const nextIndex = currentActiveIndex >= 0 ? (currentActiveIndex + 1) % activeAgents.length : 0;
  return activeAgents[nextIndex];
}

function finishCall(agentId) {
  const currentAgent = getCurrentAgent();
  if (!currentAgent || currentAgent.id !== agentId) return;

  currentAgent.calls += 1;
  const nextAgent = getNextAgentAfter(currentAgent.id);

  state.lastFinished = {
    agentName: currentAgent.name,
    finishedAt: formatTime(),
    nextAgentName: nextAgent?.name || null
  };
  state.currentAgentId = nextAgent?.id || null;
  addHistory(`${currentAgent.name} finalizou a ligação. Próximo: ${nextAgent?.name || "nenhum atendente ativo"}.`);
  commit();
}

function addAgent(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const existing = state.agents.find((agent) => normalizeName(agent.name) === normalizeName(trimmedName));
  if (existing) {
    existing.active = true;
    if (!state.currentAgentId) state.currentAgentId = existing.id;
    addHistory(`${existing.name} foi reativado no rodízio.`);
    commit();
    return;
  }

  const agent = {
    id: createId("agent"),
    name: trimmedName,
    active: true,
    calls: 0
  };
  state.agents.push(agent);
  if (!state.currentAgentId) state.currentAgentId = agent.id;
  addHistory(`${agent.name} entrou no rodízio.`);
  commit();
}

function toggleAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;

  agent.active = !agent.active;
  addHistory(`${agent.name} ficou ${agent.active ? "ativo" : "pausado"}.`);

  if (!agent.active && state.currentAgentId === agent.id) {
    state.currentAgentId = getNextAgentAfter(agent.id)?.id || getFirstActiveAgent()?.id || null;
  }

  if (agent.active && !state.currentAgentId) {
    state.currentAgentId = agent.id;
  }

  commit();
}

function removeAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;

  state.agents = state.agents.filter((item) => item.id !== agentId);
  addHistory(`${agent.name} foi removido do rodízio.`);

  if (state.currentAgentId === agent.id) {
    state.currentAgentId = getFirstActiveAgent()?.id || null;
  }

  commit();
}

function resetRotation() {
  const firstActive = getFirstActiveAgent();
  state.currentAgentId = firstActive?.id || null;
  addHistory(`Rodízio reiniciado${firstActive ? ` em ${firstActive.name}` : ""}.`);
  commit();
}

function clearHistory() {
  state.history = [];
  commit();
}

function addHistory(text) {
  state.history.unshift({
    id: createId("history"),
    text,
    time: formatTime()
  });
  state.history = state.history.slice(0, 80);
}

function normalizeName(name) {
  return String(name).trim().toLocaleLowerCase("pt-BR");
}

function commit() {
  saveState();
  render();
}

function renderMainScreen() {
  const currentAgent = getCurrentAgent();

  elements.currentAgentName.textContent = currentAgent ? currentAgent.name : "Nenhum atendente ativo";
  elements.currentAgentStatus.textContent = currentAgent
    ? `${currentAgent.name} deve atender a próxima ligação.`
    : "Ative ou cadastre pelo menos um atendente.";

  if (state.lastFinished) {
    elements.lastFinishedTitle.textContent = `${state.lastFinished.agentName} finalizou às ${state.lastFinished.finishedAt}`;
    elements.lastFinishedDetail.textContent = state.lastFinished.nextAgentName
      ? `Próximo atendente: ${state.lastFinished.nextAgentName}.`
      : "Não há próximo atendente ativo.";
  } else {
    elements.lastFinishedTitle.textContent = "Nenhuma finalização";
    elements.lastFinishedDetail.textContent = "Quando o atendente finalizar, o próximo aparecerá automaticamente.";
  }
}

function renderMainAgentList() {
  const currentAgent = getCurrentAgent();

  if (!state.agents.length) {
    elements.mainAgentList.innerHTML = `<div class="empty-state">Nenhum atendente cadastrado.</div>`;
    return;
  }

  elements.mainAgentList.innerHTML = state.agents
    .map((agent, index) => {
      const isCurrent = currentAgent?.id === agent.id;
      return `
        <div class="agent-card ${isCurrent ? "current" : ""}">
          <div class="agent-position">${index + 1}º ${isCurrent ? "· próximo" : ""}</div>
          <div class="agent-name">${escapeHtml(agent.name)}</div>
          <div class="agent-meta">${agent.active ? "Ativo" : "Pausado"} · ${agent.calls} ligação(ões)</div>
        </div>
      `;
    })
    .join("");
}

function renderFinishButtons() {
  const currentAgent = getCurrentAgent();
  const activeAgents = getActiveAgents();

  if (!activeAgents.length) {
    elements.finishList.innerHTML = `<div class="empty-state">Nenhum atendente ativo para finalizar ligação.</div>`;
    return;
  }

  elements.finishList.innerHTML = activeAgents
    .map((agent) => {
      const isCurrent = currentAgent?.id === agent.id;
      return `
        <button class="finish-button ${isCurrent ? "current" : ""}" type="button" data-action="finish-call" data-id="${agent.id}" ${isCurrent ? "" : "disabled"}>
          ${isCurrent ? `${escapeHtml(agent.name)} · Finalizei a ligação` : `${escapeHtml(agent.name)} · aguardando vez`}
        </button>
      `;
    })
    .join("");
}

function renderAgentConfig() {
  if (!state.agents.length) {
    elements.agentList.innerHTML = `<div class="empty-state">Cadastre os 4 atendentes da equipe.</div>`;
    return;
  }

  elements.agentList.innerHTML = state.agents
    .map(
      (agent) => `
        <div class="row">
          <div>
            <div class="row-title">${escapeHtml(agent.name)}</div>
            <div class="row-subtitle">${agent.active ? "Ativo" : "Pausado"} · ${agent.calls} ligação(ões)</div>
          </div>
          <div class="row-actions">
            <button class="small-button secondary" type="button" data-action="toggle-agent" data-id="${agent.id}">
              ${agent.active ? "Pausar" : "Ativar"}
            </button>
            <button class="small-button danger" type="button" data-action="remove-agent" data-id="${agent.id}">
              Remover
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.innerHTML = `<div class="empty-state">Sem histórico por enquanto.</div>`;
    return;
  }

  elements.historyList.innerHTML = state.history
    .map(
      (item) => `
        <div class="history-item">
          <div class="history-time">${item.time}</div>
          <div class="history-text">${escapeHtml(item.text)}</div>
        </div>
      `
    )
    .join("");
}

function render() {
  renderMainScreen();
  renderMainAgentList();
  renderFinishButtons();
  renderAgentConfig();
  renderHistory();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function switchView(viewName) {
  const views = {
    main: document.querySelector("#mainView"),
    operation: document.querySelector("#operationView")
  };

  Object.entries(views).forEach(([name, view]) => {
    view.classList.toggle("active", name === viewName);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
}

function tickClock() {
  elements.clock.textContent = formatTime();
}

elements.agentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addAgent(elements.agentName.value);
  elements.agentName.value = "";
  elements.agentName.focus();
});

elements.resetRotationBtn.addEventListener("click", resetRotation);
elements.clearHistoryBtn.addEventListener("click", clearHistory);

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "finish-call") finishCall(id);
  if (action === "toggle-agent") toggleAgent(id);
  if (action === "remove-agent") removeAgent(id);
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewTarget));
});

tickClock();
setInterval(tickClock, 1000);
render();
