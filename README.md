# 🐋 OrcaHub
### Unified Dashboard for Docker & Kubernetes

OrcaHub is an open-source control center that unifies **Docker** and **Kubernetes** into a single, modern dashboard.
It provides a clean interface for inspecting, managing, and understanding your containers, clusters, logs, and resources — all in one place.

This repository is a **monorepo** containing the full OrcaHub application:

- A **Go backend** (REST API, Docker & Kubernetes integrations, optional AI adapters)
- A **React frontend** (dashboard UI)
- Tooling to build a **single Docker image** that serves both

AI models (like **Ollama**, **OpenAI**, or **Anthropic**) run **outside** OrcaHub and are accessed via HTTP.

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

### Import graph (no cycles)

```
model  ←  adapter  ←  domain  ←  api/handler
  ↑                                   ↑
  └──────────── api/mappers ───────────┘
```

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