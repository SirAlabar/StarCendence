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
INFRASTRUCTURE_DIR = infrastructure
SERVICES_DIR = servicesD
FRONTEND_DIR = frontend
SHARED_DIR = shared
TESTS_DIR = tests

# Docker volume directories
DOCKER_DATA_DIR = $(HOME)/data
FRONTEND_VOLUME = $(DOCKER_DATA_DIR)/frontend
REDIS_VOLUME = $(DOCKER_DATA_DIR)/redis
USER_VOLUME = $(DOCKER_DATA_DIR)/user
AUTH_VOLUME = $(DOCKER_DATA_DIR)/auth
GAME_VOLUME = $(DOCKER_DATA_DIR)/game
CHAT_VOLUME = $(DOCKER_DATA_DIR)/chat
USER_AVATARS_VOLUME = $(DOCKER_DATA_DIR)/user/avatars
PROMETHEUS_VOLUME = $(DOCKER_DATA_DIR)/prometheus
GRAFANA_VOLUME = $(DOCKER_DATA_DIR)/grafana


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
	@printf "$(YELLOW)🧹 Maintenance:$(DEFAULT)\n"
	@printf "  $(GREEN)make clean$(DEFAULT)        - Clean containers and images\n"
	@printf "  $(GREEN)make fclean$(DEFAULT)       - Nuclear clean (removes data)\n"
	@printf "  $(GREEN)make prune$(DEFAULT)        - Docker system cleanup\n\n"
	@printf "$(YELLOW)🔧 Utilities:$(DEFAULT)\n"
	@printf "  $(GREEN)make shell-nginx$(DEFAULT)  - Enter nginx container\n"
	@printf "  $(GREEN)make shell-redis$(DEFAULT)  - Enter redis container\n"
	@printf "$(CYAN)🌐 Access Points:$(DEFAULT)\n"
	@printf "  Redis:        $(YELLOW)localhost:23111$(DEFAULT)\n"
	@printf "  Health:       $(YELLOW)http://localhost/health$(DEFAULT)\n\n"

################################################################################
#                               SETUP RULES                                    #
################################################################################

.PHONY: setup
setup:
	$(call show_logo)
	@printf "$(BLUE)🚀 Setting up ft_transcendence infrastructure...$(DEFAULT)\n\n"
	@printf "$(CYAN)Creating Docker volume directories...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory create-volumes
	@printf "$(CYAN)Setting up environment...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory setup-env
	@printf "$(CYAN)Building frontend...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory front
	@printf "$(CYAN)Building containers...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build nginx redis user-service auth-service websocket-service game-service chat-service
	@printf "$(CYAN)Starting services...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d nginx redis user-service auth-service websocket-service game-service chat-service
	@printf "$(CYAN)Waiting for services...$(DEFAULT)\n"
	@sleep 5
	@printf "$(CYAN)Pushing database schema...$(DEFAULT)\n"
	@docker compose exec user-service npx prisma db push --skip-generate --accept-data-loss
	@printf "$(CYAN)Seeding database with default users...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory seed-db
	@printf "$(CYAN)Health check...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory health-quiet
	@printf "$(GREEN)🎉 ft_transcendence is ready!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: http://localhost:8080$(DEFAULT)\n"
	@printf "$(YELLOW)🚀 Start tunnel: make tunnel$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:23111$(DEFAULT)\n\n"

monitoring:
	@printf "$(CYAN)Setting up monitoring services...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build prometheus grafana
	@$(DOCKER_COMPOSE) up -d prometheus grafana
	@printf "$(GREEN)✅ Monitoring services started!$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Prometheus: http://localhost:9090$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Grafana: http://localhost:3000$(DEFAULT)\n\n"

.PHONY: create-volumes
create-volumes:
	@printf "$(CYAN)Creating Docker bind mount directories...$(DEFAULT)\n"
	@mkdir -p $(FRONTEND_VOLUME)
	@mkdir -p $(REDIS_VOLUME)
	@mkdir -p $(USER_VOLUME)
	@mkdir -p $(AUTH_VOLUME)
	@mkdir -p $(GAME_VOLUME)
	@mkdir -p $(CHAT_VOLUME)
	@mkdir -p $(USER_AVATARS_VOLUME)
	@mkdir -p $(PROMETHEUS_VOLUME)
	@mkdir -p $(GRAFANA_VOLUME)
	@printf "$(GREEN)✅ Volume directories created:$(DEFAULT)\n"
	@printf "  - $(FRONTEND_VOLUME)\n"
	@printf "  - $(REDIS_VOLUME)\n"
	@printf "  - $(USER_VOLUME)\n"
	@printf "  - $(AUTH_VOLUME)\n"
	@printf "  - $(GAME_VOLUME)\n"
	@printf "  - $(CHAT_VOLUME)\n"
	@printf "  - $(USER_AVATARS_VOLUME)\n"
	@printf "  - $(PROMETHEUS_VOLUME)\n"
	@printf "  - $(GRAFANA_VOLUME)\n"

.PHONY: setup-env
setup-env:
	@if [ ! -f $(ENV_FILE) ]; then \
		printf "$(CYAN)Creating .env file...$(DEFAULT)\n"; \
		echo "# ft_transcendence environment" > $(ENV_FILE); \
		echo "NODE_ENV=development" >> $(ENV_FILE); \
		echo "DOMAIN=localhost" >> $(ENV_FILE); \
		printf "$(GREEN)✅ .env file created$(DEFAULT)\n"; \
	else \
		printf "$(YELLOW)⚠️  .env file already exists$(DEFAULT)\n"; \
	fi

.PHONY: front
front:
	@printf "$(GREEN)🎨 Building frontend...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up --build frontend-builder
	@$(DOCKER_COMPOSE) down frontend-builder
	@printf "$(GREEN)✅ Frontend built and deployed!$(DEFAULT)\n"

.PHONY: tunnel
tunnel:
	@printf "$(GREEN)🌐 Starting Cloudflare tunnel...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) --profile tunnel up -d cloudflared
	@printf "$(GREEN)✅ Tunnel started!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Domain: https://starcendence.dev$(DEFAULT)\n"

.PHONY: logs-tunnel
logs-tunnel:
	@$(DOCKER_COMPOSE) --profile tunnel logs -f cloudflared

.PHONY: stop-tunnel
stop-tunnel:
	@printf "$(YELLOW)🛑 Stopping tunnel...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) --profile tunnel down cloudflared
	@printf "$(GREEN)✅ Tunnel stopped!$(DEFAULT)\n"

################################################################################
#                            INFRASTRUCTURE RULES                              #
################################################################################

.PHONY: start
start:
	@printf "$(GREEN)🔥 Starting ft_transcendence infrastructure...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d nginx redis
	@printf "$(GREEN)✅ Infrastructure started!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: http://localhost:8080$(DEFAULT)\n"
	@$(MAKE) --no-print-directory health

.PHONY: stop
stop:
	@printf "$(YELLOW)🛑 Stopping ft_transcendence infrastructure...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down
	@$(DOCKER_COMPOSE) --profile tunnel down
	@printf "$(GREEN)✅ Infrastructure stopped!$(DEFAULT)\n"

.PHONY: restart
restart: stop start

.PHONY: dev
dev:
	@printf "$(GREEN)🛠️  Starting ft_transcendence in DEVELOPMENT mode...$(DEFAULT)\n"
	@printf "$(CYAN)Setting environment to development...$(DEFAULT)\n"
	@export NODE_ENV=development && \
	$(DOCKER_COMPOSE) up -d \
		redis \
		user-service \
		auth-service \
		nginx \
		frontend-dev
	@printf "$(GREEN)✅ All services are running in development mode!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Frontend (Vite): http://localhost:5173$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Backend (API Gateway via Nginx): http://localhost:8080$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Watching logs (Ctrl+C to exit)...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) logs -f redis user-service auth-service nginx frontend-dev

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
	@printf "$(YELLOW)🌐 Access: http://localhost:8080$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:23111$(DEFAULT)\n"

################################################################################
#                             MONITORING RULES                                 #
################################################################################

.PHONY: logs
logs:
	@$(DOCKER_COMPOSE) logs -f

.PHONY: health
health:
	@printf "$(GREEN)🔍 Checking service health...$(DEFAULT)\n"
	@printf "$(YELLOW)Nginx HTTP:$(DEFAULT) "
	@if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then \
		printf "$(GREEN)✅ Online$(DEFAULT)\n"; \
	else \
		printf "$(RED)❌ Offline$(DEFAULT)\n"; \
	fi
	@printf "$(YELLOW)Redis Cache:$(DEFAULT) "
	@if $(DOCKER_COMPOSE) exec -T redis redis-cli -p 23111 ping > /dev/null 2>&1; then \
		printf "$(GREEN)✅ Online$(DEFAULT)\n"; \
	else \
		printf "$(RED)❌ Offline$(DEFAULT)\n"; \
	fi

.PHONY: health-quiet
health-quiet:
	@curl -s -f http://localhost:8080/health > /dev/null 2>&1 || exit 1
	@$(DOCKER_COMPOSE) exec -T redis redis-cli -p 23111 ping > /dev/null 2>&1 || exit 1

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

.PHONY: seed-db
seed-db:
	@printf "$(CYAN)🌱 Seeding user database...$(DEFAULT)\n"
	@docker compose exec user-service npm run prisma:seed
	@printf "$(CYAN)🌱 Seeding auth database...$(DEFAULT)\n"
	@docker compose exec auth-service npm run prisma:seed
	@printf "$(GREEN)✅ Both databases seeded!$(DEFAULT)\n"

################################################################################
#                              CLEANUP RULES                                   #
################################################################################

.PHONY: clean
clean:
	@printf "$(RED)🧹 Cleaning containers and images...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down --remove-orphans
	@$(DOCKER) container prune -f
	@$(DOCKER) image prune -f
	@printf "$(GREEN)✅ Cleanup complete!$(DEFAULT)\n"

.PHONY: fclean
fclean:
	@printf "$(RED)💀 Nuclear cleanup (removing all data)...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@$(DOCKER) system prune -af
	@$(DOCKER) volume prune -f
	@printf "$(CYAN)Removing data directories...$(DEFAULT)\n"
	@sudo rm -rf $(DOCKER_DATA_DIR)/frontend/* $(DOCKER_DATA_DIR)/redis/* 2>/dev/null || true
	@printf "$(GREEN)✅ Nuclear cleanup complete!$(DEFAULT)\n"

.PHONY: prune
prune:
	@printf "$(YELLOW)🧹 Docker system cleanup...$(DEFAULT)\n"
	@$(DOCKER) system prune -f
	@$(DOCKER) volume prune -f
	@$(DOCKER) network prune -f
	@printf "$(GREEN)✅ Docker cleanup complete!$(DEFAULT)\n"

################################################################################
#                               DEBUG RULES                                    #
################################################################################

.PHONY: debug
debug:
	@printf "$(CYAN)🐛 Debug Information:$(DEFAULT)\n"
	@printf "$(YELLOW)Project:$(DEFAULT) $(NAME)\n"
	@printf "$(YELLOW)Docker Compose:$(DEFAULT) $(shell which $(DOCKER_COMPOSE))\n"
	@printf "$(YELLOW)Docker:$(DEFAULT) $(shell which $(DOCKER))\n"
	@printf "$(YELLOW)Volume directories:$(DEFAULT)\n"
	@ls -la $(DOCKER_DATA_DIR)/ 2>/dev/null || printf "  Volume directory doesn't exist\n"
	@printf "$(YELLOW)Containers:$(DEFAULT)\n"
	@$(DOCKER) ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || printf "  Docker not running\n"

# Show disk usage
.PHONY: disk
disk:
	@printf "$(GREEN)💾 Docker disk usage:$(DEFAULT)\n"
	@$(DOCKER) system df

# Quick setup for development  
.PHONY: quick
quick: create-volumes start health
	@printf "$(GREEN)⚡ Quick setup complete!$(DEFAULT)\n"

################################################################################
#                               BACKEND DEVELOPMENT                            #
################################################################################

.PHONY : user_service_restart auth_service_restart db_clean nginx_service_restart
user_service_restart:
	@printf "$(YELLOW)🔄 Restarting user-service...$(DEFAULT)\n"
	@docker compose build --no-cache user-service
	@docker compose up user-service -d --force-recreate
	@printf "$(GREEN)✅ user-service restarted!$(DEFAULT)\n"

auth_service_restart:
	@printf "$(YELLOW)🔄 Restarting auth-service...$(DEFAULT)\n"
	@docker compose build --no-cache auth-service
	@docker compose up auth-service -d --force-recreate
	@printf "$(GREEN)✅ auth-service restarted!$(DEFAULT)\n"

chat_service_restart:
	@printf "$(YELLOW)🔄 Restarting chat-service...$(DEFAULT)\n"
	@docker compose build --no-cache chat-service
	@docker compose up chat-service -d --force-recreate
	@printf "$(GREEN)✅ chat-service restarted!$(DEFAULT)\n"

nginx_service_restart:
	@printf "$(YELLOW)🔄 Restarting nginx...$(DEFAULT)\n"
	@docker compose build --no-cache nginx
	@docker compose up nginx -d --force-recreate
	@printf "$(GREEN)✅ nginx restarted!$(DEFAULT)\n"

nodemon_restart:
	@printf "$(YELLOW)🔄 Restarting nodemon...$(DEFAULT)\n"
	@docker exec -it transcendence_auth sh -c "PID=$$(lsof -ti :3001); if [ -n \"$$PID\" ]; then kill $$PID; fi"
	@docker exec -it transcendence_user sh -c "PID=$$(lsof -ti :3004); if [ -n \"$$PID\" ]; then kill $$PID; fi"
	@printf "$(GREEN)✅ nodemon restarted!$(DEFAULT)\n"

db_clean:
	@printf "$(YELLOW)🧹 Cleaning all data in user-service...$(DEFAULT)\n"
	@docker compose exec -it user-service sh -c "for tbl in \$$(sqlite3 /app/data/user.db '.tables'); do if [ \"\$$tbl\" != 'sqlite_sequence' ]; then sqlite3 /app/data/user.db \"DELETE FROM '\$$tbl'\"; fi; done; sqlite3 /app/data/user.db 'DELETE FROM sqlite_sequence';"
	@docker compose exec -it auth-service sh -c "for tbl in \$$(sqlite3 /app/data/auth.db '.tables'); do if [ \"\$$tbl\" != 'sqlite_sequence' ]; then sqlite3 /app/data/auth.db \"DELETE FROM '\$$tbl'\"; fi; done;"
	@printf "$(GREEN)✅ All tables cleaned!$(DEFAULT)\n"
	@printf "$(CYAN)Reseeding database with default users...$(DEFAULT)\n"


################################################################################
#                               MONITORING                                     #
################################################################################

prometheus_restart:
	@printf "$(YELLOW)🔄 Restarting prometheus...$(DEFAULT)\n"
	@docker compose build --no-cache prometheus
	@docker compose up prometheus -d --force-recreate
	@printf "$(GREEN)✅ prometheus restarted!$(DEFAULT)\n"

grafana_restart:
	@printf "$(YELLOW)🔄 Restarting grafana...$(DEFAULT)\n"
	@docker compose build --no-cache grafana
	@docker compose up grafana -d --force-recreate
	@printf "$(GREEN)✅ grafana restarted!$(DEFAULT)\n"