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

// Mount header based on type
export function mountHeader(type: string, selector: string = '#header'): void 
{
    currentType = type;

    if (header) 
    {
        header.resetEvents();
    }
    const container = document.querySelector(selector);
    if (!container) 
    {
        console.error(`Header container "${selector}" not found`);
        return;
    }

    switch (currentType) 
    {
        case 'default':
            mountDefault(selector);
            break;
        case 'game':
            mountGame(container as HTMLElement);
            break;
        case 'minimal':
            mountMinimal(container as HTMLElement);
            break;
        case 'none':
            container.innerHTML = '';
            break;
        default:
            mountDefault(selector);
    }
}

// Mount default header using the component system
function mountDefault(selector: string): void 
{
    if (!header) 
    {
        console.error('Header not initialized');
        return;
    }
    
    header.mount(selector);
}

// Mount game header
function mountGame(container: HTMLElement): void 
{
    container.innerHTML = `
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
    
    requestAnimationFrame(() => setupGameHeaderEvents());
}

// Mount minimal header
function mountMinimal(container: HTMLElement): void 
{
    container.innerHTML = `
        <header class="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur">
            <nav class="mx-auto flex max-w-6xl items-center justify-center px-6 py-4">
                ${renderMinimalLogo()}
            </nav>
        </header>
    `;
}

function renderGameLogo(): string 
{
    return `
        <h1 class="text-xl font-bold font-game text-cyan-400">
            <a href="/" data-link>Transcendence</a>
        </h1>
    `;
}

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

function renderMinimalLogo(): string 
{
    return `
        <h1 class="text-2xl font-bold font-game text-cyan-400">
            <a href="/" data-link>42 Transcendence</a>
        </h1>
    `;
}

// FIX: Adicionar export se está sendo usado em outro arquivo
export function setupGameHeaderEvents(): void 
{    
    if (gameEventListenersAdded) return;

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

export function resetGameEventListeners(): void 
{
    gameEventListenersAdded = false;
}

initHeaderManager();