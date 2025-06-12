# 🚀 Setup Guide

## Prerequisites

```bash
# Required
node >= 18.0.0
docker & docker-compose
git
```

---

## Quick Start

```bash
# 1. Clone & setup
git clone https://github.com/SirAlabar/ft_transcendence.git
cd ft_transcendence
make setup

# 2. Start development
make dev

# 3. Access development
open http://localhost:5173
```

---

## Environment Setup

Create `.env` in project root:

```bash
# Database
DATABASE_URL=./data/transcendence.db

# JWT
JWT_SECRET=your-super-secret-jwt-key-256-bits-long
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://starcendence.dev/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# Development
NODE_ENV=development
DOMAIN=starcendence.dev
```

---

## Development Commands

```bash
# Development environment
make dev               # Start dev servers
npm run dev           # Alternative

# Production deployment
make deploy           # Deploy to starcendence.dev

# Testing
make test             # All tests
make test-unit        # Unit only
make test-e2e         # E2E only

# Individual services (development)
cd services/auth && npm run dev
cd services/game && npm run dev
cd frontend && npm run dev

# Database
make migrate          # Run migrations
make seed             # Seed test data
```

---

## Verify Installation

✅ **Check development environment:**
```bash
# Should show 5 running containers
docker-compose ps

# Test local development
curl http://localhost:3001/auth/health
curl http://localhost:3002/games/health
```

✅ **Access points:**
- **Production**: `https://starcendence.dev`
- **Development**: `http://localhost:5173`
- **Monitoring**: `https://starcendence.dev/grafana`

---

## Troubleshooting

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :80 -i :3000 -i :3001 -i :6379
# Kill processes or change ports in docker-compose.yml
```

**Docker issues:**
```bash
# Reset everything
make clean
docker system prune -f
make setup
```

**Database issues:**
```bash
# Reset database
rm -f ./data/*.db
make migrate
make seed
```

**Google OAuth setup:**
1. Go to [Google Console](https://console.developers.google.com)
2. Create project → Enable OAuth API
3. Add redirect: `https://starcendence.dev/auth/google/callback`
4. Copy client ID/secret to `.env`

---

## File Structure

```
ft_transcendence/
├── services/          # 5 microservices (ports 3001-3005)
├── frontend/          # Vite dev server (port 5173)
├── infrastructure/    # Redis, Database, Monitoring
├── tests/            # All tests centralized
└── shared/           # Common types & utilities
```

**Live at:** [starcendence.dev](https://starcendence.dev) 🚀