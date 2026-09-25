# Contexto do Projeto — Sistema de Gestão de Estoque

## Visão geral
Aplicação web para cadastrar, consultar, editar e remover produtos, além de registrar entradas de estoque como incrementos sobre a quantidade atual. A interface permite executar as operações contra a API real.

## Stack e justificativa
- Node.js com Express 4 para uma API REST simples.
- SQLite nativo via `node:sqlite` para persistência local sem dependências nativas externas.
- HTML5, CSS3 e JavaScript vanilla no frontend, conforme solicitado.
- CORS habilitado e `fetch` no cliente.
- `node:test` e `node:assert` para testes automatizados sem framework adicional.

## Estado atual
- Estrutura `backend/`, `frontend/`, `tests/` e documentação criada.
- CRUD completo em `/products` e também em `/api/products`.
- `PATCH /products/:id/stock` implementado como rota canônica de entrada de estoque; o alias POST permanece compatível.
- A entrada soma a quantidade existente dentro de uma transação e registra auditoria; nunca substitui o estoque.
- Validação no backend: nome obrigatório, preço numérico maior que zero e quantidade inteira não negativa; entradas de estoque são inteiros positivos.
- SQLite mantém `createdAt`, `updatedAt` e histórico de movimentos.
- Frontend vanilla em português com cadastro, listagem, edição, exclusão, entrada/saída de estoque, busca e histórico.
- Testes automatizados existentes cobrem CRUD, validações, sequência de estoque, erros 404/409 e estatísticas.

## Decisões técnicas relevantes
- Preços são armazenados em centavos inteiros e retornados como números decimais para evitar erros de ponto flutuante.
- As rotas são expostas com e sem o prefixo `/api` para atender ao contrato mínimo e preservar a integração já existente.
- A atualização de quantidade é restrita às rotas de estoque; `PUT` altera somente nome e preço.

## Pendências e verificação
Execute `npm test` para repetir a suíte automatizada e `npm start` para abrir a interface em `http://localhost:3000`. Os comandos curl e exemplos completos estão em `api.md`. A validação manual do frontend deve confirmar cadastro, edição, exclusão e a sequência de entrada (por exemplo, 200 + 20 = 220).
