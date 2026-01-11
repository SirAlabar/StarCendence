# 🏓 ft_transcendence

**Live:** [starcendence.dev](https://starcendence.dev)

## 🎯 **Project Overview**

**ft_transcendence** is a full-stack, real-time multiplayer gaming platform developed as part of the 42 curriculum.
The project focuses on low-latency gameplay, microservices architecture, and modern web technologies.

The platform includes:
- A 3D Pong game built with Babylon.js
- A Star Wars Pod Racing–inspired racing game
- Real-time multiplayer using WebSockets
- Live chat, tournaments, AI opponents, and user profiles
- Secure authentication with OAuth and 2FA
- A containerized microservices backend

The system is designed to be scalable, modular, and fault-tolerant, mirroring real-world production architectures.

---

## 🎮 **Features (Modules)**

### **Major Modules (11 modules)**
- **⚡ Fastify Backend** - High-performance server framework
- **🏗️ Backend as Microservices** - Distributed architecture
- **👤 Standard User Management** - Auth + profiles + friends
- **🔑 Google Sign-in** - OAuth integration
- **🌐 Remote Players** - WebSocket multiplayer
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

## 📁 Project Structure

frontend/        UI and games  
services/        Backend microservices  
shared/          Shared types and utils  
infrastructure/  Redis, database, monitoring  

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
Redis Pub/Sub is used only between Game Service and WebSocket Service.

Lobby Events:
- lobby:create
- lobby:invite
- lobby:join
- lobby:leave
- lobby:kick
- lobby:ready
- lobby:start
- lobby:chat
- lobby:player:update
- lobby:quick-play

Game Events:
- game:move
- game:action
- game:pause
- game:resume
- game:end
- game:input
- game:ready
- game:start
- game:leave
- game:state
- game:event
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
