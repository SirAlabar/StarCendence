import { BaseComponent } from '../BaseComponent';
import { LoginService } from '../../services/auth/LoginService';
import { Modal } from '@/components/common/Modal';
import ChatNotificationService from '../../services/chat/ChatNotificationService';
import { webSocketService } from '../../services/websocket/WebSocketService';

interface NavItem 
{
    label: string;
    href: string;
    primary?: boolean;
}

export class Header extends BaseComponent 
{
    private navItems: NavItem[] = [];
    private eventsSetup = false;
    private totalUnreadCount: number = 0;
    private updateNavItems(): void 
    {
        const isLoggedIn = localStorage.getItem('accessToken') !== null;
        
        if (isLoggedIn) 
        {
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
            
            <style>
                .notification-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    min-width: 20px;
                    height: 20px;
                    padding: 0 6px;
                    background: #ff0044;
                    color: white;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: bold;
                    box-shadow: 0 0 10px rgba(255, 0, 68, 0.8);
                    z-index: 10;
                    animation: pulse-badge 2s infinite;
                }
                
                @keyframes pulse-badge {
                    0%, 100% {
                        box-shadow: 0 0 10px rgba(255, 0, 68, 0.8);
                    }
                    50% {
                        box-shadow: 0 0 20px rgba(255, 0, 68, 1);
                    }
                }
            </style>
        `;
    }

    private renderLogo(): string 
    {
        return `
            <h1 class="
                font-game font-bold whitespace-nowrap
                text-lg sm:text-xl md:text-2xl lg:text-3xl
                flex items-center gap-2
            ">
                <a href="/" data-link class="flex items-center">
                    <img 
                        src="/assets/images/42.png" 
                        alt="42 Transcendence Logo"
                       class="
                            h-10 w-auto
                            scale-125 sm:scale-125 md:scale-150 lg:scale-[1.7]
                            origin-left
                            transition-transform duration-300
                        "
                            hover:brightness-125 transition-all duration-300"
                    />
                </a>
            </h1>
        `;
    }

    private renderNavigation(): string 
    {
        return `
            <div class="flex items-center">
                ${this.renderHamburgerButton()}

                <nav class="flex max-md:hidden items-center space-x-2" aria-label="main">
                    ${this.navItems.map(item => this.renderNavItem(item)).join('')}
                </nav>
            </div>
        `;
    }

    private renderNavItem(item: NavItem): string 
    {
        const isRouteLink = item.href.startsWith('/');
        
        const isProfileButton = item.label === 'Profile';
        const badgeHtml = isProfileButton && this.totalUnreadCount > 0
            ? `<span class="notification-badge" id="profile-badge">${this.totalUnreadCount}</span>`
            : '';
        
        return `
            <a href="${item.href}"${isRouteLink ? ' data-link' : ''} class="
                px-2 py-1.5 mx-1 
                text-white/90 text-xs sm:text-sm lg:text-base font-medium
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
                ${isProfileButton ? 'relative' : ''}
            ">
                ${item.label}
                ${badgeHtml}
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
                        
                        const isProfileButton = item.label === 'Profile';
                        const badgeHtml = isProfileButton && this.totalUnreadCount > 0
                            ? `<span class="notification-badge" style="position: static; margin-left: 8px;">${this.totalUnreadCount}</span>`
                            : '';
                        
                        return `
                            <a href="${item.href}"${isRouteLink ? ' data-link' : ''} class="
                                block py-3 px-4 
                                text-white/90 hover:text-white 
                                hover:bg-white/10 
                                rounded-lg
                                transition-colors
                                border-b border-white/10 last:border-b-0
                                ${isProfileButton ? 'flex items-center' : ''}
                            ">
                                ${item.label}
                                ${badgeHtml}
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
            setTimeout(() => 
            {
                this.setupHamburgerMenu();
                this.subscribeToNotifications();
                this.eventsSetup = true;
            }, 50);
        }
    }
    
    private subscribeToNotifications(): void 
    {
        ChatNotificationService.onTotalUnreadChange((total: number) => 
        {
            this.totalUnreadCount = total;
            this.updateBadge();
        });
    }
    
    private updateBadge(): void 
    {
        // Update desktop badge
        const badge = document.getElementById('profile-badge');
        const profileLink = document.querySelector('a[href="/profile"]');
        
        if (this.totalUnreadCount > 0) 
        {
            if (badge) 
            {
                badge.textContent = this.totalUnreadCount.toString();
            }
            else if (profileLink) 
            {
                // Create badge if it doesn't exist
                const newBadge = document.createElement('span');
                newBadge.id = 'profile-badge';
                newBadge.className = 'notification-badge';
                newBadge.textContent = this.totalUnreadCount.toString();
                profileLink.appendChild(newBadge);
            }
        }
        else 
        {
            // Remove badge if count is 0
            if (badge) 
            {
                badge.remove();
            }
        }
        
        // Update mobile menu - just refresh it
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) 
        {
            // Refresh mobile menu content
            this.refreshMobileMenu();
        }
    }
    
    private refreshMobileMenu(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        if (!mobileMenu) 
        {
            return;
        }
        
        const nav = mobileMenu.querySelector('nav');
        if (!nav) 
        {
            return;
        }
        
        // Re-render mobile menu items
        nav.innerHTML = this.navItems.map(item => 
        {
            const isRouteLink = item.href.startsWith('/');
            const isProfileButton = item.label === 'Profile';
            const badgeHtml = isProfileButton && this.totalUnreadCount > 0
                ? `<span class="notification-badge" style="position: static; margin-left: 8px;">${this.totalUnreadCount}</span>`
                : '';
            
            return `
                <a href="${item.href}"${isRouteLink ? ' data-link' : ''} class="
                    block py-3 px-4 
                    text-white/90 hover:text-white 
                    hover:bg-white/10 
                    rounded-lg
                    transition-colors
                    border-b border-white/10 last:border-b-0
                    ${isProfileButton ? 'flex items-center' : ''}
                ">
                    ${item.label}
                    ${badgeHtml}
                </a>
            `;
        }).join('');
        
        // Re-attach click handlers for mobile links
        const mobileLinks = nav.querySelectorAll('a');
        mobileLinks.forEach(link => 
        {
            link.addEventListener('click', this.handleMobileMenuClick.bind(this));
        });
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
        
        // Setup logout button listeners
        const logoutLinks = document.querySelectorAll('a[href="/logout"]');
        logoutLinks.forEach(link => 
        {
            link.addEventListener('click', (e) => 
            {
                e.preventDefault();
                e.stopPropagation();
                this.handleLogout();
            });
        });
    }

    private handleHamburgerClick(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) 
        {
            mobileMenu.classList.toggle('hidden');
            
            if (!mobileMenu.classList.contains('hidden')) 
            {
                this.refreshMobileMenu();
            }
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
        if (mobileMenu && window.innerWidth >= 768) 
        {
            mobileMenu.classList.add('hidden');
        }
    }

    public refresh(): void 
    {
        this.updateNavItems();
        
        const header = document.querySelector('header');
        if (header) 
        {
            header.outerHTML = this.render();
            this.eventsSetup = false;
            this.afterMount();
        }
    }

    private async handleLogout(): Promise<void> 
    {
        if (!await Modal.confirm('LOGOUT', 'Are you sure you want to logout?'))
        {
            return;
        }
        
        try 
        {
            webSocketService.disconnect();

            await LoginService.logout();

            window.dispatchEvent(new CustomEvent('auth:logout'));

            this.refresh();

            (window as any).navigateTo('/');
        } 
        catch (error) 
        {
            webSocketService.disconnect();
            LoginService.clearTokens();
            this.refresh();
            (window as any).navigateTo('/');
        }
    }

    private handleMobileMenuClick(): void 
    {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) 
        {
            mobileMenu.classList.add('hidden');
        }
    }

    public resetEvents(): void 
    {
        this.eventsSetup = false;
    }
}