# Rodízio de Suporte Telefônico

Sistema simples para equipes de suporte que precisam saber quem deve atender a próxima ligação.

## Como funciona

- A tela principal mostra o próximo atendente.
- Quando esse atendente finaliza a ligação, ele clica em `Finalizei a ligação`.
- O sistema avança automaticamente para o próximo atendente ativo.
- É possível pausar, ativar ou remover atendentes do rodízio.
- O histórico registra cada finalização.

## Uso sugerido

1. Abra a tela principal em uma TV ou monitor visível para a equipe.
2. Na aba `Operação`, mantenha os 4 atendentes cadastrados.
3. Quando o atendente da vez terminar a ligação, clique em `Finalizei a ligação`.
4. A tela principal passa a mostrar o próximo atendente.

Os dados ficam salvos no navegador usando `localStorage`.
