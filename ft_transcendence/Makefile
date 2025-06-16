################################################################################
#                                     CONFIG                                   #
################################################################################

NAME = ft_transcendence
COMPOSE_FILE = docker-compose.yml
ENV_FILE = .env

# Docker configuration
DOCKER_COMPOSE = docker compose
DOCKER = docker

# Colors for output
DEFAULT = \033[0m
RED     = \033[1;31m
GREEN   = \033[1;32m
YELLOW  = \033[1;33m
BLUE    = \033[1;34m
PURPLE  = \033[1;35m
CYAN    = \033[1;36m
WHITE   = \033[1;37m

# Directories
DATA_DIR = data
NGINX_DIR = nginx
REDIS_DIR = redis
PUBLIC_DIR = public
SERVICES_DIR = services
LOGS_DIR = logs

# Database files
AUTH_DB = $(DATA_DIR)/auth.sqlite
GAME_DB = $(DATA_DIR)/game.sqlite
CHAT_DB = $(DATA_DIR)/chat.sqlite
USER_DB = $(DATA_DIR)/user.sqlite

################################################################################
#                                 ASCII ART                                    #
################################################################################

define show_logo
	@printf "$(CYAN)                     \`. ___$(DEFAULT)\n"
	@printf "$(CYAN)                    __,' __\`.                _..----....____$(DEFAULT)\n"
	@printf "$(CYAN)        __...--.'^\`\`; .   ,.   ;\`\`--..__     .'    ,-._    _.-'$(DEFAULT)\n"
	@printf "$(CYAN)  _..-''-------'   \`'   \`'   \`'     O \`\`-''._   (,;') _,'$(DEFAULT)\n"
	@printf "$(CYAN),'________________                          \\\`-._\`-','$(DEFAULT)\n"
	@printf "$(CYAN) \`._              \`\`\`\`\`\`\`\`\`\`\`\`\`------...___   '-.._'-:$(DEFAULT)\n"
	@printf "$(CYAN)    \`\`\`--.._      ,.                     \`\`\`\`--...__\\-.$(DEFAULT)\n"
	@printf "$(CYAN)            \`.--. \`-\`                       ____    |  |\`$(DEFAULT)\n"
	@printf "$(CYAN)              \`. \`.                       ,'\`\`\`\`\`.  ;  ;\`$(DEFAULT)\n"
	@printf "$(CYAN)                \`._\`.        __________   \`.      \\'__/\`$(DEFAULT)\n"
	@printf "$(CYAN)                   \`-:._____/______/___/____\`.     \\  \`$(DEFAULT)\n"
	@printf "$(CYAN)                               |       \`._    \`.    \\ \n"
	@printf "$(CYAN)                               \`._________\`-.   \`.   \`.___$(DEFAULT)\n"
	@printf "$(CYAN)                                                 \`------'\`$(DEFAULT)\n"
	@printf "$(YELLOW)        ft_transcendence - The Ultimate Pong Experience$(DEFAULT)\n\n"
endef

################################################################################
#                              MAIN RULES                                      #
################################################################################

.PHONY: all
all: setup

# Default help target
.PHONY: help
help:
	$(call show_logo)
	@printf "$(BLUE)🏓 ft_transcendence Development Commands$(DEFAULT)\n\n"
	@printf "$(YELLOW)🚀 Setup & Start:$(DEFAULT)\n"
	@printf "  $(GREEN)make setup$(DEFAULT)        - Initialize project (first time)\n"
	@printf "  $(GREEN)make start$(DEFAULT)        - Start infrastructure (nginx + redis)\n"
	@printf "  $(GREEN)make stop$(DEFAULT)         - Stop all services\n"
	@printf "  $(GREEN)make restart$(DEFAULT)      - Restart all services\n\n"
	@printf "$(YELLOW)🛠️  Development:$(DEFAULT)\n"
	@printf "  $(GREEN)make dev$(DEFAULT)          - Start with logs (development mode)\n"
	@printf "  $(GREEN)make build$(DEFAULT)        - Build all containers\n"
	@printf "  $(GREEN)make rebuild$(DEFAULT)      - Force rebuild all containers\n\n"
	@printf "$(YELLOW)📊 Monitoring:$(DEFAULT)\n"
	@printf "  $(GREEN)make logs$(DEFAULT)         - View container logs\n"
	@printf "  $(GREEN)make health$(DEFAULT)       - Check service health\n"
	@printf "  $(GREEN)make status$(DEFAULT)       - Show container status\n"
	@printf "  $(GREEN)make ps$(DEFAULT)           - Show running containers\n\n"
	@printf "$(YELLOW)💾 Database:$(DEFAULT)\n"
	@printf "  $(GREEN)make db-create$(DEFAULT)    - Create databases\n"
	@printf "  $(GREEN)make db-migrate$(DEFAULT)   - Run database migrations\n"
	@printf "  $(GREEN)make db-seed$(DEFAULT)      - Seed test data\n"
	@printf "  $(GREEN)make db-reset$(DEFAULT)     - Reset all databases\n\n"
	@printf "$(YELLOW)🧹 Maintenance:$(DEFAULT)\n"
	@printf "  $(GREEN)make clean$(DEFAULT)        - Clean containers and images\n"
	@printf "  $(GREEN)make fclean$(DEFAULT)       - Nuclear clean (removes data)\n"
	@printf "  $(GREEN)make prune$(DEFAULT)        - Docker system cleanup\n\n"
	@printf "$(YELLOW)🔧 Utilities:$(DEFAULT)\n"
	@printf "  $(GREEN)make shell-nginx$(DEFAULT)  - Enter nginx container\n"
	@printf "  $(GREEN)make shell-redis$(DEFAULT)  - Enter redis container\n"
	@printf "  $(GREEN)make backup$(DEFAULT)       - Backup databases\n"
	@printf "  $(GREEN)make restore$(DEFAULT)      - Restore databases\n\n"
	@printf "$(CYAN)🌐 Access Points:$(DEFAULT)\n"
	@printf "  Frontend:     $(YELLOW)https://localhost$(DEFAULT)\n"
	@printf "  Redis:        $(YELLOW)localhost:6379$(DEFAULT)\n"
	@printf "  Health:       $(YELLOW)https://localhost/health$(DEFAULT)\n\n"

################################################################################
#                               SETUP RULES                                    #
################################################################################

.PHONY: setup
setup:
	$(call show_logo)
	@printf "$(BLUE)🚀 Setting up ft_transcendence infrastructure...$(DEFAULT)\n\n"
	@printf "$(CYAN)Creating directories...$(DEFAULT)\n"
	@mkdir -p $(DATA_DIR) $(NGINX_DIR)/logs $(NGINX_DIR)/certs $(REDIS_DIR) $(PUBLIC_DIR) $(SERVICES_DIR) $(LOGS_DIR)
	@printf "$(CYAN)Creating Docker volume directories...$(DEFAULT)\n"
	@mkdir -p $(HOME)/data/frontend $(HOME)/data/redis $(HOME)/data/auth $(HOME)/data/game $(HOME)/data/chat $(HOME)/data/user
	@printf "$(CYAN)Setting up environment...$(DEFAULT)\n"
	@if [ ! -f $(ENV_FILE) ]; then cp $(ENV_FILE).example $(ENV_FILE) 2>/dev/null || touch $(ENV_FILE); fi
	@printf "$(CYAN)Creating databases...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory db-create
	@printf "$(CYAN)Building containers...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build
	@printf "$(CYAN)Running migrations...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory db-migrate
	@printf "$(CYAN)Starting services...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d
	@printf "$(CYAN)Waiting for services...$(DEFAULT)\n"
	@sleep 3
	@printf "$(CYAN)Health check...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory health-quiet
	@printf "$(GREEN)🎉 ft_transcendence is ready!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: https://localhost$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:6379$(DEFAULT)\n\n"

################################################################################
#                            INFRASTRUCTURE RULES                              #
################################################################################

.PHONY: start
start:
	@printf "$(GREEN)🔥 Starting ft_transcendence infrastructure...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d
	@printf "$(GREEN)✅ Infrastructure started!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: https://localhost$(DEFAULT)\n"
	@$(MAKE) --no-print-directory health

.PHONY: stop
stop:
	@printf "$(YELLOW)🛑 Stopping ft_transcendence infrastructure...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down
	@printf "$(GREEN)✅ Infrastructure stopped!$(DEFAULT)\n"

.PHONY: restart
restart: stop start

.PHONY: dev
dev: start
	@printf "$(GREEN)🛠️  Development mode started!$(DEFAULT)\n"
	@printf "$(YELLOW)📂 Edit files in public/ to see changes$(DEFAULT)\n"
	@printf "$(YELLOW)🔍 Watching logs (Ctrl+C to exit)...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory logs

.PHONY: build
build:
	@printf "$(GREEN)🔨 Building containers...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build
	@printf "$(GREEN)✅ Build complete!$(DEFAULT)\n"

.PHONY: rebuild
rebuild:
	@printf "$(GREEN)🔨 Force rebuilding containers...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build --no-cache
	@printf "$(GREEN)✅ Rebuild complete!$(DEFAULT)\n"

.PHONY: re
re: clean setup
	@printf "$(GREEN)♻️  Complete rebuild finished!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: https://localhost$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:6379$(DEFAULT)\n"

################################################################################
#                             DATABASE RULES                                   #
################################################################################

.PHONY: db-create
db-create:
	@if [ ! -f .db_created ]; then \
		printf "$(PURPLE)💾 Creating SQLite databases...$(DEFAULT)\n"; \
		touch $(AUTH_DB) $(GAME_DB) $(CHAT_DB) $(USER_DB); \
		touch .db_created; \
		printf "$(GREEN)✅ Databases created!$(DEFAULT)\n"; \
	fi

.PHONY: db-migrate
db-migrate: db-create
	@if [ ! -f .db_migrated ]; then \
		printf "$(PURPLE)🔄 Running database migrations...$(DEFAULT)\n"; \
		if [ -f database/migrations/001_initial_schema.sql ]; then \
			sqlite3 $(AUTH_DB) < database/migrations/001_initial_schema.sql; \
			sqlite3 $(GAME_DB) < database/migrations/002_game_tables.sql 2>/dev/null || true; \
			sqlite3 $(CHAT_DB) < database/migrations/003_chat_tables.sql 2>/dev/null || true; \
			sqlite3 $(USER_DB) < database/migrations/004_user_tables.sql 2>/dev/null || true; \
		fi; \
		touch .db_migrated; \
		printf "$(GREEN)✅ Migrations complete!$(DEFAULT)\n"; \
	fi

.PHONY: db-seed
db-seed: db-migrate
	@printf "$(PURPLE)🌱 Seeding test data...$(DEFAULT)\n"
	@if [ -f database/seeds/users.sql ]; then \
		sqlite3 $(AUTH_DB) < database/seeds/users.sql 2>/dev/null || true; \
		printf "$(GREEN)✅ Test data seeded!$(DEFAULT)\n"; \
	else \
		printf "$(YELLOW)⚠️  No seed files found - using default data from migrations$(DEFAULT)\n"; \
	fi

.PHONY: db-reset
db-reset:
	@printf "$(RED)🗑️  Resetting all databases...$(DEFAULT)\n"
	@rm -f $(AUTH_DB) $(GAME_DB) $(CHAT_DB) $(USER_DB)
	@rm -f .db_created .db_migrated
	@$(MAKE) --no-print-directory db-create db-migrate
	@printf "$(GREEN)✅ Databases reset!$(DEFAULT)\n"

################################################################################
#                             MONITORING RULES                                 #
################################################################################

.PHONY: logs
logs:
	@$(DOCKER_COMPOSE) logs -f

.PHONY: health
health:
	@printf "$(GREEN)🔍 Checking service health...$(DEFAULT)\n"
	@printf "$(YELLOW)Nginx HTTPS:$(DEFAULT) "
	@if curl -k -s -f https://localhost/health > /dev/null 2>&1; then \
		printf "$(GREEN)✅ Online$(DEFAULT)\n"; \
	else \
		printf "$(RED)❌ Offline$(DEFAULT)\n"; \
	fi
	@printf "$(YELLOW)Redis Cache:$(DEFAULT) "
	@if $(DOCKER_COMPOSE) exec -T redis redis-cli ping > /dev/null 2>&1; then \
		printf "$(GREEN)✅ Online$(DEFAULT)\n"; \
	else \
		printf "$(RED)❌ Offline$(DEFAULT)\n"; \
	fi

.PHONY: health-quiet
health-quiet:
	@curl -k -s -f https://localhost/health > /dev/null 2>&1 || exit 1
	@$(DOCKER_COMPOSE) exec -T redis redis-cli ping > /dev/null 2>&1 || exit 1

.PHONY: status
status:
	@printf "$(GREEN)📊 Container status:$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) ps

.PHONY: ps
ps: status

################################################################################
#                              UTILITY RULES                                   #
################################################################################

.PHONY: shell-nginx
shell-nginx:
	@$(DOCKER_COMPOSE) exec nginx sh

.PHONY: shell-redis
shell-redis:
	@$(DOCKER_COMPOSE) exec redis redis-cli

.PHONY: backup
backup:
	@printf "$(BLUE)💾 Creating database backup...$(DEFAULT)\n"
	@mkdir -p backups
	@timestamp=$$(date +%Y%m%d_%H%M%S); \
	tar -czf backups/ft_transcendence_$$timestamp.tar.gz $(DATA_DIR)/*.sqlite 2>/dev/null || true
	@printf "$(GREEN)✅ Backup created in backups/$(DEFAULT)\n"

.PHONY: restore
restore:
	@printf "$(YELLOW)📂 Available backups:$(DEFAULT)\n"
	@ls -la backups/*.tar.gz 2>/dev/null || printf "$(RED)No backups found$(DEFAULT)\n"

################################################################################
#                              CLEANUP RULES                                   #
################################################################################

.PHONY: clean
clean:
	@printf "$(RED)🧹 Cleaning containers and images...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down --remove-orphans
	@$(DOCKER) container prune -f
	@$(DOCKER) image prune -f
	@rm -f .compilation_started .db_created .db_migrated
	@printf "$(GREEN)✅ Cleanup complete!$(DEFAULT)\n"

.PHONY: fclean
fclean:
	@printf "$(RED)💀 Nuclear cleanup (removing all data)...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@$(DOCKER) system prune -af
	@$(DOCKER) volume prune -f
	@rm -rf $(DATA_DIR)/*.sqlite $(NGINX_DIR)/logs/* $(LOGS_DIR)/*
	@rm -f .compilation_started .db_created .db_migrated
	@printf "$(GREEN)✅ Nuclear cleanup complete!$(DEFAULT)\n"

.PHONY: prune
prune:
	@printf "$(YELLOW)🧹 Docker system cleanup...$(DEFAULT)\n"
	@$(DOCKER) system prune -f
	@$(DOCKER) volume prune -f
	@$(DOCKER) network prune -f
	@printf "$(GREEN)✅ Docker cleanup complete!$(DEFAULT)\n"

################################################################################
#                               FUTURE RULES                                   #
################################################################################

# Service development rules (commented for future use)
# .PHONY: service-auth
# service-auth:
# 	@printf "$(BLUE)🔐 Starting Auth service development...$(DEFAULT)\n"
# 	@cd $(SERVICES_DIR)/auth && npm run dev

# .PHONY: service-game
# service-game:
# 	@printf "$(BLUE)🎮 Starting Game service development...$(DEFAULT)\n"
# 	@cd $(SERVICES_DIR)/game && npm run dev

# Testing rules (for future implementation)
# .PHONY: test
# test:
# 	@printf "$(BLUE)🧪 Running tests...$(DEFAULT)\n"
# 	@echo "Tests not implemented yet"

# Production deployment (for future implementation)
# .PHONY: deploy
# deploy:
# 	@printf "$(GREEN)🚀 Production deployment...$(DEFAULT)\n"
# 	@echo "Production deployment not implemented yet"

################################################################################
#                               DEBUG RULES                                    #
################################################################################

.PHONY: debug
debug:
	@printf "$(CYAN)🐛 Debug Information:$(DEFAULT)\n"
	@printf "$(YELLOW)Project:$(DEFAULT) $(NAME)\n"
	@printf "$(YELLOW)Docker Compose:$(DEFAULT) $(shell which $(DOCKER_COMPOSE))\n"
	@printf "$(YELLOW)Docker:$(DEFAULT) $(shell which $(DOCKER))\n"
	@printf "$(YELLOW)Databases:$(DEFAULT)\n"
	@ls -la $(DATA_DIR)/ 2>/dev/null || printf "  No databases found\n"
	@printf "$(YELLOW)Containers:$(DEFAULT)\n"
	@$(DOCKER) ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || printf "  Docker not running\n"

# Show disk usage
.PHONY: disk
disk:
	@printf "$(GREEN)💾 Docker disk usage:$(DEFAULT)\n"
	@$(DOCKER) system df

# Quick setup for development
.PHONY: quick
quick: db-create start health
	@printf "$(GREEN)⚡ Quick setup complete!$(DEFAULT)\n"