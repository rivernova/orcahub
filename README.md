# 🐋 OrcaHub  
### Unified Dashboard for Docker & Kubernetes

OrcaHub is an open‑source control center that unifies **Docker** and **Kubernetes** into a single, modern dashboard.  
It provides a clean interface for inspecting, managing, and understanding your containers, clusters, logs, and resources — all in one place.

This repository is a **monorepo** containing the full OrcaHub application:

- A **Go backend** (API, integrations, orchestration, optional AI adapters)
- A **React frontend** (dashboard UI)
- Tooling to build a **single Docker image** that serves both

AI models (like **Ollama**, **OpenAI**, or **Anthropic**) run **outside** OrcaHub and are accessed via HTTP.

---

## 🧩 Monorepo Structure

```txt
orcahub/
│
├── backend/                                # Go backend (API, Docker/K8s integrations, AI adapters, embedded web)
│   │
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── internal/
│   │   ├── api/                             # HTTP
│   │   │
│   │   ├── domain/                          # Core models + services
│   │   │   └── services/
│   │   │
│   │   ├── adapters/                     # External system adapters
│   │   │   ├── docker/
│   │   │   ├── k8s/
│   │   │
│   │   ├── config/
│   │       └── config.go
│   │
│   ├── go.mod
│   └── go.sum
│
├── frontend/                                # React frontend (dashboard UI)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*                         # or similar bundler config
│
└── README.md                                 # Monorepo documentation

```
---
# 🌟 Features

## 🐳 Docker Management

- List containers, images, volumes, networks
- Start, stop, restart containers
-  Inspect details and view logs

## ☸️ Kubernetes Management

- Connect via local kubeconfig or in‑cluster config
- Explore namespaces, pods, deployments, services, nodes
- View logs, events, and resource details

## 📊 Unified Dashboard

- Real‑time views of Docker and Kubernetes resources
- Log and YAML views
- Clean, modern UI designed for clarity and speed

### 🧠 Optional AI‑Assisted Workflows

(Enabled when an external LLM provider is configured)

- Explain pod/container failures
- Summarize logs and events
- Generate Kubernetes YAML
- Generate Docker/kubectl commands
- Suggest fixes and optimizations

# 🧱 Backend Architecture (Go)

The backend follows a clean, layered architecture for clarity and maintainability:

```txt
backend/internal/
│
├── api/             # HTTP handlers, routing
├── domain/          # Core models + business logic
├── persistence/     # Docker, Kubernetes, AI providers
├── config/          # Environment/config loading
└── web/             # Embedded frontend build (dist/)
```

## Responsibilities

- Expose a REST API consumed by the frontend
- Integrate with Docker Engine API
- Integrate with Kubernetes via client-go
- Optionally integrate with LLM providers (Ollama, OpenAI, Anthropic, custom)
- Serve the compiled frontend for unified releases
- The backend abstracts all external systems (Docker, K8s, AI) behind clear interfaces in the persistence layer.

# 🎨 Frontend Architecture (React)

The frontend is a modern React application Vite‑based that:

- Calls the backend’s /api/... endpoints
- Renders Docker and Kubernetes views
- Provides log/YAML views
- Is compiled into static assets and embedded into the Go backend for production
---
# 🤝 Contributing

Contributions are welcome — code, documentation, ideas, testing.
1. Fork the repo
2. Create a feature branch
3.  Open a pull request

A CONTRIBUTING.md guide will be added as the project matures.
---
# 📄 License

MIT License — free to use, modify, and distribute.