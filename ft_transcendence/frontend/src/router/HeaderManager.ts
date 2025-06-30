import { Header } from '../components/common/Header';

// Module-level variables
let header: Header;
let currentType: string | null = null;

// Initialize header manager
export function initHeaderManager(): void 
{
    header = new Header();
}

// Get header HTML based on type
export function getHeaderHtml(type: string): string 
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
                ${renderGameControls()}
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

// Render minimal logo
function renderMinimalLogo(): string 
{
    return `
        <h1 class="text-2xl font-bold font-game text-cyan-400">
            <a href="/" data-link>42 Transcendence</a>
        </h1>
    `;
}

// Setup game header events
export function setupGameHeaderEvents(): void 
{
    // Only setup if we're showing game header
    if (currentType !== 'game') 
    {
        return;
    }

    const pauseBtn = document.getElementById('pause-game');
    const exitBtn = document.getElementById('exit-game');

    if (pauseBtn) 
    {
        pauseBtn.addEventListener('click', () => 
        {
            // Dispatch custom event for game to handle
            window.dispatchEvent(new CustomEvent('game:pause'));
        });
    }

    if (exitBtn) 
    {
        exitBtn.addEventListener('click', () => 
        {
            if (confirm('Are you sure you want to exit the game?')) 
            {
                window.dispatchEvent(new CustomEvent('game:exit'));
                // Navigate back to games page
                (window as any).navigateTo('/games');
            }
        });
    }
}

// Get current header type
export function getCurrentType(): string | null 
{
    return currentType;
}

// Update game info in header
export function updateGameInfo(info: { score?: string; time?: string; lives?: number }): void 
{
    if (currentType !== 'game') 
    {
        return;
    }

    // Find game controls and update them
    const controls = document.querySelector('#game-controls-info');
    if (controls && info) 
    {
        let infoHtml = '';
        
        if (info.score) 
        {
            infoHtml += `<span class="text-cyan-400">Score: ${info.score}</span>`;
        }
        
        if (info.time) 
        {
            infoHtml += `<span class="text-purple-400 ml-4">Time: ${info.time}</span>`;
        }
        
        if (info.lives) 
        {
            infoHtml += `<span class="text-red-400 ml-4">Lives: ${info.lives}</span>`;
        }
        
        controls.innerHTML = infoHtml;
    }
}

// Hide header
export function hideHeader(): void 
{
    const header = document.querySelector('header');
    if (header) 
    {
        header.style.display = 'none';
    }
    currentType = 'none';
}

// Show header
export function showHeader(): void 
{
    const header = document.querySelector('header');
    if (header) 
    {
        header.style.display = 'block';
    }
}

// Initialize when first imported
initHeaderManager();