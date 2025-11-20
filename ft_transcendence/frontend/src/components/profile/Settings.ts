// Settings.ts - User settings panel with 2FA
import { BaseComponent } from '../BaseComponent';
import { TwoFactorService } from '../../services/auth/TwoFactorService';
import { UserProfile } from '../../types/user.types';
import UserService from '../../services/user/UserService';
import { Modal } from '@/components/common/Modal';
import { FormValidator } from '@services/user/FormValidator';

interface SettingsProps 
{
    userProfile: UserProfile;
    onSettingsUpdated: (updatedProfile: UserProfile) => void;
}

export class Settings extends BaseComponent 
{
    private props: SettingsProps;
    private is2FAEnabled: boolean = false;
    private showQRCode: boolean = false;
    private qrCodeDataURL: string = '';
    private secret: string = '';
    private loading: boolean = false;
    private isLocked = false;

    // Track settings state
    private currentSettings = {
        showOnlineStatus: true,
        allowFriendRequests: true,
        showGameActivity: true,
        notifyFriendRequests: true,
        notifyGameInvites: true,
        notifyMessages: true
    };

    private hasUnsavedChanges: boolean = false;

    constructor(props?: SettingsProps) 
    {
        super();
        
        // If no props provided, we'll need to load profile
        if (props) 
        {
            this.props = props;
            this.initializeSettings();
        } 
        else 
        {
            // Create empty props, will load in afterMount
            this.props = {
                userProfile: {} as UserProfile,
                onSettingsUpdated: () => {}
            };
        }
    }

    private initializeSettings(): void 
    {
        const profile = this.props.userProfile;
        
        // Initialize 2FA status from nested settings
        this.is2FAEnabled = profile.settings?.twoFactorEnabled || false;
        
        // Initialize settings from profile with defaults
        this.currentSettings = {
            showOnlineStatus: profile.settings?.showOnlineStatus ?? true,
            allowFriendRequests: profile.settings?.allowFriendRequests ?? true,
            showGameActivity: profile.settings?.showGameActivity ?? true,
            notifyFriendRequests: profile.settings?.notifyFriendRequests ?? true,
            notifyGameInvites: profile.settings?.notifyGameInvites ?? true,
            notifyMessages: profile.settings?.notifyMessages ?? true
        };
    }

    render(): string 
    {
        const email = this.props.userProfile?.email || 'Loading...';
        
        return `
            <div class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="settings-modal">
                <div class="bg-gray-800/95 border-2 border-cyan-500/50 rounded-lg p-4 sm:p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 sm:mb-6">
                        <h2 class="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 tracking-wider" style="text-shadow: 0 0 10px #00ffff;">
                            SETTINGS
                        </h2>
                        <button id="close-settings-btn" class="text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0">
                            <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Message Container -->
                    <div id="settings-message" class="mb-4"></div>
                    
                    <div class="space-y-4 sm:space-y-6">
                        <!-- Account Settings -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">ACCOUNT</h3>
                            <div class="space-y-3 sm:space-y-4">
                                <div>
                                    <label class="block text-xs sm:text-sm font-medium text-gray-400 mb-2">EMAIL</label>
                                    <input 
                                        type="email" 
                                        class="w-full px-3 sm:px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none text-sm sm:text-base"
                                        value="${this.escapeHtml(email)}"
                                        disabled
                                    >
                                </div>
                                
                                ${this.shouldShowPasswordButton() ? `
                                <div>
                                    <label class="block text-xs sm:text-sm font-medium text-gray-400 mb-2">PASSWORD</label>
                                    <button id="change-password-btn" class="neon-border px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-cyan-400 text-xs sm:text-sm w-full sm:w-auto">
                                        CHANGE PASSWORD
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Two-Factor Authentication -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">TWO-FACTOR AUTHENTICATION</h3>
                            
                            <div class="bg-gray-900/50 border-2 border-gray-700 rounded-lg p-3 sm:p-4 mb-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm sm:text-base font-bold ${this.is2FAEnabled ? 'text-green-400' : 'text-gray-400'}">
                                            ${this.is2FAEnabled ? '✓ 2FA ENABLED' : '✗ 2FA DISABLED'}
                                        </p>
                                        <p class="text-xs text-gray-500 mt-1">
                                            ${this.is2FAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                                        </p>
                                    </div>
                                    ${this.is2FAEnabled 
                                        ? `<button id="disable-2fa-btn" class="neon-border-red px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-red-400 text-xs sm:text-sm whitespace-nowrap">
                                            DISABLE
                                        </button>`
                                        : `<button id="enable-2fa-btn" class="neon-border-green px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-green-400 text-xs sm:text-sm whitespace-nowrap">
                                            ENABLE
                                        </button>`
                                    }
                                </div>
                            </div>
                            
                            <!-- 2FA Setup Area (shown when enabling) -->
                            <div id="twofa-setup-area" style="display: ${this.showQRCode ? 'block' : 'none'};">
                                ${this.render2FASetup()}
                            </div>
                        </div>
                        
                        <!-- Two-Factor Authentication -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">TWO-FACTOR AUTHENTICATION</h3>
                            
                            <div class="bg-gray-900/50 border-2 border-gray-700 rounded-lg p-3 sm:p-4 mb-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm sm:text-base font-bold ${this.is2FAEnabled ? 'text-green-400' : 'text-gray-400'}">
                                            ${this.is2FAEnabled ? '✓ 2FA ENABLED' : '✗ 2FA DISABLED'}
                                        </p>
                                        <p class="text-xs text-gray-500 mt-1">
                                            ${this.is2FAEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                                        </p>
                                    </div>
                                    ${this.is2FAEnabled 
                                        ? `<button id="disable-2fa-btn" class="neon-border-red px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-red-400 text-xs sm:text-sm whitespace-nowrap">
                                            DISABLE
                                        </button>`
                                        : `<button id="enable-2fa-btn" class="neon-border-green px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-green-400 text-xs sm:text-sm whitespace-nowrap">
                                            ENABLE
                                        </button>`
                                    }
                                </div>
                            </div>
                            
                            <!-- 2FA Setup Area (shown when enabling) -->
                            <div id="twofa-setup-area" style="display: ${this.showQRCode ? 'block' : 'none'};">
                                ${this.render2FASetup()}
                            </div>
                        </div>
                        
                        <!-- Privacy Settings -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">PRIVACY</h3>
                            <div class="space-y-2 sm:space-y-3">
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Show online status</span>
                                    <input type="checkbox" id="toggle-show-online-status" class="toggle" ${this.currentSettings.showOnlineStatus ? 'checked' : ''}>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Allow friend requests</span>
                                    <input type="checkbox" id="toggle-allow-friend-requests" class="toggle" ${this.currentSettings.allowFriendRequests ? 'checked' : ''}>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Show game activity</span>
                                    <input type="checkbox" id="toggle-show-game-activity" class="toggle" ${this.currentSettings.showGameActivity ? 'checked' : ''}>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Notifications -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">NOTIFICATIONS</h3>
                            <div class="space-y-2 sm:space-y-3">
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Friend requests</span>
                                    <input type="checkbox" id="toggle-notify-friend-requests" class="toggle" ${this.currentSettings.notifyFriendRequests ? 'checked' : ''}>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Game invites</span>
                                    <input type="checkbox" id="toggle-notify-game-invites" class="toggle" ${this.currentSettings.notifyGameInvites ? 'checked' : ''}>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Messages</span>
                                    <input type="checkbox" id="toggle-notify-messages" class="toggle" ${this.currentSettings.notifyMessages ? 'checked' : ''}>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Save Button (shown when changes detected) -->
                        <div id="save-settings-container" style="display: ${this.hasUnsavedChanges ? 'block' : 'none'};">
                            <button id="save-settings-btn" class="neon-border-green px-6 py-3 rounded-lg font-bold text-green-400 text-sm sm:text-base w-full">
                                💾 SAVE CHANGES
                            </button>
                        </div>
                        
                        <!-- Danger Zone -->
                        <div>
                            <h3 class="text-lg sm:text-xl font-bold text-red-400 mb-3 sm:mb-4">DANGER ZONE</h3>
                            <button id="delete-account-btn" class="border-2 border-red-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-red-400 hover:bg-red-500/20 transition-all text-xs sm:text-sm w-full sm:w-auto">
                                DELETE ACCOUNT
                            </button>
                        </div>
                    </div>
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
                    border: 2px solid #ff4444;
                    box-shadow:
                        0 0 10px rgba(255, 68, 68, 0.6),
                        0 0 20px rgba(255, 68, 68, 0.4),
                        inset 0 0 10px rgba(255, 68, 68, 0.2);
                    transition: all 0.3s ease;
                }

                .neon-border-red:hover {
                    box-shadow:
                        0 0 15px rgba(255, 68, 68, 0.9),
                        0 0 30px rgba(255, 68, 68, 0.6),
                        inset 0 0 15px rgba(255, 68, 68, 0.3);
                    transform: translateY(-2px);
                }
                
                .toggle {
                    width: 2.5rem;
                    height: 1.25rem;
                    appearance: none;
                    background: #374151;
                    border-radius: 9999px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.3s;
                    flex-shrink: 0;
                }
                
                @media (min-width: 640px) {
                    .toggle {
                        width: 3rem;
                        height: 1.5rem;
                    }
                }
                
                .toggle:checked {
                    background: #00ffff;
                }
                
                .toggle::before {
                    content: '';
                    position: absolute;
                    width: 0.875rem;
                    height: 0.875rem;
                    border-radius: 50%;
                    top: 50%;
                    left: 0.125rem;
                    background: white;
                    transform: translateY(-50%);
                    transition: left 0.3s;
                }
                
                @media (min-width: 640px) {
                    .toggle::before {
                        width: 1.125rem;
                        height: 1.125rem;
                        left: 0.15rem;
                    }
                }
                
                .toggle:checked::before {
                    left: calc(100% - 1rem);
                }
                
                @media (min-width: 640px) {
                    .toggle:checked::before {
                        left: calc(100% - 1.25rem);
                    }
                }
            </style>
        `;
    }

    private render2FASetup(): string 
    {
        if (this.loading) 
        {
            return `
                <div class="bg-gray-900/50 border-2 border-cyan-500/50 rounded-lg p-4 text-center">
                    <div class="loader mx-auto mb-4"></div>
                    <p class="text-cyan-400 text-sm">Setting up 2FA...</p>
                </div>
            `;
        }

        if (!this.qrCodeDataURL) 
        {
            return '';
        }

        return `
            <div class="bg-gray-900/50 border-2 border-cyan-500/50 rounded-lg p-4">
                <p class="text-cyan-300 text-sm mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                
                <div class="flex justify-center mb-4">
                    <img src="${this.qrCodeDataURL}" alt="2FA QR Code" class="border-2 border-cyan-500 rounded-lg">
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-400 text-xs mb-2">Or enter this secret manually:</p>
                    <div class="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-cyan-300 font-mono text-xs break-all">
                        ${this.secret}
                    </div>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-400 mb-2">
                        Enter the 6-digit code from your app:
                    </label>
                    <input 
                        type="text" 
                        id="twofa-verify-input"
                        maxlength="6"
                        placeholder="000000"
                        class="w-full px-4 py-2 bg-gray-800 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none text-center text-lg tracking-widest font-mono"
                    >
                </div>
                
                <div class="flex gap-3">
                    <button id="verify-2fa-btn" class="neon-border-green px-4 py-2 rounded-lg font-bold text-green-400 text-sm flex-1">
                        VERIFY & ENABLE
                    </button>
                    <button id="cancel-2fa-btn" class="neon-border px-4 py-2 rounded-lg font-bold text-cyan-400 text-sm flex-1">
                        CANCEL
                    </button>
                </div>
            </div>
        `;
    }

    protected async afterMount(): Promise<void> 
    {
        // If no profile data, load it
        if (!this.props.userProfile.id) 
        {
            await this.loadUserProfile();
        }
        
        this.setupEventListeners();
    }

    private async loadUserProfile(): Promise<void> 
    {
        try 
        {
            const profile = await UserService.getProfile();
            this.props.userProfile = profile;
            this.initializeSettings();
            
            // Re-render with loaded data
            this.mount('#settings-container');
        } 
        catch (error) 
        {
            console.error('Failed to load user profile:', error);
            this.showMessage('Failed to load profile data', 'error');
        }
    }

    private shouldShowPasswordButton(): boolean 
    {
        const profile = this.props.userProfile;
        // If OAuth is enabled, user has no password to change
        if (profile.settings?.oauthEnabled === true) 
        {
            return false;
        }
        
        return true;
    }

    private setupEventListeners(): void 
    {
        // Close button
        const closeBtn = document.getElementById('close-settings-btn');
        if (closeBtn) 
        {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Close on backdrop click
        const modal = document.getElementById('settings-modal');
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

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) 
        {
            changePasswordBtn.addEventListener('click', async () => await this.handleChangePassword());
        }

        // 2FA buttons
        const enable2FABtn = document.getElementById('enable-2fa-btn');
        if (enable2FABtn) 
        {
            enable2FABtn.addEventListener('click', async () => await this.handleEnable2FA());
        }

        const disable2FABtn = document.getElementById('disable-2fa-btn');
        if (disable2FABtn) 
        {
            disable2FABtn.addEventListener('click', async () => await this.handleDisable2FA());
        }

        // Toggle change listeners
        this.setupToggleListeners();

        // Save button
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) 
        {
            saveBtn.addEventListener('click', async () => await this.handleSaveSettings());
        }

        // Delete account button
        const deleteBtn = document.getElementById('delete-account-btn');
        if (deleteBtn) 
        {
            deleteBtn.addEventListener('click', () => this.handleDeleteAccount());
        }
    }

    private setupToggleListeners(): void 
    {
        const toggles = [
            { id: 'toggle-show-online-status', key: 'showOnlineStatus' as const },
            { id: 'toggle-allow-friend-requests', key: 'allowFriendRequests' as const },
            { id: 'toggle-show-game-activity', key: 'showGameActivity' as const },
            { id: 'toggle-notify-friend-requests', key: 'notifyFriendRequests' as const },
            { id: 'toggle-notify-game-invites', key: 'notifyGameInvites' as const },
            { id: 'toggle-notify-messages', key: 'notifyMessages' as const }
        ];

        toggles.forEach(({ id, key }) => 
        {
            const toggle = document.getElementById(id) as HTMLInputElement;
            if (toggle) 
            {
                toggle.addEventListener('change', () => 
                {
                    this.currentSettings[key] = toggle.checked;
                    this.hasUnsavedChanges = true;
                    this.updateSaveButton();
                });
            }
        });
    }

    private updateSaveButton(): void 
    {
        const saveContainer = document.getElementById('save-settings-container');
        if (saveContainer) 
        {
            saveContainer.style.display = this.hasUnsavedChanges ? 'block' : 'none';
        }
    }

    private async handleSaveSettings(): Promise<void> 
    {
        try 
        {
            const updatedProfile = await UserService.updateSettings(this.currentSettings);
            
            this.hasUnsavedChanges = false;
            this.updateSaveButton();
            
            this.showMessage('✓ Settings saved successfully!', 'success');
            
            // Notify parent component
            if (this.props.onSettingsUpdated) 
            {
                this.props.onSettingsUpdated(updatedProfile);
            }
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Failed to save settings', 'error');
        }
    }

    private lockFor(ms: number) 
    {
        this.isLocked = true;
        setTimeout(() => { this.isLocked = false; }, ms);
    }

    private async handleEnable2FA(): Promise<void> 
    {
        if (this.isLocked) 
        {
            this.showMessage('Please wait a moment before trying again.', 'error');
            return;
        }

        this.lockFor(3000); // 3 seconds cooldown

        try 
        {
            this.loading = true;
            this.showQRCode = true;
            this.updateSetupArea();

            const response = await TwoFactorService.setup2FA();
            
            this.qrCodeDataURL = response.qrCodeDataURL;
            this.secret = response.secret;

            this.showMessage('Scan the QR Code and enter the 6-digit code.', 'success');
            
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Failed to setup 2FA', 'error');
            this.showQRCode = false;
        } 
        finally 
        {
            this.loading = false;
            this.updateSetupArea();
        }
    }

    private async handleVerify2FA(): Promise<void>
    {
        if (this.isLocked) 
        {
            this.showMessage('Please wait a moment before trying again.', 'error');
            return;
        }

        this.lockFor(2000); // 2 seconds cooldown

        const input = document.getElementById('twofa-verify-input') as HTMLInputElement;
        if (!input) 
        {
            return;
        }

        const code = input.value.trim();
        if (code.length !== 6) 
        {
            this.showMessage('Please enter a 6-digit code', 'error');
            return;
        }

        try 
        {
            await TwoFactorService.verify2FA(code);
            this.is2FAEnabled = true;
            this.showQRCode = false;
            this.qrCodeDataURL = '';
            this.secret = '';
            
            this.showMessage('✓ 2FA enabled successfully!', 'success');
            this.mount('#settings-container');
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Invalid code', 'error');
        }
    }

    private async handleDisable2FA(): Promise<void> 
    {
        const confirmed = await Modal.confirm(
            'Disable Two-Factor Authentication',
            'Are you sure you want to disable 2FA? This will make your account less secure.',
            'DISABLE',
            'CANCEL',
            true
        );

        if (!confirmed) 
        {
            return;
        }

        try 
        {
            await TwoFactorService.disable2FA();
            
            this.is2FAEnabled = false;
            this.showMessage('✓ 2FA disabled', 'success');
            
            // Remount to update UI
            this.mount('#settings-container');
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Failed to disable 2FA', 'error');
        }
    }


    private async handleChangePassword(): Promise<void> 
    {
        // Show password change modal
        const modalHtml = `
            <div id="password-change-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div class="bg-gray-800/95 border-2 border-cyan-500/50 rounded-lg p-6 max-w-md w-full">
                    <h3 class="text-xl font-bold text-cyan-400 mb-4 text-center">CHANGE PASSWORD</h3>
                    
                    <div id="password-error" class="mb-4"></div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                            <input 
                                type="password" 
                                id="current-password"
                                class="w-full px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none"
                                placeholder="Enter current password"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                            <input 
                                type="password" 
                                id="new-password"
                                class="w-full px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none"
                                placeholder="Min 8 chars, upper, lower, number, special"
                            >
                            <p class="text-xs text-gray-500 mt-1">Must contain uppercase, lowercase, number, and special character (@$!%*?&.)</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                            <input 
                                type="password" 
                                id="confirm-password"
                                class="w-full px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none"
                                placeholder="Confirm new password"
                            >
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-6">
                        <button id="confirm-password-change" class="neon-border-green px-6 py-3 rounded-lg font-bold text-green-400 flex-1">
                            CHANGE PASSWORD
                        </button>
                        <button id="cancel-password-change" class="neon-border px-6 py-3 rounded-lg font-bold text-cyan-400 flex-1">
                            CANCEL
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const confirmBtn = document.getElementById('confirm-password-change');
        const cancelBtn = document.getElementById('cancel-password-change');
        const modal = document.getElementById('password-change-modal');
        
        if (cancelBtn && modal) 
        {
            cancelBtn.addEventListener('click', () => modal.remove());
        }
        
        if (confirmBtn) 
        {
            confirmBtn.addEventListener('click', async () => 
            {
                const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value;
                const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value;
                const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value;
                
                const errorDiv = document.getElementById('password-error');
                
                const showError = (message: string) => {
                    if (errorDiv) 
                    {
                        errorDiv.innerHTML = `
                            <div class="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-3">
                                <p class="text-red-400 text-sm text-center">${this.escapeHtml(message)}</p>
                            </div>
                        `;
                    }
                };
                
                // Validate all fields are filled
                if (!currentPassword || !newPassword || !confirmPassword) 
                {
                    showError('All fields are required');
                    return;
                }
                
                // Validate new password using FormValidator
                const passwordError = FormValidator.validatePassword(newPassword);
                if (passwordError) 
                {
                    showError(passwordError);
                    return;
                }
                
                // Validate passwords match using FormValidator
                const confirmError = FormValidator.validatePasswordConfirm(newPassword, confirmPassword);
                if (confirmError) 
                {
                    showError(confirmError);
                    return;
                }
                
                try 
                {
                    // Call auth service to change password
                    const response = await fetch('/api/auth/update-password', 
                    {
                        method: 'PATCH',
                        headers: 
                        {
                            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ currentPassword, newPassword })
                    });
                    
                    if (!response.ok) 
                    {
                        const contentType = response.headers.get('content-type');
                        let errorMessage = 'Failed to change password';
                        
                        if (contentType && contentType.includes('application/json')) 
                        {
                            const error = await response.json();
                            errorMessage = error.message || errorMessage;
                        }
                        
                        throw new Error(errorMessage);
                    }
                    
                    modal?.remove();
                    this.showMessage('✓ Password changed successfully!', 'success');
                } 
                catch (error) 
                {
                    showError((error as Error).message);
                }
            });
        }
    }

    private async handleDeleteAccount(): Promise<void> 
    {
        const confirmed = await Modal.confirm(
            'DELETE ACCOUNT',
            'Are you sure you want to permanently delete your account? This action cannot be undone!',
            'DELETE',
            'CANCEL',
            true
        );
        
        if (!confirmed) 
        {
            return;
        }
        
        const finalConfirm = await Modal.confirm(
            'FINAL CONFIRMATION',
            'This is your last chance. Are you absolutely sure you want to delete your account?',
            'YES, DELETE',
            'CANCEL',
            true
        );
        
        if (!finalConfirm) 
        {
            return;
        }
        
        try 
        {
            const response = await fetch('/api/auth/delete-account', 
            {
                method: 'DELETE',
                headers: 
                {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})

            });
            
            if (!response.ok) 
            {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete account');
            }
            
            // Clear auth token
            localStorage.removeItem('access_token');
            
            // Show success message
            this.showMessage('✓ Account deleted successfully', 'success');
            
            // Redirect to home after 2 seconds
            setTimeout(() => 
            {
                    const modal = document.getElementById('settings-modal');
                    if (modal)
                    {
                        modal.remove();
                    }

                    const container = document.getElementById('settings-container');
                    if (container)
                    {
                        container.remove();
                    }

                    (window as any).navigateTo('/');
            }, 2000);
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Failed to delete account', 'error');
        }
    }

    private updateSetupArea(): void 
    {
        const setupArea = document.getElementById('twofa-setup-area');
        if (setupArea) 
        {
            setupArea.style.display = this.showQRCode ? 'block' : 'none';
            setupArea.innerHTML = this.render2FASetup();
            
            // Reattach event listeners
            const verify2FABtn = document.getElementById('verify-2fa-btn');
            if (verify2FABtn) 
            {
                verify2FABtn.addEventListener('click', async () => 
                {
                    await this.handleVerify2FA();
                });
            }

            const cancel2FABtn = document.getElementById('cancel-2fa-btn');
            if (cancel2FABtn) 
            {
                cancel2FABtn.addEventListener('click', () => 
                {
                    this.showQRCode = false;
                    this.qrCodeDataURL = '';
                    this.secret = '';
                    this.updateSetupArea();
                });
            }
        }
    }

    private showMessage(message: string, type: 'success' | 'error' | 'info'): void 
    {
        const container = document.getElementById('settings-message');
        if (!container) 
        {
            return;
        }

        let bgColor = '';
        let borderColor = '';
        let textColor = '';
        let icon = '';

        if (type === 'success') 
        {
            bgColor = 'bg-green-900/30';
            borderColor = 'border-green-500/50';
            textColor = 'text-green-400';
            icon = '✓';
        }
        else if (type === 'error') 
        {
            bgColor = 'bg-red-900/30';
            borderColor = 'border-red-500/50';
            textColor = 'text-red-400';
            icon = '✗';
        }
        else 
        {
            bgColor = 'bg-cyan-900/30';
            borderColor = 'border-cyan-500/50';
            textColor = 'text-cyan-400';
            icon = 'ℹ';
        }

        container.innerHTML = `
            <div class="${bgColor} ${borderColor} backdrop-blur-sm border-2 rounded-lg p-3">
                <p class="${textColor} font-bold text-center text-sm">
                    ${icon} ${this.escapeHtml(message)}
                </p>
            </div>
        `;

        setTimeout(() => 
        {
            container.innerHTML = '';
        }, 5000);
    }

    private closeModal(): void 
    {
        const modal = document.getElementById('settings-modal');
        if (modal) 
        {
            modal.remove();
        }
        
        // Remove container
        const container = document.getElementById('settings-container');
        if (container) 
        {
            container.remove();
        }
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}