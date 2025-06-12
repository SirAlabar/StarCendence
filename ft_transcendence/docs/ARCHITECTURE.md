# 🏗️ Architecture Decisions

## System Overview

```
Frontend (TypeScript + Babylon.js)
    ↓ HTTPS
API Gateway (Nginx + SSL)
    ↓ HTTP
┌──────────────────────────────────────────┐
│            Microservices                 │
│  Auth   Game   Chat   User   WebSocket  │
│ :3001  :3002  :3003  :3004    :3005     │
└──────────────────────────────────────────┘
    ↓           ↓           ↓
Redis        SQLite    Prometheus
```

---

## Why Microservices?

**Gaming-specific benefits:**

- **Independent scaling**: Game service needs CPU, Chat needs I/O
- **Fault isolation**: Chat crash ≠ game crash
- **Real-time optimization**: WebSocket service dedicated to 60fps
- **Team autonomy**: 4 devs work on different services simultaneously

**Team Distribution (4 developers):**
- **Dev 1**: Frontend + 3D Games (TypeScript + Babylon.js)
- **Dev 2**: Auth + User Services (Security focus)  
- **Dev 3**: Game + WebSocket Services (Real-time logic)
- **Dev 4**: Chat + Infrastructure (DevOps + monitoring)

**Alternative considered**: Monolith → Rejected (scaling bottlenecks)

---

## Technology Choices

### **Frontend: TypeScript + Babylon.js**
- **Why TypeScript**: Type safety for complex game logic
- **Why Babylon.js**: 3D engine for modern Pong experience
- **Why Vite**: Fast HMR for development speed
- **Alternative**: Three.js → Rejected (less gaming-focused)

### **Backend: Fastify + Node.js**
- **Why Fastify**: 2x faster than Express (gaming needs speed)
- **Why Node.js**: JavaScript everywhere, WebSocket native
- **Alternative**: Go/Rust → Rejected (team expertise)

### **Database: SQLite per service**
- **Why SQLite**: Zero-config, reliable, sufficient scale
- **Why per-service**: Data ownership, independent scaling
- **Alternative**: PostgreSQL → Rejected (overkill for scope)

### **Cache: Redis**
- **Why Redis**: PubSub for real-time + caching
- **Use cases**: WebSocket broadcasting, session storage
- **Alternative**: Memory cache → Rejected (not persistent)

---

## Data Flow Patterns

### **Authentication Flow**
```
1. Frontend → Auth Service (login)
2. Auth Service → JWT token
3. Frontend → Game Service (JWT header)
4. Game Service → Auth Service (validate token)
5. Cached for subsequent requests
```

### **Real-time Game Flow**
```
1. Player Input → Frontend
2. Frontend → WebSocket Service
3. WebSocket → Game Service (validate move)
4. Game Service → Physics calculation
5. Game Service → WebSocket (broadcast state)
6. WebSocket → All players (update)
```

### **Cross-service Communication**
```
Event-driven (Redis PubSub):
- game.ended → User Service (update stats)
- user.login → Chat Service (join channels)
- tournament.started → All services (notifications)
```

---

## Security Architecture

### **Defense in Depth**
```
1. Nginx → Rate limiting, SSL termination
2. API Gateway → Request validation
3. Services → JWT validation per request
4. Database → Input sanitization
5. Game Logic → Server-authoritative validation
```

### **Gaming Security**
- **Server-authoritative**: All game state calculated server-side
- **Input validation**: Movement bounds, speed limits
- **Anti-cheat**: Physics validation, impossible move detection
- **Rate limiting**: Prevent input spam attacks

### **Data Security**
- **JWT tokens**: Stateless authentication
- **2FA**: TOTP for sensitive accounts
- **Password hashing**: bcrypt with salt
- **HTTPS everywhere**: No plaintext transmission

---

## Performance Optimizations

### **Real-time Gaming (< 20ms latency)**
```
Hot Path (per game frame):
Input → WebSocket → Validation → Physics → Broadcast

Optimizations:
- Cached player permissions
- Pre-calculated boundaries
- Local state prediction
- Lag compensation algorithms
```

### **Caching Strategy**
```
Game Session (Redis):
- Player profiles & permissions (1h TTL)
- Game configurations (24h TTL)
- Friend lists (10min TTL)

Database Queries (only when needed):
- Statistics updates (background job)
- Match history (after game ends)
- User profile changes
```

### **Database Design**
```
Per-service databases:
- auth.sqlite → User credentials, sessions
- game.sqlite → Active games, tournaments  
- chat.sqlite → Messages, rooms
- user.sqlite → Profiles, stats, friends

Advantages:
- No cross-table joins between services
- Independent backups/scaling
- Service isolation
```

---

## Scalability Decisions

### **Horizontal Scaling Points**
```
Nginx (single instance - handles thousands of connections)
    ↓
Multiple service instances per type (when needed)
    ↓
Shared Redis + separate SQLite per service
```

### **Service Scaling Characteristics**
- **Game Service**: CPU-bound (physics calculations)
- **Chat Service**: I/O-bound (message throughput)
- **Auth Service**: Memory-bound (JWT validation)
- **WebSocket Service**: Connection-bound (socket count)

### **Bottleneck Management**
- **Redis**: Single point → Use Redis Cluster for scale
- **SQLite**: Per-service → No cross-service queries
- **WebSocket**: Connection limits → Multiple instances + sticky sessions

---

## Testing Strategy

### **Test Pyramid**
```
E2E Tests (30 files) → Full user journeys
    ↑
Integration Tests (25 files) → Service communication  
    ↑
Unit Tests (200 files) → Individual functions
```

### **Gaming-specific Tests**
- **Physics validation**: Ball collision, paddle movement
- **Real-time sync**: Multi-player state consistency
- **Performance**: Latency under load
- **Anti-cheat**: Invalid move detection

---

## Deployment Architecture

### **Production Environment**
```
Domain: starcendence.dev
SSL: Let's Encrypt auto-renewal
CDN: Static assets caching
Monitoring: Prometheus + Grafana
Logging: Centralized JSON logs
```

### **Service Discovery**
```
Nginx routes:
/auth/* → auth-service:3001
/games/* → game-service:3002  
/chat/* → chat-service:3003
/users/* → user-service:3004
/ws → websocket-service:3005
```

### **Health Monitoring**
- Service health checks every 30s
- Game latency monitoring < 20ms
- WebSocket connection tracking
- Database query performance
- Memory/CPU usage per service

---

## Trade-offs Made

### **Consistency vs Performance**
- **Chosen**: Eventual consistency for stats
- **Trade-off**: Slight delay in leaderboard updates
- **Benefit**: Real-time gameplay not affected

### **Complexity vs Scalability**  
- **Chosen**: Microservices complexity
- **Trade-off**: More deployment complexity
- **Benefit**: Independent team development

### **Technology vs Team**
- **Chosen**: JavaScript everywhere
- **Trade-off**: Not the fastest possible performance
- **Benefit**: Single language, faster development

---

## Future Scaling

**Next bottlenecks (in order):**
1. Game service instances → Multiple game service replicas
2. WebSocket connections → Redis Cluster + sticky sessions
3. Database writes → PostgreSQL migration
4. Nginx limits → Load balancer + multiple nginx (very high scale)

**Architecture allows:**
- ✅ Language flexibility per service
- ✅ Database technology migration per service  
- ✅ Independent service scaling
- ✅ Gradual performance optimizations