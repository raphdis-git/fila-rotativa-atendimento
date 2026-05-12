let inicioAtendimento = null;

async function carregarStatus() {
    const resposta = await fetch('status.php');
    const dados = await resposta.json();

    document.getElementById('nomeAtual').innerText = dados.atual?.nome || '-';
    document.getElementById('proximoNome').innerText = dados.proximo?.nome || '-';

    inicioAtendimento = dados.inicio;

    let filaHTML = '';

    dados.atendentes.forEach(a => {
        const atual = a.id == dados.atual.id ? 'item atual' : 'item';

        filaHTML += `
            <div class="${atual}">
                <strong>${a.nome}</strong>
            </div>
        `;
    });

    document.getElementById('fila').innerHTML = filaHTML;

    let historicoHTML = '';

    dados.historico.forEach(h => {
        historicoHTML += `
            <div class="item">
                <strong>${h.atendente}</strong><br>
                ${h.data_hora}<br>
                Duração: ${formatarTempo(h.duracao)}
            </div>
        `;
    });

    document.getElementById('historico').innerHTML = historicoHTML;
}

async function finalizarAtendimento() {
    await fetch('finalizar.php');
    carregarStatus();
}

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;

    return `${min}m ${seg}s`;
}

setInterval(() => {
    if (!inicioAtendimento) return;

    const inicio = new Date(inicioAtendimento);
    const agora = new Date();

    const diff = Math.floor((agora - inicio) / 1000);

    document.getElementById('tempoAtual').innerText = formatarTempo(diff);
}, 1000);

setInterval(carregarStatus, 3000);

carregarStatus();
