# Deployment Guide - Frontend

Simple deployment guide untuk Airu Portfolio Frontend.

## Prerequisites
- Docker & Docker Compose installed
- Backend already deployed with container name: `airu-portfolio-be`
- Shared Docker network: `airu-network`

---

## Quick Start

### 1. Create Shared Network (one-time)
```bash
docker network create airu-network
```

### 2. Clone & Deploy
```bash
# Clone repo
git clone <repo-url> airu-porto-fe
cd airu-porto-fe

# Start
docker-compose up -d --build
```

### 3. Verify
```bash
docker ps
docker logs airu-portfolio-fe
```

Frontend running at: `http://localhost:3000` (internal)

---

## Environment Variables

Default config in `docker-compose.yml`:
```yaml
environment:
  - NEXT_PUBLIC_API_BASE_URL=http://airu-portfolio-be:8080
```

**Change if needed:**
- For production with domain: `https://api.yourdomain.com`
- For production with IP: `http://YOUR_VM_IP:8080`

---

## Useful Commands

### Update code
```bash
git pull
docker-compose up -d --build
```

### View logs
```bash
docker-compose logs -f
docker-compose logs --tail=100
```

### Restart
```bash
docker-compose restart
```

### Stop
```bash
docker-compose down
```

---

## Network Setup

Frontend connects to backend via Docker network:

```
airu-network (shared)
├── airu-portfolio-fe (this container)
└── airu-portfolio-be (backend container)
```

Frontend calls backend using container name: `http://airu-portfolio-be:8080`

---

## Production Deployment

For production deployment with domain and HTTPS:
1. Setup nginx in backend repo (as gateway)
2. Configure DNS to point to your VM
3. Deploy frontend with production API URL

See backend repo for nginx configuration.

---

## Troubleshooting

### Can't connect to backend
```bash
# Check network
docker network inspect airu-network

# Test from container
docker exec -it airu-portfolio-fe sh
wget -qO- http://airu-portfolio-be:8080/health
```

### Port conflicts
If port 3000 already used, change in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Host:Container
```

---

## Architecture

```
┌─────────────────────────────────┐
│      airu-network (Docker)      │
│                                 │
│  ┌──────────────────┐           │
│  │   Frontend       │           │
│  │   :3000          │───┐       │
│  └──────────────────┘   │       │
│                         │       │
│                         ▼       │
│                   ┌──────────┐  │
│                   │ Backend  │  │
│                   │  :8080   │  │
│                   └──────────┘  │
│                                 │
└─────────────────────────────────┘
```

External routing (nginx, SSL, etc) handled by backend infrastructure.

---

That's it! Frontend is just a Docker container that talks to backend via Docker network. Simple! 🎉
