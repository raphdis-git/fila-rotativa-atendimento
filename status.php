<?php
include 'config.php';

$controle = $conn->query("SELECT * FROM controle WHERE id = 1")->fetch_assoc();
$indiceAtual = $controle['indice_atual'];

$atendentes = [];

$result = $conn->query("SELECT * FROM atendentes WHERE ativo = 1 ORDER BY ordem_fila ASC");

while($row = $result->fetch_assoc()) {
    $atendentes[] = $row;
}

$total = count($atendentes);

$atual = null;
$proximo = null;

foreach($atendentes as $index => $a) {
    if (($index + 1) == $indiceAtual) {
        $atual = $a;

        $proxIndex = ($index + 1) % $total;
        $proximo = $atendentes[$proxIndex];
    }
}

$historico = [];

$hist = $conn->query("SELECT * FROM historico ORDER BY id DESC LIMIT 10");

while($h = $hist->fetch_assoc()) {
    $historico[] = $h;
}

echo json_encode([
    'atual' => $atual,
    'proximo' => $proximo,
    'historico' => $historico,
    'atendentes' => $atendentes,
    'inicio' => $controle['inicio_atendimento']
]);
?>
