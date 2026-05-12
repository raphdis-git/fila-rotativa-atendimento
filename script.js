const STORAGE_KEY = "filaRotativaAtendimento";

const initialState = {
  agents: [],
  queue: [],
  history: [],
  lastAgentIndex: -1
};

let state = loadState();

const elements = {
  clock: document.querySelector("#clock"),
  nextClient: document.querySelector("#nextClient"),
  nextAgent: document.querySelector("#nextAgent"),
  callNextBtn: document.querySelector("#callNextBtn"),
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

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...initialState, ...stored };
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

function addClient(name) {
  state.queue.push({
    id: createId("client"),
    name,
    enteredAt: formatTime()
  });
  addHistory(`${name} entrou na fila.`);
  commit();
}

function callNext() {
  const client = state.queue.shift();
  const agent = getNextAgent();

  if (!client || !agent) return;

  agent.calls += 1;
  setLastAgent(agent.id);
  addHistory(`${client.name} foi chamado por ${agent.name}.`);
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

function renderNextCall() {
  const nextClient = state.queue[0];
  const nextAgent = getNextAgent();
  const canCall = Boolean(nextClient && nextAgent);

  elements.nextClient.textContent = nextClient ? nextClient.name : "Nenhum cliente na fila";
  elements.nextAgent.textContent = nextAgent
    ? `Próximo atendente: ${nextAgent.name}`
    : "Nenhum atendente ativo para receber chamadas.";
  elements.callNextBtn.disabled = !canCall;
}

function render() {
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

elements.callNextBtn.addEventListener("click", callNext);
elements.clearHistoryBtn.addEventListener("click", clearHistory);

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "toggle-agent") toggleAgent(id);
  if (action === "remove-agent") removeAgent(id);
  if (action === "remove-client") removeClient(id);
  if (action === "move-up") moveClient(id, -1);
  if (action === "move-down") moveClient(id, 1);
});

function tickClock() {
  elements.clock.textContent = formatTime();
}

tickClock();
setInterval(tickClock, 1000);
render();
