# Kanbo

Gerenciador Scrum pessoal (backlog, sprints, board Kanban, burndown) para organizar o TCC.

**Stack:** FastAPI · SQLAlchemy 2 · Alembic · SQLite — React · TypeScript · Vite · Tailwind · shadcn/ui

## Rodando

Pré-requisitos: [uv](https://docs.astral.sh/uv/), Node 20+ e `make`.

```bash
make install   # dependências do backend e frontend
make seed      # aplica migrations e cria o projeto TCC de exemplo
make dev       # API em :8000 e app em :5173
```

API docs: http://localhost:8000/docs

## Comandos

| Comando | O que faz |
| --- | --- |
| `make test` | testes do backend (pytest) |
| `make lint` / `make format` | ruff (+ eslint no front) |
| `make migrate` | `alembic upgrade head` |
| `make seed-reset` | recria o projeto TCC de exemplo |
| `make gen-api` | regenera os tipos TS a partir do OpenAPI |

Para usar PostgreSQL, defina `DATABASE_URL` em `backend/.env`.
