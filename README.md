# OrcaHub
### The AI-powered control plane for Docker & Kubernetes.

<p align="center">
  <img src="https://raw.githubusercontent.com/rivernova/orcahub/main/web/public/favicon.svg" width="150" />
</p>

# About

## Unified Dashboard for Docker & Kubernetes

OrcaHub is an open-source control center that unifies **Docker** and **Kubernetes** into a single, modern dashboard. It provides a clean interface for inspecting, managing, and understanding your containers, clusters, logs, and resources — all from one place.

This repository is a **monorepo** containing the full OrcaHub application:

- A **Go backend** — REST API, Docker & Kubernetes integrations
- A **React frontend** — dashboard UI built with Vite, TypeScript, and shadcn/ui
- Tooling to produce a **single portable binary** (or Docker image) that serves both

---

## 🌟 Features

### 🐳 Docker Management

- List, inspect, and filter containers, images, volumes, and networks
- Start, stop, restart, and delete containers
- View real-time logs and run exec commands (`docker exec -it` style terminal)
- Pull and manage images; prune unused resources
- Manage port bindings, mounts, environment variables, and restart policies

### ☸️ Kubernetes Management *(coming soon)*

- Connect via local kubeconfig or in-cluster config
- Explore namespaces, pods, deployments, services, and nodes
- View logs, events, and resource details

### 📊 Dashboard

- Real-time resource metrics (CPU, memory, network I/O) with live charts
- Per-container stats table
- Environment switcher — toggle between Docker and Kubernetes views
- Docker Compose stack management

### 🧠 AI Assistant *(optional)* (on progress)

When an external LLM provider is configured (Ollama, OpenAI, Anthropic):

- Ask questions about your infrastructure in natural language
- Summarize logs and diagnose container failures
- Suggest fixes and generate Docker commands

### Backend import graph (no cycles)

```
model  ←  adapter  ←  domain  ←  api/handler
  ↑                                   ↑
  └──────────── api/mappers ───────────┘
```

---

## 🚀 Running locally

### Backend only

```bash
go run cmd/server/main.go
```

The API will be available at `http://localhost:9876`.

### Frontend only (with hot reload)

```bash
cd web/frontend
pnpm install
pnpm dev
```

Vite proxies `/api` requests to the Go backend at `:9876`.

### Full stack (production build)

```bash
make build
./bin/orcahub
```

Open `http://localhost:9876` — the Go binary serves both the API and the frontend.

---

## 🐳 Docker

Build and run as a single self-contained image:

```bash
make docker
docker run -p 9876:9876 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  orcahub:latest
```

The Docker socket mount is required so OrcaHub can communicate with the Docker daemon on the host.

---

## ⚙️ Environment variables

| Variable | Default | Description |
|---|---|---|
| `ORCAHUB_PORT` | `9876` | Port the server listens on |

The server reads a `.env` file automatically on startup via `godotenv`. In Docker, variables are injected directly into the container environment.

---

## 🧪 Testing

Tests live alongside the code they cover, inside each package directory.

### Unit tests

No external dependencies required — mocks are used for all service and adapter interfaces.

```bash
# Run all unit tests
go test ./...

# With verbose output
go test -v ./...

# For a specific resource
go test ./internal/docker/containers/...
go test ./internal/docker/images/...
go test ./internal/docker/volumes/...
go test ./internal/docker/networks/...
```

### Integration tests

Integration tests run against a live Docker daemon and are gated behind the `integration` build tag so they never run accidentally in CI.

**Requirements:** Docker must be running locally.

```bash
# Run all integration tests
go test -tags integration ./...

# For a specific resource
go test -tags integration ./internal/docker/containers/adapter/...
go test -tags integration ./internal/docker/volumes/adapter/...
```

Integration tests create real Docker resources (containers, volumes, networks) and clean them up automatically after each test via `t.Cleanup()`, even on failure.