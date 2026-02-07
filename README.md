# 🐋 OrcaHub  
### Unifie Dashboard for Docker & Kubernetes

OrcaHub is an open‑source, AI‑assisted control center for managing containers and clusters.  
It unifies **Docker**, **Kubernetes**, and **local or remote LLMs** (like Ollama) into one intelligent dashboard.

This repository serves as the **main entry point** for the OrcaHub ecosystem.  
It provides documentation, architecture, roadmap, and links to the backend and frontend services.

---

## 🧩 OrcaHub Architecture

OrcaHub is composed of three modular components:

```txt
+------------------+
|    OrcaHub App   |
+------------------+
|
|---> orcahub-frontend (React UI)
|
|---> orcahub-backend (Go API)
|
|---> Ollama / OpenAI / Anthropic (LLM provider)

```

### **orcahub-backend**
- Written in Go  
- Integrates with Docker Engine API  
- Integrates with Kubernetes via `client-go`  
- Provides REST + WebSocket API  
- Hosts the AI adapter layer (Ollama, OpenAI, etc.)  
- Optionally serves the frontend in production builds  

Repo: https://github.com/rivernova/orcahub-backend

---

### **LLM Provider (Ollama by default)**

OrcaHub integrates with local or remote LLMs through the backend’s AI adapter layer.

Supported providers:
- **Ollama** (local, recommended)
- **OpenAI**
- **Anthropic**
- Custom endpoints

The LLM is not embedded inside the app — instead, the backend connects to it, giving users flexibility and keeping binaries lightweight.

---

## 🌟 Features

### 🧠 AI‑Powered Assistance
- Explain pod failures and container crashes  
- Summarize logs and events  
- Generate Kubernetes YAML  
- Generate Docker/kubectl commands  
- Suggest fixes and optimizations  
- Natural‑language interface for complex operations  

### 🐳 Docker Management
- View containers, images, volumes, networks  
- Start, stop, restart containers  
- Inspect details and view logs  
- Resource usage and live stats  

### ☸️ Kubernetes Management
- Connect using your local `kubeconfig`  
- Explore namespaces, pods, deployments, services, nodes  
- View logs, events, and resource metrics  
- Port‑forwarding and exec into pods  
- Apply YAML manifests directly from the UI  

### 📊 Unified Dashboard
- Real‑time metrics  
- Log streaming  
- YAML editor  
- Terminal panel  
- Multi‑cluster support (planned)  

---

## 🐳 Combined Docker Image
OrcaHub is distributed as a **single Docker image** that contains both the Go backend API and the compiled React frontend. This makes deployment simple: one container, one port, one 

## 📄 License

MIT License — free to use, modify, and distribute.



