# 🎨 Frontend - Complete File Structure

```
frontend/                       # TypeScript + Vite + Babylon.js
├── Dockerfile                  # Frontend container configuration
├── package.json                # Frontend dependencies
├── tsconfig.json               # Frontend TypeScript configuration
├── vite.config.ts              # Vite build tool configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration for Tailwind
├── index.html                  # Main HTML entry point
├── src/
│   ├── main.ts                 # Application entry point
│   ├── App.ts                  # Main application component
│   ├── router.ts               # Client-side routing configuration
│   ├── style.css               # Global styles
│   ├── components/             # UI components
│   │   ├── common/             # Shared UI components
│   │   │   ├── Button.ts       # Reusable button component
│   │   │   ├── Modal.ts        # Modal dialog component
│   │   │   ├── Loader.ts       # Loading spinner component
│   │   │   ├── Notification.ts # Toast notification component
│   │   │   └── Layout.ts       # Main layout component
│   │   ├── auth/               # Authentication UI components
│   │   │   ├── LoginForm.ts    # Login form component
│   │   │   ├── RegisterForm.ts # Registration form component
│   │   │   ├── TwoFactorAuth.ts # 2FA verification component
│   │   │   ├── GoogleAuth.ts   # Google OAuth button component
│   │   │   └── AuthGuard.ts    # Authentication route guard
│   │   ├── game/               # Game UI components
│   │   │   ├── GameCanvas.ts   # 3D game rendering canvas
│   │   │   ├── GameControls.ts # Game control interface
│   │   │   ├── GameLobby.ts    # Pre-game lobby component
│   │   │   ├── GameHUD.ts      # In-game heads-up display
│   │   │   ├── ScoreBoard.ts   # Real-time score display
│   │   │   ├── PowerUpMenu.ts  # Power-up selection interface
│   │   │   └── GameSettings.ts # Game customization options
│   │   ├── chat/               # Chat interface components
│   │   │   ├── ChatWindow.ts   # Main chat interface
│   │   │   ├── MessageList.ts  # Chat message display
│   │   │   ├── MessageInput.ts # Message composition input
│   │   │   ├── UserList.ts     # Online users sidebar
│   │   │   ├── ChatRoom.ts     # Chat room component
│   │   │   └── EmojiPicker.ts  # Emoji selection component
│   │   ├── dashboard/          # Stats dashboard components
│   │   │   ├── StatsOverview.ts # Main statistics overview
│   │   │   ├── MatchHistory.ts # Game history display
│   │   │   ├── PlayerStats.ts  # Individual player statistics
│   │   │   ├── Leaderboard.ts  # Global rankings component
│   │   │   ├── Charts.ts       # Statistics charts component
│   │   │   └── Achievements.ts # User achievements display
│   │   ├── tournament/         # Tournament UI components
│   │   │   ├── TournamentBracket.ts # Tournament bracket display
│   │   │   ├── TournamentLobby.ts # Tournament waiting room
│   │   │   ├── TournamentCreate.ts # Tournament creation form
│   │   │   └── TournamentList.ts # Available tournaments list
│   │   └── profile/            # User profile components
│   │       ├── UserProfile.ts  # User profile display
│   │       ├── ProfileEdit.ts  # Profile editing form
│   │       ├── AvatarUpload.ts # Avatar upload component
│   │       ├── FriendsList.ts  # Friends management
│   │       └── Settings.ts     # User settings panel
│   ├── game/                   # Game logic and 3D rendering
│   │   ├── GameManager.ts      # Main game manager
│   │   ├── engines/            # Game engines (Pong, Racer)
│   │   │   ├── BaseEngine.ts   # Abstract base game engine
│   │   │   ├── pong/           # 3D Pong engine
│   │   │   │   ├── PongEngine.ts # Main Pong game engine
│   │   │   │   ├── PongScene.ts # 3D scene setup for Pong
│   │   │   │   ├── PongPhysics.ts # Pong physics calculations
│   │   │   │   ├── PongRenderer.ts # Pong 3D rendering logic
│   │   │   │   ├── PongAI.ts   # Pong AI opponent logic
│   │   │   │   └── PongPowerUps.ts # Pong power-ups system
│   │   │   └── racer/          # Star Wars Racer engine
│   │   │       ├── RacerEngine.ts # Main racing game engine
│   │   │       ├── RacerScene.ts # 3D racing scene setup
│   │   │       ├── RacerPhysics.ts # Racing physics simulation
│   │   │       ├── RacerRenderer.ts # Racing 3D rendering
│   │   │       ├── RacerAI.ts  # Racing AI opponents
│   │   │       ├── RacerTrack.ts # Race track generation
│   │   │       └── RacerPods.ts # Pod racer entities
│   │   ├── entities/           # Game entities (Player, Ball, AI)
│   │   │   ├── Entity.ts       # Base entity class
│   │   │   ├── Player.ts       # Player entity implementation
│   │   │   ├── Ball.ts         # Ball/projectile entity
│   │   │   ├── Paddle.ts       # Pong paddle entity
│   │   │   ├── Obstacle.ts     # Game obstacle entities
│   │   │   ├── PowerUp.ts      # Power-up collectible entities
│   │   │   └── Particle.ts     # Particle effects system
│   │   ├── systems/            # ECS systems (Physics, Render)
│   │   │   ├── PhysicsSystem.ts # Physics calculations system
│   │   │   ├── RenderSystem.ts # 3D rendering system
│   │   │   ├── InputSystem.ts  # Input handling system
│   │   │   ├── AudioSystem.ts  # Audio effects system
│   │   │   ├── NetworkSystem.ts # Network synchronization
│   │   │   ├── CollisionSystem.ts # Collision detection
│   │   │   └── AnimationSystem.ts # Animation management
│   │   ├── ai/                 # AI opponent logic
│   │   │   ├── BaseAI.ts       # Abstract AI base class
│   │   │   ├── PongAI.ts       # Pong-specific AI implementation
│   │   │   ├── RacerAI.ts      # Racing AI implementation
│   │   │   ├── AIBehaviors.ts  # AI behavior patterns
│   │   │   ├── AIDecisionTree.ts # AI decision making logic
│   │   │   └── AIDifficulty.ts # AI difficulty scaling
│   │   ├── managers/           # Scene, Input, Asset managers
│   │   │   ├── SceneManager.ts # 3D scene management
│   │   │   ├── InputManager.ts # User input handling
│   │   │   ├── AssetManager.ts # 3D assets loading
│   │   │   ├── AudioManager.ts # Audio assets management
│   │   │   ├── CameraManager.ts # Camera control system
│   │   │   ├── LightManager.ts # Lighting system management
│   │   │   └── EffectManager.ts # Visual effects management
│   │   └── utils/              # Game utility functions
│   │       ├── MathUtils.ts    # Mathematical calculations
│   │       ├── GeometryUtils.ts # 3D geometry utilities
│   │       ├── ColorUtils.ts   # Color manipulation utilities
│   │       ├── TimingUtils.ts  # Game timing utilities
│   │       └── PerformanceUtils.ts # Performance optimization
│   ├── services/               # API clients for microservices
│   │   ├── BaseService.ts      # Base API service class
│   │   ├── authService.ts      # Auth service client
│   │   ├── gameService.ts      # Game service client
│   │   ├── chatService.ts      # Chat service client
│   │   ├── userService.ts      # User service client
│   │   ├── websocketService.ts # WebSocket client manager
│   │   ├── tournamentService.ts # Tournament service client
│   │   ├── matchmakingService.ts # Matchmaking service client
│   │   └── monitoringService.ts # Monitoring service client
│   ├── stores/                 # State management
│   │   ├── BaseStore.ts        # Base store implementation
│   │   ├── authStore.ts        # Authentication state management
│   │   ├── gameStore.ts        # Game state management
│   │   ├── chatStore.ts        # Chat state management
│   │   ├── userStore.ts        # User data state management
│   │   ├── tournamentStore.ts  # Tournament state management
│   │   ├── notificationStore.ts # Notification state management
│   │   └── settingsStore.ts    # App settings state management
│   ├── utils/                  # Helper functions
│   │   ├── validators.ts       # Input validation functions
│   │   ├── formatters.ts       # Data formatting utilities
│   │   ├── constants.ts        # Application constants
│   │   ├── config.ts           # Frontend configuration
│   │   ├── localStorage.ts     # Local storage utilities
│   │   ├── dateUtils.ts        # Date manipulation utilities
│   │   ├── errorHandling.ts    # Error handling utilities
│   │   └── deviceDetection.ts  # Device capability detection
│   └── types/                  # Frontend TypeScript types
│       ├── global.d.ts         # Global type definitions
│       ├── game.types.ts       # Game-related type definitions
│       ├── auth.types.ts       # Authentication type definitions
│       ├── chat.types.ts       # Chat type definitions
│       ├── user.types.ts       # User type definitions
│       └── api.types.ts        # API response type definitions
├── public/                     # Static assets
│   ├── favicon.ico             # Website favicon
│   ├── manifest.json           # PWA manifest
│   ├── robots.txt              # SEO robots file
│   ├── assets/                 # Static assets
│   │   ├── images/             # Image assets
│   │   │   ├── logo.png        # Application logo
│   │   │   ├── icons/          # UI icons
│   │   │   └── backgrounds/    # Background images
│   │   ├── sounds/             # Audio assets
│   │   │   ├── sfx/            # Sound effects
│   │   │   └── music/          # Background music
│   │   └── models/             # 3D model assets
│   │       ├── pong/           # Pong 3D models
│   │       └── racer/          # Racing 3D models
│   └── locales/                # Internationalization files
│       ├── en.json             # English translations
│       ├── fr.json             # French translations
│       └── es.json             # Spanish translations
└── 


**Total Frontend Files**: ~125 files  
**Key Technologies**: TypeScript, Vite, Tailwind CSS, Babylon.js  
**Main Features**: 3D Pong, Star Wars Racer, Live Chat, Real-time Multiplayer