# 📚 Shared Libraries - Complete File Structure

```
shared/                         # Shared Libraries
├── package.json                # Shared library dependencies
├── tsconfig.json               # Shared TypeScript configuration
├── src/
│   ├── types/                  # TypeScript interfaces
│   │   ├── auth.types.ts       # Auth-related types
│   │   ├── game.types.ts       # Game-related types
│   │   ├── chat.types.ts       # Chat-related types
│   │   ├── user.types.ts       # User-related types
│   │   ├── websocket.types.ts  # WebSocket types
│   │   ├── tournament.types.ts # Tournament types
│   │   ├── api.types.ts        # API response types
│   │   └── common.types.ts     # Common utility types
│   ├── events/                 # Event definitions
│   │   ├── gameEvents.ts       # Game event definitions
│   │   ├── chatEvents.ts       # Chat event definitions
│   │   ├── userEvents.ts       # User event definitions
│   │   ├── authEvents.ts       # Auth event definitions
│   │   ├── tournamentEvents.ts # Tournament event definitions
│   │   └── systemEvents.ts     # System event definitions
│   ├── utils/                  # Common utilities
│   │   ├── validation.ts       # Input validation schemas
│   │   ├── errors.ts           # Error handling classes
│   │   ├── constants.ts        # Application constants
│   │   ├── formatters.ts       # Data formatting utilities
│   │   ├── dateUtils.ts        # Date manipulation utilities
│   │   ├── mathUtils.ts        # Mathematical utilities
│   │   ├── stringUtils.ts      # String manipulation utilities
│   │   └── cryptoUtils.ts      # Cryptographic utilities
│   ├── enums/                  # Shared enumerations
│   │   ├── gameEnums.ts        # Game-related enums
│   │   ├── userEnums.ts        # User-related enums
│   │   ├── authEnums.ts        # Auth-related enums
│   │   ├── chatEnums.ts        # Chat-related enums
│   │   └── systemEnums.ts      # System enums
│   └── config/                 # Shared configuration
│       ├── database.ts         # Database configuration
│       ├── redis.ts            # Redis configuration
│       ├── environment.ts      # Environment configuration
│       ├── security.ts         # Security configuration
│       └── monitoring.ts       # Monitoring configuration
└── build/                      # Compiled shared library
```

**Total Shared Files**: ~32 files  
**Purpose**: Common types, utilities, configuration shared across all services  
**Build**: Compiled to distributable package