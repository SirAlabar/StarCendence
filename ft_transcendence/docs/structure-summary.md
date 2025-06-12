# 🏓 ft_transcendence - Project Structure Overview

## 🎯 **Project Summary**

**ft_transcendence** is a comprehensive web-based gaming platform featuring 3D Pong and Star Wars Pod Racing games with real-time multiplayer capabilities, live chat, tournaments, AI opponents, and advanced user management.

**Target Score**: 165 points (10 major modules + 7 minor modules)  
**Architecture**: Microservices with TypeScript, Fastify, Babylon.js, SQLite, Redis  
**Total Files**: ~702 files across 6 main sections

---

## 📁 **Project Architecture**

### **1. 🎨 Frontend Layer** - 125 files
```
frontend/
├── TypeScript + Vite + Tailwind CSS + Babylon.js
├── 3D Games: Pong (2D camera view) + Star Wars Racer
├── Real-time: Live chat, multiplayer, WebSocket integration
├── UI: Auth (Google OAuth + 2FA), Dashboard, Tournaments
└── State Management: Auth, Game, Chat, User stores
```

**Key Features**:
- **3D Graphics**: Babylon.js engine with advanced rendering
- **Games**: Pong + Pod Racing with AI opponents
- **Authentication**: Google OAuth, JWT, 2FA
- **Real-time**: WebSocket for live games and chat
- **UI/UX**: Responsive design, multiple languages

### **2. ⚡ Microservices Layer** - 190 files
```
services/
├── auth/          # Authentication (JWT, 2FA, Google OAuth)
├── game/          # Game logic (Pong, Racer, AI, Tournaments)
├── chat/          # Live chat (Real-time messaging, moderation)
├── user/          # User management (Profiles, friends, stats)
└── websocket/     # Real-time communication hub
```

**Architecture Pattern**: Each service is independent with:
- **Controllers**: API endpoints and request handling
- **Services**: Business logic implementation
- **Repositories**: Data access layer
- **Middleware**: Authentication, validation, rate limiting
- **Utils & Types**: Service-specific utilities and TypeScript definitions

### **3. 🔧 Infrastructure Layer** - 22 files
```
infrastructure/
├── redis/         # Cache + PubSub for real-time features
├── database/      # SQLite with migrations, seeds, triggers
└── monitoring/    # Prometheus + Grafana + AlertManager
```

**Components**:
- **Database**: SQLite with 7 migration files covering users, games, tournaments, chat, friends, stats, achievements
- **Caching**: Redis for session storage and real-time message broadcasting
- **Monitoring**: Complete observability stack with custom dashboards

### **4. 📚 Shared Libraries** - 32 files
```
shared/
├── types/         # TypeScript interfaces (auth, game, chat, user, websocket)
├── events/        # WebSocket event definitions
├── utils/         # Common utilities (validation, formatting, crypto)
├── enums/         # Shared enumerations (game types, user roles, status)
└── config/        # Shared configuration (database, redis, security)
```

**Purpose**: Ensures consistency across all services with shared types, validation rules, and configuration.

### **5. 🧪 Testing Layer** - 285 files
```
tests/
├── unit/          # Component-level tests (~200 files)
│   ├── shared/    # Shared library tests
│   ├── services/  # All microservice tests
│   └── frontend/  # Frontend component tests
├── integration/   # Cross-service tests (~25 files)
├── e2e/          # End-to-end user workflows (~30 files)
└── utils/        # Test utilities, mocks, fixtures (~30 files)
```

**Testing Strategy**:
- **Unit Tests**: Jest for individual components and functions
- **Integration Tests**: Cross-service communication testing
- **E2E Tests**: Playwright for complete user journeys
- **Test Utilities**: Shared mocks, fixtures, and helper functions

### **6. 🛠️ Development Tools** - 40 files
```
├── scripts/       # Development and deployment scripts
├── docs/          # API documentation and guides
├── .github/       # CI/CD workflows and templates
├── .vscode/       # VS Code configuration and snippets
└── config/        # ESLint, Prettier, Jest, Husky configuration
```

---

## 🏗️ **Technology Stack**

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

## 🎮 **Core Features Implementation**

### **Major Modules (100 points)**
1. **Fastify Backend** (10pts) - High-performance API services
2. **Standard User Management** (10pts) - Complete user lifecycle
3. **Google Sign-in** (10pts) - OAuth integration
4. **Remote Players** (10pts) - Real-time multiplayer
5. **Multiple Players** (10pts) - Support for 3+ players
6. **Star Wars Racer Game** (10pts) - Second game with matchmaking
7. **Live Chat** (10pts) - Real-time messaging system
8. **AI Opponent** (10pts) - Intelligent game opponents
9. **2FA + JWT** (10pts) - Advanced security
10. **Advanced 3D Graphics** (10pts) - Babylon.js implementation

### **Minor Modules (35 points)**
1. **Tailwind CSS** (5pts) - Modern styling framework
2. **SQLite Database** (5pts) - Reliable data persistence
3. **Game Customization** (5pts) - Power-ups and settings
4. **Stats Dashboard** (5pts) - Analytics and metrics
5. **All Devices Support** (5pts) - Responsive design
6. **Browser Compatibility** (5pts) - Cross-browser support
7. **Prometheus/Grafana Monitoring** (5pts) - System observability

---

## 🚀 **Development Workflow**

### **Quick Start Commands**
```bash
# Setup project
make setup

# Start development environment
make start

# Run tests
make test              # All tests
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make test-e2e         # E2E tests only

# Build and deploy
make build
make deploy
```

### **Development Features**
- **Hot Reloading**: Instant feedback during development
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: Automated linting and formatting
- **Git Hooks**: Pre-commit validation
- **CI/CD**: Automated testing and deployment

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

Total: 702 files
```

---

## 🎯 **Key Architectural Decisions**

1. **Microservices**: Scalable, maintainable service separation
2. **Centralized Testing**: Single source for all test types
3. **Shared Libraries**: Consistent types and utilities
4. **3D Frontend**: Modern gaming experience with Babylon.js
5. **Real-time First**: WebSocket-based communication
6. **Security Focus**: JWT, 2FA, OAuth, HTTPS everywhere
7. **Observability**: Complete monitoring and logging
8. **Developer Experience**: Quality tools and automation

**Result**: Professional, scalable, and maintainable gaming platform! 🎉