.PHONY: install dev dev-api dev-web test lint format migrate seed seed-reset gen-api

BACKEND := cd backend &&
FRONTEND := cd frontend &&

install: ## instala dependências do backend e do frontend
	$(BACKEND) uv sync
	@if [ -d frontend ]; then $(FRONTEND) npm install; fi

dev: ## sobe API (:8000) e frontend (:5173) juntos; Ctrl+C encerra os dois
	@trap 'kill 0' INT TERM EXIT; \
	$(MAKE) --no-print-directory dev-api & \
	$(MAKE) --no-print-directory dev-web & \
	wait

dev-api:
	$(BACKEND) uv run fastapi dev --port 8000

dev-web:
	$(FRONTEND) npm run dev

test:
	$(BACKEND) uv run pytest -q

lint:
	$(BACKEND) uv run ruff check . && uv run ruff format --check .
	@if [ -d frontend/node_modules ]; then $(FRONTEND) npm run lint; fi

format:
	$(BACKEND) uv run ruff check --fix . && uv run ruff format .
	@if [ -d frontend/node_modules ]; then $(FRONTEND) npm run format; fi

migrate:
	$(BACKEND) uv run alembic upgrade head

seed: migrate
	$(BACKEND) uv run python -m app.scripts.seed

seed-reset: migrate
	$(BACKEND) uv run python -m app.scripts.seed --reset

gen-api: ## regenera os tipos TS a partir do OpenAPI do FastAPI
	$(FRONTEND) npm run gen:api
