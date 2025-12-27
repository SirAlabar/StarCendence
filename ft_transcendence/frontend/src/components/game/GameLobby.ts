import { BaseComponent } from '../BaseComponent';
import { PodConfig, AVAILABLE_PODS } from '../../game/utils/PodConfig';
import { PodSelection, PodSelectionEvent } from '../../pages/games/PodSelectionPage';
import { POD_THUMBNAILS } from '../../pages/games/PodSelectionPage';
import UserService from '../../services/user/UserService';
import FriendService from '../../services/user/FriendService';
import OnlineFriendsService, { FriendWithStatus } from '../../services/websocket/OnlineFriendsService';
import { webSocketService } from '../../services/websocket/WebSocketService';
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
    isHost: boolean;
    avatarUrl: string;
    customization: PodConfig | null;
    paddleName?: string | null;
    paddleGradient?: string | null;
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
    private allFriends: any[] = []; // Store all friends (online + offline)
    private mountSelector: string | null = null;
    
    constructor(config: LobbyConfig) 
    {
        super();
        this.config = config;
    }
    
    private async initializePlayerSlots(): Promise<void> 
{
    this.playerSlots = [];
    
    // Load current user
    try 
    {
        this.currentUser = await UserService.getProfile();
    }
    catch (err) 
    {
        console.error('Failed to load user profile:', err);
        this.currentUser = null;
    }
    
    // Load friends with status - SAME APPROACH AS PROFILEPAGE
    try 
    {
        // Get friends list from backend (includes status)
        const friendsData = await FriendService.getFriends();
        
        if (!friendsData.friends) 
        {
            this.allFriends = [];
            this.friends = [];
        }
        else 
        {
            // Store all friends
            this.allFriends = friendsData.friends.map((friend: any) => ({
                userId: friend.userId,
                username: friend.username,
                status: friend.status || 'OFFLINE', // Backend provides this
                avatarUrl: friend.avatarUrl || '/assets/images/default-avatar.jpeg'
            }));
            
            // Filter online friends (same as ProfilePage)
            this.friends = this.allFriends
                .filter((f: any) => f.status === 'online' || f.status === 'ONLINE')
                .map((f: any) => ({
                    userId: f.userId,
                    username: f.username,
                    avatarUrl: f.avatarUrl,
                    status: f.status
                }));
            
            console.log('[GameLobby] Loaded friends:', {
                total: this.allFriends.length,
                online: this.friends.length
            });
        }
        
        // OPTIONAL: Also initialize OnlineFriendsService for real-time updates
        // But don't rely on it for initial load
        try {
            await OnlineFriendsService.initialize();
            
            // Set up listener for real-time status changes
            OnlineFriendsService.onStatusChange((updatedFriends) => 
            {
                console.log('[GameLobby] Friend status update from WebSocket:', updatedFriends);
                
                // Update friends list with real-time data
                updatedFriends.forEach(updatedFriend => {
                    const friendIndex = this.allFriends.findIndex(
                        (f: any) => f.userId === updatedFriend.userId
                    );
                    
                    if (friendIndex !== -1) {
                        this.allFriends[friendIndex].status = updatedFriend.status;
                    }
                });
                
                // Refresh online friends list
                this.friends = this.allFriends.filter(
                    (f: any) => f.status === 'online' || f.status === 'ONLINE'
                );
                
                // Update UI
                this.updateFriendsList();
            });
        } catch (err) {
            console.warn('[GameLobby] OnlineFriendsService not available:', err);
            // Not critical - we already have friend status from FriendService
        }
    }
    catch (err) 
    {
        console.error('Failed to load friends:', err);
        this.friends = [];
        this.allFriends = [];
    }
    
    // Initialize player slots (host + empty slots)
    if (this.currentUser) 
    {
        this.playerSlots.push({
            id: 0,
            playerName: this.currentUser.username,
            userId: this.currentUser.id,
            isOnline: true,
            isAI: false,
            isReady: false,
            isHost: true,
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
            isHost: false,
            avatarUrl: '/assets/images/default-avatar.jpeg',
            customization: null
        });
    }
}

// ALSO UPDATE renderFriendsList to use the same logic as ProfilePage:

    private renderFriendsList(): string 
    {
        if (this.allFriends.length === 0) 
        {
            return `
                <div class="text-center text-gray-500 py-8">
                    <p class="text-lg font-bold mb-2">No Friends Yet</p>
                    <p class="text-sm">Add friends to invite them to games!</p>
                </div>
            `;
        }
        
        return this.allFriends.map((friend: any) => {
            // Check if friend is online (case-insensitive)
            const isOnline = friend.status?.toLowerCase() === 'online';
            
            const statusColor = isOnline ? 'border-green-400' : 'border-gray-500';
            const statusDot = isOnline ? 'bg-green-400' : 'bg-gray-500';
            const statusText = isOnline ? 'text-green-400' : 'text-gray-500';
            const statusLabel = isOnline ? '● Online' : '● Offline';
            const buttonClass = isOnline 
                ? 'hover:border-cyan-500 hover:bg-gray-700/50 cursor-pointer' 
                : 'opacity-60 cursor-not-allowed';
            
            return `
                <button class="invite-friend-btn w-full p-4 rounded-lg border-2 border-cyan-500/30 bg-gray-800/50 transition-all flex items-center gap-4 ${buttonClass}" 
                    data-username="${friend.username}" 
                    data-userid="${friend.userId}"
                    ${!isOnline ? 'disabled' : ''}>
                    <div class="relative">
                        <img src="${friend.avatarUrl}" alt="${friend.username}" class="w-12 h-12 rounded-full border-2 ${statusColor}">
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${statusDot} rounded-full border-2 border-gray-800"></div>
                    </div>
                    <div class="flex-1 text-left">
                        <p class="text-cyan-300 font-bold">${friend.username}</p>
                        <p class="${statusText} text-sm">${statusLabel}</p>
                    </div>
                    <div class="text-cyan-300 font-bold">${isOnline ? 'INVITE' : 'OFFLINE'}</div>
                </button>
            `;
        }).join('');
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
                    ${this.isCurrentUserHost() ? `
                        <button id="startGameBtn" class="mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 ${this.canStartGame() ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'}" ${!this.canStartGame() ? 'disabled' : ''}>
                            START GAME
                        </button>
                    ` : `
                        <div class="mb-6 py-3 px-12 text-center text-gray-400 text-sm font-bold">
                            Waiting for host to start the game...
                        </div>
                    `}
                    
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
                
                ${this.isCurrentUserSlot(slot) ? `
                <!-- Current user's slot - show CHANGE and READY buttons -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="change-btn py-2 px-3 rounded-lg border border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        CHANGE
                    </button>
                    <button class="ready-btn py-2 px-3 rounded-lg ${slot.isReady ? 'bg-green-600 border border-green-500' : 'bg-cyan-600 border border-cyan-500'} hover:opacity-90 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                        ${slot.isReady ? 'READY ✓' : 'READY'}
                    </button>
                </div>
                ` : this.shouldShowKickButton(slot) ? `
                <!-- Host view for other players - show ready status and KICK button -->
                <div class="mb-2 py-2 px-3 rounded-lg border ${slot.isReady ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800/50'} ${slot.isReady ? 'text-green-400' : 'text-gray-400'} text-sm font-bold text-center">
                    ${slot.isReady ? '✓ READY' : 'NOT READY'}
                </div>
                <button class="remove-btn w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all" data-slot="${slot.id}">
                    ${slot.isAI ? 'REMOVE BOT' : 'KICK PLAYER'}
                </button>
                ` : `
                <!-- Guest view for other players - show ready status only -->
                <div class="py-2 px-3 rounded-lg border ${slot.isReady ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800/50'} ${slot.isReady ? 'text-green-400' : 'text-gray-400'} text-sm font-bold text-center">
                    ${slot.isReady ? '✓ READY' : 'NOT READY'}
                </div>
                `}
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
        if (!this.isCurrentUserHost()) {
            return false;
        }

        const activePlayers = this.playerSlots.filter(slot => slot.playerName !== null);
        const allReady = activePlayers.every(slot => slot.isReady);
        return activePlayers.length >= 2 && allReady;
    }

    public isCurrentUserHost(): boolean {
        if (!this.currentUser) {
            console.log('[GameLobby] isCurrentUserHost: No currentUser');
            return false;
        }
        const hostSlot = this.playerSlots.find(s => s.isHost);
        const result = hostSlot?.userId === this.currentUser.id;
        console.log('[GameLobby] isCurrentUserHost:', {
            currentUserId: this.currentUser.id,
            hostSlotUserId: hostSlot?.userId,
            hostSlotName: hostSlot?.playerName,
            result
        });
        return result;
    }

    private isCurrentUserSlot(slot: PlayerSlot): boolean {
        if (!this.currentUser || !slot.userId) return false;
        return slot.userId === this.currentUser.id;
    }

    private shouldShowKickButton(slot: PlayerSlot): boolean {
        if (!slot.playerName) {
            return false;
        }
        if (!this.isCurrentUserHost()) {
            return false;
        }
        if (slot.isHost) {
            return false;
        }
        return true;
    }

    private refreshPlayerCard(slotId: number): void {
        const slot = this.playerSlots.find(s => s.id === slotId);
        if (!slot) return;

        const cardElement = document.querySelector(`[data-slot="${slotId}"]`)?.closest('.player-card');
        if (cardElement && cardElement.parentElement) {
            const temp = document.createElement('div');
            temp.innerHTML = this.renderPlayerSlot(slot);
            
            const newCard = temp.firstElementChild!;
            cardElement.parentElement.replaceChild(newCard, cardElement);
            
            this.attachCardEventListeners(newCard as HTMLElement);
        }
    }

    private updateStartButton(): void {
        const startBtn = document.getElementById('startGameBtn') as HTMLButtonElement;
        if (!startBtn) return;

        const canStart = this.canStartGame();
        
        if (canStart) {
            startBtn.disabled = false;
            startBtn.className = 'mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-500';
        } else {
            startBtn.disabled = true;
            startBtn.className = 'mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600';
        }
    }

    /**
     * Update start button area (shows/hides button based on host status)
     */
    public updateStartButtonArea(): void {
        // Find the flex-1 div that contains the button area
        const contentDiv = document.querySelector('.flex-1.flex.flex-col.px-8');
        if (!contentDiv) {
            console.warn('[GameLobby] Could not find content div for start button update');
            return;
        }

        // Find the start button area (first child of content div)
        const buttonArea = contentDiv.firstElementChild;
        if (!buttonArea) {
            console.warn('[GameLobby] Could not find button area');
            return;
        }

        // Re-render the button area
        const isHost = this.isCurrentUserHost();
        const canStart = this.canStartGame();
        
        console.log('[GameLobby] updateStartButtonArea:', { isHost, canStart });
        
        const newHTML = isHost ? `
            <button id="startGameBtn" class="mb-6 py-3 px-12 rounded-xl text-xl font-bold transition-all self-center flex-shrink-0 ${canStart ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/50 border-2 border-cyan-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed border-2 border-gray-600'}" ${!canStart ? 'disabled' : ''}>
                START GAME
            </button>
        ` : `
            <div class="mb-6 py-3 px-12 text-center text-gray-400 text-sm font-bold">
                Waiting for host to start the game...
            </div>
        `;

        buttonArea.outerHTML = newHTML;

        // Re-attach event listener if button exists
        if (isHost) {
            const newBtn = document.getElementById('startGameBtn');
            if (newBtn) {
                newBtn.addEventListener('click', () => this.handleStartGame());
            }
        }
    }

    private attachCardEventListeners(card: HTMLElement): void {
        const addBtn = card.querySelector('.add-player-btn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const slotId = parseInt(target.dataset.slot || '0');
                this.handleAddPlayer(slotId);
            });
        }

        const changeBtn = card.querySelector('.change-btn');
        if (changeBtn) {
            changeBtn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const slotId = parseInt(target.dataset.slot || '0');
                this.handleChangeCustomization(slotId);
            });
        }

        const readyBtn = card.querySelector('.ready-btn');
        if (readyBtn) {
            readyBtn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const slotId = parseInt(target.dataset.slot || '0');
                this.toggleReady(slotId);
            });
        }

        const removeBtn = card.querySelector('.remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const slotId = parseInt(target.dataset.slot || '0');
                this.handleRemovePlayer(slotId);
            });
        }
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
        
        const message = chatInput.value.trim();
        const lobbyId = this.getLobbyIdFromUrl();
        
        // Send message via WebSocket to backend
        webSocketService.send('lobby:chat', {
            lobbyId,
            message
        });
        
        chatInput.value = '';
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
        if (!slot || !slot.userId) return;

        // Only host can kick
        if (!this.isCurrentUserHost()) {
            return;
        }

        import('../../services/websocket/WebSocketService').then(({ webSocketService }) => {
            if (slot.isAI) {
                slot.playerName = null;
                slot.userId = null;
                slot.isOnline = false;
                slot.isAI = false;
                slot.aiDifficulty = undefined;
                slot.isReady = false;
                slot.isHost = false;
                slot.customization = null;
                this.refreshPlayerCard(slotId);
            } else {
                webSocketService.send('lobby:kick', {
                    lobbyId: this.getLobbyIdFromUrl(),
                    targetUserId: slot.userId,
                });
            }
        });
    }

    private getLobbyIdFromUrl(): string | null {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }
    
    private toggleReady(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (!slot || !slot.playerName) return;
        
        if (!this.currentUser || slot.userId !== this.currentUser.id) {
            return;
        }
        
        const newReadyState = !slot.isReady;
        
        // Send to backend (DON'T update locally, wait for broadcast confirmation)
        const lobbyId = this.getLobbyIdFromUrl();
        if (lobbyId) {
            webSocketService.send('lobby:ready', {
                lobbyId,
                isReady: newReadyState
            });
        }
        
        // NOTE: Don't update locally! Wait for backend broadcast to confirm
        // This prevents the infinite loop caused by receiving our own broadcast
    }
    
    private handleChangeCustomization(slotId: number): void 
    {
        const slot = this.playerSlots[slotId];
        if (!slot || !slot.playerName) return;
        
        // Only allow current user to change their own customization
        if (!this.currentUser || slot.userId !== this.currentUser.id) {
            return;
        }
        
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
    
    private selectPaddle(_paddleIndex: number): void 
    {
<<<<<<< HEAD
=======
        this.currentCustomizingSlot = null;
    }

    private selectPaddle(_paddleIndex: number): void 
    {
        if (this.currentCustomizingSlot === null) 
        {
            return;
        }

        // Use the same paddle options as in renderPaddleOptions
        const PADDLE_OPTIONS = [
            { name: 'Default', color: 'from-cyan-500 to-blue-600' },
            { name: 'Fire', color: 'from-red-500 to-orange-600' },
            { name: 'Neon', color: 'from-pink-500 to-purple-600' },
            { name: 'Forest', color: 'from-green-500 to-emerald-600' },
            { name: 'Gold', color: 'from-yellow-500 to-amber-600' },
            { name: 'Ice', color: 'from-blue-300 to-cyan-400' }
        ];
        const option = PADDLE_OPTIONS[_paddleIndex];
        const slot = this.playerSlots[this.currentCustomizingSlot];
        if (slot) 
        {
            slot.paddleName = option.name;
            slot.paddleGradient = option.color;
        }

        this.closePaddleModal();
    }
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
    
    /**
     * Add a player to the lobby (called from WebSocket events)
     */
    /**
     * Add a player to the lobby (called from WebSocket events)
     */
    public addPlayer(player: any): void {
        console.log('[GameLobby] addPlayer called:', player);
        
        // Check if player already exists (avoid duplicates)
        if (this.hasPlayer(player.userId)) {
            console.log('[GameLobby] Player already exists, skipping');
            return;
        }
        
        // Find empty slot
        const emptySlot = this.playerSlots.find(slot => !slot.playerName);
        if (!emptySlot) {
            console.log('[GameLobby] No empty slot found');
            return;
        }

        // Populate slot with player data
        emptySlot.playerName = player.username;
        emptySlot.userId = player.userId;
        emptySlot.isOnline = player.isOnline ?? true;
        emptySlot.isAI = player.isAI ?? false;
        emptySlot.isReady = player.isReady ?? false;
        emptySlot.isHost = player.isHost ?? false;
        emptySlot.avatarUrl = player.avatarUrl || '/assets/images/default-avatar.jpeg';
        emptySlot.customization = player.customization || null;

        console.log('[GameLobby] Player added to slot:', {
            slotId: emptySlot.id,
            playerName: emptySlot.playerName,
            userId: emptySlot.userId,
            isHost: emptySlot.isHost,
            isReady: emptySlot.isReady
        });

        // Refresh only the player card instead of whole page
        this.refreshPlayerCard(emptySlot.id);
    }

    /**
     * Check if a player is already in the lobby
     */
    public hasPlayer(userId: string): boolean {
        return this.playerSlots.some(slot => slot.userId === userId);
    }

    /**
     * Update a player's ready status (called from WebSocket events)
     */
    public updatePlayerReady(userId: string, isReady: boolean): void {
        const slot = this.playerSlots.find(s => s.userId === userId);
        if (!slot) {
            return;
        }

        slot.isReady = isReady;
        this.refreshPlayerCard(slot.id);
        this.updateStartButton(); // Update start button state when ready status changes
    }

    /**
     * Remove a player from the lobby (called from WebSocket events)
     */
    public removePlayer(userId: string): void {
        const slot = this.playerSlots.find(s => s.userId === userId);
        if (!slot) {
            return;
        }

        // Clear slot
        slot.playerName = null;
        slot.userId = null;
        slot.isOnline = false;
        slot.isAI = false;
        slot.isReady = false;
        slot.isHost = false;
        slot.avatarUrl = '/assets/images/default-avatar.jpeg';
        slot.customization = null;

        // Refresh only the player card, not the whole page
        this.refreshPlayerCard(slot.id);
    }

    /**
     * Clear all players from lobby (useful for reconnect/refresh)
     */
    public clearAllPlayers(): void {
        this.playerSlots.forEach(slot => {
            // Clear player data but keep slot available
            slot.playerName = null;
            slot.userId = null;
            slot.isOnline = false;
            slot.isAI = false;
            slot.isReady = false;
            slot.isHost = false;
            slot.avatarUrl = '/assets/images/default-avatar.jpeg';
            slot.customization = null;
        });
        this.refresh();
    }

    /**
     * Update lobby state (called from WebSocket events)
     */
    public updateLobbyState(_lobbyData: any): void {
        // Implement full lobby state sync if needed
        // For now, this is a placeholder for future enhancements
    }

    /**
     * Add chat message (called from WebSocket events)
     */
    public addChatMessage(messageData: any): void {
        const now = new Date();
        const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        this.chatMessages.push({
            player: messageData.username || messageData.player || 'PLAYER',
            message: (messageData.message || messageData.text || '').toUpperCase(),
            time: messageData.time || time
        });
        
        const chatContainer = document.getElementById('chatMessages');
        if (chatContainer) {
            chatContainer.innerHTML = this.renderChatMessages();
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
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