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
    private userProfileComponent: UserProfileComponent | null = null;
    private friendsListComponent: FriendsList | null = null;
    private friends: any[] = [];
    private friendRequests: any[] = [];

    render(): string 
    {
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

    protected async afterMount(): Promise<void> 
    {
        console.log('📄 PROFILE PAGE: afterMount called');
        
        await this.loadProfile();
        await this.loadFriends();
        await this.loadFriendRequests();
        
        console.log('📄 PROFILE PAGE: Mounting components...');
        
        this.mountComponents();
        this.setupActionButtons();
        this.setupGlobalEventListeners();
    }

    private async loadProfile(): Promise<void> 
    {
        try 
        {
            console.log('📄 PROFILE PAGE: Loading profile...');
            this.userProfile = await UserService.getProfile();
            console.log('📄 PROFILE PAGE: Profile loaded:', this.userProfile);
        } 
        catch (err) 
        {
            console.error('Failed to load profile:', err);
        }
    }

    private async loadFriends(): Promise<void> 
    {
        try 
        {
            console.log('📄 PROFILE PAGE: Loading friends...');
            const friendsData = await FriendService.getFriends();
            
            this.friends = friendsData.friends.map((friend: any) => ({
                id: friend.requestId,
                username: friend.username,
                status: friend.status || 'OFFLINE',
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
            this.friendRequests = requestsData.receivedRequests || [];
            console.log('📄 PROFILE PAGE: Friend requests loaded:', this.friendRequests);
        } 
        catch (err) 
        {
            console.error('Failed to load friend requests:', err);
            this.friendRequests = [];
        }
    }

    private mountComponents(): void 
    {
        if (!this.userProfile) 
        {
            console.log('📄 PROFILE PAGE: Cannot mount - no profile');
            return;
        }

        console.log('📄 PROFILE PAGE: Mounting UserProfile and FriendsList...');

        this.userProfileComponent = new UserProfileComponent({
            userProfile: this.userProfile,
            onProfileUpdated: async (updatedProfile: UserProfile) => 
            {
                this.userProfile = updatedProfile;
                this.remountUserProfile();
            },
            onError: (message: string) => this.showMessage(message, 'error'),
            onSuccess: (message: string) => this.showMessage(message, 'success')
        });
        this.userProfileComponent.mount('#user-profile-container');

        this.friendsListComponent = new FriendsList({
            friends: this.friends,
            friendRequests: this.friendRequests,
            onRequestHandled: async () => 
            {
                await this.loadFriends();
                await this.loadFriendRequests();
                this.remountFriendsList();
            }
        });
        this.friendsListComponent.mount('#friends-list-container');
        
        console.log('📄 PROFILE PAGE: Components mounted!');
    }

    private remountUserProfile(): void 
    {
        if (!this.userProfile) 
        {
            return;
        }

        this.userProfileComponent = new UserProfileComponent({
            userProfile: this.userProfile,
            onProfileUpdated: async (updatedProfile: UserProfile) => 
            {
                this.userProfile = updatedProfile;
                this.remountUserProfile();
            },
            onError: (message: string) => this.showMessage(message, 'error'),
            onSuccess: (message: string) => this.showMessage(message, 'success')
        });
        this.userProfileComponent.mount('#user-profile-container');
    }

    private remountFriendsList(): void 
    {
        this.friendsListComponent = new FriendsList({
            friends: this.friends,
            friendRequests: this.friendRequests,
            onRequestHandled: async () => 
            {
                await this.loadFriends();
                await this.loadFriendRequests();
                this.remountFriendsList();
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