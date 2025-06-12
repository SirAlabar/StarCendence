# 📡 API Documentation

## Base URLs

```
Production:  https://starcendence.dev
Development: http://localhost
```

## Authentication

```bash
# JWT Token (required for most endpoints)
Authorization: Bearer <jwt_token>

# Get token via login
POST /auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## Auth Service (Port 3001)

### **Login & Registration**
```bash
# Register new user
POST /auth/register
{
  "email": "user@example.com",
  "username": "player123",
  "password": "password123"
}

# Login user
POST /auth/login
{
  "email": "user@example.com", 
  "password": "password123"
}
# Returns: { "token": "jwt_token", "user": {...} }

# Logout
POST /auth/logout
Authorization: Bearer <token>
```

### **2FA & Security**
```bash
# Setup 2FA
POST /auth/2fa/setup
Authorization: Bearer <token>
# Returns: { "qrCode": "data:image/png...", "secret": "..." }

# Verify 2FA
POST /auth/2fa/verify
Authorization: Bearer <token>
{
  "code": "123456"
}

# Google OAuth
GET /auth/google
# Redirects to Google OAuth

# Password reset
POST /auth/password/reset
{
  "email": "user@example.com"
}
```

---

## Game Service (Port 3002)

### **Pong Game**
```bash
# Create Pong game
POST /games/pong/create
Authorization: Bearer <token>
{
  "mode": "1v1", // or "tournament"
  "difficulty": "medium", // easy, medium, hard
  "powerUps": true
}

# Join game
POST /games/:gameId/join
Authorization: Bearer <token>

# Player move
PUT /games/:gameId/move
Authorization: Bearer <token>
{
  "direction": "up", // up, down
  "timestamp": 1234567890
}

# Get game state
GET /games/:gameId/state
Authorization: Bearer <token>
```

### **Star Wars Racer**
```bash
# Create racing game
POST /games/racer/create
Authorization: Bearer <token>
{
  "track": "tatooine", // tatooine, coruscant
  "laps": 3,
  "maxPlayers": 4
}

# Racing move
PUT /games/:gameId/race
Authorization: Bearer <token>
{
  "acceleration": 0.8, // 0.0 to 1.0
  "steering": -0.3,    // -1.0 to 1.0
  "timestamp": 1234567890
}
```

### **Tournament System**
```bash
# Create tournament
POST /games/tournaments/create
Authorization: Bearer <token>
{
  "name": "Weekly Championship",
  "gameType": "pong", // or "racer"
  "maxPlayers": 16,
  "startTime": "2024-01-15T20:00:00Z"
}

# Join tournament
POST /games/tournaments/:tournamentId/join
Authorization: Bearer <token>

# Get tournament bracket
GET /games/tournaments/:tournamentId/bracket
Authorization: Bearer <token>
```

---

## Chat Service (Port 3003)

### **Messages**
```bash
# Send message
POST /chat/messages
Authorization: Bearer <token>
{
  "roomId": "room_123",
  "content": "Hello everyone!",
  "type": "text" // text, game_invite, system
}

# Get message history
GET /chat/rooms/:roomId/messages?limit=50&before=timestamp
Authorization: Bearer <token>

# Delete message (own messages only)
DELETE /chat/messages/:messageId
Authorization: Bearer <token>
```

### **Rooms & Invitations**
```bash
# Join chat room
POST /chat/rooms/:roomId/join
Authorization: Bearer <token>

# Create private room
POST /chat/rooms/create
Authorization: Bearer <token>
{
  "name": "Private Chat",
  "type": "private", // global, game, private, tournament
  "participants": ["user1", "user2"]
}

# Send game invitation
POST /chat/invitations/game
Authorization: Bearer <token>
{
  "recipientId": "user_123",
  "gameType": "pong",
  "message": "Want to play?"
}
```

### **Moderation**
```bash
# Report user/message
POST /chat/reports
Authorization: Bearer <token>
{
  "targetType": "message", // user, message
  "targetId": "msg_123",
  "reason": "spam"
}

# Block user
POST /chat/users/:userId/block
Authorization: Bearer <token>

# Mute user (in room)
POST /chat/rooms/:roomId/mute/:userId
Authorization: Bearer <token>
{
  "duration": 3600 // seconds
}
```

---

## User Service (Port 3004)

### **Profile Management**
```bash
# Get user profile
GET /users/:userId/profile
Authorization: Bearer <token>

# Update profile
PUT /users/profile
Authorization: Bearer <token>
{
  "username": "newname",
  "displayName": "New Display Name",
  "bio": "Pong master!"
}

# Upload avatar
POST /users/profile/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
# Form data: avatar file
```

### **Friends System**
```bash
# Send friend request
POST /users/:userId/friends/request
Authorization: Bearer <token>

# Accept friend request
POST /users/friends/requests/:requestId/accept
Authorization: Bearer <token>

# Get friends list
GET /users/friends?status=online
Authorization: Bearer <token>

# Block user
POST /users/:userId/block
Authorization: Bearer <token>
```

### **Statistics & History**
```bash
# Get user stats
GET /users/:userId/stats
Authorization: Bearer <token>
# Returns: wins, losses, ranking, achievements

# Get match history
GET /users/:userId/matches?limit=20&gameType=pong
Authorization: Bearer <token>

# Get leaderboard
GET /users/leaderboard?gameType=pong&timeframe=week
Authorization: Bearer <token>
```

---

## WebSocket Events (Port 3005)

### **Connection**
```javascript
// Connect with JWT
const ws = new WebSocket('wss://starcendence.dev/ws', [], {
  headers: { Authorization: 'Bearer ' + jwt_token }
});

// Join room
ws.send(JSON.stringify({
  type: 'room.join',
  data: { roomId: 'game_123' }
}));
```

### **Game Events**
```javascript
// Real-time game updates
{
  type: 'game.update',
  data: {
    gameId: 'game_123',
    ball: { x: 400, y: 300, vx: 5, vy: 3 },
    players: [
      { id: 'player1', paddle: { y: 200 }, score: 2 },
      { id: 'player2', paddle: { y: 350 }, score: 1 }
    ],
    timestamp: 1234567890
  }
}

// Game end
{
  type: 'game.end',
  data: {
    gameId: 'game_123',
    winner: 'player1',
    finalScore: [5, 3],
    duration: 180000
  }
}
```

### **Chat Events**
```javascript
// New message
{
  type: 'chat.message',
  data: {
    messageId: 'msg_123',
    roomId: 'room_456',
    author: { id: 'user1', username: 'player123' },
    content: 'GG!',
    timestamp: 1234567890
  }
}

// User online status
{
  type: 'user.status',
  data: {
    userId: 'user_123',
    status: 'online', // online, away, offline, in_game
    gameId: 'game_456' // if in_game
  }
}
```

---

## Error Responses

```javascript
// Standard error format
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}

// Common error codes
400 - VALIDATION_ERROR, INVALID_REQUEST
401 - UNAUTHORIZED, TOKEN_EXPIRED  
403 - FORBIDDEN, INSUFFICIENT_PERMISSIONS
404 - NOT_FOUND, GAME_NOT_FOUND
409 - CONFLICT, USER_ALREADY_EXISTS
429 - RATE_LIMIT_EXCEEDED
500 - INTERNAL_ERROR, DATABASE_ERROR
```

---

## Rate Limits

```
Authentication: 5 requests/minute
Game moves: 60 requests/second  
Chat messages: 10 messages/minute
Profile updates: 5 requests/minute
File uploads: 3 uploads/minute
```

---

## Development Testing

```bash
# Health checks
GET /auth/health    → 200 OK
GET /games/health   → 200 OK  
GET /chat/health    → 200 OK
GET /users/health   → 200 OK

# Test with curl
curl -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}' \
     http://localhost:3001/auth/login
```