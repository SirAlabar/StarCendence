import { BaseComponent } from '../components/BaseComponent';
import UserService from '../services/UserService';
import FriendService from '../services/FriendService';
import { UserProfile } from '../types/user.types';
import { UserProfileComponent } from '../components/profile/UserProfile';
import { FriendsList } from '../components/profile/FriendsList';
import { Settings } from '../components/profile/Settings';
import { SearchUsers } from '../components/profile/SearchUsers';

export default class ProfilePage extends BaseComponent 
{
    private userProfile: UserProfile | null = null;
    private loading: boolean = true;
    private error: string | null = null;
    private userProfileComponent: UserProfileComponent | null = null;
    private friendsListComponent: FriendsList | null = null;
    private friends: any[] = [];
    private friendRequests: any[] = [];

    render(): string 
    {
        if (this.loading) 
        {
            return this.renderLoading();
        }

        if (this.error) 
        {
            return this.renderError();
        }

        if (!this.userProfile) 
        {
            return this.renderError('No profile data available');
        }

        return `
            <div class="container mx-auto px-6 py-8 max-w-7xl">
                <h1 class="text-4xl font-bold font-game text-cyan-400 mb-12 text-center tracking-wide" style="text-shadow: 0 0 10px #00ffff;">
                    PROFILE SETTINGS
                </h1>
                
                <!-- Message Container -->
                <div id="profile-message" class="mb-6"></div>
                
                <!-- Two Column Layout -->
                <div class="grid md:grid-cols-2 gap-8 items-stretch mb-8">
                    <!-- Left Side: User Profile -->
                    <div id="user-profile-container"></div>
                    
                    <!-- Right Side: Friends List -->
                    <div id="friends-list-container"></div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap justify-center gap-4">
                    <button id="search-users-btn" class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400 tracking-wide">
                        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        SEARCH USERS
                    </button>
                    <button id="public-profile-btn" class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400 tracking-wide">
                        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        SEE PUBLIC PROFILE
                    </button>
                    <button id="settings-btn" class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400 tracking-wide">
                        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        SETTINGS
                    </button>
                </div>
            </div>
            
            <style>
                .neon-border {
                    border: 2px solid #00ffff;
                    box-shadow:
                        0 0 10px rgba(0, 255, 255, 0.5),
                        0 0 20px rgba(0, 255, 255, 0.3),
                        inset 0 0 10px rgba(0, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border:hover {
                    box-shadow:
                        0 0 15px rgba(0, 255, 255, 0.8),
                        0 0 30px rgba(0, 255, 255, 0.5),
                        inset 0 0 15px rgba(0, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
            </style>
        `;
    }

    private renderLoading(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <div class="flex flex-col items-center justify-center min-h-[400px]">
                    <div class="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-cyan-400"></div>
                    <p class="text-cyan-400 text-xl font-bold mt-8 tracking-wider">
                        ACCESSING MAINFRAME...
                    </p>
                </div>
            </div>
        `;
    }

    private renderError(message?: string): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <div class="bg-red-900/30 backdrop-blur-md border-2 border-red-500/50 rounded-lg p-8 text-center">
                    <div class="text-6xl mb-4">⚠</div>
                    <h2 class="text-3xl font-bold text-red-400 mb-4 tracking-wider">
                        SYSTEM ERROR
                    </h2>
                    <p class="text-red-300 mb-6 text-lg">${this.escapeHtml(message || this.error || 'Failed to load profile')}</p>
                    <button onclick="location.reload()" class="bg-red-600/80 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-bold transition-all backdrop-blur-sm">
                        RETRY CONNECTION
                    </button>
                </div>
            </div>
        `;
    }

    protected async afterMount(): Promise<void> 
    {
        console.log('📄 PROFILE PAGE: afterMount called');
        await this.loadProfile();
        await this.loadFriends();
        await this.loadFriendRequests();
        this.setupActionButtons();
        this.setupGlobalEventListeners();
    }

    private async loadProfile(): Promise<void> 
    {
        console.log('📄 PROFILE PAGE: loadProfile started');
        try 
        {
            this.loading = true;
            console.log('📄 PROFILE PAGE: Calling UserService.getProfile()');
            this.userProfile = await UserService.getProfile();
            console.log('📄 PROFILE PAGE: Profile loaded successfully:', this.userProfile);
            this.error = null;
        } 
        catch (err) 
        {
            this.error = (err as Error).message;
            console.error('Failed to load profile:', err);
        } 
        finally 
        {
            this.loading = false;
            this.rerender();
        }
    }

    private async loadFriends(): Promise<void> 
    {
        try 
        {
            console.log('📄 PROFILE PAGE: Loading friends...');
            const friendsData = await FriendService.getFriends();
            
            // Map the friends data to match the FriendsList component interface
            this.friends = friendsData.friends.map((friend: any) => ({
                id: friend.requestId,
                username: friend.username,
                status: 'ONLINE', // You can update this based on actual status from backend
                avatarUrl: friend.avatarUrl
            }));
            
            console.log('📄 PROFILE PAGE: Friends loaded:', this.friends);
        } 
        catch (err) 
        {
            console.error('Failed to load friends:', err);
            this.friends = [];
        }
    }

    private async loadFriendRequests(): Promise<void> 
    {
        try 
        {
            console.log('📄 PROFILE PAGE: Loading friend requests...');
            const requestsData = await FriendService.getFriendRequests();
            this.friendRequests = requestsData.receivedRequests;
            console.log('📄 PROFILE PAGE: Friend requests loaded:', this.friendRequests);
        } 
        catch (err) 
        {
            console.error('Failed to load friend requests:', err);
            this.friendRequests = [];
        }
    }

    private rerender(): void 
    {
        const container = document.querySelector('#content-mount');
        if (container) 
        {
            container.innerHTML = this.render();
            this.mountComponents();
            this.setupActionButtons();
            this.setupGlobalEventListeners();
        }
    }

    private mountComponents(): void 
    {
        if (!this.userProfile) 
        {
            return;
        }

        // Mount User Profile Component
        this.userProfileComponent = new UserProfileComponent({
            userProfile: this.userProfile,
            onProfileUpdated: (updatedProfile: UserProfile) => 
            {
                this.userProfile = updatedProfile;
                this.rerender();
            },
            onError: (message: string) => this.showMessage(message, 'error'),
            onSuccess: (message: string) => this.showMessage(message, 'success')
        });
        this.userProfileComponent.mount('#user-profile-container');

        // Mount Friends List Component
        this.friendsListComponent = new FriendsList({
            friends: this.friends,
            friendRequests: this.friendRequests,
            onRequestHandled: async () => 
            {
                await this.loadFriends();
                await this.loadFriendRequests();
                this.rerender();
            }
        });
        this.friendsListComponent.mount('#friends-list-container');
    }

    private setupGlobalEventListeners(): void 
    {
        window.addEventListener('openSearchModal', () => 
        {
            this.openSearchModal();
        });
    }

    private setupActionButtons(): void 
    {
        const searchUsersBtn = document.getElementById('search-users-btn');
        if (searchUsersBtn) 
        {
            searchUsersBtn.addEventListener('click', () => 
            {
                this.openSearchModal();
            });
        }

        const publicProfileBtn = document.getElementById('public-profile-btn');
        if (publicProfileBtn && this.userProfile) 
        {
            publicProfileBtn.addEventListener('click', () => 
            {
                (window as any).navigateTo(`/user/${this.userProfile?.username}`);
            });
        }

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) 
        {
            settingsBtn.addEventListener('click', () => 
            {
                this.openSettings();
            });
        }
    }

    private openSearchModal(): void 
    {
        const searchUsers = new SearchUsers();
        const searchContainer = document.createElement('div');
        searchContainer.id = 'search-users-container';
        document.body.appendChild(searchContainer);
        searchUsers.mount('#search-users-container');
    }

    private openSettings(): void 
    {
        const settings = new Settings();
        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'settings-container';
        document.body.appendChild(settingsContainer);
        settings.mount('#settings-container');
    }

    private showMessage(message: string, type: 'success' | 'error'): void 
    {
        const container = document.getElementById('profile-message');
        if (!container) 
        {
            return;
        }

        const bgColor = type === 'success' ? 'bg-green-900/30' : 'bg-red-900/30';
        const borderColor = type === 'success' ? 'border-green-500/50' : 'border-red-500/50';
        const textColor = type === 'success' ? 'text-green-400' : 'text-red-400';
        const icon = type === 'success' ? '✓' : '✗';

        container.innerHTML = `
            <div class="${bgColor} ${borderColor} backdrop-blur-sm border-2 rounded-lg p-4">
                <p class="${textColor} font-bold text-center">
                    ${icon} ${this.escapeHtml(message)}
                </p>
            </div>
        `;

        setTimeout(() => 
        {
            container.innerHTML = '';
        }, 5000);
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}