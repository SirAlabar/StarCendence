import { BaseComponent } from '../BaseComponent';
import { PodConfig, AVAILABLE_PODS } from '../../game/utils/PodConfig';
import { PodSelection, PodSelectionEvent } from '../../pages/PodSelectionPage';

export type GameType = 'pong' | 'podracer';

export interface PlayerSlot 
{
    id: number;
    playerName: string | null;
    isOnline: boolean;
    isAI: boolean;
    isReady: boolean;
    avatarUrl: string;
    customization: PodConfig | null;
}

export interface LobbyConfig 
{
    gameType: GameType;
    maxPlayers: number;
    onStartGame: () => void;
    onBack: () => void;
}

export class GameLobby extends BaseComponent 
{
    private config: LobbyConfig;
    private playerSlots: PlayerSlot[] = [];
    private currentCustomizingSlot: number | null = null;
    private podSelection: PodSelection | null = null;
    private chatMessages: Array<{player: string, message: string, time: string}> = [];
    private containerElement: HTMLElement | null = null;
    
    constructor(config: LobbyConfig) 
    {
        super();
        this.config = config;
        this.initializePlayerSlots();
        this.initializeChatMessages();
    }
    
    private initializePlayerSlots(): void 
    {
        this.playerSlots = [];
        
        this.playerSlots.push({
            id: 0,
            playerName: 'PLAYER 1',
            isOnline: true,
            isAI: false,
            isReady: false,
            avatarUrl: '/assets/images/default-avatar.jpeg',
            customization: this.config.gameType === 'podracer' ? AVAILABLE_PODS[0] : null
        });
        
        for (let i = 1; i < this.config.maxPlayers; i++) 
        {
            this.playerSlots.push({
                id: i,
                playerName: null,
                isOnline: false,
                isAI: false,
                isReady: false,
                avatarUrl: '/assets/images/default-avatar.jpeg',
                customization: null
            });
        }
    }
    
    private initializeChatMessages(): void 
    {
        this.chatMessages = [
            { player: 'SYSTEM', message: 'WELCOME TO THE LOBBY!', time: '12:00' }
        ];
    }
    
    render(): string 
    {
        return `
            <div id="lobbyContainer" class="h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 flex flex-col overflow-hidden">
                <!-- Header -->
                <div class="w-full py-4 px-8 border-b border-cyan-500/30 bg-black/40 flex-shrink-0">
                    <h1 class="text-3xl font-bold text-cyan-300 text-center glow-text-cyan">
                        ${this.config.gameType === 'pong' ? 'PONG' : 'POD RACER'} LOBBY
                    </h1>
                </div>
                
                <!-- Main Content -->
                <div class="flex-1 flex flex-col px-8 py-6 overflow-y-auto custom-scrollbar">
                    <!-- Start Game Button -->
                    <button id="startGameBtn" class="mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 ${this.canStartGame() ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'}" ${!this.canStartGame() ? 'disabled' : ''}>
                        START GAME
                    </button>
                    
                    <!-- Player Slots Grid -->
                    <div class="w-full max-w-6xl mx-auto mb-6 flex-shrink-0">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${this.renderPlayerSlots()}
                        </div>
                    </div>
                    
                    <!-- Chat Window (Bottom) -->
                    <div class="w-full max-w-4xl mx-auto flex-shrink-0">
                        <div class="bg-gradient-to-br from-gray-900/90 to-blue-900/50 rounded-xl border-2 border-cyan-500/40 overflow-hidden">
                            <!-- Chat Header -->
                            <div class="px-4 py-2 border-b border-cyan-500/30 bg-black/50">
                                <h3 class="text-cyan-300 font-bold text-sm">LOBBY CHAT</h3>
                            </div>
                            
                            <!-- Chat Messages -->
                            <div id="chatMessages" class="px-4 py-3 h-32 overflow-y-auto custom-scrollbar space-y-2">
                                ${this.renderChatMessages()}
                            </div>
                            
                            <!-- Chat Input -->
                            <div class="px-4 py-3 border-t border-cyan-500/30 bg-black/50">
                                <div class="flex gap-2">
                                    <input 
                                        type="text" 
                                        id="chatInput" 
                                        placeholder="TYPE MESSAGE..." 
                                        class="flex-1 px-3 py-2 rounded bg-gray-800/80 border border-cyan-500/30 text-white text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 placeholder-gray-600"
                                    />
                                    <button 
                                        id="sendChatBtn" 
                                        class="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all"
                                    >
                                        SEND
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Cancel Button -->
                    <button id="backBtn" class="mt-6 py-3 px-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg transition-all self-center flex-shrink-0">
                        CANCEL
                    </button>
                </div>
                
                <!-- Pod Selection Modal -->
                <div id="podSelectionModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div id="podSelectionContent" class="w-full h-full">
                    </div>
                </div>
                
                <style>
                    .glow-text-cyan 
                    {
                        text-shadow: 0 0 20px rgba(34, 211, 238, 0.8), 0 0 40px rgba(34, 211, 238, 0.4);
                    }
                    
                    .player-card 
                    {
                        transition: all 0.2s ease;
                    }
                    
                    .player-card:hover 
                    {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 30px rgba(34, 211, 238, 0.3);
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar 
                    {
                        width: 6px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-track 
                    {
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 3px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb 
                    {
                        background: rgba(34, 211, 238, 0.3);
                        border-radius: 3px;
                    }
                    
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover 
                    {
                        background: rgba(34, 211, 238, 0.5);
                    }
                </style>
            </div>
        `;
    }
    
    private renderPlayerSlots(): string 
    {
        return this.playerSlots.map(slot => this.renderPlayerSlot(slot)).join('');
    }
    
    private renderPlayerSlot(slot: PlayerSlot): string 
    {
        if (!slot.playerName) 
        {
            return `
                <div class="player-card rounded-xl p-6 border-2 border-gray-700/50 bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm">
                    <div class="flex flex-col items-center justify-center h-full min-h-[140px]">
                        <div class="text-5xl mb-3 opacity-20">+</div>
                        <h3 class="text-base font-bold text-gray-600 mb-3">ADD PLAYER</h3>
                        <button class="add-player-btn px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-400 text-sm font-bold transition-all" data-slot="${slot.id}">
                            PRESS ENTER
                        </button>
                    </div>
                </div>
            `;
        }
        
        const borderColor = slot.isOnline ? 'border-green-500' : slot.isAI ? 'border-yellow-500' : 'border-gray-600';
        const bgGradient = slot.isOnline ? 'from-green-900/30' : slot.isAI ? 'from-yellow-900/30' : 'from-gray-900/30';
        const statusColor = slot.isOnline ? 'text-green-400' : slot.isAI ? 'text-yellow-400' : 'text-gray-400';
        const statusText = slot.isOnline ? 'ONLINE' : slot.isAI ? 'AUTOMATED UNIT' : 'OFFLINE';
        
        return `
            <div class="player-card rounded-xl p-4 border-2 ${borderColor} bg-gradient-to-br ${bgGradient} to-gray-900/80 backdrop-blur-sm">
                <!-- Horizontal Layout: Left (Player Info) | Right (Pod/Ship) -->
                <div class="flex gap-4 mb-4">
                    <!-- Left Side: Avatar + Info -->
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <img 
                            src="${slot.avatarUrl}" 
                            alt="${slot.playerName}" 
                            class="w-16 h-16 rounded-full border-3 ${borderColor} object-cover flex-shrink-0"
                        />
                        <div class="flex-1 min-w-0">
                            <h3 class="text-lg font-bold text-cyan-300 truncate">${slot.playerName}</h3>
                            <p class="text-xs ${statusColor} font-bold uppercase">${statusText}</p>
                        </div>
                    </div>
                    
                    <!-- Right Side: Pod/Ship Preview -->
                    <div class="flex-shrink-0 bg-black/40 rounded-lg px-4 py-2 flex flex-col items-center justify-center min-w-[160px]">
                        ${this.renderCustomizationPreview(slot)}
                    </div>
                </div>
                
                <!-- Action Buttons (Smaller, Bottom) -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="change-btn py-2 px-3 rounded-lg border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        CHANGE
                    </button>
                    <button class="ready-btn py-2 px-3 rounded-lg ${slot.isReady ? 'bg-green-600 border border-green-500' : 'bg-cyan-600 border border-cyan-500'} hover:opacity-90 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        ${slot.isReady ? 'READY ✓' : 'READY'}
                    </button>
                </div>
                
                ${slot.isAI ? `
                    <button class="remove-btn w-full mt-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        REMOVE
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    private renderCustomizationPreview(slot: PlayerSlot): string 
    {
        if (this.config.gameType === 'podracer' && slot.customization) 
        {
            return `
                <img src="/assets/images/eny1.png" alt="Pod" class="w-16 h-16 mb-1 opacity-70">
                <p class="text-cyan-300 font-bold text-xs text-center truncate w-full">${slot.customization.name}</p>
                <p class="text-gray-500 text-xs text-center truncate w-full">${slot.customization.pilot}</p>
            `;
        }
        else if (this.config.gameType === 'pong') 
        {
            return `
                <div class="w-10 h-16 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-lg mb-1"></div>
                <p class="text-cyan-300 font-bold text-xs text-center">Default Paddle</p>
            `;
        }
        
        return '<p class="text-gray-600 text-xs text-center">No customization</p>';
    }
    
    private renderChatMessages(): string 
    {
        return this.chatMessages.map(msg => `
            <div class="chat-message">
                <div class="flex items-baseline gap-2 mb-0.5">
                    <span class="text-cyan-400 font-bold text-xs">${msg.player}</span>
                    <span class="text-gray-500 text-xs">${msg.time}</span>
                </div>
                <p class="text-gray-300 text-sm">${msg.message}</p>
            </div>
        `).join('');
    }
    
    private canStartGame(): boolean 
    {
        const activePlayers = this.playerSlots.filter(slot => slot.playerName !== null);
        const allReady = activePlayers.every(slot => slot.isReady);
        return activePlayers.length >= 2 && allReady;
    }
    
    mount(containerId?: string): void 
    {
        if (containerId) 
        {
            this.containerElement = document.getElementById(containerId);
        }
        this.attachEventListeners();
    }
    
    private attachEventListeners(): void 
    {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) 
        {
            startBtn.addEventListener('click', () => this.handleStartGame());
        }
        
        const backBtn = document.getElementById('backBtn');
        if (backBtn) 
        {
            backBtn.addEventListener('click', () => this.config.onBack());
        }
        
        const chatInput = document.getElementById('chatInput') as HTMLInputElement;
        const sendBtn = document.getElementById('sendChatBtn');
        
        if (sendBtn) 
        {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
        }
        
        if (chatInput) 
        {
            chatInput.addEventListener('keypress', (e) => 
            {
                if (e.key === 'Enter') 
                {
                    this.sendChatMessage();
                }
            });
        }
        
        document.querySelectorAll('.add-player-btn').forEach(btn => 
        {
            btn.addEventListener('click', (e) => 
            {
                const slotId = parseInt((e.target as HTMLElement).getAttribute('data-slot') || '0');
                this.handleAddPlayer(slotId);
            });
        });
        
        document.querySelectorAll('.change-btn').forEach(btn => 
        {
            btn.addEventListener('click', (e) => 
            {
                const slotId = parseInt((e.target as HTMLElement).getAttribute('data-slot') || '0');
                this.handleChangeCustomization(slotId);
            });
        });
        
        document.querySelectorAll('.ready-btn').forEach(btn => 
        {
            btn.addEventListener('click', (e) => 
            {
                const slotId = parseInt((e.target as HTMLElement).getAttribute('data-slot') || '0');
                this.toggleReady(slotId);
            });
        });
        
        document.querySelectorAll('.remove-btn').forEach(btn => 
        {
            btn.addEventListener('click', (e) => 
            {
                const slotId = parseInt((e.target as HTMLElement).getAttribute('data-slot') || '0');
                this.handleRemovePlayer(slotId);
            });
        });
    }
    
    private sendChatMessage(): void 
    {
        const chatInput = document.getElementById('chatInput') as HTMLInputElement;
        if (!chatInput || !chatInput.value.trim()) 
        {
            return;
        }
        
        const now = new Date();
        const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        this.chatMessages.push({
            player: 'PLAYER 1',
            message: chatInput.value.trim().toUpperCase(),
            time: time
        });
        
        chatInput.value = '';
        
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) 
        {
            chatContainer.innerHTML = this.renderChatMessages();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    private handleStartGame(): void 
    {
        if (this.canStartGame()) 
        {
            this.config.onStartGame();
        }
    }
    
    private handleAddPlayer(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (slot && !slot.playerName) 
        {
            slot.playerName = `PLAYER ${slotId + 1}`;
            slot.isAI = true;
            slot.isReady = false;
            slot.customization = this.config.gameType === 'podracer' ? AVAILABLE_PODS[slotId % AVAILABLE_PODS.length] : null;
            this.refresh();
        }
    }
    
    private handleRemovePlayer(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (slot && slot.isAI) 
        {
            slot.playerName = null;
            slot.isOnline = false;
            slot.isAI = false;
            slot.isReady = false;
            slot.customization = null;
            this.refresh();
        }
    }
    
    private toggleReady(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (slot && slot.playerName) 
        {
            slot.isReady = !slot.isReady;
            this.refresh();
        }
    }
    
    private handleChangeCustomization(slotId: number): void 
    {
        this.currentCustomizingSlot = slotId;
        
        if (this.config.gameType === 'podracer') 
        {
            this.showPodSelectionModal();
        }
        else 
        {
            console.log('Paddle selection - placeholder');
        }
    }
    
    private showPodSelectionModal(): void 
    {
        const modal = document.getElementById('podSelectionModal');
        const content = document.getElementById('podSelectionContent');
        
        if (!modal || !content) 
        {
            return;
        }
        
        this.podSelection = new PodSelection((event: PodSelectionEvent) => 
        {
            this.onPodSelected(event);
        });
        
        content.innerHTML = this.podSelection.render();
        modal.style.display = 'flex';
        this.podSelection.mount();
    }
    
    private onPodSelected(event: PodSelectionEvent): void 
    {
        if (this.currentCustomizingSlot === null) 
        {
            return;
        }
        
        this.playerSlots[this.currentCustomizingSlot].customization = event.selectedPod;
        event.onConfirm();
        this.hidePodSelectionModal();
        this.refresh();
    }
    
    private hidePodSelectionModal(): void 
    {
        const modal = document.getElementById('podSelectionModal');
        if (modal) 
        {
            modal.style.display = 'none';
        }
        
        if (this.podSelection) 
        {
            this.podSelection.dispose();
            this.podSelection = null;
        }
        
        this.currentCustomizingSlot = null;
    }
    
    private refresh(): void 
    {
        // Only refresh the lobby container, not the whole page
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            container.outerHTML = this.render();
            this.attachEventListeners();
        }
    }
    
    public dispose(): void 
    {
        if (this.podSelection) 
        {
            this.podSelection.dispose();
            this.podSelection = null;
        }
    }
}