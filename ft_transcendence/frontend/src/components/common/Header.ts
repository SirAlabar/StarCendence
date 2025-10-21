import { BaseComponent } from '../BaseComponent';

interface NavItem 
{
    label: string;
    href: string;
    primary?: boolean;
}

export class Header extends BaseComponent 
{
    private navItems: NavItem[] = [];

    // Track if events are already setup
    private eventsSetup = false;

    private updateNavItems(): void 
    {
        const isLoggedIn = localStorage.getItem('access_token') !== null;
        
        if (isLoggedIn) 
        {
            // Navigation for LOGGED IN users
            this.navItems = [
                { label: 'Main', href: '#hero' },
                { label: 'Team', href: '#team' },
                { label: 'Features', href: '#features' },
                { label: 'About', href: '#about' },
                { label: 'Games', href: '/games' },
                { label: 'Leaderboard', href: '/leaderboard' },
                { label: 'Profile', href: '/profile', primary: true },
                { label: 'Logout', href: '/logout', primary: false }
            ];
        } 
        else 
        {
            // Navigation for LOGGED OUT users
            this.navItems = [
                { label: 'Main', href: '#hero' },
                { label: 'Team', href: '#team' },
                { label: 'Features', href: '#features' },
                { label: 'About', href: '#about' },
                { label: 'Games', href: '/games' },
                { label: 'Leaderboard', href: '/leaderboard' },
                { label: 'Login', href: '/login', primary: true }
            ];
        }
    }

    render(): string 
    {
        this.updateNavItems();
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
            <h1 class="text-2xl md:text-2xl lg:text-3xl font-bold font-game text-cyan-400 hover:text-purple-400 transition-colors duration-300 md:whitespace-nowrap">
                <a href="/" data-link>42 Transcendence</a>
            </h1>
        `;
    }

    private renderNavigation(): string 
    {
        return `
            <div class="flex items-center">
                ${this.renderHamburgerButton()}

                <!-- Desktop Navigation - Hidden on mobile -->
                <nav class="flex max-md:hidden items-center space-x-2" aria-label="main">
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
                px-3 py-2 mx-1 
                text-white/90 text-sm lg:text-base font-medium
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
                whitespace-nowrap
            ">
                ${item.label}
            </a>
        `;
    }

    private renderHamburgerButton(): string 
    {
        return `
            <button id="hamburger-button" type="button" class="
                md:hidden p-2 rounded-lg
                bg-white/10 backdrop-blur-sm
                border border-white/20
                text-white
                hover:bg-white/20
                active:bg-white/30
                transition-all duration-300
                relative z-50
                touch-manipulation
                cursor-pointer
            " aria-label="Menu" aria-expanded="false">
                <svg class="w-6 h-6 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        `;
    }

    private renderMobileMenu(): string 
    {
        return `
            <div id="mobile-menu" class="hidden md:hidden bg-gray-900/95 backdrop-blur border-t border-white/10 absolute top-full left-0 right-0">
                <nav class="px-6 py-4 space-y-2">
                    ${this.navItems.map(item => 
                    {
                        const isRouteLink = item.href.startsWith('/');
                        return `
                            <a href="${item.href}"${isRouteLink ? ' data-link' : ''} class="
                                block py-3 px-4 
                                text-white/90 hover:text-white 
                                hover:bg-white/10 
                                rounded-lg
                                transition-colors
                                border-b border-white/10 last:border-b-0
                            ">
                                ${item.label}
                            </a>
                        `;
                    }).join('')}
                </nav>
            </div>
        `;
    }

protected afterMount(): void 
{
    if (!this.eventsSetup) 
    {
        setTimeout(() => {
            this.setupHamburgerMenu();
            this.eventsSetup = true;
        }, 50);
    }
}

private setupHamburgerMenu(): void 
{
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');


    if (hamburgerButton && mobileMenu) 
    {
        hamburgerButton.addEventListener('click', this.handleHamburgerClick.bind(this));
        hamburgerButton.addEventListener('touchstart', this.handleHamburgerClick.bind(this));
        
        document.addEventListener('click', this.handleOutsideClick.bind(this));
        window.addEventListener('resize', this.handleWindowResize.bind(this));

        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => 
        {
            link.addEventListener('click', this.handleMobileMenuClick.bind(this));
        });
    }
    const logoutLinks = document.querySelectorAll('a[href="/logout"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleLogout();
        });
    });
}

    // Event handler methods
    private handleHamburgerClick(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) 
        {
            mobileMenu.classList.toggle('hidden');
        }
    }

    private handleOutsideClick(event: Event): void 
    {
        const hamburgerButton = document.getElementById('hamburger-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (hamburgerButton && mobileMenu && 
            !hamburgerButton.contains(event.target as Node) && 
            !mobileMenu.contains(event.target as Node)) 
        {
            mobileMenu.classList.add('hidden');
        }
    }

    private handleWindowResize(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        // Enable the resize handler
        if (mobileMenu && window.innerWidth >= 768) 
        {
            mobileMenu.classList.add('hidden');
        }
    }

    public refresh(): void 
    {
        // Update nav items based on current auth state
        this.updateNavItems();
        
        const header = document.querySelector('header');
        if (header) 
        {
            header.outerHTML = this.render();
            this.eventsSetup = false;
            this.afterMount();
        }
    }

    private handleLogout(): void 
    {
        // Show confirmation dialog
        if (!confirm('Are you sure you want to logout?')) 
        {
            return;
        }
        
        // Clear token
        localStorage.removeItem('access_token');
        
        // Dispatch logout event
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        this.refresh();
        
        (window as any).navigateTo('/');
    }

    private handleMobileMenuClick(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) 
        {
            mobileMenu.classList.add('hidden');
        }
    }

    // Public method to reset event setup
    public resetEvents(): void 
    {
        this.eventsSetup = false;
    }
}