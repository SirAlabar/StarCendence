import { BaseComponent } from '../components/BaseComponent';
import UserService from '../services/UserService';
import { UserProfile } from '../types/user.types';

export default class ProfilePage extends BaseComponent 
{
    private userProfile: UserProfile | null = null;
    private loading: boolean = true;
    private error: string | null = null;

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

                .neon-border-purple {
                border: 2px solid #a855f7;
                box-shadow:
                    0 0 10px rgba(168, 85, 247, 0.6),
                    0 0 20px rgba(168, 85, 247, 0.4),
                    inset 0 0 10px rgba(168, 85, 247, 0.2);
                transition: all 0.3s ease;
                }

                .neon-border-purple:hover {
                box-shadow:
                    0 0 15px rgba(168, 85, 247, 0.9),
                    0 0 30px rgba(168, 85, 247, 0.6),
                    inset 0 0 15px rgba(168, 85, 247, 0.3);
                transform: translateY(-2px);
                }

                .profile-avatar {
                    border: 3px solid #00ffff;
                    box-shadow: 
                        0 0 20px #00ffff,
                        0 0 40px #00ffff,
                        inset 0 0 20px rgba(0, 255, 255, 0.2);
                }    
            </style>

            <div class="container mx-auto px-6 py-8 max-w-6xl">
                <h1 class="text-4xl font-bold font-game text-cyan-400 mb-12 text-center tracking-wide" style="text-shadow: 0 0 10px #00ffff;">
                    PROFILE SETTINGS
                </h1>
                
                <div class="grid md:grid-cols-3 gap-8 items-stretch">
                    <!-- Profile Card -->
                    <div class="md:col-span-1">
                        ${this.renderProfileCard()}
                    </div>
                    
                    <!-- Profile Details -->
                    <div class="md:col-span-2">
                        ${this.renderProfileDetails()}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap justify-center gap-4 mt-12">
                    <button class="neon-border px-8 py-3 rounded-lg font-bold text-cyan-400">
                        SEARCH USERS
                    </button>
                <button class="neon-border px-8 py-3 rounded-lg font-bold text-purple-400">
                        MY FRIENDS
                    </button>
                </div>
                
            </div>
        `;
    }

    private renderProfileCard(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        const avatarUrl = this.userProfile.avatarUrl 
            ? `http://localhost:3004${this.userProfile.avatarUrl}` 
            : null;

        const statusColor = this.getStatusColor(this.userProfile.status);
        const statusText = this.getStatusText(this.userProfile.status);

        return `
            <div class="bg-gray-800/20 backdrop-blur-md rounded-lg p-8 border border-gray-700/50 text-center">
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
                
                <div class="space-y-3 text-sm mb-6">
                    <div class="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span class="text-gray-400 font-medium">TRANSMISSION:</span>
                        <span class="text-cyan-300 text-xs">${this.escapeHtml(this.userProfile.email)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-gray-700/50">
                        <span class="text-gray-400 font-medium">ENLISTED:</span>
                        <span class="text-cyan-300">${this.formatDate(this.userProfile.createdAt)}</span>
                    </div>
                </div>
                
                <button id="upload-avatar-btn" class="neon-border-purple w-full px-4 py-3 rounded-lg font-bold text-red-400 tracking-wide">
                    UPDATE HOLOGRAM
                </button>
                <input type="file" id="avatar-input" accept="image/*" class="hidden">
            </div>
        `;
    }

    private renderProfileDetails(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        return `
            <div class="bg-gray-800/20 backdrop-blur-md rounded-lg p-8 border border-gray-700/30">
                <h3 class="text-2xl font-bold text-cyan-400 mb-8 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                    USER INFORMATION
                </h3>
                
                <div class="mb-8">
                    <label class="block text-sm font-bold text-cyan-300 mb-3 tracking-wide">BIOGRAPHICAL DATA</label>
                    <textarea 
                        id="bio-input"
                        rows="5" 
                        placeholder="Enter your mission statement... (max 160 characters)"
                        maxlength="160"
                        class="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700/50 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none resize-none font-mono text-sm backdrop-blur-sm"
                    >${this.escapeHtml(this.userProfile.bio || '')}</textarea>
                    <div class="text-right text-sm text-cyan-400 mt-2 font-mono">
                        <span id="bio-counter">${(this.userProfile.bio || '').length}</span>/160 CHARACTERS
                    </div>
                </div>
                
                <div id="profile-message" class="mb-6"></div>
                
                <div class="flex flex-wrap gap-4">
                    <button id="save-bio-btn" class="neon-border-green px-8 py-3 rounded-lg font-bold text-purple-400 tracking-wide transition-all backdrop-blur-sm">
                        SAVE DATA
                    </button>
                    <button id="cancel-bio-btn" class="neon-border-green px-8 py-3 rounded-lg font-bold text-green-300 tracking-wide transition-all backdrop-blur-sm">
                        CANCEL
                    </button>
                </div>
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
                return 'READY FOR DUTY';
            case 'AWAY':
                return 'ON STANDBY';
            case 'IN_GAME':
                return 'IN COMBAT';
            case 'OFFLINE':
            default:
                return 'OFF DUTY';
        }
    }

    private formatDate(dateString: string): string 
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

        setTimeout(() => {
            container.innerHTML = '';
        }, 5000);
    }

    protected async afterMount(): Promise<void> 
    {
        await this.loadProfile();
        this.setupEventListeners();
    }

    private async loadProfile(): Promise<void> 
    {
        try 
        {
            this.loading = true;
            this.userProfile = await UserService.getProfile();
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

    private rerender(): void 
    {
        const container = document.querySelector('#content-mount');
        if (container) 
        {
            container.innerHTML = this.render();
            this.setupEventListeners();
        }
    }

    private setupEventListeners(): void 
    {
        const bioInput = document.getElementById('bio-input') as HTMLTextAreaElement;
        const bioCounter = document.getElementById('bio-counter');
        if (bioInput && bioCounter) 
        {
            bioInput.addEventListener('input', () => {
                bioCounter.textContent = bioInput.value.length.toString();
            });
        }

        const saveBioBtn = document.getElementById('save-bio-btn');
        if (saveBioBtn) 
        {
            saveBioBtn.addEventListener('click', () => this.handleSaveBio());
        }

        const cancelBioBtn = document.getElementById('cancel-bio-btn');
        if (cancelBioBtn && bioInput && this.userProfile) 
        {
            cancelBioBtn.addEventListener('click', () => {
                bioInput.value = this.userProfile?.bio || '';
                if (bioCounter) 
                {
                    bioCounter.textContent = bioInput.value.length.toString();
                }
            });
        }

        const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
        const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;
        if (uploadAvatarBtn && avatarInput) 
        {
            uploadAvatarBtn.addEventListener('click', () => {
                avatarInput.click();
            });

            avatarInput.addEventListener('change', (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) 
                {
                    this.handleUploadAvatar(file);
                }
            });
        }

        const searchBtn = document.getElementById('search-players-btn');
        if (searchBtn) 
        {
            searchBtn.addEventListener('click', () => {
                alert('Search modal coming soon!');
            });
        }

        const friendsBtn = document.getElementById('my-friends-btn');
        if (friendsBtn) 
        {
            friendsBtn.addEventListener('click', () => {
                (window as any).navigateTo('/friends');
            });
        }
    }

    private async handleSaveBio(): Promise<void> 
    {
        const bioInput = document.getElementById('bio-input') as HTMLTextAreaElement;
        if (!bioInput) 
        {
            return;
        }

        const newBio = bioInput.value.trim();

        try 
        {
            const updatedProfile = await UserService.updateProfile(newBio);
            this.userProfile = updatedProfile;
            this.showMessage('Bio updated successfully', 'success');
        } 
        catch (err) 
        {
            this.showMessage((err as Error).message, 'error');
            console.error('Failed to update bio:', err);
        }
    }

    private async handleUploadAvatar(file: File): Promise<void> 
    {
        try 
        {
            this.showMessage('Uploading avatar...', 'success');
            const avatarUrl = await UserService.uploadAvatar(file);
            
            if (this.userProfile) 
            {
                this.userProfile.avatarUrl = avatarUrl;
            }
            
            this.showMessage('Avatar uploaded successfully', 'success');
            this.rerender();
        } 
        catch (err) 
        {
            this.showMessage((err as Error).message, 'error');
            console.error('Failed to upload avatar:', err);
        }
    }
}