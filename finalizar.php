<?php
include 'config.php';

$controle = $conn->query("SELECT * FROM controle WHERE id = 1")->fetch_assoc();
$indiceAtual = $controle['indice_atual'];
$inicio = strtotime($controle['inicio_atendimento']);

$atendentes = [];

$result = $conn->query("SELECT * FROM atendentes WHERE ativo = 1 ORDER BY ordem_fila ASC");

while($row = $result->fetch_assoc()) {
    $atendentes[] = $row;
}

$total = count($atendentes);

if ($total == 0) {
    exit;
}

$atual = $atendentes[$indiceAtual - 1];

$duracao = time() - $inicio;

$stmt = $conn->prepare("INSERT INTO historico (atendente, data_hora, duracao) VALUES (?, NOW(), ?)");
$stmt->bind_param("si", $atual['nome'], $duracao);
$stmt->execute();

$novoIndice = $indiceAtual + 1;

if ($novoIndice > $total) {
    $novoIndice = 1;
}

$stmt2 = $conn->prepare("UPDATE controle SET indice_atual = ?, inicio_atendimento = NOW() WHERE id = 1");
$stmt2->bind_param("i", $novoIndice);
$stmt2->execute();

echo "OK";
?>
