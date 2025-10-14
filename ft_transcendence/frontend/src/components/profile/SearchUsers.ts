import { BaseComponent } from '../BaseComponent';
import UserService from '../../services/UserService';

interface SearchResult 
{
    id: string;
    username: string;
    avatarUrl: string | null;
    status: string;
}

export class SearchUsers extends BaseComponent 
{
    private searchResults: SearchResult[] = [];
    private searching: boolean = false;

    render(): string 
    {
        return `
            <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" id="search-modal">
                <div class="bg-gray-800/95 border-2 border-cyan-500/50 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-3xl font-bold text-cyan-400 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                            SEARCH USERS
                        </h2>
                        <button id="close-search-btn" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Search Input -->
                    <div class="mb-6">
                        <div class="relative">
                            <input 
                                type="text" 
                                id="search-input"
                                placeholder="Search for users..."
                                class="w-full px-4 py-3 pl-12 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none"
                            >
                            <svg class="w-6 h-6 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Type at least 2 characters to search</p>
                    </div>
                    
                    <!-- Search Results -->
                    <div id="search-results">
                        ${this.renderSearchResults()}
                    </div>
                </div>
            </div>
            
            <style>
                .neon-border-small {
                    border: 2px solid #00ffff;
                    box-shadow:
                        0 0 5px rgba(0, 255, 255, 0.4),
                        0 0 10px rgba(0, 255, 255, 0.2),
                        inset 0 0 5px rgba(0, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }

                .neon-border-small:hover {
                    box-shadow:
                        0 0 10px rgba(0, 255, 255, 0.6),
                        0 0 20px rgba(0, 255, 255, 0.4),
                        inset 0 0 10px rgba(0, 255, 255, 0.2);
                }
            </style>
        `;
    }

    private renderSearchResults(): string 
    {
        if (this.searching) 
        {
            return `
                <div class="text-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                    <p class="text-cyan-400 mt-4">Searching...</p>
                </div>
            `;
        }

        if (this.searchResults.length === 0) 
        {
            return `
                <div class="text-center py-8">
                    <svg class="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p class="text-gray-400">Start typing to search for users</p>
                </div>
            `;
        }

        return `
            <div class="space-y-3">
                ${this.searchResults.map(user => this.renderUserItem(user)).join('')}
            </div>
        `;
    }

    private renderUserItem(user: SearchResult): string 
    {
        const avatarContent = user.avatarUrl 
            ? `<img src="http://localhost:3004${user.avatarUrl}" alt="${user.username}" class="w-12 h-12 rounded-full object-cover">`
            : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                ${user.username.charAt(0).toUpperCase()}
            </div>`;

        return `
            <div class="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-gray-700/30 hover:border-cyan-500/50 transition-all">
                <div class="flex items-center gap-3 cursor-pointer" data-username="${this.escapeHtml(user.username)}">
                    ${avatarContent}
                    <div>
                        <h4 class="text-lg font-bold text-cyan-400">${this.escapeHtml(user.username)}</h4>
                    </div>
                </div>
                <button class="neon-border-small px-4 py-2 rounded-lg font-bold text-cyan-400 text-sm" data-username="${this.escapeHtml(user.username)}">
                    VIEW PROFILE
                </button>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        this.setupEventListeners();
    }

    private setupEventListeners(): void 
    {
        const closeBtn = document.getElementById('close-search-btn');
        const modal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        
        if (closeBtn) 
        {
            closeBtn.addEventListener('click', () => 
            {
                this.closeModal();
            });
        }
        
        if (modal) 
        {
            modal.addEventListener('click', (e) => 
            {
                if (e.target === modal) 
                {
                    this.closeModal();
                }
            });
        }

        if (searchInput) 
        {
            let timeout: number;
            searchInput.addEventListener('input', (e) => 
            {
                clearTimeout(timeout);
                const query = (e.target as HTMLInputElement).value.trim();
                
                if (query.length >= 2) 
                {
                    timeout = window.setTimeout(() => 
                    {
                        this.performSearch(query);
                    }, 500);
                }
                else 
                {
                    this.searchResults = [];
                    this.updateResults();
                }
            });
        }

        // Add click handlers for user items
        this.attachUserClickHandlers();
    }

    private attachUserClickHandlers(): void 
    {
        const userItems = document.querySelectorAll('[data-username]');
        userItems.forEach(item => 
        {
            item.addEventListener('click', (e) => 
            {
                const username = (e.currentTarget as HTMLElement).getAttribute('data-username');
                if (username) 
                {
                    this.closeModal();
                    (window as any).navigateTo(`/user/${username}`);
                }
            });
        });
    }

    private async performSearch(query: string): Promise<void> 
    {
        try 
        {
            this.searching = true;
            this.updateResults();

            const results = await UserService.searchUsers(query);
            
            // Map UserProfile[] to SearchResult[]
            this.searchResults = results.map(user => ({
                id: user.id,
                username: user.username,
                avatarUrl: user.avatarUrl || null,
                status: user.status || 'OFFLINE'
            }));
        } 
        catch (err) 
        {
            console.error('Search failed:', err);
            this.searchResults = [];
        } 
        finally 
        {
            this.searching = false;
            this.updateResults();
        }
    }

    private updateResults(): void 
    {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) 
        {
            resultsContainer.innerHTML = this.renderSearchResults();
            this.attachUserClickHandlers();
        }
    }

    private closeModal(): void 
    {
        const modal = document.getElementById('search-modal');
        if (modal) 
        {
            modal.remove();
        }
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}