const STORAGE_KEY = "rodizioSuporteTelefonico.v2";
const params = new URLSearchParams(window.location.search);
const attendantIdFromUrl = params.get("atendente");

const defaultAgents = ["Atendente 1", "Atendente 2", "Atendente 3", "Atendente 4"].map((name) => ({
  id: createId("agent"),
  name,
  active: true,
  status: "available",
  calls: 0
}));

const initialState = {
  agents: defaultAgents,
  history: [],
  lastAction: null
};

let state = loadState();

const elements = {
  clock: document.querySelector("#clock"),
  mainNav: document.querySelector("#mainNav"),
  mainView: document.querySelector("#mainView"),
  operationView: document.querySelector("#operationView"),
  attendantView: document.querySelector("#attendantView"),
  currentAgentName: document.querySelector("#currentAgentName"),
  currentAgentStatus: document.querySelector("#currentAgentStatus"),
  mainAgentList: document.querySelector("#mainAgentList"),
  lastFinishedTitle: document.querySelector("#lastFinishedTitle"),
  lastFinishedDetail: document.querySelector("#lastFinishedDetail"),
  attendantLinks: document.querySelector("#attendantLinks"),
  agentForm: document.querySelector("#agentForm"),
  agentName: document.querySelector("#agentName"),
  agentList: document.querySelector("#agentList"),
  resetRotationBtn: document.querySelector("#resetRotationBtn"),
  clearHistoryBtn: document.querySelector("#clearHistoryBtn"),
  historyList: document.querySelector("#historyList"),
  attendantName: document.querySelector("#attendantName"),
  attendantStatus: document.querySelector("#attendantStatus"),
  startCallBtn: document.querySelector("#startCallBtn"),
  finishCallBtn: document.querySelector("#finishCallBtn")
};

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return structuredClone(initialState);

    return {
      ...initialState,
      ...stored,
      agents: (stored.agents || initialState.agents).map((agent) => ({
        ...agent,
        status: agent.status || "available"
      }))
    };
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

function getActiveAgents() {
  return state.agents.filter((agent) => agent.active);
}

function getAvailableAgents() {
  return state.agents.filter((agent) => agent.active && agent.status === "available");
}

function getCurrentAgent() {
  return getAvailableAgents()[0] || null;
}

function getAgent(agentId) {
  return state.agents.find((agent) => agent.id === agentId) || null;
}

function startCall(agentId) {
  const agent = getAgent(agentId);
  const currentAgent = getCurrentAgent();
  if (!agent || !currentAgent || agent.id !== currentAgent.id) return;

  agent.status = "busy";
  state.lastAction = {
    type: "started",
    agentName: agent.name,
    time: formatTime()
  };
  addHistory(`${agent.name} iniciou uma ligação.`);
  commit();
}

function finishCall(agentId) {
  const agent = getAgent(agentId);
  if (!agent || agent.status !== "busy") return;

  agent.status = "available";
  agent.calls += 1;
  moveAgentToEnd(agent.id);

  const nextAgent = getCurrentAgent();
  state.lastAction = {
    type: "finished",
    agentName: agent.name,
    nextAgentName: nextAgent?.name || null,
    time: formatTime()
  };
  addHistory(`${agent.name} finalizou a ligação. Próximo: ${nextAgent?.name || "nenhum atendente disponível"}.`);
  commit();
}

function moveAgentToEnd(agentId) {
  const index = state.agents.findIndex((agent) => agent.id === agentId);
  if (index < 0) return;

  const [agent] = state.agents.splice(index, 1);
  state.agents.push(agent);
}

function addAgent(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  const existing = state.agents.find((agent) => normalizeName(agent.name) === normalizeName(trimmedName));
  if (existing) {
    existing.active = true;
    existing.status = "available";
    addHistory(`${existing.name} foi reativado no rodízio.`);
    commit();
    return;
  }

  state.agents.push({
    id: createId("agent"),
    name: trimmedName,
    active: true,
    status: "available",
    calls: 0
  });
  addHistory(`${trimmedName} entrou no rodízio.`);
  commit();
}

function toggleAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;

  agent.active = !agent.active;
  if (!agent.active) agent.status = "available";
  addHistory(`${agent.name} ficou ${agent.active ? "ativo" : "pausado"}.`);
  commit();
}

function removeAgent(agentId) {
  const agent = getAgent(agentId);
  if (!agent) return;

  state.agents = state.agents.filter((item) => item.id !== agentId);
  addHistory(`${agent.name} foi removido do rodízio.`);
  commit();
}

function resetRotation() {
  state.agents = state.agents.map((agent) => ({
    ...agent,
    status: "available"
  }));
  addHistory("Rodízio reiniciado.");
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

  elements.currentAgentName.textContent = currentAgent ? currentAgent.name : "Nenhum atendente disponível";
  elements.currentAgentStatus.textContent = currentAgent
    ? `${currentAgent.name} deve atender a próxima ligação.`
    : "Todos estão em ligação, pausados ou sem cadastro ativo.";

  if (state.lastAction) {
    elements.lastFinishedTitle.textContent =
      state.lastAction.type === "started"
        ? `${state.lastAction.agentName} iniciou às ${state.lastAction.time}`
        : `${state.lastAction.agentName} finalizou às ${state.lastAction.time}`;
    elements.lastFinishedDetail.textContent = state.lastAction.nextAgentName
      ? `Próximo disponível: ${state.lastAction.nextAgentName}.`
      : "Aguardando alguém ficar disponível.";
  } else {
    elements.lastFinishedTitle.textContent = "Nenhuma ação registrada";
    elements.lastFinishedDetail.textContent = "Quando alguém atender ou finalizar, a tela principal atualiza.";
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
      const status = getStatusText(agent);
      return `
        <div class="agent-card ${isCurrent ? "current" : ""}">
          <div class="agent-position">${index + 1}º ${isCurrent ? "· próximo" : ""}</div>
          <div class="agent-name">${escapeHtml(agent.name)}</div>
          <div class="agent-meta">${status} · ${agent.calls} ligação(ões)</div>
        </div>
      `;
    })
    .join("");
}

function renderAttendantLinks() {
  const activeAgents = getActiveAgents();

  if (!activeAgents.length) {
    elements.attendantLinks.innerHTML = `<div class="empty-state">Nenhum atendente ativo.</div>`;
    return;
  }

  elements.attendantLinks.innerHTML = activeAgents
    .map(
      (agent) => `
        <a class="attendant-link" href="?atendente=${encodeURIComponent(agent.id)}" target="_blank" rel="noopener">
          Abrir tela de ${escapeHtml(agent.name)}
        </a>
      `
    )
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
            <div class="row-subtitle">${getStatusText(agent)} · ${agent.calls} ligação(ões)</div>
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

function renderAttendantView() {
  if (!attendantIdFromUrl) return;

  const agent = getAgent(attendantIdFromUrl);
  const currentAgent = getCurrentAgent();

  if (!agent) {
    elements.attendantName.textContent = "Atendente não encontrado";
    elements.attendantStatus.textContent = "Volte para a operação e abra uma nova tela.";
    elements.startCallBtn.disabled = true;
    elements.finishCallBtn.disabled = true;
    return;
  }

  elements.attendantName.textContent = agent.name;

  if (!agent.active) {
    elements.attendantStatus.textContent = "Você está pausado no rodízio.";
    elements.startCallBtn.disabled = true;
    elements.finishCallBtn.disabled = true;
    return;
  }

  if (agent.status === "busy") {
    elements.attendantStatus.textContent = "Você está em ligação.";
    elements.startCallBtn.disabled = true;
    elements.finishCallBtn.disabled = false;
    return;
  }

  const isCurrent = currentAgent?.id === agent.id;
  elements.attendantStatus.textContent = isCurrent
    ? "É sua vez de atender a próxima ligação."
    : `Aguardando sua vez. Próximo disponível: ${currentAgent?.name || "ninguém"}.`;
  elements.startCallBtn.disabled = !isCurrent;
  elements.finishCallBtn.disabled = true;
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

function getStatusText(agent) {
  if (!agent.active) return "Pausado";
  if (agent.status === "busy") return "Em ligação";
  return "Disponível";
}

function render() {
  renderMainScreen();
  renderMainAgentList();
  renderAttendantLinks();
  renderAgentConfig();
  renderAttendantView();
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
    main: elements.mainView,
    operation: elements.operationView
  };

  Object.entries(views).forEach(([name, view]) => {
    view.classList.toggle("active", name === viewName);
  });

  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.viewTarget === viewName);
  });
}

function configureMode() {
  const isAttendantScreen = Boolean(attendantIdFromUrl);
  elements.mainNav.classList.toggle("hidden", isAttendantScreen);
  elements.mainView.classList.toggle("active", !isAttendantScreen);
  elements.operationView.classList.remove("active");
  elements.attendantView.classList.toggle("active", isAttendantScreen);
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

elements.startCallBtn.addEventListener("click", () => {
  if (attendantIdFromUrl) startCall(attendantIdFromUrl);
});

elements.finishCallBtn.addEventListener("click", () => {
  if (attendantIdFromUrl) finishCall(attendantIdFromUrl);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle-agent") toggleAgent(id);
  if (action === "remove-agent") removeAgent(id);
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewTarget));
});

window.addEventListener("storage", () => {
  state = loadState();
  render();
});

configureMode();
tickClock();
setInterval(tickClock, 1000);
render();
