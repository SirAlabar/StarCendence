# 🏓 ft_transcendence

**Live:** [starcendence.dev](https://starcendence.dev)

## 🎯 **Project Overview**

**ft_transcendence** is a comprehensive web-based gaming platform featuring 3D Pong and Star Wars Pod Racing games with real-time multiplayer capabilities, live chat, tournaments, AI opponents, and advanced user management.

**Target Score**: 165 points (10 major modules + 7 minor modules)  
**Architecture**: Microservices with TypeScript, Fastify, Babylon.js, SQLite, Redis  
**Total Files**: ~702 files across 6 main sections  


---

## 🎮 **Features (Modules)**

### **Major Modules (11 modules)**
- **⚡ Fastify Backend** - High-performance server framework
- **🏗️ Backend as Microservices** - Distributed architecture
- **👤 Standard User Management** - Auth + profiles + friends
- **🔑 Google Sign-in** - OAuth integration
- **🌐 Remote Players** - WebSocket multiplayer
- **👥 Multiple Players** - 3+ players support
- **🏎️ Star Wars Racer + Matchmaking** - Second game with pairing
- **💬 Live Chat** - Real-time messaging
- **🤖 AI Opponent** - Intelligent computer players
- **🔐 2FA + JWT** - Advanced security
- **🎆 Advanced 3D Babylon.js** - 3D graphics engine

### **Minor Modules (7 modules)**
- **🎨 Tailwind CSS** - Styling framework
- **💾 SQLite Database** - Data persistence
- **⚙️ Game Customization** - Power-ups and variations
- **📊 Stats Dashboards** - User analytics
- **📱 All Devices Support** - Responsive design
- **🌍 Browser Compatibility** - Firefox + Chrome
- **📈 Prometheus/Grafana** - System monitoring

---

## 🏗️ **System Architecture**

```
Frontend (TypeScript + Tailwind + Babylon.js)
    ↓
API Gateway (Nginx)
    ↓
┌─────────────────────────────────────────────────┐
│              Microservices                      │
├─────────┬─────────┬─────────┬─────────┬────────┤
│   Auth  │  Game   │  Chat   │  User   │WebSocket│
│  :3001  │ :3002   │ :3003   │ :3004   │ :3005  │
└─────────┴─────────┴─────────┴─────────┴────────┘
    ↓               ↓               ↓
┌─────────────────────────────────────────────────┐
│          Infrastructure Services                │
├─────────────────┬───────────────────────────────┤
│     Redis       │          SQLite               │
│ (Cache+PubSub)  │        (Persistent)           │
│     :6379       │           File                │
└─────────────────┴───────────────────────────────┘
```

---

## 📁 **Project Structure (702 files)**

### **1. 🎨 Frontend Layer** - 125 files
```
frontend/                       # TypeScript + Vite + Babylon.js
├── src/
│   ├── components/             # UI Components
│   │   ├── auth/               # Login, Register, 2FA, Google OAuth
│   │   ├── game/               # Game Canvas, Controls, HUD, Settings
│   │   ├── chat/               # Chat Window, Messages, User List
│   │   ├── dashboard/          # Stats, Charts, Leaderboard
│   │   ├── tournament/         # Bracket, Lobby, Creation
│   │   └── profile/            # User Profile, Settings, Friends
│   ├── game/                   # 3D Game Engine
│   │   ├── engines/
│   │   │   ├── pong/           # 3D Pong with 2D camera view
│   │   │   └── racer/          # Star Wars Pod Racing
│   │   ├── entities/           # Player, Ball, Paddle, PowerUps
│   │   ├── systems/            # Physics, Render, Input, Audio
│   │   ├── ai/                 # AI Opponent logic
│   │   └── managers/           # Scene, Camera, Assets, Effects
│   ├── services/               # API Clients
│   │   ├── authService.ts      # Authentication API
│   │   ├── gameService.ts      # Game API
│   │   ├── chatService.ts      # Chat API
│   │   ├── userService.ts      # User API
│   │   └── websocketService.ts # Real-time communication
│   ├── stores/                 # State Management
│   │   ├── authStore.ts        # Auth state
│   │   ├── gameStore.ts        # Game state
│   │   └── chatStore.ts        # Chat state
│   └── utils/                  # Helper Functions
└── public/                     # Static Assets (3D models, sounds, images)
```

### **2. ⚡ Microservices Layer** - 190 files
```
services/                       # 5 Independent Microservices
├── auth/                       # Authentication Service
│   ├── src/
│   │   ├── controllers/        # Auth endpoints (login, register, 2FA)
│   │   ├── middleware/         # JWT validation, rate limiting
│   │   ├── services/           # Auth business logic
│   │   ├── repositories/       # User data access
│   │   ├── oauth/              # Google OAuth integration
│   │   ├── twofa/              # 2FA implementation (TOTP, QR codes)
│   │   └── utils/              # Password hashing, tokens
├── game/                       # Game Logic Service
│   ├── src/
│   │   ├── controllers/        # Game endpoints (create, join, move)
│   │   ├── engines/            # Game engines (Pong, Racer)
│   │   ├── ai/                 # AI opponent system
│   │   ├── physics/            # Game physics calculations
│   │   ├── tournament/         # Tournament system
│   │   ├── matchmaking/        # Player pairing logic
│   │   ├── customization/      # Power-ups, game variations
│   │   └── repositories/       # Game data access
├── chat/                       # Live Chat Service
│   ├── src/
│   │   ├── controllers/        # Chat endpoints
│   │   ├── rooms/              # Chat rooms management
│   │   ├── messaging/          # Real-time messaging logic
│   │   ├── history/            # Message persistence
│   │   ├── moderation/         # Chat moderation
│   │   └── repositories/       # Chat data access
├── user/                       # User Management Service
│   ├── src/
│   │   ├── controllers/        # User endpoints (profiles, friends)
│   │   ├── profiles/           # User profiles + avatars
│   │   ├── friends/            # Friends system
│   │   ├── stats/              # Game statistics
│   │   ├── history/            # Match history
│   │   ├── dashboard/          # Stats dashboard logic
│   │   └── repositories/       # User data access
└── websocket/                  # Real-time Communication Service
    ├── src/
    │   ├── connections/        # Connection management
    │   ├── events/             # Real-time events handling
    │   ├── rooms/              # Game rooms + chat rooms
    │   ├── broadcasting/       # Message broadcasting
    │   └── middleware/         # WebSocket authentication
```

### **3. 🧪 Testing Layer** - 285 files
```
tests/                          # Centralized Testing
├── unit/                       # Unit Tests (~200 files)
│   ├── shared/                 # Shared library tests
│   ├── services/               # All microservice tests
│   └── frontend/               # Frontend component tests
├── integration/                # Integration Tests (~25 files)
│   ├── api/                    # API integration tests
│   ├── database/               # Database integration tests
│   ├── websocket/              # WebSocket integration tests
│   └── services/               # Cross-service integration
├── e2e/                        # End-to-End Tests (~30 files)
│   ├── auth/                   # Authentication E2E tests
│   ├── game/                   # Game E2E tests
│   ├── chat/                   # Chat E2E tests
│   └── scenarios/              # Complex user scenarios
└── utils/                      # Test Utilities (~30 files)
    ├── mocks/                  # Mock implementations
    ├── fixtures/               # Test data fixtures
    ├── helpers/                # Test helper functions
    └── factories/              # Data factories
```

### **4. 📚 Shared Libraries** - 32 files
```
shared/                         # Common Code
├── types/                      # TypeScript interfaces
│   ├── auth.types.ts          # Auth-related types
│   ├── game.types.ts          # Game-related types
│   ├── chat.types.ts          # Chat-related types
│   └── user.types.ts          # User-related types
├── events/                     # Event definitions
│   ├── gameEvents.ts          # Game event definitions
│   ├── chatEvents.ts          # Chat event definitions
│   └── userEvents.ts          # User event definitions
├── utils/                      # Common utilities
│   ├── validation.ts          # Input validation schemas
│   ├── formatters.ts          # Data formatting utilities
│   ├── cryptoUtils.ts         # Cryptographic utilities
│   └── constants.ts           # Application constants
└── config/                     # Shared configuration
    ├── database.ts            # Database configuration
    ├── redis.ts               # Redis configuration
    └── security.ts            # Security configuration
```

### **5. 🔧 Infrastructure Layer** - 22 files
```
infrastructure/                 # Infrastructure Services
├── redis/                      # Redis Cache + PubSub
│   ├── redis.conf             # Redis configuration
│   └── scripts/               # Redis setup scripts
├── database/                   # SQLite Database
│   ├── migrations/            # Database migrations (7 files)
│   │   ├── 001_initial_schema.sql    # Users, auth tables
│   │   ├── 002_add_tournaments.sql   # Tournament system
│   │   ├── 003_add_chat.sql          # Chat messages, rooms
│   │   ├── 004_add_friends.sql       # Friends, blocking
│   │   ├── 005_add_stats.sql         # Game statistics
│   │   ├── 006_add_achievements.sql  # Achievement system
│   │   └── 007_add_indexes.sql       # Performance optimization
│   ├── seeds/                 # Initial/test data
│   ├── setup.sql              # Complete schema
│   └── triggers.sql           # Database triggers
└── monitoring/                 # Prometheus + Grafana
    ├── prometheus/
    │   ├── prometheus.yml     # Metrics collection config
    │   └── alerts.yml         # Alert rules
    └── grafana/
        └── dashboards/        # Monitoring dashboards
```

### **6. 🛠️ Development Tools** - 40 files
```
├── scripts/                    # Development scripts
│   ├── setup.sh              # Project setup
│   ├── test.sh               # All tests
│   ├── test-unit.sh          # Unit tests only
│   ├── test-integration.sh   # Integration tests only
│   ├── test-e2e.sh           # E2E tests only
│   └── migrate.sh            # Database migrations
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── guides/                # Development guides
│   └── diagrams/              # Architecture diagrams
├── .github/                    # CI/CD
│   └── workflows/             # GitHub Actions
├── .vscode/                    # VS Code configuration
│   ├── settings.json         # Workspace settings
│   ├── launch.json           # Debug configurations
│   └── snippets/             # Code snippets
└── config/                     # Global configuration
    ├── jest.config.js        # Testing framework
    ├── eslint.config.js      # Code linting
    └── prettier.config.js    # Code formatting
```

---

## 🚀 **Technology Stack**

### **Frontend Technologies**
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling framework
- **Babylon.js**: 3D graphics engine for games

### **Backend Technologies**
- **Fastify**: High-performance Node.js web framework
- **SQLite**: Lightweight, reliable database
- **Redis**: In-memory cache and message broker
- **JWT**: Secure authentication tokens

### **DevOps & Quality**
- **Docker**: Containerized development and deployment
- **Nginx**: Reverse proxy and SSL termination
- **Prometheus + Grafana**: Monitoring and observability
- **Jest + Playwright**: Comprehensive testing suite
- **ESLint + Prettier**: Code quality and formatting

---

## 📊 **Microservices Communication**

### **Service Ports & Responsibilities**
```
nginx:80/443        → API Gateway + SSL termination
frontend:3000       → Vite dev server / Static files
auth-service:3001   → JWT, 2FA, Google OAuth, Sessions
game-service:3002   → Game engines, AI, Physics, Tournaments  
chat-service:3003   → Real-time messaging, Chat rooms
user-service:3004   → Profiles, Friends, Stats, Avatars
websocket-service:3005 → Real-time events, Broadcasting
redis:6379          → Cache + PubSub messaging
sqlite:file         → Persistent data storage
prometheus:9090     → Metrics collection
grafana:3010        → Monitoring dashboards
```

### **API Gateway Routes (Nginx)**
```
/auth/*     → auth-service:3001
/games/*    → game-service:3002
/chat/*     → chat-service:3003
/users/*    → user-service:3004
/ws         → websocket-service:3005
/metrics    → prometheus:9090
/grafana/*  → grafana:3010
```

### **Event-Driven Communication (Redis PubSub)**
```
Events Published:
- user.registered    → auth-service → user-service
- user.login         → auth-service → websocket-service
- game.created       → game-service → chat-service, websocket-service
- game.ended         → game-service → user-service (update stats)
- message.sent       → chat-service → websocket-service
- player.joined      → game-service → websocket-service
- tournament.started → game-service → chat-service, websocket-service
```

---

## ⚡ **Performance & Security Architecture**

### **Latency Optimization Strategy**
```
HIGH LATENCY (Login/Setup - 80-200ms):
Frontend → game-service → auth-service (validate token)
                       → user-service (get profile)  
                       → chat-service (join channel)

LOW LATENCY (Gameplay - 6-20ms):
Frontend → websocket → game-service (cached validation)
                    → broadcast (local state)
```

### **Input Validation & Anti-Cheat**
```
Client Input → Server Validation Pipeline:

1. Basic Validation (1ms)     → Speed limits, boundaries
2. Physics Validation (5ms)   → Movement possibilities  
3. Game Logic Validation (10ms) → Rule compliance
4. State Update              → Server-authoritative
5. Broadcast to Players      → Validated state only

Security Features:
✅ Server-authoritative game state
✅ Input rate limiting (anti-spam)
✅ Speed hack detection
✅ Boundary violation prevention
✅ Lag compensation algorithms
```

### **Caching Strategy for Real-time Performance**
```
Game Session Cache (loaded once):
- Player profiles & permissions
- Game configuration & rules
- Friend lists & relationships
- Chat room memberships

Real-time Validation (< 1ms):
- Paddle movement bounds
- Ball physics calculations
- Collision detection
- Score validation

Database Queries (only when needed):
- Match history updates
- Statistics calculations
- Tournament progression
```

---

## 🚀 **Quick Start**

### **Development Setup**
```bash
# Clone and start all microservices
git clone https://github.com/SirAlabar/ft_transcendence.git
cd ft_transcendence

# Setup project (install dependencies, setup database)
make setup

# Start development environment
make start

# Access application
open https://localhost
```

### **Testing Commands**
```bash
# Run all tests
make test

# Run specific test types
make test-unit              # Unit tests only
make test-integration       # Integration tests only
make test-e2e              # E2E tests only

# Test specific components
npm run test:shared         # Shared library tests
npm run test:services       # All services tests
npm run test:frontend       # Frontend tests
```

---

## 🎮 **Games & Features**

### **3D Pong (Babylon.js)**
- Server-authoritative physics (paddle movement, ball collision)
- Real-time multiplayer with lag compensation
- AI opponents with adaptive difficulty
- Tournament system with bracket management
- Ultra-low latency validation (< 1ms per input)

### **Star Wars Racer**
- Complex physics simulation (vehicle dynamics)
- Track boundary enforcement
- Power-ups system with server validation
- Multiplayer racing with position synchronization
- Advanced collision detection (5-10ms validation)

### **Real-time Architecture**
- WebSocket connections for 60fps gameplay
- Redis PubSub for event broadcasting  
- Cached player data for instant validation
- Server-side anti-cheat protection
- Cross-service communication optimized for gaming

### **Advanced Features**
- **Auth**: JWT + 2FA + Google OAuth + Session management
- **Live Chat**: Real-time messaging, Game invitations, User presence  
- **Monitoring**: Prometheus metrics + Grafana dashboards + Performance tracking

---

## 🛠️ **Microservices Benefits in Gaming**

```
✅ Independent Scaling:
   - Game service: CPU-intensive (3D physics)
   - Chat service: I/O-intensive (messaging)
   - Auth service: Security-focused (encryption)

✅ Fault Isolation:
   - If chat crashes → games continue
   - If auth is slow → games use cached tokens
   - Database separation prevents cascade failures

✅ Development Efficiency:
   - Teams work independently on services
   - Deploy services without downtime
   - Technology flexibility per service

✅ Gaming-Specific Optimizations:
   - Game service: Optimized for low-latency
   - Chat service: Optimized for high-throughput
   - User service: Optimized for complex queries
```

---

## 📊 **Project Statistics**

```
File Distribution:
├── Frontend:        125 files (18%)
├── Services:        190 files (27%)
├── Tests:          285 files (41%)
├── Infrastructure:   22 files (3%)
├── Shared:          32 files (5%)
├── Tools:           40 files (6%)
└── Root:             8 files (1%)

Total: ~702 files
```


---

## 🧑‍💻 **Team**

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/SirAlabar">
        <img src="https://github.com/SirAlabar.png" width="80" height="80" style="border-radius: 50%;" alt="hluiz"><br>
        <sub><b>hluiz-ma</b></sub><br>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/joaorema">
        <img src="https://github.com/joaorema.png" width="80" height="80" style="border-radius: 50%;" alt="jpedro-c"><br>
        <sub><b>jpedro-c</b></sub><br>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/therappha">
        <img src="https://github.com/therappha.png" width="80" height="80" style="border-radius: 50%;" alt="rafaelfe"><br>
        <sub><b>rafaelfe</b></sub><br>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/m3irel3s">
        <img src="https://github.com/m3irel3s.png" width="80" height="80" style="border-radius: 50%;" alt="jmeirele"><br>
        <sub><b>jmeirele</b></sub><br>
      </a>
    </td>
  </tr>
</table>
