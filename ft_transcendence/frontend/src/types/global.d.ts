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
                @keyframes starwars-glow {
                    0%, 100% { 
                        box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff;
                    }
                    50% { 
                        box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff;
                    }
                }
                
                @keyframes hologram-flicker {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                .starwars-title {
                    text-shadow: 
                        0 0 10px #00ffff,
                        0 0 20px #00ffff,
                        0 0 30px #00ffff,
                        0 0 40px #00ffff;
                    animation: starwars-glow 2s ease-in-out infinite;
                }
                
                .hologram-card {
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(138, 43, 226, 0.1) 100%);
                    border: 2px solid #00ffff;
                    box-shadow: 
                        0 0 20px rgba(0, 255, 255, 0.3),
                        inset 0 0 20px rgba(0, 255, 255, 0.1);
                    animation: hologram-flicker 3s ease-in-out infinite;
                }
                
                .profile-avatar {
                    border: 3px solid #00ffff;
                    box-shadow: 
                        0 0 20px #00ffff,
                        0 0 40px #00ffff,
                        inset 0 0 20px rgba(0, 255, 255, 0.2);
                }
                
                .btn-starwars {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border: 2px solid #00ffff;
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    text-shadow: 0 0 5px #00ffff;
                    transition: all 0.3s ease;
                }
                
                .btn-starwars:hover {
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                    transform: translateY(-2px);
                }
                
                .btn-primary-starwars {
                    background: linear-gradient(135deg, #00ffff 0%, #0088ff 100%);
                    border: 2px solid #ffffff;
                    color: #000000;
                    text-shadow: none;
                }
                
                .btn-success-starwars {
                    background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
                    border: 2px solid #ffffff;
                    color: #000000;
                    text-shadow: none;
                }
                
                .status-indicator {
                    box-shadow: 0 0 10px currentColor;
                }
            </style>
            
            <div class="container mx-auto px-6 py-8 max-w-6xl">
                <h1 class="text-5xl font-bold font-game text-center mb-12 starwars-title" style="color: #00ffff;">
                    PILOT DOSSIER
                </h1>
                
                <div class="grid md:grid-cols-3 gap-8">
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
                    <button id="search-players-btn" class="btn-starwars px-8 py-4 rounded-lg font-bold text-lg text-cyan-400">
                        SEARCH PILOTS
                    </button>
                    <button id="my-friends-btn" class="btn-starwars px-8 py-4 rounded-lg font-bold text-lg text-purple-400">
                        MY SQUADRON
                    </button>
                </div>
                
                <div class="text-center mt-8">
                    <button onclick="navigateTo('/')" class="btn-starwars px-6 py-3 rounded-lg font-medium text-gray-400">
                        RETURN TO BASE
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
            <div class="hologram-card rounded-lg p-8 text-center">
                ${avatarUrl 
                    ? `<img src="${avatarUrl}" alt="Avatar" class="w-32 h-32 rounded-full mx-auto mb-6 object-cover profile-avatar">`
                    : `<div class="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center text-5xl profile-avatar bg-gradient-to-br from-cyan-500 to-purple-600">
                        <svg class="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>`
                }
                
                <h2 class="text-3xl font-bold text-cyan-400 mb-4 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                    ${this.escapeHtml(this.userProfile.username).toUpperCase()}
                </h2>
                
                <div class="flex items-center justify-center gap-3 mb-6">
                    <span class="inline-block w-4 h-4 rounded-full status-indicator ${statusColor}"></span>
                    <span class="text-gray-300 text-sm font-bold tracking-wide">${statusText}</span>
                </div>
                
                <div class="space-y-3 text-sm mb-6">
                    <div class="flex justify-between items-center py-2 border-b border-cyan-900/30">
                        <span class="text-gray-400 font-medium">TRANSMISSION:</span>
                        <span class="text-cyan-300 text-xs">${this.escapeHtml(this.userProfile.email)}</span>
                    </div>
                    <div class="flex justify-between items-center py-2 border-b border-cyan-900/30">
                        <span class="text-gray-400 font-medium">ENLISTED:</span>
                        <span class="text-cyan-300">${this.formatDate(this.userProfile.createdAt)}</span>
                    </div>
                </div>
                
                <button id="upload-avatar-btn" class="btn-primary-starwars w-full px-4 py-3 rounded-lg font-bold text-sm tracking-wide">
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
            <div class="hologram-card rounded-lg p-8">
                <h3 class="text-2xl font-bold text-cyan-400 mb-8 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                    PILOT INFORMATION
                </h3>
                
                <div class="mb-8">
                    <label class="block text-sm font-bold text-cyan-300 mb-3 tracking-wide">BIOGRAPHICAL DATA</label>
                    <textarea 
                        id="bio-input"
                        rows="5" 
                        placeholder="Enter your mission statement... (max 160 characters)"
                        maxlength="160"
                        class="w-full px-4 py-3 bg-gray-900/50 border-2 border-cyan-900/50 rounded-lg text-cyan-100 focus:border-cyan-400 focus:outline-none resize-none font-mono text-sm"
                        style="box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.1);"
                    >${this.escapeHtml(this.userProfile.bio || '')}</textarea>
                    <div class="text-right text-sm text-cyan-400 mt-2 font-mono">
                        <span id="bio-counter">${(this.userProfile.bio || '').length}</span>/160 CHARACTERS
                    </div>
                </div>
                
                <div id="profile-message" class="mb-6"></div>
                
                <div class="flex flex-wrap gap-4">
                    <button id="save-bio-btn" class="btn-success-starwars px-8 py-3 rounded-lg font-bold tracking-wide">
                        SAVE DATA
                    </button>
                    <button id="cancel-bio-btn" class="btn-starwars px-8 py-3 rounded-lg font-medium text-gray-400">
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
                    <div class="relative">
                        <div class="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-cyan-400" style="box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);"></div>
                        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div class="w-12 h-12 bg-cyan-400 rounded-full" style="box-shadow: 0 0 30px rgba(0, 255, 255, 0.8);"></div>
                        </div>
                    </div>
                    <p class="text-cyan-400 text-xl font-bold mt-8 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
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
                <div class="hologram-card rounded-lg p-8 text-center" style="border-color: #ff0000; box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);">
                    <div class="text-6xl mb-4">⚠</div>
                    <h2 class="text-3xl font-bold text-red-400 mb-4 tracking-wider" style="text-shadow: 0 0 10px #ff0000;">
                        SYSTEM ERROR
                    </h2>
                    <p class="text-red-300 mb-6 text-lg">${this.escapeHtml(message || this.error || 'Failed to load profile')}</p>
                    <button onclick="location.reload()" class="btn-starwars px-8 py-3 rounded-lg font-bold text-red-400" style="border-color: #ff0000;">
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

        const borderColor = type === 'success' ? '#00ff88' : '#ff0000';
        const bgColor = type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        const textColor = type === 'success' ? '#00ff88' : '#ff4444';
        const icon = type === 'success' ? '✓' : '✗';

        container.innerHTML = `
            <div style="
                background: ${bgColor};
                border: 2px solid ${borderColor};
                box-shadow: 0 0 15px ${borderColor}50;
                border-radius: 0.5rem;
                padding: 1rem;
                animation: hologram-flicker 2s ease-in-out infinite;
            ">
                <p style="color: ${textColor}; font-weight: bold; text-align: center;">
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