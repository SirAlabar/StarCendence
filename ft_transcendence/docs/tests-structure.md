# 🧪 Tests - Centralized Testing Structure

```
tests/                          # Centralized Testing Directory
├── jest.config.js              # Main Jest configuration
├── setup.ts                    # Global test setup
├── teardown.ts                 # Global test teardown
├── unit/                       # Unit Tests
│   ├── shared/                 # Shared library tests
│   │   ├── types/              # Type definition tests
│   │   │   ├── auth.types.test.ts # Auth types tests
│   │   │   ├── game.types.test.ts # Game types tests
│   │   │   ├── chat.types.test.ts # Chat types tests
│   │   │   ├── user.types.test.ts # User types tests
│   │   │   └── common.types.test.ts # Common types tests
│   │   ├── utils/              # Utility function tests
│   │   │   ├── validation.test.ts # Validation tests
│   │   │   ├── formatters.test.ts # Formatter tests
│   │   │   ├── dateUtils.test.ts # Date utility tests
│   │   │   ├── mathUtils.test.ts # Math utility tests
│   │   │   ├── stringUtils.test.ts # String utility tests
│   │   │   └── cryptoUtils.test.ts # Crypto utility tests
│   │   ├── events/             # Event definition tests
│   │   │   ├── gameEvents.test.ts # Game event tests
│   │   │   ├── chatEvents.test.ts # Chat event tests
│   │   │   ├── userEvents.test.ts # User event tests
│   │   │   └── authEvents.test.ts # Auth event tests
│   │   └── enums/              # Enum tests
│   │       ├── gameEnums.test.ts # Game enum tests
│   │       ├── userEnums.test.ts # User enum tests
│   │       └── authEnums.test.ts # Auth enum tests
│   ├── services/               # Microservice unit tests
│   │   ├── auth/               # Auth service tests
│   │   │   ├── controllers/    # Controller tests
│   │   │   │   ├── authController.test.ts # Main auth controller tests
│   │   │   │   ├── loginController.test.ts # Login tests
│   │   │   │   ├── registerController.test.ts # Register tests
│   │   │   │   ├── twoFactorController.test.ts # 2FA tests
│   │   │   │   └── oauthController.test.ts # OAuth tests
│   │   │   ├── services/       # Service logic tests
│   │   │   │   ├── authService.test.ts # Auth service tests
│   │   │   │   ├── tokenService.test.ts # Token service tests
│   │   │   │   ├── passwordService.test.ts # Password service tests
│   │   │   │   ├── twoFactorService.test.ts # 2FA service tests
│   │   │   │   └── oauthService.test.ts # OAuth service tests
│   │   │   ├── repositories/   # Repository tests
│   │   │   │   ├── userRepository.test.ts # User repo tests
│   │   │   │   ├── sessionRepository.test.ts # Session repo tests
│   │   │   │   └── tokenRepository.test.ts # Token repo tests
│   │   │   ├── middleware/     # Middleware tests
│   │   │   │   ├── authMiddleware.test.ts # Auth middleware tests
│   │   │   │   ├── rateLimitMiddleware.test.ts # Rate limit tests
│   │   │   │   └── validationMiddleware.test.ts # Validation tests
│   │   │   └── utils/          # Utility tests
│   │   │       ├── hashUtils.test.ts # Hash utility tests
│   │   │       ├── tokenUtils.test.ts # Token utility tests
│   │   │       └── validationUtils.test.ts # Validation tests
│   │   ├── game/               # Game service tests
│   │   │   ├── controllers/    # Game controller tests
│   │   │   │   ├── gameController.test.ts # Main game controller
│   │   │   │   ├── pongController.test.ts # Pong controller tests
│   │   │   │   ├── racerController.test.ts # Racer controller tests
│   │   │   │   └── tournamentController.test.ts # Tournament tests
│   │   │   ├── engines/        # Game engine tests
│   │   │   │   ├── PongEngine.test.ts # Pong engine tests
│   │   │   │   ├── RacerEngine.test.ts # Racer engine tests
│   │   │   │   ├── GameState.test.ts # Game state tests
│   │   │   │   └── GameValidator.test.ts # Game validation tests
│   │   │   ├── ai/             # AI system tests
│   │   │   │   ├── PongAI.test.ts # Pong AI tests
│   │   │   │   ├── RacerAI.test.ts # Racer AI tests
│   │   │   │   ├── AIBehavior.test.ts # AI behavior tests
│   │   │   │   └── DifficultyScaler.test.ts # AI difficulty tests
│   │   │   ├── physics/        # Physics tests
│   │   │   │   ├── PhysicsEngine.test.ts # Physics engine tests
│   │   │   │   ├── CollisionDetection.test.ts # Collision tests
│   │   │   │   ├── PongPhysics.test.ts # Pong physics tests
│   │   │   │   └── RacerPhysics.test.ts # Racer physics tests
│   │   │   ├── tournament/     # Tournament system tests
│   │   │   │   ├── TournamentManager.test.ts # Tournament manager tests
│   │   │   │   ├── BracketGenerator.test.ts # Bracket generation tests
│   │   │   │   └── MatchScheduler.test.ts # Match scheduling tests
│   │   │   ├── matchmaking/    # Matchmaking tests
│   │   │   │   ├── MatchmakingEngine.test.ts # Matchmaking tests
│   │   │   │   ├── SkillRating.test.ts # Skill rating tests
│   │   │   │   └── QueueManager.test.ts # Queue management tests
│   │   │   └── repositories/   # Game repository tests
│   │   │       ├── gameRepository.test.ts # Game repo tests
│   │   │       ├── matchRepository.test.ts # Match repo tests
│   │   │       └── tournamentRepository.test.ts # Tournament repo tests
│   │   ├── chat/               # Chat service tests
│   │   │   ├── controllers/    # Chat controller tests
│   │   │   │   ├── chatController.test.ts # Main chat controller
│   │   │   │   ├── messageController.test.ts # Message controller
│   │   │   │   ├── roomController.test.ts # Room controller
│   │   │   │   └── moderationController.test.ts # Moderation tests
│   │   │   ├── messaging/      # Messaging tests
│   │   │   │   ├── MessageService.test.ts # Message service tests
│   │   │   │   ├── MessageValidator.test.ts # Message validation
│   │   │   │   ├── MessageFormatter.test.ts # Message formatting
│   │   │   │   └── EmojiProcessor.test.ts # Emoji processing
│   │   │   ├── rooms/          # Room management tests
│   │   │   │   ├── RoomManager.test.ts # Room manager tests
│   │   │   │   ├── GameRoom.test.ts # Game room tests
│   │   │   │   ├── GlobalRoom.test.ts # Global room tests
│   │   │   │   └── PrivateRoom.test.ts # Private room tests
│   │   │   ├── moderation/     # Moderation tests
│   │   │   │   ├── ModerationService.test.ts # Moderation service
│   │   │   │   ├── WordFilter.test.ts # Word filter tests
│   │   │   │   ├── UserMuting.test.ts # User muting tests
│   │   │   │   └── AutoModeration.test.ts # Auto moderation tests
│   │   │   └── repositories/   # Chat repository tests
│   │   │       ├── messageRepository.test.ts # Message repo tests
│   │   │       ├── roomRepository.test.ts # Room repo tests
│   │   │       └── moderationRepository.test.ts # Moderation repo tests
│   │   ├── user/               # User service tests
│   │   │   ├── controllers/    # User controller tests
│   │   │   │   ├── userController.test.ts # Main user controller
│   │   │   │   ├── profileController.test.ts # Profile controller
│   │   │   │   ├── friendsController.test.ts # Friends controller
│   │   │   │   └── statsController.test.ts # Stats controller
│   │   │   ├── profiles/       # Profile management tests
│   │   │   │   ├── ProfileService.test.ts # Profile service tests
│   │   │   │   ├── AvatarService.test.ts # Avatar service tests
│   │   │   │   ├── ProfileValidator.test.ts # Profile validation
│   │   │   │   └── ImageProcessor.test.ts # Image processing tests
│   │   │   ├── friends/        # Friends system tests
│   │   │   │   ├── FriendsService.test.ts # Friends service tests
│   │   │   │   ├── FriendRequests.test.ts # Friend requests tests
│   │   │   │   ├── OnlineStatus.test.ts # Online status tests
│   │   │   │   └── BlockedUsers.test.ts # User blocking tests
│   │   │   ├── stats/          # Statistics tests
│   │   │   │   ├── StatsService.test.ts # Stats service tests
│   │   │   │   ├── GameStats.test.ts # Game stats tests
│   │   │   │   ├── RankingSystem.test.ts # Ranking system tests
│   │   │   │   └── AchievementSystem.test.ts # Achievement tests
│   │   │   └── repositories/   # User repository tests
│   │   │       ├── userRepository.test.ts # User repo tests
│   │   │       ├── profileRepository.test.ts # Profile repo tests
│   │   │       ├── friendsRepository.test.ts # Friends repo tests
│   │   │       └── statsRepository.test.ts # Stats repo tests
│   │   └── websocket/          # WebSocket service tests
│   │       ├── connections/    # Connection tests
│   │       │   ├── ConnectionManager.test.ts # Connection manager tests
│   │       │   ├── ClientConnection.test.ts # Client connection tests
│   │       │   ├── ConnectionPool.test.ts # Connection pool tests
│   │       │   └── HeartbeatManager.test.ts # Heartbeat tests
│   │       ├── events/         # Event handling tests
│   │       │   ├── EventManager.test.ts # Event manager tests
│   │       │   ├── GameEvents.test.ts # Game event tests
│   │       │   ├── ChatEvents.test.ts # Chat event tests
│   │       │   └── UserEvents.test.ts # User event tests
│   │       ├── rooms/          # Room management tests
│   │       │   ├── RoomManager.test.ts # Room manager tests
│   │       │   ├── GameRoom.test.ts # Game room tests
│   │       │   ├── ChatRoom.test.ts # Chat room tests
│   │       │   └── PrivateRoom.test.ts # Private room tests
│   │       └── broadcasting/   # Broadcasting tests
│   │           ├── BroadcastManager.test.ts # Broadcast manager tests
│   │           ├── RoomBroadcast.test.ts # Room broadcast tests
│   │           └── GameBroadcast.test.ts # Game broadcast tests
│   └── frontend/               # Frontend unit tests
│       ├── components/         # Component tests
│       │   ├── auth/           # Auth component tests
│       │   │   ├── LoginForm.test.ts # Login form tests
│       │   │   ├── RegisterForm.test.ts # Register form tests
│       │   │   ├── TwoFactorAuth.test.ts # 2FA component tests
│       │   │   └── GoogleAuth.test.ts # Google auth tests
│       │   ├── game/           # Game component tests
│       │   │   ├── GameCanvas.test.ts # Game canvas tests
│       │   │   ├── GameControls.test.ts # Game controls tests
│       │   │   ├── GameLobby.test.ts # Game lobby tests
│       │   │   └── ScoreBoard.test.ts # Scoreboard tests
│       │   ├── chat/           # Chat component tests
│       │   │   ├── ChatWindow.test.ts # Chat window tests
│       │   │   ├── MessageList.test.ts # Message list tests
│       │   │   └── UserList.test.ts # User list tests
│       │   └── dashboard/      # Dashboard component tests
│       │       ├── StatsOverview.test.ts # Stats overview tests
│       │       ├── MatchHistory.test.ts # Match history tests
│       │       └── PlayerStats.test.ts # Player stats tests
│       ├── services/           # Frontend service tests
│       │   ├── authService.test.ts # Auth service client tests
│       │   ├── gameService.test.ts # Game service client tests
│       │   ├── chatService.test.ts # Chat service client tests
│       │   └── websocketService.test.ts # WebSocket client tests
│       ├── stores/             # State management tests
│       │   ├── authStore.test.ts # Auth store tests
│       │   ├── gameStore.test.ts # Game store tests
│       │   ├── chatStore.test.ts # Chat store tests
│       │   └── userStore.test.ts # User store tests
│       └── game/               # Game engine tests
│           ├── engines/        # Game engine tests
│           │   ├── pong/       # Pong engine tests
│           │   │   ├── PongEngine.test.ts # Pong engine tests
│           │   │   ├── PongPhysics.test.ts # Pong physics tests
│           │   │   └── PongAI.test.ts # Pong AI tests
│           │   └── racer/      # Racer engine tests
│           │       ├── RacerEngine.test.ts # Racer engine tests
│           │       ├── RacerPhysics.test.ts # Racer physics tests
│           │       └── RacerAI.test.ts # Racer AI tests
│           ├── entities/       # Entity tests
│           │   ├── Player.test.ts # Player entity tests
│           │   ├── Ball.test.ts # Ball entity tests
│           │   ├── Paddle.test.ts # Paddle entity tests
│           │   └── PowerUp.test.ts # PowerUp entity tests
│           ├── systems/        # System tests
│           │   ├── PhysicsSystem.test.ts # Physics system tests
│           │   ├── RenderSystem.test.ts # Render system tests
│           │   ├── InputSystem.test.ts # Input system tests
│           │   └── CollisionSystem.test.ts # Collision system tests
│           └── managers/       # Manager tests
│               ├── SceneManager.test.ts # Scene manager tests
│               ├── InputManager.test.ts # Input manager tests
│               └── AssetManager.test.ts # Asset manager tests
├── integration/                # Integration Tests
│   ├── api/                    # API integration tests
│   │   ├── auth.integration.test.ts # Auth API integration
│   │   ├── game.integration.test.ts # Game API integration
│   │   ├── chat.integration.test.ts # Chat API integration
│   │   └── user.integration.test.ts # User API integration
│   ├── database/               # Database integration tests
│   │   ├── migrations.test.ts  # Migration tests
│   │   ├── seeds.test.ts       # Seed data tests
│   │   ├── relationships.test.ts # Table relationship tests
│   │   └── performance.test.ts # Database performance tests
│   ├── websocket/              # WebSocket integration tests
│   │   ├── connections.test.ts # Connection flow tests
│   │   ├── events.test.ts      # Event flow tests
│   │   ├── rooms.test.ts       # Room functionality tests
│   │   └── broadcasting.test.ts # Message broadcasting tests
│   ├── services/               # Cross-service integration
│   │   ├── auth-user.test.ts   # Auth + User service integration
│   │   ├── game-chat.test.ts   # Game + Chat integration
│   │   ├── game-websocket.test.ts # Game + WebSocket integration
│   │   └── user-chat.test.ts   # User + Chat integration
│   └── security/               # Security integration tests
│       ├── authentication.test.ts # Auth flow tests
│       ├── authorization.test.ts # Permission tests
│       ├── jwt.test.ts         # JWT integration tests
│       └── oauth.test.ts       # OAuth integration tests
├── e2e/                        # End-to-End Tests
│   ├── playwright.config.ts    # Playwright configuration
│   ├── auth/                   # Authentication E2E tests
│   │   ├── login.e2e.test.ts   # Login flow E2E
│   │   ├── register.e2e.test.ts # Registration flow E2E
│   │   ├── twofa.e2e.test.ts   # 2FA flow E2E
│   │   └── oauth.e2e.test.ts   # OAuth flow E2E
│   ├── game/                   # Game E2E tests
│   │   ├── pong.e2e.test.ts    # Pong gameplay E2E
│   │   ├── racer.e2e.test.ts   # Racer gameplay E2E
│   │   ├── multiplayer.e2e.test.ts # Multiplayer E2E
│   │   ├── tournament.e2e.test.ts # Tournament E2E
│   │   └── ai.e2e.test.ts      # AI opponent E2E
│   ├── chat/                   # Chat E2E tests
│   │   ├── messaging.e2e.test.ts # Chat messaging E2E
│   │   ├── rooms.e2e.test.ts   # Chat rooms E2E
│   │   ├── moderation.e2e.test.ts # Chat moderation E2E
│   │   └── invitations.e2e.test.ts # Game invitations E2E
│   ├── user/                   # User management E2E tests
│   │   ├── profile.e2e.test.ts # Profile management E2E
│   │   ├── friends.e2e.test.ts # Friends system E2E
│   │   ├── dashboard.e2e.test.ts # Stats dashboard E2E
│   │   └── settings.e2e.test.ts # User settings E2E
│   └── scenarios/              # Complex user scenarios
│       ├── fullGameSession.e2e.test.ts # Complete game session
│       ├── tournamentFlow.e2e.test.ts # Full tournament flow
│       ├── friendsAndChat.e2e.test.ts # Social features flow
│       └── newUserJourney.e2e.test.ts # New user experience
└── utils/                      # Test Utilities and Helpers
    ├── mocks/                  # Mock implementations
    │   ├── mockDatabase.ts     # Database mocks
    │   ├── mockRedis.ts        # Redis mocks
    │   ├── mockWebSocket.ts    # WebSocket mocks
    │   ├── mockAuth.ts         # Auth mocks
    │   └── mockServices.ts     # Service mocks
    ├── fixtures/               # Test data fixtures
    │   ├── users.fixture.ts    # User test data
    │   ├── games.fixture.ts    # Game test data
    │   ├── tournaments.fixture.ts # Tournament test data
    │   ├── messages.fixture.ts # Chat message data
    │   └── stats.fixture.ts    # Statistics test data
    ├── helpers/                # Test helper functions
    │   ├── testDatabase.ts     # Database test helpers
    │   ├── testAuth.ts         # Auth test helpers
    │   ├── testWebSocket.ts    # WebSocket test helpers
    │   ├── testGame.ts         # Game test helpers
    │   └── testChat.ts         # Chat test helpers
    ├── factories/              # Data factories
    │   ├── userFactory.ts      # User data factory
    │   ├── gameFactory.ts      # Game data factory
    │   ├── tournamentFactory.ts # Tournament data factory
    │   ├── messageFactory.ts   # Message data factory
    │   └── matchFactory.ts     # Match data factory
    └── config/                 # Test configuration
        ├── jest.unit.config.js # Unit test configuration
        ├── jest.integration.config.js # Integration test config
        ├── jest.e2e.config.js  # E2E test configuration
        └── testEnvironment.ts  # Test environment setup
```

**Total Test Files**: ~285 files  
**Coverage**: Unit tests for all components, Integration tests for cross-service communication, E2E tests for user workflows  
**Tools**: Jest for unit/integration tests, Playwright for E2E tests