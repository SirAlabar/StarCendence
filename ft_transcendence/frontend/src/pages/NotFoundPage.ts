import { BaseComponent } from '../components/BaseComponent';

// Asset Configuration
interface ShipConfig 
{
    id: string;
    name: string;
    pilot: string;
    imagePath: string;
}

export const PLAYER_SHIPS: ShipConfig[] = [
    {
        id: 'millennium_falcon',
        name: 'Millennium Falcon',
        pilot: 'Han Solo',
        imagePath: '/assets/images/falcon404.png'
    }
];

export const ENEMY_SHIPS: ShipConfig[] = [
    {
        id: 'tie_fighter_1',
        name: 'TIE Fighter',
        pilot: 'Empire',
        imagePath: '/assets/images/eny1.png'
    },
    {
        id: 'tie_interceptor',
        name: 'TIE Interceptor',
        pilot: 'Empire',
        imagePath: '/assets/images/eny2.png'
    },
    {
        id: 'tie_bomber',
        name: 'TIE Bomber',
        pilot: 'Empire',
        imagePath: '/assets/images/eny3.png'
    },
    {
        id: 'tie_advanced',
        name: 'TIE Advanced',
        pilot: 'Darth Vader',
        imagePath: '/assets/images/eny4.png'
    }
];

// Interfaces
interface Position 
{
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Player extends Position 
{
    speed: number;
}

interface Bullet extends Position 
{
    speed: number;
}

interface Enemy extends Position 
{
    type: number;
}

interface Star 
{
    x: number;
    y: number;
    size: number;
    speed: number;
}

interface GameState 
{
    state: 'start' | 'playing' | 'gameover' | 'levelComplete';
    score: number;
    level: number;
    lives: number;
    player: Player;
    bullets: Bullet[];
    enemies: Enemy[];
    enemyBullets: Bullet[];
    stars: Star[];
    keys: Record<string, boolean>;
    enemyDirection: number;
    enemySpeed: number;
    shootCooldown: number;
    animationId: number | null;
    damageFlash: number;
}

export default class NotFoundPage extends BaseComponent 
{
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private game: GameState | null = null;
    
    private playerImg: HTMLImageElement | null = null;
    private enemyImages: HTMLImageElement[] = [];
    private assetsLoaded: boolean = false;

    render(): string 
    {
        return `
            <div class="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
                <!-- Header -->
                <div class="text-center mb-4 sm:mb-6 px-2">
                    <!-- Falcon Ship Image ABOVE 404 -->
                    <div class="mb-3 sm:mb-4 flex justify-center">
                        <img 
                            src="/assets/images/falcon404.png" 
                            alt="Millennium Falcon" 
                            class="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-contain animate-bounce"
                            style="image-rendering: pixelated;"
                        />
                    </div>
                    
                    <!-- Neon 404 Text -->
                    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2" style="
                        color: #fbbf24;
                        text-shadow: 
                            0 0 10px #fbbf24,
                            0 0 20px #fbbf24,
                            0 0 30px #fbbf24,
                            0 0 40px #f59e0b,
                            0 0 70px #f59e0b,
                            0 0 80px #f59e0b,
                            0 0 100px #f59e0b,
                            0 0 150px #f59e0b;
                        animation: neonFlicker 1.5s infinite alternate;
                    ">
                        404 - SPACE INVADERS
                    </h1>
                    
                    <p class="text-base sm:text-lg lg:text-xl text-gray-300 mb-1 sm:mb-2">
                        Oh no! This page was destroyed by space invaders!
                    </p>
                    <p class="text-sm sm:text-md text-cyan-400">
                        Take revenge while we find your page...
                    </p>
                </div>

                <!-- Game Stats -->
                <div class="flex flex-wrap gap-3 sm:gap-8 justify-center text-base sm:text-lg lg:text-xl mb-3 sm:mb-4">
                    <span class="text-white">Score: <span id="game-score" class="text-yellow-400 font-bold">0</span></span>
                    <span class="text-white">Level: <span id="game-level" class="text-green-400 font-bold">1</span></span>
                    <span class="text-white">Lives: <span id="game-lives" class="text-red-400">❤️❤️❤️</span></span>
                </div>

                <!-- Game Canvas Container -->
                <div class="relative w-full max-w-4xl px-2 sm:px-4">
                    <canvas 
                        id="game-canvas" 
                        width="800" 
                        height="600" 
                        class="w-full h-auto border-2 sm:border-4 border-yellow-400 rounded-lg mb-3 sm:mb-4 bg-black/50 backdrop-blur-sm"
                        style="max-height: 70vh;"
                    ></canvas>
                    
                    <!-- Game Over / Level Complete Card -->
                    <div id="game-card" class="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg p-4">
                        <div class="relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 sm:border-4 border-yellow-400 rounded-xl p-4 sm:p-8 w-full max-w-sm sm:max-w-md text-center shadow-2xl">
                            <!-- Falcon Icon in corner -->
                            <img 
                                src="/assets/images/falcon404.png" 
                                alt="Millennium Falcon" 
                                class="absolute -top-6 -right-6 sm:-top-8 sm:-right-8 w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                style="image-rendering: pixelated;"
                            />
                            <div id="card-content"></div>
                        </div>
                    </div>
                </div>

                <!-- Game Message -->
                <div id="game-message" class="text-center mb-4 sm:mb-6 px-2">
                    <p class="text-xs sm:text-sm text-gray-400">Arrow Keys to move | SPACE to shoot</p>
                </div>

                <!-- Navigation Buttons -->
                <div class="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap justify-center w-full max-w-2xl px-4">
                    <button 
                        onclick="navigateTo('/')" 
                        class="w-full sm:w-auto bg-cyan-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-cyan-700 font-bold transition text-sm sm:text-base"
                    >
                        🏠 Go Home
                    </button>
                    <button 
                        onclick="navigateTo('/games')" 
                        class="w-full sm:w-auto bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 font-bold transition text-sm sm:text-base"
                    >
                        🎮 Play Games
                    </button>
                    <button 
                        onclick="history.back()" 
                        class="w-full sm:w-auto bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-700 font-bold transition text-sm sm:text-base"
                    >
                        ⬅️ Go Back
                    </button>
                </div>
                
                <!-- Neon Animation CSS -->
                <style>
                    @keyframes neonFlicker {
                        0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
                            text-shadow: 
                                0 0 10px #fbbf24,
                                0 0 20px #fbbf24,
                                0 0 30px #fbbf24,
                                0 0 40px #f59e0b,
                                0 0 70px #f59e0b,
                                0 0 80px #f59e0b,
                                0 0 100px #f59e0b,
                                0 0 150px #f59e0b;
                        }
                        20%, 24%, 55% {
                            text-shadow: none;
                        }
                    }
                    
                    /* Ensure canvas maintains aspect ratio */
                    #game-canvas {
                        aspect-ratio: 4 / 3;
                    }
                </style>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        this.loadAssets();
        this.initGame();
    }

    private loadAssets(): void 
    {
        this.playerImg = new Image();
        
        // Load enemy ships using config
        this.enemyImages = ENEMY_SHIPS.map(() => 
        {
            const img = new Image();
            return img;
        });
        
        // Wait for all images to load
        let imagesLoaded = 0;
        const totalImages = 1 + ENEMY_SHIPS.length;
        
        const onImageLoad = () => 
        {
            return () => 
            {
                imagesLoaded++;
                
                if (imagesLoaded === totalImages) 
                {
                    setTimeout(() => 
                    {
                        this.assetsLoaded = true;
                    }, 150);
                }
            };
        };
        
        const onImageError = (_shipName: string, _path: string) => 
        {
            return (_e: any) => 
            {
                imagesLoaded++;
                
                if (imagesLoaded === totalImages) 
                {
                    this.assetsLoaded = true;
                }
            };
        };
        
        // Setup player image
        const playerShip = PLAYER_SHIPS[0];
        this.playerImg.onload = onImageLoad();
        this.playerImg.onerror = onImageError(playerShip.name, playerShip.imagePath);
        this.playerImg.src = playerShip.imagePath;
        
        // Setup enemy images
        this.enemyImages.forEach((img, index) => 
        {
            const ship = ENEMY_SHIPS[index];
            img.onload = onImageLoad();
            img.onerror = onImageError(ship.name, ship.imagePath);
            img.src = ship.imagePath;
        });
    }

    private initGame(): void 
    {
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (!this.canvas) 
        {
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) 
        {
            return;
        }
        
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.ctx.imageSmoothingEnabled = false;

        // Initialize game state
        this.game = {
            state: 'start',
            score: 0,
            level: 1,
            lives: 3,
            player: {
                x: 375,
                y: 550,
                width: 40,
                height: 40,
                speed: 5
            },
            bullets: [],
            enemies: [],
            enemyBullets: [],
            stars: [],
            keys: {},
            enemyDirection: 1,
            enemySpeed: 1,
            shootCooldown: 0,
            animationId: null,
            damageFlash: 0
        };

        // Initialize stars
        this.initStars();

        // Setup keyboard controls
        this.setupControls();
        
        // AUTO-START THE GAME
        setTimeout(() => 
        {
            this.startGame();
        }, 500);
    }

    private initStars(): void 
    {
        if (!this.game || !this.canvas) 
        {
            return;
        }

        for (let i = 0; i < 100; i++) 
        {
            this.game.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }

    private setupControls(): void 
    {
        document.addEventListener('keydown', (e: KeyboardEvent) => 
        {
            if (!this.game) 
            {
                return;
            }
            
            this.game.keys[e.key] = true;
            
            if (e.key === ' ' && this.game.state === 'playing') 
            {
                e.preventDefault();
                this.shoot();
            }
            
            if (e.key === 'Enter' && this.game.state === 'gameover') 
            {
                e.preventDefault();
                this.startGame();
            }
        });

        document.addEventListener('keyup', (e: KeyboardEvent) => 
        {
            if (!this.game) 
            {
                return;
            }
            
            this.game.keys[e.key] = false;
        });
    }

    private startGame(): void 
    {
        if (!this.game) 
        {
            return;
        }

        if (this.game.animationId) 
        {
            cancelAnimationFrame(this.game.animationId);
            this.game.animationId = null;
        }

        this.hideCard();
        this.game.state = 'playing';
        this.game.score = 0;
        this.game.level = 1;
        this.game.lives = 3;
        this.game.player.x = 375;
        this.game.bullets = [];
        this.game.enemyBullets = [];
        this.game.enemySpeed = 1;
        
        // Clear canvas
        if (this.ctx && this.canvas) 
        {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.updateUI();
        this.createEnemies(1);
        this.gameLoop();
    }

    private nextLevel(): void 
    {
        if (!this.game) 
        {
            return;
        }

        // Clear any existing animation frame
        if (this.game.animationId) 
        {
            cancelAnimationFrame(this.game.animationId);
            this.game.animationId = null;
        }

        this.game.level++;
        this.game.state = 'playing';
        this.game.bullets = [];
        this.game.enemyBullets = [];
        this.game.enemySpeed = 1 + (this.game.level - 1) * 0.3;
        
        // Clear canvas
        if (this.ctx && this.canvas) 
        {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        this.updateUI();
        this.createEnemies(this.game.level);
        this.gameLoop();
    }

    private createEnemies(currentLevel: number): void 
    {
        if (!this.game || !this.canvas) 
        {
            return;
        }

        this.game.enemies = [];
        
        const rows: number = Math.min(3 + Math.floor(currentLevel / 2), 6);
        const cols: number = Math.min(6 + Math.floor(currentLevel / 3), 11);
        const spacing: number = 60;
        const startX: number = (this.canvas.width - cols * spacing) / 2;
        const startY: number = 50;

        for (let row = 0; row < rows; row++) 
        {
            for (let col = 0; col < cols; col++) 
            {
                this.game.enemies.push({
                    x: startX + col * spacing,
                    y: startY + row * spacing,
                    width: 40,
                    height: 40,
                    type: row % 4
                });
            }
        }
    }

    private shoot(): void 
    {
        if (!this.game) 
        {
            return;
        }

        if (this.game.shootCooldown <= 0) 
        {
            this.game.bullets.push({
                x: this.game.player.x + this.game.player.width / 2 - 2,
                y: this.game.player.y,
                width: 4,
                height: 15,
                speed: 7
            });
            this.game.shootCooldown = 20;
        }
    }

    private enemyShoot(): void 
    {
        if (!this.game) 
        {
            return;
        }

        if (this.game.enemies.length > 0 && Math.random() < 0.02 * this.game.level) 
        {
            const shooter: Enemy = this.game.enemies[Math.floor(Math.random() * this.game.enemies.length)];
            this.game.enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 15,
                speed: 4
            });
        }
    }

    private drawPlayer(): void 
    {
        if (!this.ctx || !this.game) 
        {
            return;
        }

        // Use image if loaded and valid
        if (this.assetsLoaded && 
            this.playerImg && 
            this.playerImg.complete && 
            this.playerImg.naturalWidth > 0 &&
            this.playerImg.naturalHeight > 0) 
        {
            try 
            {
                this.ctx.drawImage(
                    this.playerImg, 
                    this.game.player.x, 
                    this.game.player.y, 
                    this.game.player.width, 
                    this.game.player.height
                );
            }
            catch (e) 
            {
                this.drawPlayerFallback();
            }
        }
        else 
        {
            this.drawPlayerFallback();
        }
    }
    
    private drawPlayerFallback(): void 
    {
        if (!this.ctx || !this.game) 
        {
            return;
        }
        
        // Fallback: Millennium Falcon style ship
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.game.player.x + 15, this.game.player.y, 10, 30);
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.game.player.x, this.game.player.y + 10, 40, 3);
        this.ctx.fillRect(this.game.player.x + 10, this.game.player.y + 15, 20, 5);
    }

    private drawDamageEffect(): void 
    {
        if (!this.ctx || !this.canvas || !this.game) 
        {
            return;
        }

        if (this.game.damageFlash > 0) 
        {
            // Create pulsing red overlay
            const alpha = (this.game.damageFlash / 30) * 0.4;
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Red border around player
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.game.player.x - 5, 
                this.game.player.y - 5, 
                this.game.player.width + 10, 
                this.game.player.height + 10
            );
            
            this.game.damageFlash--;
        }
    }

    private drawEnemy(enemy: Enemy): void 
    {
        if (!this.ctx) 
        {
            return;
        }

        // Use enemy image based on type if loaded and valid
        const enemyImg = this.enemyImages[enemy.type];
        
        if (this.assetsLoaded && 
            enemyImg && 
            enemyImg.complete && 
            enemyImg.naturalWidth > 0 &&
            enemyImg.naturalHeight > 0) 
        {
            try 
            {
                this.ctx.drawImage(
                    enemyImg, 
                    enemy.x, 
                    enemy.y, 
                    enemy.width, 
                    enemy.height
                );
            }
            catch (e) 
            {
                this.drawEnemyFallback(enemy);
            }
        }
        else 
        {
            this.drawEnemyFallback(enemy);
        }
    }
    
    private drawEnemyFallback(enemy: Enemy): void 
    {
        if (!this.ctx) 
        {
            return;
        }
        
        // Fallback: Different colored TIE Fighter shapes for each type
        const colors: string[] = ['#666', '#888', '#aaa', '#999'];
        this.ctx.fillStyle = colors[enemy.type % 4];
        
        this.ctx.fillRect(enemy.x + 15, enemy.y + 10, 10, 20);
        this.ctx.fillRect(enemy.x, enemy.y + 5, 12, 30);
        this.ctx.fillRect(enemy.x + 28, enemy.y + 5, 12, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(enemy.x + 17, enemy.y + 15, 6, 10);
    }

    private updateUI(): void 
    {
        if (!this.game) 
        {
            return;
        }

        const scoreEl = document.getElementById('game-score');
        const levelEl = document.getElementById('game-level');
        const livesEl = document.getElementById('game-lives');

        if (scoreEl) 
        {
            scoreEl.textContent = this.game.score.toString();
        }
        
        if (levelEl) 
        {
            levelEl.textContent = this.game.level.toString();
        }
        
        if (livesEl) 
        {
            livesEl.textContent = '❤️'.repeat(this.game.lives);
        }
    }
    
    private showCard(content: string): void 
    {
        const cardEl = document.getElementById('game-card');
        const cardContent = document.getElementById('card-content');
        
        if (cardEl && cardContent) 
        {
            cardContent.innerHTML = content;
            cardEl.classList.remove('hidden');
        }
    }
    
    private hideCard(): void 
    {
        const cardEl = document.getElementById('game-card');
        if (cardEl) 
        {
            cardEl.classList.add('hidden');
        }
    }

    private checkCollision(rect1: Position, rect2: Position): boolean 
    {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    private gameLoop = (): void => 
    {
        if (!this.game || !this.ctx || !this.canvas || this.game.state !== 'playing') 
        {
            return;
        }

        // Clear canvas with transparent background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.ctx.fillStyle = '#fff';
        this.game.stars.forEach((star: Star) => 
        {
            this.ctx!.fillRect(star.x, star.y, star.size, star.size);
            star.y += star.speed;
            
            if (star.y > this.canvas!.height) 
            {
                star.y = 0;
                star.x = Math.random() * this.canvas!.width;
            }
        });

        // Move player
        if (this.game.keys['ArrowLeft'] && this.game.player.x > 0) 
        {
            this.game.player.x -= this.game.player.speed;
        }
        
        if (this.game.keys['ArrowRight'] && this.game.player.x < this.canvas.width - this.game.player.width) 
        {
            this.game.player.x += this.game.player.speed;
        }

        // Draw player
        this.drawPlayer();
        this.drawDamageEffect();
        // Update and draw bullets
        this.game.bullets = this.game.bullets.filter((bullet: Bullet) => 
        {
            bullet.y -= bullet.speed;
            this.ctx!.fillStyle = '#00ff00';
            this.ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            return bullet.y > 0;
        });

        if (this.game.shootCooldown > 0) 
        {
            this.game.shootCooldown--;
        }

        // Move enemies
        let moveDown: boolean = false;
        const edge: boolean = this.game.enemies.some((enemy: Enemy) => 
            (enemy.x <= 0 && this.game!.enemyDirection === -1) || 
            (enemy.x >= this.canvas!.width - enemy.width && this.game!.enemyDirection === 1)
        );

        if (edge) 
        {
            this.game.enemyDirection *= -1;
            moveDown = true;
        }

        this.game.enemies.forEach((enemy: Enemy) => 
        {
            enemy.x += this.game!.enemyDirection * this.game!.enemySpeed;
            
            if (moveDown) 
            {
                enemy.y += 20;
            }
        });

        // Draw enemies
        this.game.enemies.forEach((enemy: Enemy) => 
        {
            this.drawEnemy(enemy);
        });

        // Enemy shooting
        this.enemyShoot();

        // Update and draw enemy bullets
        this.game.enemyBullets = this.game.enemyBullets.filter((bullet: Bullet) => 
        {
            bullet.y += bullet.speed;
            this.ctx!.fillStyle = '#ff0000';
            this.ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            return bullet.y < this.canvas!.height;
        });

        // Collision: player bullets vs enemies
        this.game.bullets.forEach((bullet: Bullet, bIndex: number) => 
        {
            this.game!.enemies.forEach((enemy: Enemy, eIndex: number) => 
            {
                if (this.checkCollision(bullet, enemy)) 
                {
                    this.game!.bullets.splice(bIndex, 1);
                    this.game!.enemies.splice(eIndex, 1);
                    this.game!.score += 10 * this.game!.level;
                    this.updateUI();
                }
            });
        });

        // Collision: enemy bullets vs player
        this.game.enemyBullets.forEach((bullet: Bullet, index: number) => 
        {
            if (this.checkCollision(bullet, this.game!.player)) 
            {
                this.game!.enemyBullets.splice(index, 1);
                this.game!.lives--;
                this.game!.damageFlash = 30;
                this.updateUI();
                
                if (this.game!.lives <= 0) 
                {
                    this.game!.state = 'gameover';
                    
                    // Stop game loop
                    if (this.game!.animationId) 
                    {
                        cancelAnimationFrame(this.game!.animationId);
                        this.game!.animationId = null;
                    }
                    
                    this.showCard(`
                        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-500 mb-3 sm:mb-4">GAME OVER</h2>
                        <p class="text-lg sm:text-xl lg:text-2xl text-white mb-3 sm:mb-4">Final Score: <span class="text-yellow-400">${this.game!.score}</span></p>
                        <p class="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">The Empire has won this battle...</p>
                        <button 
                            id="restart-btn"
                            class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition text-sm sm:text-base"
                        >
                            🔄 Restart Game
                        </button>
                    `);
                    
                    // Add event listener to restart button
                    setTimeout(() => 
                    {
                        const restartBtn = document.getElementById('restart-btn');
                        if (restartBtn) 
                        {
                            restartBtn.addEventListener('click', () => this.startGame());
                        }
                    }, 100);
                    
                    return;
                }
            }
        });

        // Check if enemies reached bottom
        if (this.game.enemies.some((enemy: Enemy) => enemy.y + enemy.height >= this.game!.player.y)) 
        {
            this.game.state = 'gameover';
            
            // Stop game loop
            if (this.game.animationId) 
            {
                cancelAnimationFrame(this.game.animationId);
                this.game.animationId = null;
            }
            
            this.showCard(`
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-500 mb-3 sm:mb-4">GAME OVER</h2>
                <p class="text-lg sm:text-xl lg:text-2xl text-white mb-3 sm:mb-4">Final Score: <span class="text-yellow-400">${this.game.score}</span></p>
                <p class="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">The Empire has invaded!</p>
                <button 
                    id="restart-btn"
                    class="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-lg transition text-sm sm:text-base"
                >
                    🔄 Restart Game
                </button>
            `);
            
            // Add event listener to restart button
            setTimeout(() => 
            {
                const restartBtn = document.getElementById('restart-btn');
                if (restartBtn) 
                {
                    restartBtn.addEventListener('click', () => this.startGame());
                }
            }, 100);
            
            return;
        }

        // Check level complete
        if (this.game.enemies.length === 0) 
        {
            this.game.state = 'levelComplete';
            
            // Stop game loop
            if (this.game.animationId) 
            {
                cancelAnimationFrame(this.game.animationId);
                this.game.animationId = null;
            }
            
            this.showCard(`
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-500 mb-3 sm:mb-4">LEVEL ${this.game.level} COMPLETE!</h2>
                <p class="text-lg sm:text-xl lg:text-2xl text-white mb-3 sm:mb-4">Score: <span class="text-yellow-400">${this.game.score}</span></p>
                <p class="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">The Rebellion continues...</p>
                <div class="text-cyan-400 text-base sm:text-lg animate-pulse">
                    Starting Level ${this.game.level + 1} in 3 seconds...
                </div>
            `);
            
            // Auto-start next level after 3 seconds
            setTimeout(() => 
            {
                this.hideCard();
                this.nextLevel();
            }, 3000);
            
            return;
        }

        const messageEl = document.getElementById('game-message');
        if (messageEl && this.game.state === 'playing') 
        {
            messageEl.innerHTML = '<p class="text-xs sm:text-sm text-gray-400">Arrow Keys to move | SPACE to shoot</p>';
        }

        this.game.animationId = requestAnimationFrame(this.gameLoop);
    }

    destroy(): void 
    {
        if (this.game?.animationId) 
        {
            cancelAnimationFrame(this.game.animationId);
        }
    }
}