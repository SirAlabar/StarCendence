# ⚡ Services - Complete File Structure

```
services/                       # Microservices
├── auth/                       # Authentication Microservice
│   ├── Dockerfile              # Auth service container
│   ├── package.json            # Auth service dependencies
│   ├── tsconfig.json           # Auth TypeScript configuration
│   ├── src/
│   │   ├── server.ts           # Auth service entry point
│   │   ├── app.ts              # Fastify app configuration
│   │   ├── controllers/        # Auth endpoints (login, register, 2FA)
│   │   │   ├── authController.ts # Main authentication controller
│   │   │   ├── loginController.ts # Login endpoint logic
│   │   │   ├── registerController.ts # Registration logic
│   │   │   ├── twoFactorController.ts # 2FA management
│   │   │   ├── oauthController.ts # OAuth integration
│   │   │   ├── passwordController.ts # Password reset logic
│   │   │   └── sessionController.ts # Session management
│   │   ├── middleware/         # JWT validation, rate limiting
│   │   │   ├── authMiddleware.ts # JWT token validation
│   │   │   ├── rateLimitMiddleware.ts # Rate limiting protection
│   │   │   ├── corsMiddleware.ts # CORS configuration
│   │   │   ├── validationMiddleware.ts # Input validation
│   │   │   ├── errorMiddleware.ts # Error handling
│   │   │   └── loggingMiddleware.ts # Request logging
│   │   ├── services/           # Auth business logic
│   │   │   ├── authService.ts  # Core authentication logic
│   │   │   ├── tokenService.ts # JWT token management
│   │   │   ├── passwordService.ts # Password hashing/validation
│   │   │   ├── twoFactorService.ts # 2FA implementation
│   │   │   ├── oauthService.ts # OAuth provider integration
│   │   │   ├── sessionService.ts # Session management
│   │   │   └── emailService.ts # Email notifications
│   │   ├── repositories/       # User data access
│   │   │   ├── userRepository.ts # User data operations
│   │   │   ├── sessionRepository.ts # Session data operations
│   │   │   ├── tokenRepository.ts # Token storage operations
│   │   │   └── auditRepository.ts # Security audit logging
│   │   ├── oauth/              # Google OAuth integration
│   │   │   ├── googleOAuth.ts  # Google OAuth implementation
│   │   │   ├── oauthConfig.ts  # OAuth configuration
│   │   │   └── oauthCallbacks.ts # OAuth callback handlers
│   │   ├── twofa/              # 2FA implementation
│   │   │   ├── totpGenerator.ts # TOTP generation logic
│   │   │   ├── qrCodeGenerator.ts # QR code generation
│   │   │   ├── backupCodes.ts  # Backup codes management
│   │   │   └── twoFactorValidator.ts # 2FA validation
│   │   ├── utils/              # Auth utility functions
│   │   │   ├── hashUtils.ts    # Password hashing utilities
│   │   │   ├── tokenUtils.ts   # Token generation utilities
│   │   │   ├── validationUtils.ts # Input validation
│   │   │   ├── securityUtils.ts # Security utilities
│   │   │   └── constants.ts    # Auth service constants
│   │   ├── types/              # Auth TypeScript types
│   │   │   ├── auth.types.ts   # Authentication types
│   │   │   ├── user.types.ts   # User types
│   │   │   ├── token.types.ts  # Token types
│   │   │   └── oauth.types.ts  # OAuth types
│   │   └── config/             # Service configuration
│   │       ├── database.ts     # Database configuration
│   │       ├── jwt.ts          # JWT configuration
│   │       ├── oauth.ts        # OAuth configuration
│   │       └── security.ts     # Security configuration
├── game/                       # Game Logic Microservice
│   ├── Dockerfile              # Game service container
│   ├── package.json            # Game service dependencies
│   ├── tsconfig.json           # Game TypeScript configuration
│   ├── src/
│   │   ├── server.ts           # Game service entry point
│   │   ├── app.ts              # Fastify app configuration
│   │   ├── controllers/        # Game endpoints (create, join, move)
│   │   │   ├── gameController.ts # Main game controller
│   │   │   ├── pongController.ts # Pong game controller
│   │   │   ├── racerController.ts # Racing game controller
│   │   │   ├── matchController.ts # Match management
│   │   │   ├── tournamentController.ts # Tournament management
│   │   │   ├── customizationController.ts # Game customization
│   │   │   └── spectateController.ts # Spectator functionality
│   │   ├── engines/            # Game engines (Pong, Racer)
│   │   │   ├── BaseGameEngine.ts # Abstract game engine
│   │   │   ├── PongEngine.ts   # Pong game engine
│   │   │   ├── RacerEngine.ts  # Racing game engine
│   │   │   ├── GameState.ts    # Game state management
│   │   │   ├── GameLoop.ts     # Game loop implementation
│   │   │   └── GameValidator.ts # Game move validation
│   │   ├── ai/                 # AI opponent system
│   │   │   ├── AIOpponent.ts   # AI opponent implementation
│   │   │   ├── PongAI.ts       # Pong AI logic
│   │   │   ├── RacerAI.ts      # Racing AI logic
│   │   │   ├── AIBehavior.ts   # AI behavior patterns
│   │   │   ├── DifficultyScaler.ts # AI difficulty management
│   │   │   └── AITraining.ts   # AI learning algorithms
│   │   ├── physics/            # Game physics
│   │   │   ├── PhysicsEngine.ts # Physics calculations
│   │   │   ├── CollisionDetection.ts # Collision detection
│   │   │   ├── PongPhysics.ts  # Pong-specific physics
│   │   │   ├── RacerPhysics.ts # Racing physics
│   │   │   ├── Vector3D.ts     # 3D vector mathematics
│   │   │   └── BoundingBox.ts  # Collision boundaries
│   │   ├── tournament/         # Tournament system
│   │   │   ├── TournamentManager.ts # Tournament coordination
│   │   │   ├── BracketGenerator.ts # Tournament bracket creation
│   │   │   ├── MatchScheduler.ts # Match scheduling logic
│   │   │   ├── TournamentRules.ts # Tournament rule engine
│   │   │   ├── PrizeDistribution.ts # Prize/points distribution
│   │   │   └── TournamentStats.ts # Tournament statistics
│   │   ├── matchmaking/        # Player pairing logic
│   │   │   ├── MatchmakingEngine.ts # Player matching algorithm
│   │   │   ├── SkillRating.ts  # ELO/skill rating system
│   │   │   ├── QueueManager.ts # Matchmaking queue management
│   │   │   ├── TeamBalancer.ts # Team balance algorithm
│   │   │   └── MatchValidator.ts # Match validation logic
│   │   ├── customization/      # Power-ups, game variations
│   │   │   ├── PowerUpManager.ts # Power-up system
│   │   │   ├── GameModes.ts    # Game mode variations
│   │   │   ├── CustomRules.ts  # Custom game rules
│   │   │   ├── PowerUpEffects.ts # Power-up implementations
│   │   │   └── GameSettings.ts # Game configuration
│   │   ├── repositories/       # Game data access
│   │   │   ├── gameRepository.ts # Game data operations
│   │   │   ├── matchRepository.ts # Match data operations
│   │   │   ├── tournamentRepository.ts # Tournament data
│   │   │   ├── statsRepository.ts # Game statistics data
│   │   │   └── replayRepository.ts # Game replay storage
│   │   ├── utils/              # Game utility functions
│   │   │   ├── gameUtils.ts    # General game utilities
│   │   │   ├── mathUtils.ts    # Mathematical calculations
│   │   │   ├── validationUtils.ts # Game input validation
│   │   │   ├── scoreUtils.ts   # Score calculation utilities
│   │   │   └── constants.ts    # Game constants
│   │   ├── types/              # Game TypeScript types
│   │   │   ├── game.types.ts   # Core game types
│   │   │   ├── player.types.ts # Player types
│   │   │   ├── match.types.ts  # Match types
│   │   │   ├── tournament.types.ts # Tournament types
│   │   │   └── ai.types.ts     # AI types
│   │   └── config/             # Game service configuration
│   │       ├── gameConfig.ts   # Game configuration
│   │       ├── aiConfig.ts     # AI configuration
│   │       └── physicsConfig.ts # Physics configuration
│   └── tests/                  # Game service tests
│       ├── controllers/        # Controller tests
│       ├── engines/            # Engine tests
│       ├── ai/                 # AI tests
│       ├── physics/            # Physics tests
│       ├── integration/        # Integration tests
│       └── utils/              # Test utilities
├── chat/                       # Live Chat Microservice
│   ├── Dockerfile              # Chat service container
│   ├── package.json            # Chat service dependencies
│   ├── tsconfig.json           # Chat TypeScript configuration
│   ├── src/
│   │   ├── server.ts           # Chat service entry point
│   │   ├── app.ts              # Fastify app configuration
│   │   ├── controllers/        # Chat endpoints
│   │   │   ├── chatController.ts # Main chat controller
│   │   │   ├── messageController.ts # Message management
│   │   │   ├── roomController.ts # Chat room management
│   │   │   ├── moderationController.ts # Chat moderation
│   │   │   ├── inviteController.ts # Game invitations
│   │   │   └── historyController.ts # Message history
│   │   ├── rooms/              # Chat rooms management
│   │   │   ├── RoomManager.ts  # Chat room coordination
│   │   │   ├── GameRoom.ts     # Game-specific chat rooms
│   │   │   ├── GlobalRoom.ts   # Global chat room
│   │   │   ├── PrivateRoom.ts  # Private chat rooms
│   │   │   ├── TournamentRoom.ts # Tournament chat rooms
│   │   │   └── RoomPermissions.ts # Room access control
│   │   ├── messaging/          # Real-time messaging logic
│   │   │   ├── MessageService.ts # Message processing
│   │   │   ├── MessageValidator.ts # Message validation
│   │   │   ├── MessageFormatter.ts # Message formatting
│   │   │   ├── EmojiProcessor.ts # Emoji processing
│   │   │   ├── LinkPreview.ts  # Link preview generation
│   │   │   └── MessageFilters.ts # Message content filtering
│   │   ├── history/            # Message persistence
│   │   │   ├── MessageHistory.ts # Message storage
│   │   │   ├── HistoryManager.ts # History management
│   │   │   ├── SearchService.ts # Message search functionality
│   │   │   └── ExportService.ts # Chat export functionality
│   │   ├── moderation/         # Chat moderation
│   │   │   ├── ModerationService.ts # Content moderation
│   │   │   ├── WordFilter.ts   # Inappropriate content filter
│   │   │   ├── UserMuting.ts   # User muting system
│   │   │   ├── ReportSystem.ts # User reporting system
│   │   │   ├── AutoModeration.ts # Automated moderation
│   │   │   └── ModerationLog.ts # Moderation action logging
│   │   ├── repositories/       # Chat data access
│   │   │   ├── messageRepository.ts # Message data operations
│   │   │   ├── roomRepository.ts # Room data operations
│   │   │   ├── userRepository.ts # Chat user data
│   │   │   ├── moderationRepository.ts # Moderation data
│   │   │   └── inviteRepository.ts # Invitation data
│   │   ├── utils/              # Chat utility functions
│   │   │   ├── chatUtils.ts    # General chat utilities
│   │   │   ├── validationUtils.ts # Chat input validation
│   │   │   ├── formatUtils.ts  # Message formatting utilities
│   │   │   ├── timeUtils.ts    # Time-related utilities
│   │   │   └── constants.ts    # Chat constants
│   │   ├── types/              # Chat TypeScript types
│   │   │   ├── chat.types.ts   # Core chat types
│   │   │   ├── message.types.ts # Message types
│   │   │   ├── room.types.ts   # Room types
│   │   │   └── moderation.types.ts # Moderation types
│   │   └── config/             # Chat service configuration
│   │       ├── chatConfig.ts   # Chat configuration
│   │       └── moderationConfig.ts # Moderation settings
├── user/                       # User Management Microservice
│   ├── Dockerfile              # User service container
│   ├── package.json            # User service dependencies
│   ├── tsconfig.json           # User TypeScript configuration
│   ├── src/
│   │   ├── server.ts           # User service entry point
│   │   ├── app.ts              # Fastify app configuration
│   │   ├── controllers/        # User endpoints (profiles, friends)
│   │   │   ├── userController.ts # Main user controller
│   │   │   ├── profileController.ts # Profile management
│   │   │   ├── friendsController.ts # Friends management
│   │   │   ├── statsController.ts # User statistics
│   │   │   ├── historyController.ts # Match history
│   │   │   ├── dashboardController.ts # Dashboard data
│   │   │   └── settingsController.ts # User settings
│   │   ├── profiles/           # User profiles + avatars
│   │   │   ├── ProfileService.ts # Profile management logic
│   │   │   ├── AvatarService.ts # Avatar upload/management
│   │   │   ├── ProfileValidator.ts # Profile validation
│   │   │   ├── ImageProcessor.ts # Avatar image processing
│   │   │   └── ProfileFormatter.ts # Profile data formatting
│   │   ├── friends/            # Friends system
│   │   │   ├── FriendsService.ts # Friends management logic
│   │   │   ├── FriendRequests.ts # Friend request handling
│   │   │   ├── OnlineStatus.ts # Online status tracking
│   │   │   ├── BlockedUsers.ts # User blocking system
│   │   │   └── FriendsNotifications.ts # Friend notifications
│   │   ├── stats/              # Game statistics
│   │   │   ├── StatsService.ts # Statistics calculation
│   │   │   ├── GameStats.ts    # Game-specific statistics
│   │   │   ├── RankingSystem.ts # Player ranking system
│   │   │   ├── AchievementSystem.ts # User achievements
│   │   │   ├── PerformanceAnalytics.ts # Performance analysis
│   │   │   └── StatsAggregator.ts # Statistics aggregation
│   │   ├── history/            # Match history
│   │   │   ├── MatchHistory.ts # Match history management
│   │   │   ├── GameRecords.ts  # Game record keeping
│   │   │   ├── HistoryFormatter.ts # History data formatting
│   │   │   ├── HistoryFilter.ts # History filtering/search
│   │   │   └── ExportHistory.ts # History export functionality
│   │   ├── dashboard/          # Stats dashboard logic
│   │   │   ├── DashboardService.ts # Dashboard data service
│   │   │   ├── ChartGenerator.ts # Chart data generation
│   │   │   ├── MetricsCalculator.ts # Metrics calculation
│   │   │   ├── TrendAnalysis.ts # Trend analysis
│   │   │   └── DashboardCache.ts # Dashboard data caching
│   │   ├── repositories/       # User data access
│   │   │   ├── userRepository.ts # User data operations
│   │   │   ├── profileRepository.ts # Profile data operations
│   │   │   ├── friendsRepository.ts # Friends data operations
│   │   │   ├── statsRepository.ts # Statistics data operations
│   │   │   ├── historyRepository.ts # History data operations
│   │   │   └── achievementRepository.ts # Achievement data
│   │   ├── utils/              # User utility functions
│   │   │   ├── userUtils.ts    # General user utilities
│   │   │   ├── validationUtils.ts # User input validation
│   │   │   ├── formatUtils.ts  # Data formatting utilities
│   │   │   ├── imageUtils.ts   # Image processing utilities
│   │   │   └── constants.ts    # User service constants
│   │   ├── types/              # User TypeScript types
│   │   │   ├── user.types.ts   # Core user types
│   │   │   ├── profile.types.ts # Profile types
│   │   │   ├── friends.types.ts # Friends types
│   │   │   ├── stats.types.ts  # Statistics types
│   │   │   └── achievement.types.ts # Achievement types
│   │   └── config/             # User service configuration
│   │       ├── userConfig.ts   # User service configuration
│   │       └── uploadConfig.ts # File upload configuration
└── websocket/                  # WebSocket Microservice
    ├── Dockerfile              # WebSocket service container
    ├── package.json            # WebSocket service dependencies
    ├── tsconfig.json           # WebSocket TypeScript configuration
    ├── src/
    │   ├── server.ts           # WebSocket server entry point
    │   ├── app.ts              # WebSocket server configuration
    │   ├── connections/        # Connection management
    │   │   ├── ConnectionManager.ts # WebSocket connection management
    │   │   ├── ClientConnection.ts # Individual client connection
    │   │   ├── ConnectionPool.ts # Connection pooling
    │   │   ├── ConnectionAuth.ts # Connection authentication
    │   │   ├── HeartbeatManager.ts # Connection heartbeat
    │   │   └── DisconnectHandler.ts # Disconnection handling
    │   ├── events/             # Real-time events handling
    │   │   ├── EventManager.ts # Event routing and handling
    │   │   ├── GameEvents.ts   # Game-related events
    │   │   ├── ChatEvents.ts   # Chat-related events
    │   │   ├── UserEvents.ts   # User-related events
    │   │   ├── TournamentEvents.ts # Tournament events
    │   │   ├── NotificationEvents.ts # Notification events
    │   │   └── SystemEvents.ts # System events
    │   ├── rooms/              # Game rooms + chat rooms
    │   │   ├── RoomManager.ts  # Room management system
    │   │   ├── GameRoom.ts     # Game room implementation
    │   │   ├── ChatRoom.ts     # Chat room implementation
    │   │   ├── TournamentRoom.ts # Tournament room
    │   │   ├── PrivateRoom.ts  # Private rooms
    │   │   ├── SpectatorRoom.ts # Spectator rooms
    │   │   └── RoomSecurity.ts # Room access control
    │   ├── broadcasting/       # Message broadcasting
    │   │   ├── BroadcastManager.ts # Message broadcasting
    │   │   ├── RoomBroadcast.ts # Room-specific broadcasting
    │   │   ├── UserBroadcast.ts # User-specific broadcasting
    │   │   ├── GameBroadcast.ts # Game state broadcasting
    │   │   ├── ChatBroadcast.ts # Chat message broadcasting
    │   │   └── NotificationBroadcast.ts # Notification broadcasting
    │   ├── middleware/         # WebSocket authentication
    │   │   ├── authMiddleware.ts # WebSocket authentication
    │   │   ├── rateLimitMiddleware.ts # Rate limiting
    │   │   ├── validationMiddleware.ts # Message validation
    │   │   ├── loggingMiddleware.ts # Connection logging
    │   │   └── errorMiddleware.ts # Error handling
    │   ├── utils/              # WebSocket utility functions
    │   │   ├── wsUtils.ts      # WebSocket utilities
    │   │   ├── messageUtils.ts # Message processing utilities
    │   │   ├── validationUtils.ts # Message validation
    │   │   ├── compressionUtils.ts # Message compression
    │   │   └── constants.ts    # WebSocket constants
    │   ├── types/              # WebSocket TypeScript types
    │   │   ├── websocket.types.ts # WebSocket types
    │   │   ├── connection.types.ts # Connection types
    │   │   ├── event.types.ts  # Event types
    │   │   ├── room.types.ts   # Room types
    │   │   └── message.types.ts # Message types
    │   └── config/             # WebSocket service configuration
    │       ├── wsConfig.ts     # WebSocket configuration
    │       └── securityConfig.ts # Security configuration
```

**Total Services Files**: ~190 files across 5 microservices  
**Architecture**: Fastify + Node.js microservices  
**Communication**: REST APIs + WebSocket for real-time features