.PHONY: dev test build up down logs migrate prod-up prod-logs

dev:
	docker compose up --build

test:
	cd backend && uv run pytest
	cd frontend && npm run build

build:
	docker compose build

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

migrate:
	docker compose run --rm backend uv run alembic upgrade head

prod-up:
	docker compose -f compose.yaml -f compose.host.yaml up -d --no-build

prod-logs:
	docker compose -f compose.yaml -f compose.host.yaml logs -f --tail=200
