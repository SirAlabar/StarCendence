import { BaseComponent } from '../BaseComponent';
import { PodConfig, AVAILABLE_PODS } from '../../game/utils/PodConfig';
import { PodSelection, PodSelectionEvent } from '../../pages/PodSelectionPage';
import { POD_THUMBNAILS } from '../../pages/PodSelectionPage';
import UserService from '../../services/user/UserService';
import FriendService from '../../services/user/FriendService';
import OnlineFriendsService, { FriendWithStatus } from '../../services/websocket/OnlineFriendsService';
import { UserProfile } from '../../types/user.types';
import { AiDifficulty } from '../../game/engines/pong2D/entities/EnemyAi';

export type GameType = 'pong' | 'podracer';

export interface PlayerSlot 
{
    id: number;
    playerName: string | null;
    userId: string | null;
    isOnline: boolean;
    isAI: boolean;
    aiDifficulty?: AiDifficulty;
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
    private currentUser: UserProfile | null = null;
    private friends: FriendWithStatus[] = [];
    private mountSelector: string | null = null;
    
    constructor(config: LobbyConfig) 
    {
        super();
        this.config = config;
    }
    
    private async initializePlayerSlots(): Promise<void> 
    {
        this.playerSlots = [];
        
        try 
        {
            this.currentUser = await UserService.getProfile();
        }
        catch (err) 
        {
            console.error('Failed to load user profile:', err);
            this.currentUser = null;
        }
        
        try 
        {
            await OnlineFriendsService.initialize();
            
            OnlineFriendsService.onStatusChange((friends) => 
            {
                this.friends = friends;
                this.updateFriendsList();
            });
            
            const friendsData = await FriendService.getFriends();
            const allFriends = friendsData.friends || [];
            
            allFriends.forEach((friend: any) => 
            {
                if (friend.status === 'online') 
                {
                    OnlineFriendsService.addFriend({
                        userId: friend.userId,
                        username: friend.username,
                        avatarUrl: friend.avatarUrl || '/assets/images/default-avatar.jpeg',
                        status: friend.status
                    });
                }
            });
            
            this.friends = OnlineFriendsService.getOnlineFriends();
        }
        catch (err) 
        {
            console.error('Failed to load friends:', err);
            this.friends = [];
        }
        
        if (this.currentUser) 
        {
            this.playerSlots.push({
                id: 0,
                playerName: this.currentUser.username,
                userId: this.currentUser.id,
                isOnline: true,
                isAI: false,
                isReady: false,
                avatarUrl: this.currentUser.avatarUrl || '/assets/images/default-avatar.jpeg',
                customization: this.config.gameType === 'podracer' ? AVAILABLE_PODS[0] : null
            });
        }
        
        for (let i = 1; i < this.config.maxPlayers; i++) 
        {
            this.playerSlots.push({
                id: i,
                playerName: null,
                userId: null,
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
                <div class="w-full py-4 px-8 border-b border-cyan-500/30 bg-black/40 flex-shrink-0">
                    <h1 class="text-3xl font-bold text-cyan-300 text-center glow-text-cyan">
                        ${this.config.gameType === 'pong' ? 'PONG' : 'POD RACER'} LOBBY
                    </h1>
                </div>
                
                <div class="flex-1 flex flex-col px-8 py-6 overflow-y-auto custom-scrollbar">
                    <button id="startGameBtn" class="mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 ${this.canStartGame() ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'}" ${!this.canStartGame() ? 'disabled' : ''}>
                        START GAME
                    </button>
                    
                    <div class="w-full max-w-6xl mx-auto mb-6 flex-shrink-0">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${this.renderPlayerSlots()}
                        </div>
                    </div>
                    
                    <div class="w-full max-w-4xl mx-auto flex-shrink-0">
                        <div class="bg-gradient-to-br from-gray-900/90 to-blue-900/50 rounded-xl border-2 border-cyan-500/40 overflow-hidden">
                            <div class="px-4 py-2 border-b border-cyan-500/30 bg-black/50">
                                <h3 class="text-cyan-300 font-bold text-sm">LOBBY CHAT</h3>
                            </div>
                            
                            <div id="chatMessages" class="px-4 py-3 h-32 overflow-y-auto custom-scrollbar space-y-2">
                                ${this.renderChatMessages()}
                            </div>
                            
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
                    
                    <button id="backBtn" class="mt-6 py-3 px-12 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg transition-all self-center flex-shrink-0">
                        CANCEL
                    </button>
                </div>
                
                <div id="podSelectionModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div id="podSelectionContent" class="w-full h-full">
                    </div>
                </div>
                
                <div id="inviteModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-blue-900/50 rounded-2xl border-2 border-cyan-500/50 p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h2 class="text-2xl font-bold text-cyan-300 mb-6 text-center">INVITE PLAYER</h2>
                        
                        <div id="friendsListContainer" class="space-y-4 mb-6">
                            ${this.renderFriendsList()}
                        </div>
                        
                        <button id="closeInviteModal" class="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
                            CLOSE
                        </button>
                    </div>
                </div>
                
                <div id="playerTypeModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-blue-900/50 rounded-2xl border-2 border-cyan-500/50 p-8 max-w-4xl w-full mx-4">
                        <h2 class="text-3xl font-bold text-cyan-300 mb-8 text-center">ADD PLAYER</h2>
                        
                        <div class="grid grid-cols-2 gap-6 mb-6">
                            <button id="selectInviteFriend" class="p-8 rounded-xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-900/40 to-gray-900/60 hover:border-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/50 transition-all">
                                <div class="text-6xl mb-4">👥</div>
                                <h3 class="text-2xl font-bold text-cyan-400 mb-2">INVITE FRIEND</h3>
                                <p class="text-gray-400">Play with online friends</p>
                            </button>
                            
                            <button id="selectAddAI" class="p-8 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 to-gray-900/60 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 transition-all">
                                <div class="text-6xl mb-4">🤖</div>
                                <h3 class="text-2xl font-bold text-purple-400 mb-2">ADD AI BOT</h3>
                                <p class="text-gray-400">Play against computer</p>
                            </button>
                        </div>
                        
                        <button id="closePlayerTypeModal" class="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
                            CANCEL
                        </button>
                    </div>
                </div>
                
                <!-- Player Type Selection Modal (Friend or AI) -->
                <div id="playerTypeModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-blue-900/50 rounded-2xl border-2 border-cyan-500/50 p-8 max-w-3xl w-full mx-4">
                        <h2 class="text-3xl font-bold text-cyan-300 mb-8 text-center">ADD PLAYER</h2>

                        <div class="grid grid-cols-${this.config.gameType === 'podracer' ? '1' : '2'} gap-6 mb-6">
                            <button id="selectInviteFriend" class="p-8 rounded-xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-900/40 to-gray-900/60 hover:border-cyan-500 hover:shadow-2xl hover:shadow-cyan-500/50 transition-all">
                                <div class="text-6xl mb-4">👥</div>
                                <h3 class="text-2xl font-bold text-cyan-400 mb-2">INVITE FRIEND</h3>
                                <p class="text-gray-400">Play with online friends</p>
                            </button>

                            ${this.config.gameType !== 'podracer' ? `
                            <button id="selectAddAI" class="p-8 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-900/40 to-gray-900/60 hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/50 transition-all">
                                <div class="text-6xl mb-4">🤖</div>
                                <h3 class="text-2xl font-bold text-purple-400 mb-2">ADD AI</h3>
                                <p class="text-gray-400">Play against bot</p>
                            </button>
                            ` : ''}
                        </div>

                        <button id="closePlayerTypeModal" class="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
                            CANCEL
                        </button>
                    </div>
                </div>
                
                <div id="aiDifficultyModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-blue-900/50 rounded-2xl border-2 border-cyan-500/50 p-8 max-w-4xl w-full mx-4">
                        <h2 class="text-3xl font-bold text-cyan-300 mb-8 text-center">SELECT AI DIFFICULTY</h2>
                        
                        <div class="grid grid-cols-2 gap-6 mb-6">
                            <button id="selectEasyAI" class="p-8 rounded-xl border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-900/40 to-gray-900/60 hover:border-yellow-500 hover:shadow-2xl hover:shadow-yellow-500/50 transition-all">
                                <div class="text-6xl mb-4">😊</div>
                                <h3 class="text-2xl font-bold text-yellow-400 mb-2">EASY</h3>
                                <p class="text-gray-400">Balanced gameplay</p>
                            </button>
                            
                            <button id="selectHardAI" class="p-8 rounded-xl border-2 border-red-500/40 bg-gradient-to-br from-red-900/40 to-gray-900/60 hover:border-red-500 hover:shadow-2xl hover:shadow-red-500/50 transition-all">
                                <div class="text-6xl mb-4">😈</div>
                                <h3 class="text-2xl font-bold text-red-400 mb-2">HARD</h3>
                                <p class="text-gray-400">Accurate predictions, tough to beat</p>
                            </button>
                        </div>
                        
                        <button id="closeAIModal" class="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
                            CANCEL
                        </button>
                    </div>
                </div>
                
                <div id="paddleSelectionModal" class="fixed inset-0 bg-black/90 backdrop-blur-sm items-center justify-center z-50" style="display: none;">
                    <div class="bg-gradient-to-br from-gray-900 to-blue-900/50 rounded-2xl border-2 border-cyan-500/50 p-8 max-w-4xl w-full mx-4">
                        <h2 class="text-3xl font-bold text-cyan-300 mb-8 text-center">SELECT PADDLE</h2>
                        
                        <div class="grid grid-cols-3 gap-6 mb-6">
                            ${this.renderPaddleOptions()}
                        </div>
                        
                        <button id="closePaddleModal" class="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold">
                            CLOSE
                        </button>
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
                        <h3 class="text-base font-bold text-gray-600 mb-3">
                            ${this.config.gameType === 'podracer' ? 'ADD PLAYER' : 'ADD PLAYER / AI'}
                        </h3>
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
        const statusText = slot.isOnline ? 'ONLINE' : slot.isAI ? `AUTOMATED UNIT (${slot.aiDifficulty?.toUpperCase()})` : 'OFFLINE';
        
        return `
            <div class="player-card rounded-xl p-4 border-2 ${borderColor} bg-gradient-to-br ${bgGradient} to-gray-900/80 backdrop-blur-sm">
                <div class="flex gap-4 mb-4">
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
                    
                    <div class="flex-shrink-0 bg-black/40 rounded-lg px-4 py-2 flex flex-col items-center justify-center min-w-[160px]">
                        ${this.renderCustomizationPreview(slot)}
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    <button class="change-btn py-2 px-3 rounded-lg border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        CHANGE
                    </button>
                    <button class="ready-btn py-2 px-3 rounded-lg ${slot.isReady ? 'bg-green-600 border border-green-500' : 'bg-cyan-600 border border-cyan-500'} hover:opacity-90 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        ${slot.isReady ? 'READY ✓' : 'READY'}
                    </button>
                </div>
                
                ${slot.isAI || (slot.id !== 0) ? `
                    <button class="remove-btn w-full mt-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        ${slot.isAI ? 'REMOVE BOT' : 'KICK PLAYER'}
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    private renderCustomizationPreview(slot: PlayerSlot): string 
    {
        if (this.config.gameType === 'podracer' && slot.customization) 
        {
            const podId = slot.customization.id;
            let podImage = POD_THUMBNAILS[podId] || '/assets/images/eny1.jpeg';
            if (!podImage.startsWith('/')) 
            {
                podImage = `/${podImage}`;
            }
            return `
                <img src="${podImage}" alt="${slot.customization.name}" class="w-16 h-16 mb-1 opacity-70">
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
    
    private renderFriendsList(): string 
    {
        if (this.friends.length === 0) 
        {
            return `
                <div class="text-center text-gray-500 py-8">
                    <p>No friends online</p>
                    <p class="text-sm mt-2">Your friends need to be online to invite them</p>
                </div>
            `;
        }
        
        return this.friends.map(friend => `
            <button class="invite-friend-btn w-full p-4 rounded-lg border-2 border-cyan-500/30 bg-gray-800/50 hover:border-cyan-500 hover:bg-gray-700/50 transition-all flex items-center gap-4" data-username="${friend.username}" data-userid="${friend.userId}">
                <div class="relative">
                    <img src="${friend.avatarUrl}" alt="${friend.username}" class="w-12 h-12 rounded-full border-2 border-green-400">
                    <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
                </div>
                <div class="flex-1 text-left">
                    <p class="text-cyan-300 font-bold">${friend.username}</p>
                    <p class="text-green-400 text-sm">● Online</p>
                </div>
                <div class="text-cyan-300 font-bold">INVITE</div>
            </button>
        `).join('');
    }
    
    private updateFriendsList(): void 
    {
        const container = document.getElementById('friendsListContainer');
        if (container) 
        {
            container.innerHTML = this.renderFriendsList();
        }
    }
    
    private renderPaddleOptions(): string 
    {
        const paddles = [
            { name: 'Default', color: 'from-cyan-500 to-blue-600' },
            { name: 'Fire', color: 'from-red-500 to-orange-600' },
            { name: 'Neon', color: 'from-pink-500 to-purple-600' },
            { name: 'Forest', color: 'from-green-500 to-emerald-600' },
            { name: 'Gold', color: 'from-yellow-500 to-amber-600' },
            { name: 'Ice', color: 'from-blue-300 to-cyan-400' }
        ];
        
        return paddles.map((paddle, index) => `
            <button class="select-paddle-btn p-6 rounded-xl border-2 border-cyan-500/30 bg-gray-800/50 hover:border-cyan-500 hover:bg-gray-700/50 transition-all" data-paddle="${index}">
                <div class="w-12 h-20 bg-gradient-to-b ${paddle.color} rounded-lg mb-3 mx-auto"></div>
                <p class="text-cyan-300 font-bold text-sm">${paddle.name}</p>
            </button>
        `).join('');
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
    
    async mount(selector?: string): Promise<void> 
    {
        this.mountSelector = selector ?? '#game-content';

        await this.initializePlayerSlots();
        this.initializeChatMessages();

        const container = document.querySelector(this.mountSelector);
        if (container) 
        {
            container.innerHTML = this.render();
        }

        this.attachEventListeners();
    }

    private attachEventListeners(): void
    {
        if (!this.mountSelector) 
        {
            return;
        }

        const root = document.querySelector(this.mountSelector);
        if (!root) 
        {
            return;
        }

        root.addEventListener('click', (e: Event) => 
        {
            const target = e.target as HTMLElement;

            if (target.closest('#startGameBtn')) 
            {
                this.handleStartGame();
                return;
            }

            if (target.closest('#backBtn')) 
            {
                this.config.onBack();
                return;
            }

            const addBtn = target.closest('.add-player-btn') as HTMLElement | null;
            if (addBtn) 
            {
                const slotId = parseInt(addBtn.dataset.slot!, 10);
                this.handleAddPlayer(slotId);
                return;
            }

            const changeBtn = target.closest('.change-btn') as HTMLElement | null;
            if (changeBtn) 
            {
                const slotId = parseInt(changeBtn.dataset.slot!, 10);
                this.handleChangeCustomization(slotId);
                return;
            }

            const readyBtn = target.closest('.ready-btn') as HTMLElement | null;
            if (readyBtn) 
            {
                const slotId = parseInt(readyBtn.dataset.slot!, 10);
                this.toggleReady(slotId);
                return;
            }

            const removeBtn = target.closest('.remove-btn') as HTMLElement | null;
            if (removeBtn) 
            {
                const slotId = parseInt(removeBtn.dataset.slot!, 10);
                this.handleRemovePlayer(slotId);
                return;
            }

            const inviteBtn = target.closest('.invite-friend-btn') as HTMLElement | null;
            if (inviteBtn) 
            {
                const username = inviteBtn.dataset.username!;
                const userId = inviteBtn.dataset.userid!;
                this.invitePlayer(username, userId);
                return;
            }

            if (target.closest('#closeInviteModal')) 
            {
                this.closeInviteModal();
                return;
            }

            if (target.closest('#closePlayerTypeModal')) 
            {
                this.closePlayerTypeModal();
                return;
            }

            if (target.closest('#selectInviteFriend')) 
            {
                this.closePlayerTypeModal();
                this.showInviteModalFromPlayerType();
                return;
            }

            if (target.closest('#selectAddAI')) 
            {
                this.closePlayerTypeModal();
                this.showAIModalFromPlayerType();
                return;
            }
            
            if (target.closest('#selectInviteFriend')) 
            {
                this.closePlayerTypeModal();
                this.showInviteModal(this.currentCustomizingSlot!);
                return;
            }
            
            if (target.closest('#selectAddAI')) 
            {
                this.closePlayerTypeModal();
                this.showAIModal(this.currentCustomizingSlot!);
                return;
            }
            
            if (target.closest('#closePlayerTypeModal')) 
            {
                this.closePlayerTypeModal();
                return;
            }

            if (target.closest('#selectEasyAI')) 
            {
                this.addAIPlayer('easy');
                return;
            }
            
            if (target.closest('#selectHardAI')) 
            {
                this.addAIPlayer('hard');
                return;
            }
            
            if (target.closest('#closeAIModal')) 
            {
                this.closeAIModal();
                return;
            }

            const paddleBtn = target.closest('.select-paddle-btn') as HTMLElement | null;
            if (paddleBtn) 
            {
                const paddleIndex = parseInt(paddleBtn.dataset.paddle!, 10);
                this.selectPaddle(paddleIndex);
                return;
            }
            
            if (target.closest('#closePaddleModal')) 
            {
                this.closePaddleModal();
                return;
            }
        });

        const chatInput = root.querySelector('#chatInput') as HTMLInputElement | null;
        if (chatInput) 
        {
            chatInput.addEventListener('keydown', (e: KeyboardEvent) => 
            {
                if (e.key === 'Enter') 
                {
                    this.sendChatMessage();
                }
            });
        }
        
        const sendBtn = root.querySelector('#sendChatBtn');
        if (sendBtn) 
        {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
        }
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
            player: this.currentUser?.username || 'PLAYER 1',
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
        this.currentCustomizingSlot = slotId;
        this.showPlayerTypeModal();
    }
    
    private showPlayerTypeModal(): void 
    {
        const modal = document.getElementById('playerTypeModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private closePlayerTypeModal(): void 
    {
        const modal = document.getElementById('playerTypeModal');
        if (modal) 
        {
            modal.style.display = 'none';
        }
    }
    
    private showInviteModalFromPlayerType(): void 
    {
        const modal = document.getElementById('inviteModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private showAIModalFromPlayerType(): void 
    {
        const modal = document.getElementById('aiDifficultyModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private showInviteModal(slotId: number): void 
    {
        this.currentCustomizingSlot = slotId;
        const modal = document.getElementById('inviteModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private closeInviteModal(): void 
    {
        const modal = document.getElementById('inviteModal');
        if (modal) 
        {
            modal.style.display = 'none';
        }
        this.currentCustomizingSlot = null;
    }
    
    private invitePlayer(username: string, userId: string): void 
    {
        if (this.currentCustomizingSlot === null) 
        {
            return;
        }
        
        const friend = this.friends.find(f => f.username === username);
        if (!friend) 
        {
            return;
        }
        
        const slot = this.playerSlots[this.currentCustomizingSlot];
        if (slot) 
        {
            slot.playerName = username;
            slot.userId = userId;
            slot.isOnline = true;
            slot.isAI = false;
            slot.isReady = false;
            slot.avatarUrl = friend.avatarUrl;
            slot.customization = this.config.gameType === 'podracer' ? AVAILABLE_PODS[this.currentCustomizingSlot % AVAILABLE_PODS.length] : null;
        }
        
        this.closeInviteModal();
        this.refresh();
    }
    
    private showAIModal(slotId: number): void 
    {
        this.currentCustomizingSlot = slotId;
        const modal = document.getElementById('aiDifficultyModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private closeAIModal(): void 
    {
        const modal = document.getElementById('aiDifficultyModal');
        if (modal) 
        {
            modal.style.display = 'none';
        }
        this.currentCustomizingSlot = null;
    }
    
    private addAIPlayer(difficulty: AiDifficulty): void 
    {
        if (this.currentCustomizingSlot === null) 
        {
            return;
        }
        
        const slot = this.playerSlots[this.currentCustomizingSlot];
        if (slot) 
        {
            slot.playerName = `AI BOT ${this.currentCustomizingSlot}`;
            slot.userId = null;
            slot.isAI = true;
            slot.aiDifficulty = difficulty;
            slot.isReady = true;
            slot.customization = null;
        }
        
        this.closeAIModal();
        this.refresh();
    }
    
    private handleRemovePlayer(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (slot && slotId !== 0) 
        {
            slot.playerName = null;
            slot.userId = null;
            slot.isOnline = false;
            slot.isAI = false;
            slot.aiDifficulty = undefined;
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
            this.showPaddleModal();
        }
    }
    
    private showPaddleModal(): void 
    {
        const modal = document.getElementById('paddleSelectionModal');
        if (modal) 
        {
            modal.style.display = 'flex';
        }
    }
    
    private closePaddleModal(): void 
    {
        const modal = document.getElementById('paddleSelectionModal');
        if (modal) 
        {
            modal.style.display = 'none';
        }
        this.currentCustomizingSlot = null;
    }
    
    private selectPaddle(paddleIndex: number): void 
    {
        console.log(`Selected paddle: ${paddleIndex}`);
        this.closePaddleModal();
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
        if (!this.mountSelector) 
        {
            return;
        }
        
        const container = document.querySelector(this.mountSelector);
        if (!container) 
        {
            return;
        }

        container.innerHTML = this.render();
        this.attachEventListeners();
    }
    
    public dispose(): void 
    {
        if (this.podSelection) 
        {
            this.podSelection.dispose();
            this.podSelection = null;
        }
        
        OnlineFriendsService.dispose();
    }
}