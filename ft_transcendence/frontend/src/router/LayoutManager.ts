import { BaseComponent } from '../components/BaseComponent';
import { Layout } from '../components/common/Layout';

// Module-level variables
let layout: Layout;

// Initialize layout manager
export function initLayoutManager(): void 
{
    layout = new Layout();
}

// Render default layout
export function renderDefault(component: BaseComponent, headerHtml: string): void 
{
    const headerMount = document.querySelector('#header-mount');
    const contentMount = document.querySelector('#content-mount');
    
    // Only mount layout if the structure doesn't exist
    if (!headerMount || !contentMount) 
    {
        layout.mount('#app');
    }
    
    // Mount header to the existing #header-mount slot
    const headerMountAfter = document.querySelector('#header-mount');
    if (headerMountAfter) 
    {
        headerMountAfter.innerHTML = headerHtml;
    }

    // Mount content to existing #content-mount slot
    const contentMountAfter = document.querySelector('#content-mount');
    if (contentMountAfter) 
    {
        contentMountAfter.setAttribute('data-route-content', 'true');
        
        // Use Layout's renderPageSection like your App.ts does
        const pageContent = layout.renderPageSection(
            'page-content', 
            component.render(), 
            true
        );
        contentMountAfter.innerHTML = pageContent;
    }

    // Call component mount if it exists
    if (typeof component.mount === 'function') 
    {
        component.mount('#content-mount');
    }
}

// Render game layout (fullscreen)
export function renderGame(component: BaseComponent, headerHtml: string): void 
{
    const app = document.querySelector('#app')!;
    
    // Only create game layout if it doesn't exist
    if (!document.querySelector('#game-header-mount')) 
    {
        // Create custom game layout (fullscreen)
        app.innerHTML = `
            <div class="h-screen overflow-hidden bg-black" data-route-content="true">
                <div id="game-header-mount"></div>
                <main class="h-full">
                    <div id="game-content" class="h-full"></div>
                </main>
            </div>
        `;
    }

    // Mount header
    const headerMount = document.querySelector('#game-header-mount');
    if (headerMount) 
    {
        headerMount.innerHTML = headerHtml;
    }

    mountComponent(component, '#game-content');
}

// Render auth layout (centered)
export function renderAuth(component: BaseComponent, headerHtml: string): void 
{
    const app = document.querySelector('#app')!;
    
    // Only create auth layout if it doesn't exist
    if (!document.querySelector('#auth-header-mount')) 
    {
        // Create custom auth layout (centered)
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900" data-route-content="true">
                <div id="auth-header-mount"></div>
                <main class="min-h-screen flex items-center justify-center">
                    <div id="auth-content" class="w-full max-w-md"></div>
                </main>
            </div>
        `;
    }

    // Mount header
    const headerMount = document.querySelector('#auth-header-mount');
    if (headerMount) 
    {
        headerMount.innerHTML = headerHtml;
    }

    mountComponent(component, '#auth-content');
}

// Render no layout
export function renderNone(component: BaseComponent): void 
{
    const app = document.querySelector('#app')!;
    
    app.innerHTML = '<div id="no-layout-content" class="h-screen" data-route-content="true"></div>';
    
    mountComponent(component, '#no-layout-content');
}

// Mount component helper
function mountComponent(component: BaseComponent, selector: string): void 
{
    const container = document.querySelector(selector);
    if (!container) 
    {
        return;
    }

    // Render component HTML
    container.innerHTML = component.render();
    
    // Call mount if component has it
    if (typeof component.mount === 'function') 
    {
        component.mount(selector);
    }
}

// Show loading screen
export function showLoading(): void 
{
    const loading = document.createElement('div');
    loading.id = 'layout-loading';
    loading.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    loading.innerHTML = `
        <div class="bg-gray-800 rounded-lg p-6 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p class="text-white">Loading...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

// Hide loading screen
export function hideLoading(): void 
{
    const loading = document.querySelector('#layout-loading');
    if (loading) 
    {
        loading.remove();
    }
}

// Show 404 page
export function show404(): void 
{
    const app = document.querySelector('#app')!;
    
    app.innerHTML = `
        <div class="min-h-screen bg-gray-900 flex items-center justify-center" data-route-content="true">
            <div class="text-center">
                <h1 class="text-6xl font-bold text-red-500 mb-4">404</h1>
                <p class="text-xl text-gray-300 mb-8">Page not found</p>
                <button onclick="navigateTo('/')" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                    Go Home
                </button>
            </div>
        </div>
    `;
}

// Initialize when first imported
initLayoutManager();