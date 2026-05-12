# Fila Rotativa de Atendimento

Sistema simples de fila rotativa para organizar chamadas entre atendentes ativos.

## Recursos

- Cadastro de atendentes.
- Pausar ou reativar atendentes.
- Cadastro de clientes ou senhas na fila.
- Chamada do próximo cliente para o próximo atendente ativo.
- Tela principal com o próximo atendente da rotação.
- Controle de atendimentos em andamento.
- Finalização de atendimento por colaborador.
- Reordenação manual da fila.
- Histórico das ações.
- Persistência local pelo navegador usando `localStorage`.

## Como usar

Abra o arquivo `index.html` no navegador.

1. Adicione os atendentes.
2. Adicione os clientes na fila.
3. Clique em `Chamar próximo`.
4. Na tela principal, clique em `Finalizar` quando o colaborador encerrar o atendimento.

O sistema alterna automaticamente entre os atendentes ativos e mostra quem será o próximo a atender após cada finalização.

## Publicar no GitHub Pages

Depois de enviar estes arquivos para um repositório no GitHub:

1. Abra `Settings`.
2. Entre em `Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Escolha a branch principal e a pasta `/root`.
5. Salve.

O GitHub vai gerar um link publico para acessar o sistema.
