.PHONY: dev build docker

# Dev
dev:
    @echo "→ Starting Go backend on :8080"
    go run ./cmd/orcahub &
    @echo "→ Starting Vite dev server on :3000"
    cd web/frontend && pnpm dev

# Prod
build:
    @echo "→ Building frontend..."
    cd web/frontend && pnpm install && pnpm build
    @echo "→ Building Go binary..."
    go build -ldflags="-s -w" -o bin/orcahub ./cmd/orcahub
    @echo "✓ Binary ready: bin/orcahub"

# Docker
docker:
    docker build -t orcahub:latest .