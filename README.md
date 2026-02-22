# 🐋 OrcaHub
### Unified Dashboard for Docker & Kubernetes

OrcaHub is an open-source control center that unifies **Docker** and **Kubernetes** into a single, modern dashboard.
It provides a clean interface for inspecting, managing, and understanding your containers, clusters, logs, and resources — all in one place.

This repository is a **monorepo** containing the full OrcaHub application:

- A **Go backend** (REST API, Docker & Kubernetes integrations, optional AI adapters)
- A **React frontend** (dashboard UI)
- Tooling to build a **single Docker image** that serves both

AI models (like **Ollama**, **OpenAI**, or **Anthropic**) run **outside** OrcaHub and are accessed via HTTP.

---

## 🧩 Monorepo Structure

```txt
orcahub/
│
├── cmd/
│   └── server/
│       └── main.go                         # Entry point — wires adapters, services, handlers, router
│
├── internal/
│   └── docker/
│   │   ├── containers/
│   │   │   ├── model/        model.go      # Shared types (Container, Port, Mount, Stats...)
│   │   │   ├── adapter/      adapter.go    # ContainerAdapter interface
│   │   │   │                 adapter_impl.go  # DockerAdapter (Docker SDK v28)
│   │   │   ├── domain/       service.go    # ContainerService interface
│   │   │   │                 service_impl.go  # Business logic
│   │   │   └── api/          handler.go    # HTTP handlers
│   │   │                     requests.go
│   │   │                     responses.go
│   │   │       ├── mappers/  mapper.go     # model ↔ API DTO conversion
│   │   │       └── router/   router.go     # Route registration
│   │   │
│   │   ├── images/           (same structure as containers/)
│   │   ├── volumes/          (same structure as containers/)
│   │   └── networks/         (same structure as containers/)
│   │
│   ├── k8s/                                # Kubernetes resources (coming soon)
│   └── router/
│       └── router.go                       # Main router — assembles all resource routes
│
├── frontend/                               # React frontend (dashboard UI)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── .env                                    # Local environment variables (not committed)
├── go.mod
├── go.sum
└── README.md
```

---

## 🌟 Features

### 🐳 Docker Management
- List containers, images, volumes, networks
- Start, stop, restart, and delete containers
- Inspect details, view logs, run exec commands
- Pull and build images
- Manage port bindings, mounts, environment variables

### ☸️ Kubernetes Management *(coming soon)*
- Connect via local kubeconfig or in-cluster config
- Explore namespaces, pods, deployments, services, nodes
- View logs, events, and resource details

### 📊 Unified Dashboard
- Real-time views of Docker and Kubernetes resources
- Log and YAML views
- Clean, modern UI designed for clarity and speed

### 🧠 Optional AI-Assisted Workflows
*(Enabled when an external LLM provider is configured)*
- Explain pod/container failures
- Summarize logs and events
- Generate Kubernetes YAML
- Generate Docker/kubectl commands
- Suggest fixes and optimizations

---

## 🧱 Backend Architecture (Go)

The backend follows a **clean layered architecture** designed to avoid circular imports and keep each layer's responsibility clear.

```txt
internal/docker/<resource>/
│
├── model/          Shared pure types — imported by all layers, imports nothing internal
├── adapter/        Interface + Docker SDK implementation — imports model
├── domain/         Service interface + business logic — imports model + adapter
└── api/
    ├── handler     HTTP handlers — imports domain + model
    ├── mappers/    DTO conversion — imports api + model
    └── router/     Route registration
```

### Import graph (no cycles)

```
model  ←  adapter  ←  domain  ←  api/handler
  ↑                                   ↑
  └──────────── api/mappers ───────────┘
```

### Layer responsibilities

| Layer | Responsibility |
|---|---|
| `model` | Plain Go structs — no business logic, no external imports |
| `adapter` | Talks to Docker SDK, translates SDK types → `model` types |
| `domain` | Service interfaces and implementations, orchestrates adapter calls |
| `api/handler` | Parses HTTP requests, calls service, returns JSON |
| `api/mappers` | Converts `model` structs ↔ API request/response DTOs |
| `api/router` | Registers routes on a Gin `RouterGroup` |

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `ORCAHUB_PORT` | `9876` | Port the server listens on |

The server reads `.env` automatically on startup via `godotenv`. In Docker, variables are injected directly into the container environment.

---

## 🎨 Frontend Architecture (React)

The frontend is a modern Vite-based React application that:

- Calls the backend's `/api/...` endpoints
- Renders Docker and Kubernetes resource views
- Provides log and YAML views
- Is compiled into static assets and embedded into the Go binary for production releases

---

## 🚀 Running locally

```bash
# Start the backend
go run cmd/server/main.go

# Start the frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:9876`.

---

## 🤝 Contributing

Contributions are welcome — code, documentation, ideas, testing.

1. Fork the repo
2. Create a feature branch
3. Open a pull request

A `CONTRIBUTING.md` guide will be added as the project matures.

---

## 📄 License

MIT License — free to use, modify, and distribute.