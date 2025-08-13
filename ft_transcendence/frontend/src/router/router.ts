import { renderDefault, renderGame, renderAuth, showLoading, hideLoading, show404 } from './LayoutManager';
import { getHeaderHtml, setupGameHeaderEvents, resetGameEventListeners } from './HeaderManager';

// Singleton state - only one instance allowed
class RouterState
{
    private static instance: RouterState;

    public currentRoute: any = null;
    public isInitialized = false;
    public isNavigating = false;

    // Store event listeners for cleanup
    private clickListener: ((e: Event) => void) | null = null;
    private popstateListener: ((e: PopStateEvent) => void) | null = null;

    private constructor() {}

    static getInstance(): RouterState
    {
        if (!RouterState.instance)
        {
            RouterState.instance = new RouterState();
        }
        return RouterState.instance;
    }

    cleanup()
    {
        if (this.clickListener)
        {
            document.removeEventListener('click', this.clickListener);
            this.clickListener = null;
        }
        if (this.popstateListener)
        {
            window.removeEventListener('popstate', this.popstateListener);
            this.popstateListener = null;
        }
    }

    setEventListeners(clickListener: (e: Event) => void, popstateListener: (e: PopStateEvent) => void)
    {
        this.cleanup();
        this.clickListener = clickListener;
        this.popstateListener = popstateListener;
        document.addEventListener('click', clickListener);
        window.addEventListener('popstate', popstateListener);
    }
}

// Route configuration
const routeConfig: Record<string, any> =
{
    '/':
    {
        component: () => import('../pages/LandingPage'),
        title: 'Home - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/games':
    {
        component: () => import('../pages/GamesPage'),
        title: 'Games - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/pod-racer':
    {
        component: () => import('../pages/PodRacerPage'),
        title: 'Pod Racer - Transcendence',
        layout: 'game',
        headerType: 'game'
    },
    '/pong':
    {
        component: () => import('../pages/PongPage'),
        title: '3D Pong - Transcendence',
        layout: 'game',
        headerType: 'game'
    },
    '/login':
    {
        component: () => import('../pages/LoginPage'),
        title: 'Login - Transcendence',
        layout: 'auth',
        headerType: 'minimal'
    },
    '/register':
    {
        component: () => import('../pages/RegisterPage'),
        title: 'Register - Transcendence',
        layout: 'auth',
        headerType: 'minimal'
    },
    '/dashboard':
    {
        component: () => import('../pages/DashboardPage'),
        title: 'Dashboard - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/tournament':
    {
        component: () => import('../pages/TournamentPage'),
        title: 'Tournament - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/leaderboard':
    {
        component: () => import('../pages/LeaderboardPage'),
        title: 'Leaderboard - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/profile':
    {
        component: () => import('../pages/ProfilePage'),
        title: 'Profile - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/settings':
    {
        component: () => import('../pages/SettingsPage'),
        title: 'Settings - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/404':
    {
        component: () => import('../pages/NotFoundPage'),
        title: 'Page Not Found - Transcendence',
        layout: 'default',
        headerType: 'default'
    }
};

// Get singleton instance
const routerState = RouterState.getInstance();

// Function to get current path
function getCurrentPath(): string
{
    return window.location.pathname || '/';
}

// Function to parse route
function parseRoute(path: string): any
{
    return routeConfig[path] || routeConfig['/404'];
}

// Check if user is authenticated
function isAuthenticated(): boolean
{
    return localStorage.getItem('auth_token') !== null;
}

// Main navigation function
export async function navigateTo(path: string): Promise<void>
{

    // Prevent navigation loops
    if (routerState.isNavigating)
    {
        return;
    }

    const cleanPath = path.startsWith('/') ? path : `/${path}`;


    // Prevent duplicate navigation
    if (routerState.currentRoute && routerState.currentRoute.path === cleanPath)
    {
        return;
    }

    routerState.isNavigating = true;

    const route = parseRoute(cleanPath);

    // Check authentication
    if (route.requiresAuth && !isAuthenticated())
    {
        if (cleanPath !== '/login' && cleanPath !== '/register')
        {
            routerState.isNavigating = false;
            return navigateTo('/login');
        }
    }

    // Update page title
    document.title = route.title;

    // Update URL in browser - only if different from current
    if (window.location.pathname !== cleanPath)
    {
        window.history.pushState({ path: cleanPath }, '', cleanPath);
    }

    // Scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    try
    {
        showLoading();

        // Dynamic import and component instantiation
        const moduleImport = await route.component();
        const ComponentClass = moduleImport.default || moduleImport;
        const component = new ComponentClass();

        // Reset game event listeners if switching away from game
        if (routerState.currentRoute?.headerType === 'game' && route.headerType !== 'game')
        {
            resetGameEventListeners();
        }

        const headerHtml = getHeaderHtml(route.headerType);

        renderWithLayout(component, route.layout, headerHtml);

        // Scroll to top
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

        // Setup events after DOM is ready
        requestAnimationFrame(() =>
        {
            setupGameHeaderEvents();
            updateActiveNavLinks();
        });

        routerState.currentRoute = { ...route, path: cleanPath };

    }
    catch (error)
    {
        console.error('Error during navigation:', error);
        show404();
    }
    finally
    {
        hideLoading();
        routerState.isNavigating = false;
    }
}

// Render function
function renderWithLayout(component: any, layoutType: string, headerHtml: string): void
{
    switch (layoutType)
    {
        case 'game':
            renderGame(component);
            break;
        case 'auth':
            renderAuth(component, headerHtml);
            break;
        default:
            renderDefault(component, headerHtml);
    }
}

// Update active nav links
function updateActiveNavLinks(): void
{
    const currentPath = getCurrentPath();

    document.querySelectorAll('[data-link]').forEach(link =>
    {
        const href = link.getAttribute('href');
        if (!href)
        {
            return;
        }
        if (href === currentPath)
        {
            link.classList.add('active');
        }
        else
        {
            link.classList.remove('active');
        }
    });
}

// Event handlers
function handleLinkClick(e: Event): void
{
    const target = e.target as HTMLElement;
    if (!target)
    {
        return;
    }

    const link = target?.closest('a') as HTMLAnchorElement;
    if (!link)
    {
        return;
    }
    const href = link.getAttribute('href');
    if (!href)
    {
        return;
    }
    if (link.hasAttribute("data-link"))
    {
        e.preventDefault();
        e.stopPropagation();

        if (href && !routerState.isNavigating)
        {
            navigateTo(href);
        }
    }
    else
    {
        if (href?.startsWith('#'))
        {
            navigateTo('/').then(() =>
            {
                const section = document.querySelector(href);
                section?.scrollIntoView({ behavior: 'smooth'});
            });
        }
    }
}

function handlePopState(_e: PopStateEvent): void
{
    if (!routerState.isNavigating)
    {
        const path = getCurrentPath();
        navigateTo(path);
    }
}

// Initialize router
export function initRouter(): void
{
    if (document.readyState === 'loading') 
    {
        document.addEventListener('DOMContentLoaded', () => initRouter());
        return;
    }
    // Prevent double initialization
    if (routerState.isInitialized)
    {
        return;
    }

    routerState.isInitialized = true;

    // Make router globally available
    (window as any).navigateTo = navigateTo;

    // Setup event listeners with cleanup
    routerState.setEventListeners(handleLinkClick, handlePopState);

    // Load initial page only if no content exists
    const currentPath = getCurrentPath();

    const existingContent = document.querySelector('[data-route-content]');

    if (!existingContent)
    {
        setTimeout(() =>
        {
            if (!routerState.currentRoute)
            {
                navigateTo(currentPath);
            }
        }, 100);
    }
}

// Helper functions for external use
export function getCurrentRoute(): any
{
    return routerState.currentRoute;
}

export function addRoute(path: string, config: any): void
{
    routeConfig[path] = config;
}

// Cleanup function for hot reloading/testing
export function destroyRouter(): void
{
    routerState.cleanup();
    routerState.isInitialized = false;
    routerState.currentRoute = null;
    routerState.isNavigating = false;
}
