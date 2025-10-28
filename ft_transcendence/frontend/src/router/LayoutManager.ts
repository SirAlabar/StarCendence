import { BaseComponent } from '../components/BaseComponent';
import { Layout } from '../components/common/Layout';
import NotFoundPage from '../pages/NotFoundPage';


// Module-level variables
let layout: Layout;

// Initialize layout manager
export function initLayoutManager(): void 
{
    layout = new Layout();
}

// Render default layout
export function renderDefault(component: BaseComponent): void 
{
    const headerMount = document.querySelector('#header-mount');
    const contentMount = document.querySelector('#content-mount');
    
    // Only mount layout if the structure doesn't exist
    if (!headerMount || !contentMount) 
    {
        layout.mount('#app');
    }

    // Mount content to existing #content-mount slot
    const contentMountAfter = document.querySelector('#content-mount');
    if (contentMountAfter) 
    {
        contentMountAfter.setAttribute('data-route-content', 'true');
        const isLandingPage = component.constructor.name === 'LandingPage';
        if (isLandingPage) 
        {
            contentMountAfter.className = 'pt-20';
            const pageContent = layout.renderPageSection(
                'page-content', 
                component.render(), 
                true
            );
            contentMountAfter.innerHTML = pageContent;
        } 
        else 
        {
            contentMountAfter.className = 'flex-1 flex flex-col pt-20';
            contentMountAfter.innerHTML = layout.renderPageSection('page-content', component.render(), false);
        }
    }

    // Call component mount if it exists
    if (typeof component.mount === 'function') 
    {
        component.mount('#content-mount');
    }
}

// Render game layout (fullscreen)
export function renderGame(component: BaseComponent): void 
{
    const app = document.querySelector('#app')!;
    
    app.innerHTML = `
        <div class="h-screen overflow-hidden" data-route-content="true">
            <main class="h-full">
                <div id="game-content" class="h-full"></div>
            </main>
        </div>
    `;

    mountComponent(component, '#game-content');
}

// Render auth layout
export function renderAuth(component: BaseComponent): void
{
    const app = document.querySelector('#app')!;
   
    // if (!document.querySelector('#auth-header-mount'))
    // {
        app.innerHTML = `
            <div class="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900" data-route-content="true">
                <div id="header-mount"></div>
                <main class="min-h-screen flex items-center justify-center">
                    <div id="auth-content" class="w-full max-w-md"></div>
                </main>
            </div>
        `;
    // }
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

export function showLoading(): void 
{
    const loading = document.createElement('div');
    loading.id = 'layout-loading';
    loading.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    loading.innerHTML = `
        <div class="loader"></div>

        <style>
            .loader {
                width: 60px;
                height: 25px;
                border: 3px solid #63eafe;
                box-sizing: border-box;
                border-radius: 50%;
                display: grid;
                animation: l2 2s infinite linear;
                box-shadow: 0 0 8px #63eafe, inset 0 0 8px #63eafe;
            }
            
            .loader:before,
            .loader:after {
                content: "";
                grid-area: 1/1;
                border: 3px solid;
                border-radius: 50%;
                animation: inherit;
                animation-duration: 3s;
            }
            
            .loader:before {
                border-color: #a855f7;
                box-shadow: 0 0 6px #a855f7, inset 0 0 6px #a855f7;
            }
            
            .loader:after {
                --s: -1;
                border-color: #3b82f6;
                box-shadow: 0 0 6px #3b82f6, inset 0 0 6px #3b82f6;
            }
            
            @keyframes l2 {
                100% { 
                    transform: rotate(calc(var(--s, 1) * 1turn)); 
                }
            }
        </style>
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
    renderNone(new NotFoundPage());
}

// Initialize when first imported
initLayoutManager();