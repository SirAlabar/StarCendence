# ft_transcendence

**Live:** [starcendence.dev](https://starcendence.dev)

## 🎯 Features (Modules)

### Major Modules (11 modules)
- **⚡ Fastify Backend** - High-performance server framework
- **🏗️ Backend as Microservices** - **Distributed architecture**
- **👤 Standard User Management** - Auth + profiles + friends
- **🔑 Google Sign-in** - OAuth integration
- **🌐 Remote Players** - WebSocket multiplayer
- **👥 Multiple Players** - 3+ players support
- **🏎️ Star Wars Racer + Matchmaking** - Second game with pairing
- **💬 Live Chat** - Real-time messaging
- **🤖 AI Opponent** - Intelligent computer players
- **🔐 2FA + JWT** - Advanced security
- **🎆 Advanced 3D Babylon.js** - 3D graphics engine

### Minor Modules (7 modules)
- **🎨 Tailwind CSS** - Styling framework
- **💾 SQLite Database**- Data persistence
- **⚙️ Game Customization** - Power-ups and variations
- **📊 Stats Dashboards** - User analytics
- **📱 All Devices Support** - Responsive design
- **🌍 Browser Compatibility** - Firefox + Chrome
- **📈 Prometheus/Grafana** - System monitoring

## 🏗️ Architecture

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

## 📁 Complete Project Structure

```
ft_transcendence/
├── docker-compose.yml              # Development environment
├── docker-compose.prod.yml         # Production configuration
├── nginx/
│   └── nginx.conf                  # API Gateway + SSL reverse proxy
├── frontend/                       # TypeScript + Vite + Babylon.js
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── components/             # UI components
│   │   │   ├── auth/               # Login, register components
│   │   │   ├── game/               # Game UI components
│   │   │   ├── chat/               # Chat interface
│   │   │   └── dashboard/          # Stats dashboard
│   │   ├── game/                   # Game logic and 3D rendering
│   │   │   ├── engines/            # Game engines (Pong, Racer)
│   │   │   │   ├── pong/           # 3D Pong engine
│   │   │   │   └── racer/          # Star Wars Racer engine
│   │   │   ├── entities/           # Game entities (Player, Ball, AI)
│   │   │   ├── systems/            # ECS systems (Physics, Render)
│   │   │   ├── ai/                 # AI opponent logic
│   │   │   └── managers/           # Scene, Input, Asset managers
│   │   ├── services/               # API clients for microservices
│   │   │   ├── authService.ts      # Auth service client
│   │   │   ├── gameService.ts      # Game service client
│   │   │   ├── chatService.ts      # Chat service client
│   │   │   ├── userService.ts      # User service client
│   │   │   └── websocketService.ts # WebSocket client
│   │   ├── stores/                 # State management
│   │   │   ├── authStore.ts        # Authentication state
│   │   │   ├── gameStore.ts        # Game state
│   │   │   └── chatStore.ts        # Chat state
│   │   └── utils/                  # Helper functions
│   └── public/                     # Static assets
├── services/                       # Microservices
│   ├── auth/                       # Authentication Microservice
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── controllers/        # Auth endpoints (login, register, 2FA)
│   │   │   ├── middleware/         # JWT validation, rate limiting
│   │   │   ├── services/           # Auth business logic
│   │   │   ├── repositories/       # User data access
│   │   │   ├── oauth/              # Google OAuth integration
│   │   │   ├── twofa/              # 2FA implementation
│   │   │   └── utils/              # Password hashing, tokens
│   │   └── tests/
│   ├── game/                       # Game Logic Microservice
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── controllers/        # Game endpoints (create, join, move)
│   │   │   ├── engines/            # Game engines (Pong, Racer)
│   │   │   ├── ai/                 # AI opponent system
│   │   │   ├── physics/            # Game physics
│   │   │   ├── tournament/         # Tournament system
│   │   │   ├── matchmaking/        # Player pairing logic
│   │   │   ├── customization/      # Power-ups, game variations
│   │   │   └── repositories/       # Game data access
│   │   └── tests/
│   ├── chat/                       # Live Chat Microservice
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── controllers/        # Chat endpoints
│   │   │   ├── rooms/              # Chat rooms management
│   │   │   ├── messaging/          # Real-time messaging logic
│   │   │   ├── history/            # Message persistence
│   │   │   ├── moderation/         # Chat moderation
│   │   │   └── repositories/       # Chat data access
│   │   └── tests/
│   ├── user/                       # User Management Microservice
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── controllers/        # User endpoints (profiles, friends)
│   │   │   ├── profiles/           # User profiles + avatars
│   │   │   ├── friends/            # Friends system
│   │   │   ├── stats/              # Game statistics
│   │   │   ├── history/            # Match history
│   │   │   ├── dashboard/          # Stats dashboard logic
│   │   │   └── repositories/       # User data access
│   │   └── tests/
│   └── websocket/                  # WebSocket Microservice
│       ├── Dockerfile
│       ├── package.json
│       ├── src/
│       │   ├── server.ts           # WebSocket server
│       │   ├── connections/        # Connection management
│       │   ├── events/             # Real-time events handling
│       │   ├── rooms/              # Game rooms + chat rooms
│       │   ├── broadcasting/       # Message broadcasting
│       │   └── middleware/         # WebSocket authentication
│       └── tests/
├── shared/                         # Shared Libraries
│   ├── types/                      # TypeScript interfaces
│   │   ├── auth.ts                 # Auth-related types
│   │   ├── game.ts                 # Game-related types
│   │   ├── chat.ts                 # Chat-related types
│   │   └── user.ts                 # User-related types
│   ├── events/                     # Event definitions
│   │   ├── gameEvents.ts           # Game events
│   │   ├── chatEvents.ts           # Chat events
│   │   └── userEvents.ts           # User events
│   ├── utils/                      # Common utilities
│   │   ├── validation.ts           # Input validation schemas
│   │   ├── errors.ts               # Error handling
│   │   └── constants.ts            # Application constants
│   └── config/                     # Shared configuration
│       ├── database.ts             # Database configuration
│       └── redis.ts                # Redis configuration
├── infrastructure/                 # Infrastructure Services
│   ├── redis/                      # Redis Cache + PubSub
│   │   ├── redis.conf              # Redis configuration
│   │   └── Dockerfile              # Custom Redis setup
│   ├── database/                   # SQLite Database
│   │   ├── migrations/             # Database migrations
│   │   ├── seeds/                  # Initial data
│   │   └── setup.sql               # Database schema
│   └── monitoring/                 # Prometheus + Grafana
│       ├── prometheus/
│       │   └── prometheus.yml      # Metrics configuration
│       └── grafana/
│           └── dashboards/         # Monitoring dashboards
└── .github/                        # CI/CD Automation
    └── workflows/
        ├── deploy.yml              # Automated deployment
        ├── test.yml                # Automated testing
        └── build.yml               # Build validation
```

## 📊 Microservices Communication

### Service Ports & Responsibilities
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

### API Gateway Routes (Nginx)
```
/auth/*     → auth-service:3001
/games/*    → game-service:3002
/chat/*     → chat-service:3003
/users/*    → user-service:3004
/ws         → websocket-service:3005
/metrics    → prometheus:9090
/grafana/*  → grafana:3010
```

### Event-Driven Communication (Redis PubSub)
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

## 🗄️ Distributed Data Architecture

### Database-per-Service Strategy
```
auth-service/auth.sqlite:
├── Users (credentials, 2FA, OAuth tokens)
├── Sessions (JWT tokens, refresh tokens)
└── Login history (security audit)

game-service/game.sqlite:
├── Games (active games, tournaments)
├── AI opponents (difficulty, patterns)
└── Game configurations (rules, physics)

chat-service/chat.sqlite:
├── Messages (chat history, rooms)
├── Channels (game channels, private chats)
└── Moderation (banned words, user reports)

user-service/user.sqlite:
├── Profiles (names, avatars, preferences)
├── Friends (relationships, online status)
├── Statistics (wins, losses, rankings)
└── Match history (detailed game records)

websocket-service/ws.sqlite:
├── Active connections (socket IDs, rooms)
├── Subscriptions (user → room mappings)
└── Real-time state (temporary session data)
```

### Data Consistency Patterns
```
Immediate Consistency:
- User authentication (critical security)
- Game state updates (anti-cheat)
- Real-time messaging (user experience)

Eventual Consistency:
- Statistics updates (can be delayed)
- Match history (background processing)
- Friend status updates (non-critical)

Event Sourcing:
- Game events → replay system
- Chat events → message history
- User events → audit trail
```

## ⚡ Performance & Security Architecture

### Latency Optimization Strategy
```
HIGH LATENCY (Login/Setup - 80-200ms):
Frontend → game-service → auth-service (validate token)
                       → user-service (get profile)  
                       → chat-service (join channel)

LOW LATENCY (Gameplay - 6-20ms):
Frontend → websocket → game-service (cached validation)
                    → broadcast (local state)
```

### Input Validation & Anti-Cheat
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

### Caching Strategy for Real-time Performance
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

## 🚀 Start

```bash
# Clone and start all microservices
git clone https://github.com/yourusername/ft_transcendence.git
cd ft_transcendence
docker-compose up --build

# Access application
open https://localhost
```

## 🎮 Games & Features

**3D Pong (Babylon.js):** 
- Server-authoritative physics (paddle movement, ball collision)
- Real-time multiplayer with lag compensation
- AI opponents with adaptive difficulty
- Tournament system with bracket management
- Ultra-low latency validation (< 1ms per input)

**Star Wars Racer:** 
- Complex physics simulation (vehicle dynamics)
- Track boundary enforcement
- Power-ups system with server validation
- Multiplayer racing with position synchronization
- Advanced collision detection (5-10ms validation)

**Real-time Architecture:**
- WebSocket connections for 60fps gameplay
- Redis PubSub for event broadcasting  
- Cached player data for instant validation
- Server-side anti-cheat protection
- Cross-service communication optimized for gaming

**Advanced Auth:** JWT + 2FA + Google OAuth + Session management
**Live Chat:** Real-time messaging, Game invitations, User presence  
**Monitoring:** Prometheus metrics + Grafana dashboards + Performance tracking

## 🛠️ Technology Stack & Microservices Benefits

**Frontend:** Vite + TypeScript + Tailwind CSS + Babylon.js  
**Microservices:** Fastify + Node.js (5 independent services)
**Infrastructure:** Redis (Cache+PubSub) + SQLite per service + Docker
**Gateway:** Nginx (SSL + Reverse Proxy + Load Balancing)
**Monitoring:** Prometheus + Grafana + Real-time metrics

### Microservices Advantages in Gaming
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
**Team:** hluiz, joao-pol, isilva-t
