# Fila Rotativa de Atendimento

Sistema simples de fila rotativa para organizar chamadas entre atendentes ativos.

## Recursos

- Cadastro de atendentes.
- Pausar ou reativar atendentes.
- Cadastro de clientes ou senhas na fila.
- Chamada do próximo cliente para o próximo atendente ativo.
- Reordenação manual da fila.
- Histórico das ações.
- Persistência local pelo navegador usando `localStorage`.

## Como usar

Abra o arquivo `index.html` no navegador.

1. Adicione os atendentes.
2. Adicione os clientes na fila.
3. Clique em `Chamar próximo`.

O sistema alterna automaticamente entre os atendentes ativos.

## Publicar no GitHub Pages

Depois de enviar estes arquivos para um repositório no GitHub:

1. Abra `Settings`.
2. Entre em `Pages`.
3. Em `Build and deployment`, selecione `Deploy from a branch`.
4. Escolha a branch principal e a pasta `/root`.
5. Salve.

O GitHub vai gerar um link publico para acessar o sistema.
