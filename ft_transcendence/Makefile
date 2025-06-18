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

# FIXED: Correct directories that actually exist in project
INFRASTRUCTURE_DIR = infrastructure
SERVICES_DIR = servicesD
FRONTEND_DIR = frontend
SHARED_DIR = shared
TESTS_DIR = tests

# FIXED: Docker volume directories (these are the actual bind mount targets)
DOCKER_DATA_DIR = $(HOME)/data
FRONTEND_VOLUME = $(DOCKER_DATA_DIR)/frontend
REDIS_VOLUME = $(DOCKER_DATA_DIR)/redis

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
	@printf "  $(GREEN)make start$(DEFAULT)        - Start infrastructure (nginx + redis + frontend)\n"
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
	@printf "  $(GREEN)make shell-frontend$(DEFAULT) - Enter frontend container\n\n"
	@printf "$(CYAN)🌐 Access Points:$(DEFAULT)\n"
	@printf "  Frontend:     $(YELLOW)http://localhost$(DEFAULT)\n"
	@printf "  Redis:        $(YELLOW)localhost:6379$(DEFAULT)\n"
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
	@printf "$(CYAN)Building containers...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) build
	@printf "$(CYAN)Starting services...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d
	@printf "$(CYAN)Waiting for services...$(DEFAULT)\n"
	@sleep 3
	@printf "$(CYAN)Health check...$(DEFAULT)\n"
	@$(MAKE) --no-print-directory health-quiet
	@printf "$(GREEN)🎉 ft_transcendence is ready!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: http://localhost$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:6379$(DEFAULT)\n\n"

# FIXED: Only create directories that are actually needed for Docker volumes
.PHONY: create-volumes
create-volumes:
	@printf "$(CYAN)Creating Docker bind mount directories...$(DEFAULT)\n"
	@mkdir -p $(FRONTEND_VOLUME)
	@mkdir -p $(REDIS_VOLUME)
	@printf "$(GREEN)✅ Volume directories created:$(DEFAULT)\n"
	@printf "  - $(FRONTEND_VOLUME)\n"
	@printf "  - $(REDIS_VOLUME)\n"

# FIXED: Simple environment setup
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

################################################################################
#                            INFRASTRUCTURE RULES                              #
################################################################################

.PHONY: start
start:
	@printf "$(GREEN)🔥 Starting ft_transcendence infrastructure...$(DEFAULT)\n"
	@$(DOCKER_COMPOSE) up -d
	@printf "$(GREEN)✅ Infrastructure started!$(DEFAULT)\n"
	@printf "$(YELLOW)🌐 Access: http://localhost$(DEFAULT)\n"
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
	@printf "$(YELLOW)📂 Edit files in frontend/ to see changes$(DEFAULT)\n"
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
	@printf "$(YELLOW)🌐 Access: http://localhost$(DEFAULT)\n"
	@printf "$(YELLOW)📊 Redis: localhost:6379$(DEFAULT)\n"

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
	@if curl -s -f http://localhost/health > /dev/null 2>&1; then \
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
	@curl -s -f http://localhost/health > /dev/null 2>&1 || exit 1
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

.PHONY: shell-frontend
shell-frontend:
	@$(DOCKER_COMPOSE) exec frontend sh

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
	@rm -rf $(DOCKER_DATA_DIR)/frontend/* $(DOCKER_DATA_DIR)/redis/*
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