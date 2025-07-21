import { Header } from '../components/common/Header';

// Module-level variables
let header: Header;
let currentType: string | null = null;
let gameEventListenersAdded = false;

// Initialize header manager
export function initHeaderManager(): void 
{
    header = new Header();
}

// Get header HTML based on type
export function getHeaderHtml(type: string): string 
{
    return getHeaderHtmlOnly(type);
}

// Get just the HTML without setup
function getHeaderHtmlOnly(type: string): string 
{
    switch (type) 
    {
        case 'default':
            return renderDefault();
        case 'game':
            return renderGame();
        case 'minimal':
            return renderMinimal();
        case 'none':
            return '';
        default:
            return renderDefault();
    }
}

// Render default header (uses your existing Header.ts)
function renderDefault(): string 
{
    currentType = 'default';
    
    if (!header) 
    {
        return '<div>Header not initialized</div>';
    }
    
    return header.render();
}

// Render game header (minimal for fullscreen)
function renderGame(): string 
{
    currentType = 'game';
    return `
        <header class="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-gray-700">
            <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-2">
                ${renderGameLogo()}
                <div class="flex items-center space-x-4">
                    ${renderGameNavigation()}
                    ${renderGameControls()}
                </div>
            </nav>
        </header>
    `;
}

// Render minimal header (for auth pages)
function renderMinimal(): string 
{
    currentType = 'minimal';
    return `
        <header class="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur">
            <nav class="mx-auto flex max-w-6xl items-center justify-center px-6 py-4">
                ${renderMinimalLogo()}
            </nav>
        </header>
    `;
}

// Render game logo
function renderGameLogo(): string 
{
    return `
        <h1 class="text-xl font-bold font-game text-cyan-400">
            <a href="/" data-link>Transcendence</a>
        </h1>
    `;
}

// Render game controls
function renderGameControls(): string 
{
    return `
        <div class="flex items-center space-x-4">
            <button id="pause-game" class="text-white/80 hover:text-white px-3 py-1 rounded">
                ⏸️ Pause
            </button>
            <button id="exit-game" class="text-red-400 hover:text-red-300 px-3 py-1 rounded">
                ❌ Exit
            </button>
        </div>
    `;
}

function renderGameNavigation(): string 
{
    const navItems = [
        { label: 'Games', href: '/games' },
        { label: 'Leaderboard', href: '/leaderboard' },
        { label: 'Profile', href: '/profile' }
    ];
    
    return `
        <nav class="hidden md:flex items-center space-x-2">
            ${navItems.map(item => `
                <a href="${item.href}" data-link class="
                    px-3 py-1 mx-1 
                    text-white/90 text-sm font-medium
                    bg-gray-500/20 backdrop-blur-sm
                    border border-transparent
                    rounded-lg
                    transition-all duration-300 ease-in-out
                    hover:bg-gray-500/30 
                    hover:border-white/50 
                    hover:text-white
                    no-underline
                ">
                    ${item.label}
                </a>
            `).join('')}
        </nav>
    `;
}

// Render minimal logo
function renderMinimalLogo(): string 
{
    return `
        <h1 class="text-2xl font-bold font-game text-cyan-400">
            <a href="/" data-link>42 Transcendence</a>
        </h1>
    `;
}

// Setup game header events - prevent duplicates
export function setupGameHeaderEvents(): void 
{    
    if (currentType !== 'game') 
    {
        return;
    }

    // Prevent duplicate event listeners
    if (gameEventListenersAdded) 
    {
        return;
    }

    const pauseBtn = document.getElementById('pause-game');
    const exitBtn = document.getElementById('exit-game');

    if (pauseBtn) 
    {
        pauseBtn.addEventListener('click', handlePauseGame);
        gameEventListenersAdded = true;
    }

    if (exitBtn) 
    {
        exitBtn.addEventListener('click', handleExitGame);
    }
}

// Separate event handlers
function handlePauseGame(): void 
{
    window.dispatchEvent(new CustomEvent('game:pause'));
}

function handleExitGame(): void 
{
    if (confirm('Are you sure you want to exit the game?')) 
    {
        window.dispatchEvent(new CustomEvent('game:exit'));
        (window as any).navigateTo('/games');
    }
}

// Reset game event listeners flag when switching away from game
export function resetGameEventListeners(): void 
{
    gameEventListenersAdded = false;
}

// Initialize when first imported
initHeaderManager();