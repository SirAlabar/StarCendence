// router/router.ts - Fixed TypeScript errors

import { renderDefault, renderGame, renderAuth, showLoading, hideLoading, show404 } from './LayoutManager';
import { getHeaderHtml, setupGameHeaderEvents } from './HeaderManager';

// Module-level variables
let currentRoute: any = null;

// Route configuration (like your routes object)
const routeConfig: Record<string, any> = {
    '/': { 
        component: () => import('../pages/LandingPage'),
        title: 'Home - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/games': { 
        component: () => import('../pages/GamesPage'),
        title: 'Games - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/pod-racer': { 
        component: () => import('../pages/PodRacerPage'),
        title: 'Pod Racer - Transcendence',
        layout: 'game',
        headerType: 'game'
    },
    '/pong': { 
        component: () => import('../pages/PongPage'),
        title: '3D Pong - Transcendence',
        layout: 'game',
        headerType: 'game'
    },
    '/login': { 
        component: () => import('../pages/LoginPage'),
        title: 'Login - Transcendence',
        layout: 'auth',
        headerType: 'minimal'
    },
    '/register': { 
        component: () => import('../pages/RegisterPage'),
        title: 'Register - Transcendence',
        layout: 'auth',
        headerType: 'minimal'
    },
    '/dashboard': { 
        component: () => import('../pages/DashboardPage'),
        title: 'Dashboard - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/tournament': { 
        component: () => import('../pages/TournamentPage'),
        title: 'Tournament - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/leaderboard': { 
        component: () => import('../pages/LeaderboardPage'),
        title: 'Leaderboard - Transcendence',
        layout: 'default',
        headerType: 'default'
    },
    '/profile': { 
        component: () => import('../pages/ProfilePage'),
        title: 'Profile - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/settings': { 
        component: () => import('../pages/SettingsPage'),
        title: 'Settings - Transcendence',
        layout: 'default',
        headerType: 'default',
        requiresAuth: true
    },
    '/404': { 
        component: () => import('../pages/NotFoundPage'),
        title: 'Page Not Found - Transcendence',
        layout: 'default',
        headerType: 'default'
    }
};

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
    // TODO: Implement proper authentication check
    return localStorage.getItem('auth_token') !== null;
}

// Main navigation function
export async function navigateTo(path: string): Promise<void> 
{
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // Get route info
    const route = parseRoute(cleanPath);
    
    // Check authentication
    if (route.requiresAuth && !isAuthenticated()) 
    {
        navigateTo('/login');
        return;
    }
    
    // Update page title
    document.title = route.title;
    
    // Update URL in browser
    window.history.pushState({ path: cleanPath }, '', cleanPath);
    
    // Scroll to top
    scrollToTop();
    
    try 
    {
        showLoading();
        
        const moduleImport = await route.component();
        const ComponentClass = moduleImport.default || moduleImport;
        const component = new ComponentClass();
        
        const headerHtml = getHeaderHtml(route.headerType);
        renderWithLayout(component, route.layout, headerHtml);
        setupGameHeaderEvents();
        
        currentRoute = route;
        updateActiveNavLinks();
        
        // Return resolved promise
        return Promise.resolve();
        
    } 
    catch (error) 
    {
        console.error('Error loading route:', error);
        show404();
        return Promise.reject(error);
    } 
    finally 
    {
        hideLoading();
    }
}

// Render function
function renderWithLayout(component: any, layoutType: string, headerHtml: string): void 
{
    switch (layoutType) 
    {
        case 'game':
            renderGame(component, headerHtml);
            break;
        case 'auth':
            renderAuth(component, headerHtml);
            break;
        default:
            renderDefault(component, headerHtml);
    }
}

// Scroll to top function
function scrollToTop(): void 
{
    // Method 1: Modern browsers
    if (window.scrollTo) 
    {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }
    
    // Method 2: Fallback for older browsers
    try 
    {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    } 
    catch (error) 
    {
        console.warn("Scroll to top failed:", error);
    }
    
    // Method 3: Additional fallback
    if (document.scrollingElement) 
    {
        document.scrollingElement.scrollTop = 0;
    }
}

// Update active nav links
function updateActiveNavLinks(): void 
{
    const currentPath = getCurrentPath();
    
    document.querySelectorAll('[data-link]').forEach(link => 
    {
        const href = link.getAttribute('href');
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

// Initialize function
export function initRouter(): void 
{
    // Make router globally available
    (window as any).navigateTo = navigateTo;
    
    // Handle clicks on links
// In your initRouter() function, replace the click handler:
document.addEventListener('click', (e) => 
{
    const target = e.target as HTMLElement;
    const link = target?.closest('a') as HTMLAnchorElement;
    
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Handle route links (with data-link)
    if (link.hasAttribute('data-link')) 
    {
        e.preventDefault();
        if (href) 
        {
            navigateTo(href);
        }
    }
    // Handle cross-page hash links
    else if (href?.startsWith('#') && window.location.pathname !== '/') 
    {
        e.preventDefault();
        // Navigate to landing page, then scroll to section
        navigateTo('/').then(() => {
            setTimeout(() => {
                const section = document.querySelector(href);
                section?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    }
    // Let normal hash links work on same page
    else if (href?.startsWith('#')) 
    {
        // Let browser handle normal hash navigation
    }
});
    
    // Handle back/forward buttons
    window.addEventListener('popstate', () => 
    {
        const path = getCurrentPath();
        navigateTo(path);
    });
    
    // Navigate to initial route
    const initialPath = getCurrentPath();
    navigateTo(initialPath);
}

// Helper functions
export function getCurrentRoute(): any 
{
    return currentRoute;
}

export function addRoute(path: string, config: any): void 
{
    routeConfig[path] = config;
}