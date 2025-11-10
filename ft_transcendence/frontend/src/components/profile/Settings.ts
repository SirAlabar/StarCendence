// Settings.ts - User settings panel with 2FA
import { BaseComponent } from '../BaseComponent';
import { TwoFactorService } from '../../services/auth/TwoFactorService';

export class Settings extends BaseComponent 
{
    private is2FAEnabled: boolean = false;
    private showQRCode: boolean = false;
    private qrCodeDataURL: string = '';
    private secret: string = '';
    private loading: boolean = false;

    render(): string 
    {
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
                                    <label class="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        class="w-full px-3 sm:px-4 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 focus:border-cyan-500 focus:outline-none text-sm sm:text-base"
                                        placeholder="your.email@example.com"
                                        disabled
                                    >
                                </div>
                                <div>
                                    <label class="block text-xs sm:text-sm font-medium text-gray-400 mb-2">Password</label>
                                    <button id="change-password-btn" class="neon-border px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-cyan-400 text-xs sm:text-sm w-full sm:w-auto">
                                        CHANGE PASSWORD
                                    </button>
                                </div>
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
                                        ? `<button id="disable-2fa-btn" class="neon-border px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-red-400 text-xs sm:text-sm whitespace-nowrap">
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
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Allow friend requests</span>
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Show game activity</span>
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Notifications -->
                        <div class="border-b border-gray-700 pb-4 sm:pb-6">
                            <h3 class="text-lg sm:text-xl font-bold text-cyan-300 mb-3 sm:mb-4">NOTIFICATIONS</h3>
                            <div class="space-y-2 sm:space-y-3">
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Friend requests</span>
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Game invites</span>
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                                <label class="flex items-center justify-between cursor-pointer gap-3">
                                    <span class="text-gray-300 text-sm sm:text-base">Messages</span>
                                    <input type="checkbox" class="toggle" checked>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Danger Zone -->
                        <div>
                            <h3 class="text-lg sm:text-xl font-bold text-red-400 mb-3 sm:mb-4">DANGER ZONE</h3>
                            <button class="border-2 border-red-500 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-red-400 hover:bg-red-500/20 transition-all text-xs sm:text-sm w-full sm:w-auto">
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
                    width: 1rem;
                    height: 1rem;
                    border-radius: 50%;
                    background: white;
                    top: 0.125rem;
                    left: 0.125rem;
                    transition: transform 0.3s;
                }
                
                @media (min-width: 640px) {
                    .toggle::before {
                        width: 1.25rem;
                        height: 1.25rem;
                    }
                }
                
                .toggle:checked::before {
                    transform: translateX(1.25rem);
                }
                
                @media (min-width: 640px) {
                    .toggle:checked::before {
                        transform: translateX(1.5rem);
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
                <div class="text-center py-6">
                    <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                    <p class="text-cyan-400 text-sm">Generating QR Code...</p>
                </div>
            `;
        }

        if (!this.qrCodeDataURL) 
        {
            return '';
        }

        return `
            <div class="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 sm:p-4 space-y-4">
                <!-- Instructions -->
                <div class="bg-gray-900/50 rounded-lg p-3">
                    <h4 class="text-sm font-bold text-cyan-300 mb-2">Setup Instructions:</h4>
                    <ol class="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Install Google Authenticator or Authy</li>
                        <li>Scan the QR code below</li>
                        <li>Enter the 6-digit code from the app</li>
                    </ol>
                </div>
                
                <!-- QR Code -->
                <div class="flex justify-center">
                    <div class="bg-white p-3 rounded-lg">
                        <img src="${this.qrCodeDataURL}" alt="QR Code" class="w-48 h-48">
                    </div>
                </div>
                
                <!-- Backup Secret -->
                <div class="bg-gray-900/50 rounded-lg p-3">
                    <p class="text-xs text-gray-400 mb-1">Backup Secret:</p>
                    <code class="text-cyan-300 font-mono text-xs break-all">${this.secret}</code>
                </div>
                
                <!-- Verification Input -->
                <div>
                    <label class="block text-xs font-bold text-cyan-300 mb-2">Enter 6-Digit Code:</label>
                    <input 
                        type="text" 
                        id="twofa-verify-input"
                        maxlength="6"
                        placeholder="000000"
                        class="w-full px-3 py-2 bg-gray-900/50 border-2 border-gray-700 rounded-lg text-cyan-100 text-center text-lg font-mono focus:border-cyan-500 focus:outline-none tracking-widest"
                    >
                </div>
                
                <!-- Action Buttons -->
                <div class="flex gap-2">
                    <button id="verify-2fa-btn" class="neon-border-green flex-1 px-4 py-2 rounded-lg font-bold text-green-400 text-sm">
                        VERIFY & ENABLE
                    </button>
                    <button id="cancel-2fa-btn" class="neon-border flex-1 px-4 py-2 rounded-lg font-bold text-cyan-400 text-sm">
                        CANCEL
                    </button>
                </div>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        this.setupEventListeners();
        this.check2FAStatus();
    }

    private setupEventListeners(): void 
    {
        const closeBtn = document.getElementById('close-settings-btn');
        const modal = document.getElementById('settings-modal');
        
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

        // Change Password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) 
        {
            changePasswordBtn.addEventListener('click', () => 
            {
                this.showMessage('Change password feature coming soon!', 'info');
            });
        }

        // Enable 2FA button
        const enable2FABtn = document.getElementById('enable-2fa-btn');
        if (enable2FABtn) 
        {
            enable2FABtn.addEventListener('click', async () => 
            {
                await this.handleEnable2FA();
            });
        }

        // Disable 2FA button
        const disable2FABtn = document.getElementById('disable-2fa-btn');
        if (disable2FABtn) 
        {
            disable2FABtn.addEventListener('click', async () => 
            {
                await this.handleDisable2FA();
            });
        }

        // Verify 2FA button
        const verify2FABtn = document.getElementById('verify-2fa-btn');
        if (verify2FABtn) 
        {
            verify2FABtn.addEventListener('click', async () => 
            {
                await this.handleVerify2FA();
            });
        }

        // Cancel 2FA setup button
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

    private async check2FAStatus(): Promise<void> 
    {
        // TODO: Call backend to check if 2FA is enabled
        // For now, assume it's disabled
        this.is2FAEnabled = false;
    }

    private async handleEnable2FA(): Promise<void> 
    {
        try 
        {
            this.loading = true;
            this.showQRCode = true;
            this.updateSetupArea();

            const response = await TwoFactorService.setup2FA();
            
            this.qrCodeDataURL = response.qrCodeDataURL;
            this.secret = response.secret;
            this.loading = false;
            
            this.updateSetupArea();
        } 
        catch (error) 
        {
            this.loading = false;
            this.showQRCode = false;
            this.updateSetupArea();
            this.showMessage((error as Error).message || 'Failed to setup 2FA', 'error');
        }
    }

    private async handleVerify2FA(): Promise<void> 
    {
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
            
            // Remount to update UI
            this.mount('#settings-container');
        } 
        catch (error) 
        {
            this.showMessage((error as Error).message || 'Invalid code', 'error');
        }
    }

    private async handleDisable2FA(): Promise<void> 
    {
        if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) 
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
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}