# Rodízio de Suporte Telefônico

Sistema simples para equipes de suporte que precisam saber quem deve atender a próxima ligação.

## Como funciona

- A tela principal mostra o próximo atendente disponível.
- Cada atendente pode abrir uma tela própria em nova aba.
- Na tela individual, o atendente clica em `Atender ligação` quando for a vez dele.
- Ao atender, ele fica marcado como `Em ligação` e o próximo disponível aparece na tela principal.
- Ao finalizar, ele clica em `Finalizar ligação` e volta para o fim do rodízio.
- É possível pausar, ativar ou remover atendentes do rodízio.
- O histórico registra cada finalização.

## Uso sugerido

1. Abra a tela principal em uma TV ou monitor visível para a equipe.
2. Na aba `Operação`, mantenha os 4 atendentes cadastrados.
3. Abra uma aba individual para cada atendente.
4. Quando for a vez dele, o botão `Atender ligação` fica liberado.
5. Ao finalizar, o atendente clica em `Finalizar ligação`.

Os dados ficam salvos no navegador usando `localStorage`.
