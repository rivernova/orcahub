.PHONY: dev build docker

# Dev
dev:
	@echo "→ Starting Go backend on :9876"
	go run ./cmd/server &
	@echo "→ Starting Vite dev server on :3000"
	cd web && pnpm dev

# Prod
build:
	@echo "→ Building frontend..."
	cd web && pnpm install && pnpm build
	@echo "→ Building Go binary..."
	go build -ldflags="-s -w" -o bin/orcahub ./cmd/server
	@echo "✓ Binary ready: bin/orcahub"

# Docker
docker:
	docker build -t orcahub:latest .