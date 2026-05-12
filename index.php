<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fila de Atendimento</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>

<div class="container">

    <div class="principal">
        <h1>Sistema de Fila de Atendimento</h1>

        <div class="painel">
            <div class="titulo">PRÓXIMO ATENDENTE</div>
            <div class="nome" id="nomeAtual">-</div>
        </div>

        <div class="info-boxes">
            <div class="box">
                <div class="label">Próximo da fila</div>
                <div class="valor" id="proximoNome">-</div>
            </div>

            <div class="box">
                <div class="label">Tempo atual</div>
                <div class="valor" id="tempoAtual">0m 0s</div>
            </div>
        </div>

        <button onclick="finalizarAtendimento()">
            Finalizar Atendimento
        </button>
    </div>

    <div class="lateral">

        <div class="card">
            <h2>Fila Atual</h2>
            <div id="fila"></div>
        </div>

        <div class="card">
            <h2>Últimos Atendimentos</h2>
            <div id="historico"></div>
        </div>

    </div>

</div>

<script src="script.js"></script>
</body>
</html>
