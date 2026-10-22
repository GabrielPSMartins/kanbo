# Kanbo

Gerenciador Scrum **pessoal** (inspirado em Jira/Linear) para organizar o TCC: backlog, sprints,
board Kanban, burndown e dashboard. Single-user, sem login, roda local.

**Stack:** FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · SQLite — React 19 · TypeScript · Vite ·
Tailwind v4 · shadcn/ui · TanStack Query · dnd-kit · Recharts

## Rodando em 3 comandos

Pré-requisitos: [uv](https://docs.astral.sh/uv/), Node 20+ e `make`.

```bash
make install   # dependências do backend (uv) e do frontend (npm)
make seed      # aplica as migrations e cria o projeto TCC de exemplo
make dev       # API em http://localhost:8000 e app em http://localhost:5173
```

Docs da API (Swagger): http://localhost:8000/docs

> Alternativa opcional: `docker compose up` (mesmas portas).

## Atalhos

| Tecla | Ação |
| --- | --- |
| `C` | Nova issue |
| `Ctrl+K` | Busca / command palette (issues, telas, ações) |
| `Esc` | Fecha drawer ou modal |
| `Ctrl+Enter` | Cria a issue no modal |

## Comandos

| Comando | O que faz |
| --- | --- |
| `make test` | testes do backend (pytest) |
| `make lint` | ruff + oxlint + prettier (check) |
| `make format` | formata backend e frontend |
| `make migrate` | `alembic upgrade head` |
| `make seed-reset` | apaga e recria o projeto TCC de exemplo |
| `make gen-api` | regenera `frontend/src/api/schema.d.ts` a partir do OpenAPI |
| `make dev-api` / `make dev-web` | sobe só um dos lados |

Depois de mudar schemas/rotas no backend, rode `make gen-api`: os tipos do frontend vêm do OpenAPI
do FastAPI (via `openapi-typescript` + `openapi-fetch`), nada é duplicado à mão.

## Estrutura

```
backend/app/
  core/          config (pydantic-settings), sessão do banco, erros {detail, code}
  models/        Project, Epic, Sprint, Issue, Label, ChecklistItem, ActivityLog
  schemas/       Pydantic v2
  repositories/  consultas e filtros
  services/      regras de negócio: move/reorder, start/close sprint, activity log,
                 burndown, dashboard
  api/v1/routers/
  scripts/       seed, export do OpenAPI
  tests/
frontend/src/
  api/           client tipado, query keys, hooks do TanStack Query
  components/    layout, issue (cards, linhas, drawer, pickers), sprint (modais), charts, ui (shadcn)
  pages/         dashboard, backlog, board, sprints, epics, settings
  hooks/ lib/ providers/
```

## Como algumas coisas funcionam

- **Keys sequenciais** (`TCC-1`, `TCC-2`…): contador por projeto incrementado na mesma transação;
  números nunca são reutilizados.
- **Ordenação por drag-and-drop**: `position` é float; mover calcula o ponto médio entre os
  vizinhos (`POST /issues/{id}/move`), então só a issue movida é atualizada. Se o espaço entre dois
  vizinhos se esgota, apenas aquela seção é renumerada.
- **Uma sprint ativa por projeto**: validado no service e garantido por índice único parcial no banco.
- **Concluir sprint**: concluídas ficam no histórico da sprint; pendentes vão para o backlog ou
  para uma sprint planejada. Os pontos comprometidos/entregues ficam registrados na sprint.
- **Burndown**: reconstruído a partir do `ActivityLog` — parte do estado atual de cada issue e desfaz
  as mudanças posteriores a cada dia (status, sprint, pontos), contando inclusive mudança de escopo.

## Banco de dados

SQLite em `backend/kanbo.db`. Para usar PostgreSQL, crie `backend/.env` com
`DATABASE_URL=postgresql+psycopg://usuario:senha@localhost/kanbo` (e `uv add psycopg[binary]`),
depois `make migrate`.
