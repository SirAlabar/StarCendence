import { BaseComponent } from '../components/BaseComponent';
import UserService from '../services/user/UserService';
import FriendService from '../services/user/FriendService';
import { UserProfile } from '../types/user.types';
import { getBaseUrl } from '@/types/api.types';
import { Modal } from '@/components/common/Modal';

export default class UserPublicPage extends BaseComponent 
{
    private userProfile: UserProfile | null = null;
    private loading: boolean = true;
    private error: string | null = null;
    private username: string = '';
    private isFriend: boolean = false;
    private hasPendingRequest: boolean = false;
    private checkingFriendship: boolean = true;
    private listenersAttached: boolean = false;
    private isOwnProfile: boolean = false;

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
            <style>
                .profile-avatar {
                    border: 3px solid #00ffff;
                    box-shadow: 
                        0 0 20px #00ffff,
                        0 0 40px #00ffff,
                        inset 0 0 20px rgba(0, 255, 255, 0.2);
                }

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

                .neon-border-green {
                    border: 2px solid #00ff88;
                    box-shadow:
                        0 0 10px rgba(0, 255, 136, 0.6),
                        0 0 20px rgba(0, 255, 136, 0.4),
                        inset 0 0 10px rgba(0, 255, 136, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border-green:hover {
                    box-shadow:
                        0 0 15px rgba(0, 255, 136, 0.9),
                        0 0 30px rgba(0, 255, 136, 0.6),
                        inset 0 0 15px rgba(0, 255, 136, 0.3);
                    transform: translateY(-2px);
                }

                .neon-border-red {
                    border: 2px solid #ff0044;
                    box-shadow:
                        0 0 10px rgba(255, 0, 68, 0.6),
                        0 0 20px rgba(255, 0, 68, 0.4),
                        inset 0 0 10px rgba(255, 0, 68, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border-red:hover {
                    box-shadow:
                        0 0 15px rgba(255, 0, 68, 0.9),
                        0 0 30px rgba(255, 0, 68, 0.6),
                        inset 0 0 15px rgba(255, 0, 68, 0.3);
                    transform: translateY(-2px);
                }
            </style>

            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <button id="back-btn" class="text-cyan-400 hover:text-cyan-300 mb-6 flex items-center gap-2 transition-colors">
                    <span>←</span> <span>Back</span>
                </button>

                <h1 class="text-4xl font-bold font-game text-cyan-400 mb-8 text-center tracking-wide" style="text-shadow: 0 0 10px #00ffff;">
                    USER PROFILE
                </h1>

                <div class="bg-gray-800/20 backdrop-blur-md rounded-lg p-8 border border-gray-700/50">
                    ${this.renderProfileContent()}
                </div>

                <div id="action-message" class="mt-6"></div>

                ${this.renderActionButtons()}
            </div>
        `;
    }

    private renderProfileContent(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        const avatarUrl = this.userProfile.avatarUrl ? `${getBaseUrl()}${this.userProfile.avatarUrl}` : null;

        const statusColor = this.getStatusColor(this.userProfile.status);
        const statusText = this.getStatusText(this.userProfile.status);

        return `
            <div class="text-center">
                ${avatarUrl
                    ? `<img src="${avatarUrl}" alt="Avatar" class="w-32 h-32 rounded-full mx-auto mb-6 object-cover border-4 border-cyan-500/50">`
                    : `<div class="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl profile-avatar bg-gradient-to-br from-cyan-500 to-purple-600">
                        <svg class="w-20 h-20 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>`
                }

                <h2 class="text-3xl font-bold text-cyan-400 mb-4 tracking-wider">
                    ${this.escapeHtml(this.userProfile.username).toUpperCase()}
                </h2>

                <div class="flex items-center justify-center gap-3 mb-6">
                    <span class="inline-block w-4 h-4 rounded-full ${statusColor}"></span>
                    <span class="text-gray-300 text-sm font-bold tracking-wide">${statusText}</span>
                </div>

                ${this.userProfile.bio 
                    ? `<div class="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                        <p class="text-cyan-100 text-sm font-mono">${this.escapeHtml(this.userProfile.bio)}</p>
                    </div>`
                    : `<p class="text-gray-500 italic">No bio yet</p>`
                }

                <div class="mt-6 text-sm text-gray-400">
                    <p>Member since ${this.formatDate(this.userProfile.createdAt)}</p>
                </div>

                <!-- Player Statistics Section -->
                <div class="mt-10">
                    <h3 class="text-xl font-bold text-cyan-400 mb-4 tracking-wider text-center" style="text-shadow: 0 0 8px #00ffff;">
                        PLAYER STATISTICS
                    </h3>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Total Games</p>
                        <p class="text-cyan-300 text-lg font-bold">${this.userProfile.totalGames ?? 0}</p>
                        </div>

                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Total Wins</p>
                        <p class="text-green-400 text-lg font-bold">${this.userProfile.totalWins ?? 0}</p>
                        </div>

                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Total Losses</p>
                        <p class="text-red-400 text-lg font-bold">${this.userProfile.totalLosses ?? 0}</p>
                        </div>

                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Total Draws</p>
                        <p class="text-yellow-400 text-lg font-bold">${this.userProfile.totalDraws ?? 0}</p>
                        </div>

                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Tournament Wins</p>
                        <p class="text-cyan-300 text-lg font-bold">${this.userProfile.tournamentWins ?? 0}</p>
                        </div>

                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Tournaments Played</p>
                        <p class="text-cyan-300 text-lg font-bold">${this.userProfile.tournamentParticipations ?? 0}</p>
                        </div>
                    </div>

                    <h4 class="text-lg font-bold text-cyan-400 mt-8 mb-3 text-center tracking-wider">GAME MODES</h4>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Pong Wins</p>
                        <p class="text-green-400 text-lg font-bold">${this.userProfile.totalPongWins ?? 0}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Pong Losses</p>
                        <p class="text-red-400 text-lg font-bold">${this.userProfile.totalPongLoss ?? 0}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Racer Wins</p>
                        <p class="text-green-400 text-lg font-bold">${this.userProfile.totalRacerWins ?? 0}</p>
                        </div>
                        <div class="p-4 rounded-lg bg-gray-900/40 border border-gray-700/40">
                        <p class="text-gray-400 text-sm">Racer Losses</p>
                        <p class="text-red-400 text-lg font-bold">${this.userProfile.totalRacerLoss ?? 0}</p>
                        </div>
                    </div>

                    <div class="mt-8 text-center">
                        <p class="text-cyan-400 font-bold text-lg tracking-wide">
                        WIN RATE: ${(this.userProfile.totalWinPercent ?? this.calculateWinPercent()).toFixed(1)}%
                        </p>
                    </div>
                </div>

            </div>
        `;
    }

    private calculateWinPercent(): number 
    {
        if (!this.userProfile) 
        {
            return 0;
        }
        const total = this.userProfile.totalGames || 0;
        const wins = this.userProfile.totalWins || 0;
        if (total === 0) 
        {
            return 0;
        }
        return ((wins / total) * 100);
    }

    private renderActionButtons(): string 
    {
        // Don't show buttons on own profile
        if (this.isOwnProfile) 
        {
            return '';
        }

        if (this.checkingFriendship) 
        {
            return `
                <div class="flex justify-center mt-6">
                    <div class="text-gray-400">Checking friendship status...</div>
                </div>
            `;
        }

        if (this.isFriend) 
        {
            return `
                <div class="flex flex-wrap justify-center gap-4 mt-6">
                    <button class="neon-border-green px-8 py-3 rounded-lg font-bold text-green-400 tracking-wide cursor-not-allowed opacity-75">
                        ✓ ALREADY FRIENDS
                    </button>
                    <button id="unfriend-btn" class="neon-border-red px-8 py-3 rounded-lg font-bold text-red-400 tracking-wide">
                        REMOVE FRIEND
                    </button>
                </div>
            `;
        }

        if (this.hasPendingRequest) 
        {
            return `
                <div class="flex justify-center mt-6">
                    <button class="neon-border-red px-8 py-3 rounded-lg font-bold text-red-400 tracking-wide cursor-not-allowed opacity-75" disabled>
                        X FRIEND REQUEST ALREADY SENT
                    </button>
                </div>
            `;
        }

        return `
            <div class="flex justify-center mt-6">
                <button id="add-friend-btn" class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400 tracking-wide">
                    ADD FRIEND
                </button>
            </div>
        `;
    }

    private renderLoading(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <div class="flex flex-col items-center justify-center min-h-[400px]">
                    <div class="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-cyan-400"></div>
                    <p class="text-cyan-400 text-xl font-bold mt-8 tracking-wider">
                        LOADING PROFILE...
                    </p>
                </div>
            </div>
        `;
    }

    private renderError(message?: string): string 
    {
        return `
            <div class="container mx-auto px-6 py-8 max-w-4xl">
                <button id="back-btn-error" class="text-cyan-400 hover:text-cyan-300 mb-6 flex items-center gap-2 transition-colors">
                    <span>←</span> <span>Back</span>
                </button>
                <div class="bg-red-900/30 backdrop-blur-md border-2 border-red-500/50 rounded-lg p-8 text-center">
                    <div class="text-6xl mb-4">⚠</div>
                    <h2 class="text-3xl font-bold text-red-400 mb-4 tracking-wider">
                        ERROR
                    </h2>
                    <p class="text-red-300 mb-6 text-lg">${this.escapeHtml(message || this.error || 'Failed to load profile')}</p>
                </div>
            </div>
        `;
    }

    private getStatusColor(status?: string): string 
    {
        switch (status) 
        {
            case 'ONLINE':
                return 'bg-green-500';
            case 'AWAY':
                return 'bg-yellow-500';
            case 'IN_GAME':
                return 'bg-blue-500';
            case 'OFFLINE':
            default:
                return 'bg-gray-500';
        }
    }

    private getStatusText(status?: string): string 
    {
        switch (status) 
        {
            case 'ONLINE':
                return 'ONLINE';
            case 'AWAY':
                return 'AWAY';
            case 'IN_GAME':
                return 'IN GAME';
            case 'OFFLINE':
            default:
                return 'OFFLINE';
        }
    }

    private formatDate(dateString: string | Date): string 
    {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options).toUpperCase();
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    private showMessage(message: string, type: 'success' | 'error'): void 
    {
        const container = document.getElementById('action-message');
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

    protected async afterMount(): Promise<void> 
    {
        // Extract username from URL (no decoding)
        this.username = window.location.pathname.split('/').pop() || '';
        
        if (!this.username) 
        {
            this.error = 'Invalid username';
            this.loading = false;
            this.rerender();
            return;
        }

        await this.loadUserProfile();
        
        // Check if viewing own profile
        try 
        {
            const currentUser = await UserService.getProfile();
            this.isOwnProfile = currentUser.username === this.username;
        } 
        catch (err) 
        {
            console.error('Failed to get current user:', err);
            this.isOwnProfile = false;
        }
        
        // Only check friendship if not viewing own profile
        if (!this.isOwnProfile) 
        {
            await this.checkFriendshipStatus();
        } 
        else 
        {
            this.checkingFriendship = false;
            this.rerender();
        }
        
        this.setupEventListeners();
    }

    private async loadUserProfile(): Promise<void> 
    {
        try 
        {
            this.loading = true;
            this.userProfile = await UserService.getPublicProfile(this.username);
            this.error = null;
        } 
        catch (err) 
        {
            this.error = (err as Error).message;
            console.error('Failed to load user profile:', err);
        } 
        finally 
        {
            this.loading = false;
            this.rerender();
        }
    }

    private async checkFriendshipStatus(): Promise<void> 
    {
        try 
        {
            this.checkingFriendship = true;
            const friendsData = await FriendService.getFriends();
            
            // Check if this user is in the friends list with safe access
            this.isFriend = friendsData?.friends?.some(
                friend => friend.username === this.username
            ) || false;

            // Check sent requests
            if (!this.isFriend) 
            {
                const sentRequests = await FriendService.getSentRequests();
                this.hasPendingRequest = sentRequests?.sentRequests?.some(
                    request => request.username === this.username
                ) || false;
            }
        } 
        catch (err) 
        {
            console.error('Failed to check friendship:', err);
            this.isFriend = false;
            this.hasPendingRequest = false;
        } 
        finally 
        {
            this.checkingFriendship = false;
            this.rerender();
        }
    }

    private rerender(): void 
    {
        const container = this.container || document.querySelector('#content-mount .page-content');
        if (container) 
        {
            container.innerHTML = this.render();
            // Reset the flag when we recreate the DOM
            this.listenersAttached = false;
            this.setupEventListeners();
        }
    }

    private setupEventListeners(): void 
    {
        // Prevent adding listeners multiple times
        if (this.listenersAttached) 
        {
            return;
        }
        
        this.listenersAttached = true;

        // Back button
        const backBtn = document.getElementById('back-btn');
        const backBtnError = document.getElementById('back-btn-error');
        
        if (backBtn) 
        {
            backBtn.addEventListener('click', () => 
            {
                (window as any).navigateTo('/profile');
            });
        }

        if (backBtnError) 
        {
            backBtnError.addEventListener('click', () => 
            {
                (window as any).navigateTo('/profile');
            });
        }

        // Add friend button
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) 
        {
            addFriendBtn.addEventListener('click', () => this.handleAddFriend());
        }

        // Unfriend button
        const unfriendBtn = document.getElementById('unfriend-btn');
        if (unfriendBtn) 
        {
            unfriendBtn.addEventListener('click', () => this.handleUnfriend());
        }
    }

    private async handleAddFriend(): Promise<void> 
    {
        if (!this.username) 
        {
            return;
        }

        try 
        {
            await FriendService.sendFriendRequest(this.username);
            this.showMessage('Friend request sent successfully!', 'success');
            
            // Update state
            this.hasPendingRequest = true;
            
            // Update button
            const addFriendBtn = document.getElementById('add-friend-btn');
            if (addFriendBtn) 
            {
                addFriendBtn.textContent = 'X FRIEND REQUEST ALREADY SENT';
                addFriendBtn.classList.remove('neon-border');
                addFriendBtn.classList.add('neon-border-red', 'cursor-not-allowed', 'opacity-75');
                addFriendBtn.setAttribute('disabled', 'true');
            }
        } 
        catch (err) 
        {
            const error = err as any;
            
            // Handle "cannot send to yourself" error
            if (error.status === 400 && error.message?.toLowerCase().includes('yourself')) 
            {
                this.showMessage('You cannot send a friend request to yourself!', 'error');
                
                // Mark as own profile and remove the button
                this.isOwnProfile = true;
                
                // Hide the button container
                const buttonContainer = document.querySelector('.flex.justify-center.mt-6');
                if (buttonContainer) 
                {
                    buttonContainer.remove();
                }
            }
            else if (error.status === 409 || error.message?.toLowerCase().includes('already')) 
            {
                this.showMessage('Friend request already sent!', 'error');
                this.hasPendingRequest = true;
                
                const addFriendBtn = document.getElementById('add-friend-btn');
                if (addFriendBtn) 
                {
                    addFriendBtn.textContent = 'X FRIEND REQUEST ALREADY SENT';
                    addFriendBtn.classList.remove('neon-border');
                    addFriendBtn.classList.add('neon-border-red', 'cursor-not-allowed', 'opacity-75');
                    addFriendBtn.setAttribute('disabled', 'true');
                }
            }
            else if (error.status === 400 && error.message?.toLowerCase().includes('already friends')) 
            {
                this.showMessage('You are already friends with this user!', 'error');
            }
            else 
            {
                this.showMessage(error.message || 'Failed to send friend request', 'error');
            }
            
            console.error('Failed to send friend request:', err);
        }
    }

    private async handleUnfriend(): Promise<void> 
    {
        if (!this.userProfile) 
        {
            return;
        }

        const confirmed = await Modal.confirm(
            'Remove Friend',
            `Are you sure you want to remove ${this.userProfile.username} from your friends?`,
            'REMOVE',
            'CANCEL',
            true
        );

        if (!confirmed) 
        {
            return;
        }


        try 
        {
            await FriendService.unfriend(this.userProfile.id);
            this.showMessage('Friend removed successfully', 'success');
            
            this.isFriend = false;
            
            const actionsContainer = document.querySelector('.flex.flex-wrap.justify-center.gap-4.mt-6') || 
                                    document.querySelector('.flex.justify-center.mt-6');
            if (actionsContainer) 
            {
                actionsContainer.innerHTML = `
                    <button id="add-friend-btn" class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400 tracking-wide">
                        ADD FRIEND
                    </button>
                `;
                
                const newBtn = document.getElementById('add-friend-btn');
                if (newBtn) 
                {
                    newBtn.addEventListener('click', () => this.handleAddFriend());
                }
            }
        } 
        catch (err) 
        {
            this.showMessage((err as Error).message, 'error');
            console.error('Failed to unfriend:', err);
        }
    }
}