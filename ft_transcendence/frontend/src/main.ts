//  Application entry point

import './style.css'

// Type definitions for global variables
declare global {
  const __APP_VERSION__: string
  const __BUILD_TIME__: string
}

/**
 * ft_transcendence - Main Application Entry Point
 * This is a temporary "Hello World" implementation to test the Docker setup
 */
class App {
  private container: HTMLElement

  constructor() {
    this.container = document.getElementById('app')!
    this.init()
  }

  private init(): void {
    this.render()
    this.addEventListeners()
    console.log('🏓 ft_transcendence initialized successfully!')
    console.log(`📦 Version: ${__APP_VERSION__ || 'dev'}`)
    console.log(`🔨 Built: ${__BUILD_TIME__ || 'development'}`)
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center">
        <div class="text-center space-y-8 p-8">
          <!-- Logo/Title -->
          <div class="space-y-4">
            <h1 class="text-6xl font-game font-black text-transparent bg-clip-text bg-gradient-to-r from-game-pong to-game-racer animate-pulse-glow">
              ft_transcendence
            </h1>
            <p class="text-xl text-dark-text font-mono">
              🏓 3D Pong & 🏎️ Star Wars Racing Platform
            </p>
          </div>

          <!-- Status Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <!-- Docker Status -->
            <div class="bg-dark-surface border border-dark-border rounded-lg p-6 hover:shadow-glow transition-all">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-game-success rounded-full animate-ping"></div>
                <h3 class="text-lg font-semibold text-game-success">Docker</h3>
              </div>
              <p class="text-sm text-dark-text mt-2">Frontend container running</p>
            </div>

            <!-- Nginx Status -->
            <div class="bg-dark-surface border border-dark-border rounded-lg p-6 hover:shadow-glow transition-all">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-game-success rounded-full animate-ping"></div>
                <h3 class="text-lg font-semibold text-game-success">Nginx</h3>
              </div>
              <p class="text-sm text-dark-text mt-2">Reverse proxy working</p>
            </div>

            <!-- SSL Status -->
            <div class="bg-dark-surface border border-dark-border rounded-lg p-6 hover:shadow-glow transition-all">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-game-success rounded-full animate-ping"></div>
                <h3 class="text-lg font-semibold text-game-success">SSL</h3>
              </div>
              <p class="text-sm text-dark-text mt-2">Cloudflare certificates</p>
            </div>
          </div>

          <!-- Coming Soon Features -->
          <div class="space-y-4">
            <h2 class="text-2xl font-game text-primary-500">Coming Soon</h2>
            <div class="flex flex-wrap justify-center gap-3">
              <span class="px-3 py-1 bg-dark-surface border border-game-pong text-game-pong rounded-full text-sm">
                🏓 3D Pong Game
              </span>
              <span class="px-3 py-1 bg-dark-surface border border-game-racer text-game-racer rounded-full text-sm">
                🏎️ Pod Racing
              </span>
              <span class="px-3 py-1 bg-dark-surface border border-primary-500 text-primary-500 rounded-full text-sm">
                👥 Multiplayer
              </span>
              <span class="px-3 py-1 bg-dark-surface border border-primary-500 text-primary-500 rounded-full text-sm">
                🤖 AI Opponents
              </span>
              <span class="px-3 py-1 bg-dark-surface border border-primary-500 text-primary-500 rounded-full text-sm">
                💬 Live Chat
              </span>
              <span class="px-3 py-1 bg-dark-surface border border-primary-500 text-primary-500 rounded-full text-sm">
                🏆 Tournaments
              </span>
            </div>
          </div>

          <!-- System Info -->
          <div class="bg-dark-surface border border-dark-border rounded-lg p-4 max-w-md mx-auto">
            <h3 class="text-lg font-mono text-primary-500 mb-2">System Status</h3>
            <div class="text-sm text-dark-text space-y-1 font-mono">
              <div>🌐 Domain: <span class="text-game-success">starcendence.dev</span></div>
              <div>📦 Version: <span class="text-primary-500">${__APP_VERSION__ || 'dev'}</span></div>
              <div>🔨 Built: <span class="text-primary-500">${new Date(__BUILD_TIME__ || Date.now()).toLocaleString()}</span></div>
              <div>⚡ Framework: <span class="text-primary-500">Vite + TypeScript</span></div>
            </div>
          </div>

          <!-- Next Steps -->
          <div class="text-center space-y-2">
            <p class="text-dark-text">
              🎯 <strong>MVP Goal Achieved:</strong> Frontend Docker + Nginx + SSL working!
            </p>
            <p class="text-sm text-dark-text font-mono">
              Next: Redis cache → Auth service → Game engines
            </p>
          </div>
        </div>
      </div>
    `
  }

  private addEventListeners(): void {
    // Add some interactive feedback
    const cards = this.container.querySelectorAll('.hover\\:shadow-glow')
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('scale-105', 'shadow-glow')
      })
      card.addEventListener('mouseleave', () => {
        card.classList.remove('scale-105', 'shadow-glow')
      })
    })

    // Console Easter egg
    console.log(`
    🏓 ft_transcendence Debug Info:
    ================================
    📡 Frontend Status: ✅ Running
    🐳 Docker Status: ✅ Working  
    🔒 SSL Status: ✅ Cloudflare
    ⚡ Framework: Vite + TypeScript
    🎨 Styling: Tailwind CSS
    🎮 Games: Coming Soon...
    
    🔧 Next Implementation Steps:
    1. Redis cache container
    2. Auth microservice (JWT + OAuth)
    3. Game microservice (Pong + Racer)
    4. WebSocket real-time service
    5. Chat microservice
    6. User management service
    `)
  }
}

// Initialize the application
new App()

// Hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔄 Hot reload triggered')
  })
}