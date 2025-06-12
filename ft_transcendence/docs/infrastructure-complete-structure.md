# 🔧 Infrastructure - Complete File Structure

```
infrastructure/                 # Infrastructure Services
├── redis/                      # Redis Cache + PubSub
│   ├── redis.conf              # Redis configuration
│   ├── Dockerfile              # Custom Redis setup
│   └── scripts/                # Redis setup scripts
│       ├── init.sh             # Redis initialization
│       └── backup.sh           # Redis backup script
├── database/                   # SQLite Database
│   ├── migrations/             # Database migrations
│   │   ├── 001_initial_schema.sql # Initial database schema
│   │   ├── 002_add_tournaments.sql # Tournament tables
│   │   ├── 003_add_chat.sql    # Chat tables
│   │   ├── 004_add_friends.sql # Friends system tables
│   │   ├── 005_add_stats.sql   # Statistics tables
│   │   ├── 006_add_achievements.sql # Achievement system
│   │   └── 007_add_indexes.sql # Performance indexes
│   ├── seeds/                  # Initial data
│   │   ├── users.sql           # Sample user data
│   │   ├── games.sql           # Sample game data
│   │   ├── tournaments.sql     # Sample tournament data
│   │   └── achievements.sql    # Achievement definitions
│   ├── setup.sql               # Database schema
│   ├── triggers.sql            # Database triggers
│   ├── procedures.sql          # Stored procedures
│   └── views.sql               # Database views
└── monitoring/                 # Prometheus + Grafana
    ├── prometheus/
    │   ├── prometheus.yml      # Prometheus configuration
    │   ├── alerts.yml          # Alert rules
    │   ├── recording_rules.yml # Recording rules
    │   └── targets.json        # Scrape targets
    ├── grafana/
    │   ├── grafana.ini         # Grafana configuration
    │   ├── provisioning/       # Automated provisioning
    │   │   ├── datasources/    # Data source configurations
    │   │   │   └── prometheus.yml # Prometheus datasource
    │   │   └── dashboards/     # Dashboard configurations
    │   │       ├── dashboard.yml # Dashboard provider
    │   │       ├── system.json # System metrics dashboard
    │   │       ├── application.json # App metrics dashboard
    │   │       ├── game.json   # Game metrics dashboard
    │   │       ├── user.json   # User metrics dashboard
    │   │       └── chat.json   # Chat metrics dashboard
    │   └── plugins/            # Grafana plugins
    └── alertmanager/           # Alert Manager
        ├── alertmanager.yml    # Alert manager configuration
        ├── templates/          # Alert templates
        │   ├── email.tmpl      # Email alert template
        │   └── slack.tmpl      # Slack alert template
        └── silence/            # Alert silencing rules
```

**Total Infrastructure Files**: ~22 files  
**Components**: Redis, SQLite, Prometheus, Grafana, AlertManager  
**Purpose**: Caching, persistence, monitoring, alerting