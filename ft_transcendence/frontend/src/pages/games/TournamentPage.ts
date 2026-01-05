import { BaseComponent } from '../../components/BaseComponent';
import { TournamentBracket } from '../../components/tournament/TournamentBracket';
import TournamentService from '../../services/game/TournamentService';
import { Tournament } from '../../types/tournament.types';
import { Modal } from '@/components/common/Modal';
import { navigateTo } from '../../router/router';
import UserService from '../../services/user/UserService';

export default class TournamentPage extends BaseComponent 
{
    private tournament: Tournament | null = null;
    private bracketComponent: TournamentBracket | null = null;
    private isCreatingTournament: boolean = false;
    private activeTournaments: Tournament[] = [];
    private currentUserId: string = '';

    render(): string 
    {
        return `
            <div class="container mx-auto px-6 py-8">
                ${!this.tournament ? `
                    <!-- Header only on creation page -->
                    <div class="text-center mb-12">
                        <h1 class="text-6xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-yellow-400 to-orange-400 mb-4 drop-shadow-[0_0_15px_rgba(99,234,254,0.5)]">
                            🏆 TOURNAMENT
                        </h1>
                        <p class="text-xl text-cyan-300 font-semibold tracking-wide">
                            Compete. Win. Transcend.
                        </p>
                    </div>
                ` : ''}

                ${this.tournament ? this.renderActiveTournament() : this.renderTournamentCreation()}
            </div>
        `;
    }

    private renderTournamentCreation(): string 
    {
        return `
            <div class="max-w-7xl mx-auto">
                <div class="grid lg:grid-cols-2 gap-8">
                    <!-- Create Tournament -->
                    <div>
                        <div class="bg-gray-800/80 rounded-lg border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20 p-8">
                            <h2 class="text-3xl font-bold text-cyan-400 mb-6 flex items-center">
                                <span class="mr-3">⚔️</span>
                                Create Tournament
                            </h2>

                            <form id="createTournamentForm" class="space-y-6">
                                <div>
                                    <label class="block text-gray-300 font-semibold mb-2">Tournament Name</label>
                                    <input 
                                        type="text" 
                                        id="tournamentName" 
                                        class="w-full bg-gray-900/50 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                                        placeholder="e.g., Weekly Pong Championship"
                                        required
                                        maxlength="50">
                                </div>

                                <div class="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                                    <div class="flex justify-between items-center">
                                        <span class="text-purple-300 font-semibold">🏆 Prize Pool</span>
                                        <span class="text-2xl font-bold text-yellow-400">4000 PTS</span>
                                    </div>
                                </div>

                                <div class="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                                    <h3 class="text-blue-300 font-bold mb-2">ℹ️ Tournament Info</h3>
                                    <ul class="text-sm text-gray-300 space-y-1">
                                        <li>• Requires exactly <strong>4 players</strong></li>
                                        <li>• Single elimination format</li>
                                        <li>• Best of 3 matches</li>
                                    </ul>
                                </div>

                                <button 
                                    type="submit" 
                                    id="createTournamentBtn"
                                    class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    🎮 Create Tournament
                                </button>
                            </form>
                        </div>

                        <!-- Rules -->
                        <div class="bg-gray-800/80 rounded-lg border-2 border-purple-500/50 shadow-xl shadow-purple-500/20 p-6 mt-6">
                            <h3 class="text-2xl font-bold text-yellow-400 mb-4">📜 Rules</h3>

                            <div class="space-y-3 text-gray-300 mb-6">
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400 text-xl">✓</span>
                                    <span>Single elimination</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400 text-xl">✓</span>
                                    <span>Best of 3 matches</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400 text-xl">✓</span>
                                    <span>Fair play policy</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <span class="text-green-400 text-xl">✓</span>
                                    <span>AI opponents allowed</span>
                                </div>
                            </div>

                            <div class="border-t border-gray-700 pt-4">
                                <h4 class="font-bold text-white mb-3">🏅 Prize Distribution</h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between items-center">
                                        <span class="text-yellow-400">🥇 1st Place:</span>
                                        <span class="text-white font-bold">2000 pts (50%)</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-400">🥈 2nd Place:</span>
                                        <span class="text-white font-bold">1200 pts (30%)</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-orange-400">🥉 3rd Place:</span>
                                        <span class="text-white font-bold">800 pts (20%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Active Tournaments -->
                    <div>
                        <div class="bg-gray-800/80 rounded-lg border-2 border-yellow-500/50 shadow-xl shadow-yellow-500/20 p-8">
                            <h2 class="text-3xl font-bold text-yellow-400 mb-6 flex items-center">
                                <span class="mr-3">🏟️</span>
                                Active Tournaments
                            </h2>

                            ${this.renderActiveTournamentsList()}
                        </div>
                    </div>
                </div>

                <!-- Back Button -->
                <div class="text-center mt-8">
                    <button 
                        onclick="navigateTo('/')" 
                        class="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    private renderActiveTournamentsList(): string 
    {
        if (this.activeTournaments.length === 0) 
        {
            return `
                <div class="text-center py-16">
                    <div class="text-6xl mb-4">🎮</div>
                    <h3 class="text-2xl font-bold text-gray-400 mb-2">No Active Tournaments</h3>
                    <p class="text-gray-500">Be the first to create one!</p>
                </div>
            `;
        }

        return `
            <div class="space-y-4">
                ${this.activeTournaments.map(tournament => `
                    <div class="bg-gray-900/50 border-2 border-cyan-500/30 rounded-lg p-6 hover:border-cyan-500/60 transition-all duration-300">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-white mb-1">${tournament.name}</h3>
                                <p class="text-gray-400">Host: <span class="text-cyan-400">${tournament.hostUsername}</span></p>
                            </div>
                            <span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">OPEN</span>
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="text-center">
                                <p class="text-gray-400 text-sm">Players</p>
                                <p class="text-white font-bold">${tournament.players.length}/4</p>
                            </div>
                            <div class="text-center">
                                <p class="text-gray-400 text-sm">Prize Pool</p>
                                <p class="text-yellow-400 font-bold">${tournament.prizePool} pts</p>
                            </div>
                        </div>

                        <button 
                            onclick="window.handleQuickJoin('${tournament.id}')"
                            class="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-bold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/50">
                            ⚡ Quick Join
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private renderActiveTournament(): string 
    {
        if (!this.tournament) 
        {
            return '';
        }

        const playerCount = this.tournament.players.length;
        const canStart = TournamentService.canStartTournament();
        const isHost = this.currentUserId === this.tournament.hostId;

        return `
            <div class="max-w-7xl mx-auto mt-8">
                <!-- Tournament Header with Title on Right -->
                <div class="grid lg:grid-cols-2 gap-4 mb-6">
                    <!-- Left: Tournament Name & Host -->
                    <div class="bg-gray-800/90 rounded-lg border-2 border-yellow-500/50 p-4">
                        <h2 class="text-2xl font-bold text-yellow-400">${this.tournament.name}</h2>
                        <p class="text-gray-300 text-sm">Host: <span class="text-cyan-400">${this.tournament.hostUsername}</span></p>
                    </div>

                    <!-- Right: Tournament Title -->
                    <div class="bg-purple-900/50 rounded-lg border-2 border-cyan-500/50 p-4 flex flex-col justify-center">
                        <h2 class="text-3xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-yellow-400 text-center">
                            🏆 TOURNAMENT
                        </h2>
                        <p class="text-center text-cyan-300 text-sm font-semibold tracking-wide mt-1">
                            Compete. Win. Transcend.
                        </p>
                        <div class="mt-2 text-center">
                            <span class="text-purple-300 text-xs">Prize Pool: </span>
                            <span class="text-yellow-400 font-bold text-lg">${this.tournament.prizePool} pts</span>
                            ${this.renderTournamentStatus()}
                        </div>
                    </div>
                </div>

                <!-- Players & Bracket - Same Height -->
                <div class="grid lg:grid-cols-5 gap-6">
                    <!-- Players List -->
                    <div class="lg:col-span-2 flex">
                        <div class="bg-gray-800/80 rounded-lg border-2 border-cyan-500/50 p-6 flex flex-col w-full">
                            <h3 class="text-2xl font-bold text-cyan-400 mb-6 flex justify-between items-center">
                                <span>👥 Players</span>
                                <span class="text-xl">${playerCount}/4</span>
                            </h3>

                            <div class="space-y-6 mb-6 flex-1 flex flex-col justify-between">
                                ${this.tournament.players.map(player => this.renderPlayerCard(player, isHost)).join('')}
                                ${this.renderEmptySlots(4 - playerCount)}
                            </div>

                            ${this.tournament.status === 'waiting' ? `
                                <div class="space-y-3">
                                    ${isHost ? `
                                        <div class="grid grid-cols-2 gap-3">
                                            <button 
                                                id="addAIEasyBtn"
                                                class="bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-all duration-300 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                                ${playerCount >= 4 ? 'disabled' : ''}>
                                                🤖 AI Easy
                                            </button>
                                            <button 
                                                id="addAIHardBtn"
                                                class="bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 transition-all duration-300 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                                ${playerCount >= 4 ? 'disabled' : ''}>
                                                🤖 AI Hard
                                            </button>
                                        </div>
                                        <button 
                                            id="startTournamentBtn"
                                            class="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-all duration-300 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                            ${!canStart ? 'disabled' : ''}>
                                            ⚔️ Start Tournament
                                        </button>
                                    ` : ''}
                                    <button 
                                        id="leaveTournamentBtn"
                                        class="w-full bg-gray-600 text-white py-4 rounded-lg hover:bg-gray-700 transition-all duration-300 font-semibold text-base">
                                        ← Leave
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Bracket -->
                    <div class="lg:col-span-3 flex">
                        <div class="bg-gray-800/80 rounded-lg border-2 border-yellow-500/50 p-6 w-full">
                            <h3 class="text-2xl font-bold text-yellow-400 mb-6">📊 Tournament Bracket</h3>
                            <div id="bracketContainer"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderTournamentStatus(): string 
    {
        if (!this.tournament) 
        {
            return '';
        }

        switch (this.tournament.status) 
        {
            case 'waiting':
                return '<span class="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold ml-3">⏳ WAITING</span>';
            case 'in-progress':
                return '<span class="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold animate-pulse ml-3">🎮 LIVE</span>';
            case 'completed':
                return '<span class="bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-semibold ml-3">✅ COMPLETED</span>';
            default:
                return '';
        }
    }

    private renderPlayerCard(player: any, isHost: boolean): string 
    {
        const canKick = isHost && player.userId !== this.tournament?.hostId;

        return `
            <div class="bg-gray-900/50 border-2 border-gray-700 rounded-lg p-5 flex items-center space-x-4">
                <div class="relative">
                    <img src="${player.avatarUrl}" 
                         alt="${player.username}" 
                         class="w-24 h-24 rounded-full border-2 border-cyan-500"
                         onerror="this.src='/assets/images/default-avatar.jpeg'">
                    ${player.isAI ? `
                        <div class="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1">
                            <span class="text-sm">🤖</span>
                        </div>
                    ` : ''}
                    ${player.seed === 1 ? `
                        <div class="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                            <span class="text-sm">👑</span>
                        </div>
                    ` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-white font-semibold text-lg truncate">${player.username}</p>
                    <p class="text-sm text-gray-500">Seed ${player.seed}</p>
                </div>
                ${canKick ? `
                    <button 
                        onclick="window.handleKickPlayer('${player.userId}')"
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold transition-all duration-200 flex-shrink-0">
                        Kick
                    </button>
                ` : ''}
            </div>
        `;
    }

    private renderEmptySlots(count: number): string 
    {
        return Array(count).fill(0).map(() => `
            <div class="bg-gray-900/30 border-2 border-dashed border-gray-700 rounded-lg p-5 flex items-center space-x-4">
                <div class="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
                    <span class="text-gray-600 text-xl">?</span>
                </div>
                <div class="flex-1">
                    <p class="text-gray-600 font-semibold text-lg">Waiting for player...</p>
                </div>
            </div>
        `).join('');
    }

    async mount(): Promise<void> 
    {
        // Check authentication first
        try 
        {
            const user = await UserService.getProfile();
            this.currentUserId = user.id;
        }
        catch (error) 
        {
            console.error('[TournamentPage] User not authenticated:', error);
            // Redirect to login page
            navigateTo('/login');
            return;
        }

        super.mount('#content-mount');

        // Load active tournaments
        this.activeTournaments = TournamentService.getActiveTournaments();

        // Check if there's an active tournament
        this.tournament = TournamentService.getCurrentTournament();

        if (this.tournament) 
        {
            this.updateView();
            this.setupTournamentSubscription();
        }

        this.setupEventListeners();
    }

    private setupEventListeners(): void 
    {
        // Create tournament form
        const form = document.getElementById('createTournamentForm') as HTMLFormElement;
        if (form) 
        {
            form.addEventListener('submit', (e) => this.handleCreateTournament(e));
        }

        // Add AI buttons
        const addAIEasyBtn = document.getElementById('addAIEasyBtn');
        if (addAIEasyBtn) 
        {
            addAIEasyBtn.addEventListener('click', () => this.handleAddAI('easy'));
        }

        const addAIHardBtn = document.getElementById('addAIHardBtn');
        if (addAIHardBtn) 
        {
            addAIHardBtn.addEventListener('click', () => this.handleAddAI('hard'));
        }

        // Start tournament button
        const startBtn = document.getElementById('startTournamentBtn');
        if (startBtn) 
        {
            startBtn.addEventListener('click', () => this.handleStartTournament());
        }

        // Leave tournament button
        const leaveBtn = document.getElementById('leaveTournamentBtn');
        if (leaveBtn) 
        {
            leaveBtn.addEventListener('click', () => this.handleLeaveTournament());
        }

        // Global handlers for quick actions
        (window as any).handleQuickJoin = (tournamentId: string) => this.handleQuickJoin(tournamentId);
        (window as any).handleKickPlayer = (userId: string) => this.handleKickPlayer(userId);
    }

    private async handleCreateTournament(e: Event): Promise<void> 
    {
        e.preventDefault();

        if (this.isCreatingTournament) 
        {
            return;
        }

        // Check authentication before creating tournament
        try 
        {
            await UserService.getProfile();
        }
        catch (error) 
        {
            console.error('[TournamentPage] Authentication failed during tournament creation:', error);
            await Modal.alert('Session Expired', 'Your session has expired. Please login again.');
            navigateTo('/login');
            return;
        }

        const form = e.target as HTMLFormElement;
        const nameInput = form.querySelector('#tournamentName') as HTMLInputElement;

        const name = nameInput.value.trim();

        if (!name) 
        {
            await Modal.alert('Error', 'Please enter a tournament name');
            return;
        }

        this.isCreatingTournament = true;
        const btn = form.querySelector('#createTournamentBtn') as HTMLButtonElement;
        if (btn) 
        {
            btn.disabled = true;
            btn.textContent = '⏳ Creating...';
        }

        try 
        {
            this.tournament = await TournamentService.createTournament({ name });
            this.setupTournamentSubscription();
            this.updateView();

            await Modal.alert('Success', 'Tournament created! Invite players or add AI opponents.');
        }
        catch (error: any) 
        {
            console.error('Failed to create tournament:', error);
            await Modal.alert('Error', error.message || 'Failed to create tournament');
        }
        finally 
        {
            this.isCreatingTournament = false;
            if (btn) 
            {
                btn.disabled = false;
                btn.textContent = '🎮 Create Tournament';
            }
        }
    }

    private async handleQuickJoin(tournamentId: string): Promise<void> 
    {
        try 
        {
            this.tournament = await TournamentService.joinTournament(tournamentId);
            this.setupTournamentSubscription();
            this.updateView();

            await Modal.alert('Success', 'Joined tournament successfully!');
        }
        catch (error: any) 
        {
            console.error('Failed to join tournament:', error);
            await Modal.alert('Error', error.message || 'Failed to join tournament');
        }
    }

    private async handleAddAI(difficulty: 'easy' | 'hard'): Promise<void> 
    {
        try 
        {
            await TournamentService.addAIPlayer(difficulty);
            this.updateView();
        }
        catch (error: any) 
        {
            console.error('Failed to add AI:', error);
            await Modal.alert('Error', error.message || 'Failed to add AI player');
        }
    }

    private async handleKickPlayer(userId: string): Promise<void> 
    {
        const confirmed = await Modal.confirm('Kick Player', 'Are you sure you want to kick this player?');

        if (confirmed) 
        {
            try 
            {
                await TournamentService.kickPlayer(userId);
                this.updateView();
            }
            catch (error: any) 
            {
                console.error('Failed to kick player:', error);
                await Modal.alert('Error', error.message || 'Failed to kick player');
            }
        }
    }

    private async handleStartTournament(): Promise<void> 
    {
        try 
        {
            await TournamentService.startTournament();
            await Modal.alert('Success', 'Tournament started! Good luck! 🎮');
            this.updateView();
        }
        catch (error: any) 
        {
            console.error('Failed to start tournament:', error);
            await Modal.alert('Error', error.message || 'Failed to start tournament');
        }
    }

    private async handleLeaveTournament(): Promise<void> 
    {
        const confirmed = await Modal.confirm('Leave Tournament', 'Are you sure you want to leave this tournament?');

        if (confirmed) 
        {
            try 
            {
                await TournamentService.leaveTournament();
                this.tournament = null;
                navigateTo('/games');
            }
            catch (error: any) 
            {
                console.error('Failed to leave tournament:', error);
                await Modal.alert('Error', error.message || 'Failed to leave tournament');
            }
        }
    }

    private setupTournamentSubscription(): void 
    {
        TournamentService.onTournamentUpdate((updatedTournament) => 
        {
            this.tournament = updatedTournament;
            this.updateView();
        });
    }

    private updateView(): void 
    {
        if (!this.container) 
        {
            return;
        }

        this.container.innerHTML = this.render();
        this.setupEventListeners();

        if (this.tournament) 
        {
            const bracketData = TournamentService.getBracketData();
            if (bracketData) 
            {
                if (!this.bracketComponent) 
                {
                    this.bracketComponent = new TournamentBracket(bracketData);
                    const bracketContainer = document.getElementById('bracketContainer');
                    if (bracketContainer) 
                    {
                        bracketContainer.innerHTML = this.bracketComponent.render();
                    }
                }
                else 
                {
                    this.bracketComponent.updateBracket(bracketData);
                }
            }
        }
    }

    public dispose(): void 
    {
        if (this.bracketComponent) 
        {
            this.bracketComponent = null;
        }

        delete (window as any).handleQuickJoin;
        delete (window as any).handleKickPlayer;
    }
}``
