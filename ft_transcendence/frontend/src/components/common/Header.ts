import { BaseComponent, tw } from '../BaseComponent';

interface NavItem 
{
    label: string;
    href: string;
    primary?: boolean;
}

export class Header extends BaseComponent 
{
    private navItems: NavItem[] = [
        { label: 'Main', href: '#hero' },
        { label: 'Team', href: '#team' },
        { label: 'Features', href: '#features' },
        { label: 'About', href: '#about' },
        { label: 'Games', href: '/games' },
        { label: 'Leaderboard', href: '/leaderboard' },
        { label: 'Login', href: '/login', primary: true }
    ];

    render(): string 
    {
        return `
            <header class="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gray-900/20 border-b border-white/10 shadow-lg">
                <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                    ${this.renderLogo()}
                    ${this.renderNavigation()}
                </nav>
                ${this.renderMobileMenu()}
            </header>
        `;
    }

    private renderLogo(): string 
    {
        return `
            <h1 class="text-3xl font-bold font-game text-cyan-400 hover:text-purple-400 transition-colors duration-300">
                <a href="#hero">42 Transcendence</a>
            </h1>
        `;
    }

    private renderNavigation(): string 
    {
        return `
            <div class="flex items-center">
                <!-- Mobile hamburger button -->
                ${this.renderHamburgerButton()}
                
                <!-- Desktop navigation -->
                <nav class="hidden md:flex items-center space-x-2" aria-label="main">
                    ${this.navItems.map(item => this.renderNavItem(item)).join('')}
                </nav>
            </div>
        `;
    }

    private renderNavItem(item: NavItem): string 
    {
        return `
            <a href="${item.href}" class="
                px-4 py-2 mx-1 
                text-white/90 text-lg font-medium
                bg-gray-500/20 backdrop-blur-sm
                border border-transparent
                rounded-lg
                transition-all duration-300 ease-in-out
                hover:bg-gray-500/30 
                hover:border-white/50 
                hover:shadow-lg 
                hover:shadow-white/20
                hover:text-white
                no-underline
            ">
                ${item.label}
            </a>
        `;
    }

    private renderHamburgerButton(): string 
    {
        return `
            <button id="hamburger-button" class="
                md:hidden p-2 rounded-lg
                bg-white/10 backdrop-blur-sm
                border border-white/20
                text-white
                hover:bg-white/20
                transition-all duration-300
            ">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        `;
    }

    private renderMobileMenu(): string 
    {
        return `
            <div id="mobile-menu" class="
                hidden md:hidden 
                backdrop-blur-lg bg-gray-900/30 
                border-t border-white/10
            ">
                <nav class="flex flex-col space-y-2 p-4" aria-label="mobile">
                    ${this.navItems.map(item => this.renderMobileNavItem(item)).join('')}
                </nav>
            </div>
        `;
    }

    private renderMobileNavItem(item: NavItem): string 
    {
        return `
            <a href="${item.href}" class="
                block py-3 px-4 text-center
                text-white text-lg font-medium
                bg-gray-500/20 backdrop-blur-sm
                border border-white/10
                rounded-lg
                transition-all duration-300
                hover:bg-gray-500/30 
                hover:border-white/50 
                hover:shadow-lg 
                hover:shadow-white/20
                no-underline
            ">
                ${item.label}
            </a>
        `;
    }

    protected afterMount(): void 
    {
        this.setupHamburgerMenu();
    }

    private setupHamburgerMenu(): void 
    {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (hamburgerButton && mobileMenu) 
        {
            hamburgerButton.addEventListener('click', () => 
            {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
}