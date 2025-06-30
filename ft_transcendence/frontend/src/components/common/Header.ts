import { BaseComponent } from '../BaseComponent';

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
                <a href="/" data-link>42 Transcendence</a>
            </h1>
        `;
    }

    private renderNavigation(): string 
    {
        return `
            <div class="flex items-center">
                ${this.renderHamburgerButton()}

                <nav class="flex items-center space-x-2" aria-label="main">
                    ${this.navItems.map(item => this.renderNavItem(item)).join('')}
                </nav>
            </div>
        `;
    }

    private renderNavItem(item: NavItem): string 
    {
        const isRouteLink = item.href.startsWith('/');
        
        return `
            <a href="${item.href}"${isRouteLink ? ' data-link' : ''} class="
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
            <div id="mobile-menu" class="hidden md:hidden bg-gray-900/95 backdrop-blur border-t border-white/10">
                <nav class="px-6 py-4">
                    ${this.navItems.map(item => {
                        const dataLink = item.href.startsWith('/') ? 'data-link' : '';
                        return `
                            <a href="${item.href}" ${dataLink} class="block py-2 text-white/90 hover:text-white transition-colors">
                                ${item.label}
                            </a>
                        `;
                    }).join('')}
                </nav>
            </div>
        `;
    }
}