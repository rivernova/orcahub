# OrcaHub Frontend

Production-grade React + TypeScript + Vite + shadcn/ui container management dashboard.

## Tech Stack

- **React 18** + **TypeScript** (strict)
- **Vite 6** — build tool
- **pnpm** — package manager
- **shadcn/ui** — component primitives (Radix UI)
- **Tailwind CSS** — styling with OrcaHub design tokens
- **Lucide React** — icons
- **Outfit** + **JetBrains Mono** — typography

## Quick Start

```bash
# Install deps
pnpm install

# Dev server (proxies /api → localhost:8080)
pnpm dev

# Production build
pnpm build
```

## Features

- **Docker Overview** — stats, running containers at a glance
- **Containers** — full table with CPU/mem, start/stop/restart/delete
- **Exec Terminal** — `docker exec -it` style shell, with command history and mock simulation
- **Logs Viewer** — streaming-style log display with tail selection
- **Images** — pull, delete, prune, size visualization
- **Volumes** — create, delete, prune with usage info
- **Networks** — create, delete, driver display
- **Metrics** — live-updating SVG chart + per-container stats table
- **Compose Stacks** — accordion view with stack management
- **Settings** — theme toggle, API config, system prune
- **Kubernetes** — placeholder pages (shown when k8s detected)
- **AI Panel** — infrastructure assistant sidebar
- **Mock fallback** — works offline with realistic demo data

## Project Structure

```
src/
├── api/          # API client + mock data
├── components/
│   ├── ui/       # shadcn/ui primitives (Button, Dialog, Tabs, etc.)
│   └── orcahub/  # App-level components (Header, Sidebar, StatCard, etc.)
├── context/      # AppContext + useReducer state
├── lib/          # cn(), formatBytes(), etc.
├── pages/        # One file per page
└── types/        # TypeScript types
```

## Backend Integration

The app proxies `/api/*` to `localhost:8080` in dev.
When the backend is unavailable, it falls back to mock data automatically.

### Expected endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/containers` | List containers |
| GET | `/api/v1/containers/:id` | Inspect container |
| POST | `/api/v1/containers/:id/start` | Start |
| POST | `/api/v1/containers/:id/stop` | Stop |
| POST | `/api/v1/containers/:id/restart` | Restart |
| DELETE | `/api/v1/containers/:id` | Delete |
| GET | `/api/v1/containers/:id/logs` | Logs |
| GET | `/api/v1/containers/:id/stats` | Stats |
| POST | `/api/v1/containers/:id/exec` | Exec command |
| GET | `/api/v1/images` | List images |
| POST | `/api/v1/images/pull` | Pull image |
| POST | `/api/v1/images/prune` | Prune unused |
| GET | `/api/v1/volumes` | List volumes |
| POST | `/api/v1/volumes` | Create volume |
| POST | `/api/v1/volumes/prune` | Prune unused |
| GET | `/api/v1/networks` | List networks |
| POST | `/api/v1/networks` | Create network |
| GET | `/api/v1/system/detect` | Detect Docker/K8s |
| POST | `/api/v1/system/prune` | System prune |
