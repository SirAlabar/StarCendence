//  User settings panel
import { BaseComponent } from '../BaseComponent';

export class Settings extends BaseComponent 
{
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
                                    <button class="neon-border px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-cyan-400 text-xs sm:text-sm w-full sm:w-auto">
                                        CHANGE PASSWORD
                                    </button>
                                </div>
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

    protected afterMount(): void 
    {
        this.setupEventListeners();
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
    }

    private closeModal(): void 
    {
        const modal = document.getElementById('settings-modal');
        if (modal) 
        {
            modal.remove();
        }
    }
}