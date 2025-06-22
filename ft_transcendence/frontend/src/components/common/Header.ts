import { BaseComponent, tw } from '../BaseComponent';

interface NavItem {
    label: string;
    href: string;
    primary?: boolean;
}

export class Header extends BaseComponent {
    private navItems: NavItem[] = [
        { label: 'Main', href: '#hero' },
        { label: 'Team', href: '#team' },
        { label: 'Features', href: '#features' },
        { label: 'About', href: '#about' },
        { label: 'Games', href: '/games' },
        { label: 'Leaderboard', href: '/leaderboard' },
        { label: 'Login', href: '/login', primary: true }
    ];

    render(): string {
        return `
            <header class="sticky top-0 z-10 backdrop-blur-md bg-gray-900/70 border-b border-purple-500/20">
                <section class="mx-auto flex max-w-4xl items-center justify-between p-4">
                    ${this.renderLogo()}
                    ${this.renderNavigation()}
                </section>
                ${this.renderMobileMenu()}
            </header>
        `;
    }

    private renderLogo(): string {
        return `
            <h1 class="text-3xl font-medium">
                <a href="#hero" class="text-cyan-400 hover:text-purple-400 transition-colors font-game">
                    42 Transcendence
                </a>
            </h1>
        `;
    }

    private renderNavigation(): string {
        return `
            <div>
                ${this.renderHamburgerButton()}
                <nav class="hidden space-x-4 text-lg md:block" aria-label="main">
                    ${this.navItems.map(item => this.renderNavItem(item)).join('')}
                </nav>
            </div>
        `;
    }

    private renderNavItem(item: NavItem): string {
        const baseClasses = `
            ${tw.bg.gradient} 
            ${tw.px(4)} ${tw.py(2)} 
            ${tw.rounded.lg} 
            ${tw.hover.opacity} 
            ${tw.transition}
            font-medium
        `;
        
        return `
            <a href="${item.href}" class="${baseClasses}">
                ${item.label}
            </a>
        `;
    }

    private renderHamburgerButton(): string {
        return `
            <button id="hamburger-button" class="relative h-8 w-8 cursor-pointer text-3xl md:hidden">
                <div class="absolute top-4 -mt-0.5 h-1 w-8 rounded bg-white transition-all duration-500 before:absolute before:h-1 before:w-8 before:-translate-x-4 before:-translate-y-3 before:rounded before:bg-white before:transition-all before:duration-500 before:content-[''] after:absolute after:h-1 after:w-8 after:-translate-x-4 after:translate-y-3 after:rounded after:bg-white after:transition-all after:duration-500 after:content-['']"></div>
            </button>
        `;
    }

    private renderMobileMenu(): string {
        return `
            <section id="mobile-menu" class="absolute top-full left-0 right-0 hidden w-full origin-top bg-black/90 backdrop-blur-md">
                <nav class="flex flex-col items-center py-8" aria-label="mobile">
                    ${this.navItems.map(item => `
                        <a href="${item.href}" class="${tw.bg.gradient} ${tw.px(6)} ${tw.py(3)} ${tw.m(2)} ${tw.rounded.lg} ${tw.hover.opacity} ${tw.transition} text-lg font-medium">
                            ${item.label}
                        </a>
                    `).join('')}
                </nav>
            </section>
        `;
    }

    protected afterMount(): void {
        this.setupMobileMenu();
    }

    private setupMobileMenu(): void {
        const hamburger = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        hamburger?.addEventListener('click', () => {
            mobileMenu?.classList.toggle('hidden');
        });

        // Close mobile menu when clicking on links
        mobileMenu?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}