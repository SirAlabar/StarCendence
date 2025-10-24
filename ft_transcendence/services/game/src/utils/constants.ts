// Game Service Constants

export const GAME_CONFIG = {
  // Server Configuration
  PORT: 3002,
  SERVICE_NAME: 'game-service',
  
  // Service URLs (internal network)
  SERVICES: {
    WEBSOCKET: 'http://websocket-service:3005',
    AUTH: 'http://auth-service:3001',
    USER: 'http://user-service:3004',
  },

  // Redis Configuration
  REDIS: {
    HOST: 'redis',
    PORT: 6379,
    CHANNELS: {
      GAME_UPDATES: 'game:*:updates',
      GAME_EVENTS: 'game:*:events',
      GAME_CHAT: 'game:*:chat',
      TOURNAMENT_UPDATES: 'tournament:*',
    },
  },

  // Database Configuration
  DATABASE: {
    PATH: '/app/data/game.db',
    URL: 'file:/app/data/game.db',
  },

  // Game Loop Configuration
  GAME_LOOP: {
    TICK_RATE: 60, // 60 FPS
    TICK_INTERVAL: 1000 / 60, // ~16.67ms
    MAX_DELTA_TIME: 100, // Maximum delta time in ms
  },

  // Player Configuration
  PLAYERS: {
    MIN_PER_GAME: 2,
    MAX_PER_GAME: 4,
    DISCONNECT_TIMEOUT: 30000, // 30 seconds
  },

  // Session Configuration
  SESSION: {
    TIMEOUT: 1800000, // 30 minutes
    CLEANUP_INTERVAL: 60000, // 1 minute
  },

  // Pong Game Configuration
  PONG: {
    CANVAS: {
      WIDTH: 800,
      HEIGHT: 600,
    },
    PADDLE: {
      WIDTH: 10,
      HEIGHT: 100,
      SPEED: 5,
      OFFSET: 20, // Distance from edge
    },
    BALL: {
      RADIUS: 8,
      INITIAL_SPEED: 5,
      MAX_SPEED: 15,
      SPEED_INCREMENT: 0.5,
    },
    GAME: {
      MAX_SCORE: 5,
      COUNTDOWN_SECONDS: 3,
    },
  },

  // Racer Game Configuration
  RACER: {
    PHYSICS: {
      MAX_SPEED: 200,
      ACCELERATION: 5,
      DECELERATION: 3,
      TURN_SPEED: 2,
      POSITION_TOLERANCE: 10, // For validation
    },
    TRACK: {
      LAP_COUNT: 3,
      CHECKPOINT_COUNT: 8,
      VALIDATION_INTERVAL: 100, // Validate every 100ms
    },
  },

  // Validation Thresholds
  VALIDATION: {
    MAX_POSITION_DELTA: 50, // Maximum position change per tick
    MAX_SPEED_DELTA: 10, // Maximum speed change per tick
    MAX_ROTATION_DELTA: Math.PI / 4, // Maximum rotation per tick
  },

  // API Rate Limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 100,
    MAX_GAME_ACTIONS_PER_SECOND: 60,
  },
} as const;

// Game Types Enum
export enum GameType {
  PONG = 'PONG',
  RACER = 'RACER',
}

// Game Mode Enum
export enum GameMode {
  MULTIPLAYER_2P = 'MULTIPLAYER_2P',
  MULTIPLAYER_3P = 'MULTIPLAYER_3P',
  MULTIPLAYER_4P = 'MULTIPLAYER_4P',
  TOURNAMENT = 'TOURNAMENT',
}

// Game Status Enum
export enum GameStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  STARTING = 'STARTING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

// Player Role Enum
export enum PlayerRole {
  PLAYER1 = 'PLAYER1',
  PLAYER2 = 'PLAYER2',
  PLAYER3 = 'PLAYER3',
  PLAYER4 = 'PLAYER4',
  SPECTATOR = 'SPECTATOR',
}

// Tournament Status Enum
export enum TournamentStatus {
  PENDING = 'PENDING',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GAME_NOT_FOUND: 'Game not found',
  GAME_FULL: 'Game is full',
  GAME_ALREADY_STARTED: 'Game has already started',
  PLAYER_NOT_IN_GAME: 'Player is not in this game',
  INVALID_MOVE: 'Invalid move',
  INVALID_GAME_STATE: 'Invalid game state',
  NOT_ENOUGH_PLAYERS: 'Not enough players to start game',
  UNAUTHORIZED: 'Unauthorized',
  INTERNAL_ERROR: 'Internal server error',
} as const;
