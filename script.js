const STORAGE_KEY = "filaRotativaAtendimento";

const initialState = {
  agents: [],
  queue: [],
  activeServices: [],
  activeOperatorName: "",
  history: [],
  lastFinished: null,
  lastAgentIndex: -1
};

let state = loadState();

const elements = {
  clock: document.querySelector("#clock"),
  nextClient: document.querySelector("#nextClient"),
  nextAgent: document.querySelector("#nextAgent"),
  callNextBtn: document.querySelector("#callNextBtn"),
  operatorForm: document.querySelector("#operatorForm"),
  serviceAgentName: document.querySelector("#serviceAgentName"),
  enterOperatorBtn: document.querySelector("#enterOperatorBtn"),
  finishOwnServiceBtn: document.querySelector("#finishOwnServiceBtn"),
  startServiceMessage: document.querySelector("#startServiceMessage"),
  agentForm: document.querySelector("#agentForm"),
  agentName: document.querySelector("#agentName"),
  clientForm: document.querySelector("#clientForm"),
  clientName: document.querySelector("#clientName"),
  agentList: document.querySelector("#agentList"),
  queueList: document.querySelector("#queueList"),
  historyList: document.querySelector("#historyList"),
  agentCount: document.querySelector("#agentCount"),
  queueCount: document.querySelector("#queueCount"),
  clearHistoryBtn: document.querySelector("#clearHistoryBtn")
};

elements.mainNextAgent = document.querySelector("#mainNextAgent");
elements.mainNextClient = document.querySelector("#mainNextClient");
elements.lastFinishedTitle = document.querySelector("#lastFinishedTitle");
elements.lastFinishedDetail = document.querySelector("#lastFinishedDetail");
elements.activeServiceCount = document.querySelector("#activeServiceCount");
elements.activeServiceList = document.querySelector("#activeServiceList");

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const hydrated = { ...initialState, ...stored };
    return {
      ...hydrated,
      activeServices: hydrated.activeServices || [],
      activeOperatorName: hydrated.activeOperatorName || "",
      lastFinished: hydrated.lastFinished || null
    };
  } catch {
    return { ...initialState };
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

function getNextAgent() {
  const activeAgents = getActiveAgents();
  if (!activeAgents.length) return null;

  const currentAgentId = state.agents[state.lastAgentIndex]?.id;
  const activePosition = activeAgents.findIndex((agent) => agent.id === currentAgentId);
  const nextActiveIndex = (activePosition + 1) % activeAgents.length;
  return activeAgents[nextActiveIndex];
}

function setLastAgent(agentId) {
  state.lastAgentIndex = state.agents.findIndex((agent) => agent.id === agentId);
}

function addHistory(text) {
  state.history.unshift({
    id: createId("history"),
    text,
    time: formatTime()
  });
  state.history = state.history.slice(0, 60);
}

function addAgent(name) {
  state.agents.push({
    id: createId("agent"),
    name,
    active: true,
    calls: 0
  });
  addHistory(`${name} entrou na equipe de atendimento.`);
  commit();
}

function findAgentByName(name) {
  const normalizedName = normalizeName(name);
  return state.agents.find((agent) => normalizeName(agent.name) === normalizedName);
}

function normalizeName(name) {
  return String(name).trim().toLocaleLowerCase("pt-BR");
}

function ensureAgent(name) {
  const existingAgent = findAgentByName(name);
  if (existingAgent) {
    existingAgent.active = true;
    return existingAgent;
  }

  const agent = {
    id: createId("agent"),
    name,
    active: true,
    calls: 0
  };
  state.agents.push(agent);
  addHistory(`${name} entrou na equipe de atendimento.`);
  return agent;
}

function addClient(name) {
  state.queue.push({
    id: createId("client"),
    name,
    enteredAt: formatTime()
  });
  addHistory(`${name} entrou na fila.`);
  commit();
}

function callNext(requestedAgentName = "") {
  const requestedAgent = requestedAgentName.trim() ? ensureAgent(requestedAgentName.trim()) : null;
  const nextAgent = getNextAgent();

  if (!state.queue.length) {
    setStartMessage("Não há clientes na fila.");
    commit();
    return;
  }

  if (!nextAgent) {
    setStartMessage("Nenhum atendente ativo para iniciar.");
    commit();
    return;
  }

  if (requestedAgent && requestedAgent.id !== nextAgent.id) {
    setStartMessage(`A vez agora é de ${nextAgent.name}.`);
    commit();
    return;
  }

  const client = state.queue.shift();
  const agent = nextAgent;

  if (!client || !agent) return;

  agent.calls += 1;
  setLastAgent(agent.id);
  state.activeServices.push({
    id: createId("service"),
    clientName: client.name,
    agentId: agent.id,
    agentName: agent.name,
    startedAt: formatTime()
  });
  addHistory(`${client.name} foi chamado por ${agent.name}.`);
  setStartMessage(`${agent.name} iniciou o atendimento de ${client.name}.`);
  commit();
}

function enterOperator(name) {
  const agent = ensureAgent(name);
  state.activeOperatorName = agent.name;
  setStartMessage(`${agent.name} entrou na operação.`);
  commit();
}

function setStartMessage(message) {
  elements.startServiceMessage.textContent = message;
}

function finishService(serviceId) {
  const service = state.activeServices.find((item) => item.id === serviceId);
  if (!service) return;

  state.activeServices = state.activeServices.filter((item) => item.id !== serviceId);
  const nextAgent = getNextAgent();

  state.lastFinished = {
    agentName: service.agentName,
    clientName: service.clientName,
    finishedAt: formatTime(),
    nextAgentName: nextAgent?.name || null
  };

  addHistory(`${service.agentName} finalizou o atendimento de ${service.clientName}.`);
  commit();
}

function toggleAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;

  agent.active = !agent.active;
  addHistory(`${agent.name} ficou ${agent.active ? "ativo" : "inativo"}.`);
  commit();
}

function removeAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  state.agents = state.agents.filter((item) => item.id !== agentId);
  if (agent) addHistory(`${agent.name} saiu da equipe.`);
  if (state.lastAgentIndex >= state.agents.length) state.lastAgentIndex = state.agents.length - 1;
  commit();
}

function removeClient(clientId) {
  const client = state.queue.find((item) => item.id === clientId);
  state.queue = state.queue.filter((item) => item.id !== clientId);
  if (client) addHistory(`${client.name} foi removido da fila.`);
  commit();
}

function moveClient(clientId, direction) {
  const index = state.queue.findIndex((item) => item.id === clientId);
  const newIndex = index + direction;

  if (index < 0 || newIndex < 0 || newIndex >= state.queue.length) return;

  const [client] = state.queue.splice(index, 1);
  state.queue.splice(newIndex, 0, client);
  commit();
}

function clearHistory() {
  state.history = [];
  commit();
}

function commit() {
  saveState();
  render();
}

function renderAgents() {
  elements.agentCount.textContent = getActiveAgents().length;

  if (!state.agents.length) {
    elements.agentList.innerHTML = `<div class="empty-state">Nenhum atendente cadastrado.</div>`;
    return;
  }

  elements.agentList.innerHTML = state.agents
    .map(
      (agent) => `
        <div class="row ${agent.active ? "" : "agent-offline"}">
          <div>
            <div class="row-title">${escapeHtml(agent.name)}</div>
            <div class="row-subtitle">${agent.active ? "Ativo" : "Inativo"} · ${agent.calls} chamada(s)</div>
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

function renderQueue() {
  elements.queueCount.textContent = state.queue.length;

  if (!state.queue.length) {
    elements.queueList.innerHTML = `<div class="empty-state">A fila está vazia.</div>`;
    return;
  }

  elements.queueList.innerHTML = state.queue
    .map(
      (client, index) => `
        <div class="row">
          <div>
            <div class="row-title">${index + 1}. ${escapeHtml(client.name)}</div>
            <div class="row-subtitle">Entrada: ${client.enteredAt}</div>
          </div>
          <div class="row-actions">
            <button class="small-button secondary" type="button" data-action="move-up" data-id="${client.id}" ${index === 0 ? "disabled" : ""}>Subir</button>
            <button class="small-button secondary" type="button" data-action="move-down" data-id="${client.id}" ${index === state.queue.length - 1 ? "disabled" : ""}>Descer</button>
            <button class="small-button warning" type="button" data-action="remove-client" data-id="${client.id}">Remover</button>
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

function renderMainBoard() {
  const nextAgent = getNextAgent();
  const nextClient = state.queue[0];

  elements.mainNextAgent.textContent = nextAgent ? nextAgent.name : "Nenhum atendente ativo";
  elements.mainNextClient.textContent = nextClient
    ? `Próximo cliente: ${nextClient.name}`
    : "Aguardando cliente na fila.";

  if (state.lastFinished) {
    elements.lastFinishedTitle.textContent = `${state.lastFinished.agentName} finalizou`;
    elements.lastFinishedDetail.textContent = state.lastFinished.nextAgentName
      ? `Atendimento de ${state.lastFinished.clientName} finalizado às ${state.lastFinished.finishedAt}. Próximo: ${state.lastFinished.nextAgentName}.`
      : `Atendimento de ${state.lastFinished.clientName} finalizado às ${state.lastFinished.finishedAt}.`;
  } else {
    elements.lastFinishedTitle.textContent = "Nenhum atendimento finalizado";
    elements.lastFinishedDetail.textContent = "Finalize um atendimento para atualizar o painel.";
  }
}

function renderActiveServices() {
  elements.activeServiceCount.textContent = state.activeServices.length;

  if (!state.activeServices.length) {
    elements.activeServiceList.innerHTML = `<div class="empty-state">Nenhum atendimento em andamento.</div>`;
    return;
  }

  elements.activeServiceList.innerHTML = state.activeServices
    .map(
      (service) => `
        <div class="row">
          <div>
            <div class="row-title">${escapeHtml(service.agentName)} atendendo ${escapeHtml(service.clientName)}</div>
            <div class="row-subtitle">Início: ${service.startedAt}</div>
          </div>
          <div class="row-actions">
            <button class="small-button success" type="button" data-action="finish-service" data-id="${service.id}">
              Finalizar
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderNextCall() {
  const nextClient = state.queue[0];
  const nextAgent = getNextAgent();
  const activeOperator = findAgentByName(state.activeOperatorName);
  const ownService = activeOperator
    ? state.activeServices.find((service) => service.agentId === activeOperator.id)
    : null;
  const canStart = Boolean(nextClient && nextAgent && activeOperator && nextAgent.id === activeOperator.id && !ownService);

  elements.nextClient.textContent = nextClient ? nextClient.name : "Nenhum cliente na fila";
  elements.nextAgent.textContent = nextAgent
    ? `Próximo atendente: ${nextAgent.name}`
    : "Digite seu nome para entrar na rotação.";

  elements.callNextBtn.classList.toggle("hidden", !canStart);
  elements.finishOwnServiceBtn.classList.toggle("hidden", !ownService);
  elements.enterOperatorBtn.textContent = activeOperator ? "Trocar atendente" : "Entrar";

  if (ownService) {
    setStartMessage(`${ownService.agentName} está atendendo ${ownService.clientName}.`);
    return;
  }

  if (!activeOperator) return;

  if (!nextClient) {
    setStartMessage(`${activeOperator.name} está na fila de atendentes. Não há clientes aguardando.`);
    return;
  }

  if (canStart) {
    setStartMessage(`${activeOperator.name}, é sua vez. Inicie o atendimento.`);
    return;
  }

  setStartMessage(`Aguardando sua vez. Próximo atendente: ${nextAgent?.name || "nenhum"}.`);
}

function render() {
  renderMainBoard();
  renderActiveServices();
  renderNextCall();
  renderAgents();
  renderQueue();
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

elements.agentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.agentName.value.trim();
  if (!name) return;
  addAgent(name);
  elements.agentName.value = "";
  elements.agentName.focus();
});

elements.clientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.clientName.value.trim();
  if (!name) return;
  addClient(name);
  elements.clientName.value = "";
  elements.clientName.focus();
});

elements.callNextBtn.addEventListener("click", () => {
  const name = elements.serviceAgentName.value.trim() || state.activeOperatorName;
  if (!name) return;
  callNext(name);
});

elements.finishOwnServiceBtn.addEventListener("click", () => {
  const agent = findAgentByName(state.activeOperatorName);
  const ownService = agent ? state.activeServices.find((service) => service.agentId === agent.id) : null;
  if (ownService) finishService(ownService.id);
});

elements.clearHistoryBtn.addEventListener("click", clearHistory);

elements.operatorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.serviceAgentName.value.trim();
  if (!name) return;
  enterOperator(name);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle-agent") toggleAgent(id);
  if (action === "remove-agent") removeAgent(id);
  if (action === "remove-client") removeClient(id);
  if (action === "move-up") moveClient(id, -1);
  if (action === "move-down") moveClient(id, 1);
  if (action === "finish-service") finishService(id);
});

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.viewTarget));
});

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

tickClock();
setInterval(tickClock, 1000);
render();
