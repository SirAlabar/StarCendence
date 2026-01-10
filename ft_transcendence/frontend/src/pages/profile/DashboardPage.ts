import { BaseComponent } from '../../components/BaseComponent';
import { getUserApiUrl, getGameApiUrl } from '../../types/api.types';
import { UserProfile } from '../../types/user.types';
import { showLoading, hideLoading } from '../../router/LayoutManager';

// Match the backend schema
interface MatchResult 
{
    id: string;
    matchId: string;
    userId: string;
    score: number;
    accuracy?: number;
    topSpeed?: number;
}

interface Match 
{
    id: string;
    gameId: string;
    type: string; // "PONG" | "RACER"
    mode: string;
    winnerId?: string;
    duration: number;
    results: MatchResult[];
    totalPoints?: number;
    fastestLap?: number;
    playedAt: string;
}

// User data cache for avatars
interface UserCache 
{
    [userId: string]: 
    {
        username: string;
        avatarUrl?: string;
    };
}

export default class DashboardPage extends BaseComponent 
{
    private userProfile: UserProfile | null = null;
    private matchHistory: Match[] = [];
    private userCache: UserCache = {};
    private error: string | null = null;
    private currentUserId: string = '';

    render(): string 
    {
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
                .neon-card {
                    background: rgba(17, 24, 39, 0.6);
                    backdrop-filter: blur(10px);
                    border: 2px solid rgba(0, 255, 255, 0.3);
                    box-shadow: 
                        0 0 20px rgba(0, 255, 255, 0.2),
                        inset 0 0 20px rgba(0, 255, 255, 0.05);
                    transition: all 0.3s ease;
                }

                .neon-card:hover {
                    border-color: rgba(0, 255, 255, 0.6);
                    box-shadow: 
                        0 0 30px rgba(0, 255, 255, 0.4),
                        inset 0 0 20px rgba(0, 255, 255, 0.1);
                    transform: translateY(-2px);
                }

                .stat-label {
                    color: rgba(156, 163, 175, 1);
                    font-size: 0.875rem;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #00ffff 0%, #a855f7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .chart-bar {
                    background: linear-gradient(90deg, #00ffff 0%, #a855f7 100%);
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    transition: all 0.3s ease;
                }

                .chart-bar:hover {
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                    transform: scaleY(1.05);
                }

                .match-item {
                    background: rgba(31, 41, 55, 0.5);
                    border-left: 3px solid transparent;
                    transition: all 0.3s ease;
                }

                .match-item.win {
                    border-left-color: #10b981;
                }

                .match-item.loss {
                    border-left-color: #ef4444;
                }

                .match-item.draw {
                    border-left-color: #f59e0b;
                }

                .match-item:hover {
                    background: rgba(31, 41, 55, 0.8);
                    transform: translateX(4px);
                }

                .progress-ring {
                    transform: rotate(-90deg);
                }

                .progress-ring-circle {
                    stroke-dasharray: 314;
                    stroke-dashoffset: 314;
                    transition: stroke-dashoffset 1s ease-in-out;
                }

                .avatar-small {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(0, 255, 255, 0.5);
                    box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
                }

                .game-type-badge {
                    display: inline-block;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .badge-pong {
                    background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
                    color: #ffffff;
                }

                .badge-racer {
                    background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
                    color: #ffffff;
                }
            </style>

            <div class="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
                <!-- Header -->
                <div class="flex flex-col sm:flex-row justify-between items-center mb-8">
                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-bold font-game text-cyan-400 tracking-wide mb-4 sm:mb-0" style="text-shadow: 0 0 20px #00ffff;">
                        PLAYER DASHBOARD
                    </h1>
                    <button id="back-btn" class="neon-card px-6 py-3 rounded-lg font-bold text-cyan-400 tracking-wide hover:text-white">
                        ← BACK TO PROFILE
                    </button>
                </div>

                <!-- Stats Overview Grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    ${this.renderStatsCards()}
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <!-- Win Rate Circle Chart -->
                    <div class="neon-card rounded-lg p-6">
                        <h3 class="text-xl font-bold text-cyan-400 mb-6 tracking-wider text-center">WIN RATE</h3>
                        ${this.renderWinRateChart()}
                    </div>

                    <!-- Game Modes Performance -->
                    <div class="neon-card rounded-lg p-6">
                        <h3 class="text-xl font-bold text-purple-400 mb-6 tracking-wider text-center">GAME MODES</h3>
                        ${this.renderGameModesChart()}
                    </div>

                    <!-- Recent Performance -->
                    <div class="neon-card rounded-lg p-6">
                        <h3 class="text-xl font-bold text-green-400 mb-6 tracking-wider text-center">PERFORMANCE</h3>
                        ${this.renderPerformanceStats()}
                    </div>
                </div>

                <!-- Match History -->
                <div class="neon-card rounded-lg p-6">
                    <h2 class="text-2xl font-bold text-cyan-400 mb-6 tracking-wider">MATCH HISTORY</h2>
                    ${this.renderMatchHistory()}
                </div>
            </div>
        `;
    }

    private renderStatsCards(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        const totalGames = this.userProfile.gameStatus?.totalGames || 0;
        const totalWins = this.userProfile.gameStatus?.totalWins || 0;
        const totalLosses = this.userProfile.gameStatus?.totalLosses || 0;
        const winRate = this.calculateWinRate();

        return `
            <div class="neon-card rounded-lg p-6 text-center">
                <p class="stat-label mb-2">Total Games</p>
                <p class="stat-value">${totalGames}</p>
            </div>

            <div class="neon-card rounded-lg p-6 text-center">
                <p class="stat-label mb-2">Victories</p>
                <p class="stat-value text-green-400">${totalWins}</p>
            </div>

            <div class="neon-card rounded-lg p-6 text-center">
                <p class="stat-label mb-2">Defeats</p>
                <p class="stat-value text-red-400">${totalLosses}</p>
            </div>

            <div class="neon-card rounded-lg p-6 text-center">
                <p class="stat-label mb-2">Win Rate</p>
                <p class="stat-value text-yellow-400">${winRate.toFixed(1)}%</p>
            </div>
        `;
    }

    private renderWinRateChart(): string 
    {
        const winRate = this.calculateWinRate();
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (winRate / 100) * circumference;

        return `
            <div class="flex flex-col items-center">
                <svg width="160" height="160" class="mb-4">
                    <!-- Background circle -->
                    <circle cx="80" cy="80" r="50" fill="none" stroke="rgba(75, 85, 99, 0.3)" stroke-width="10"/>
                    <!-- Progress circle -->
                    <circle 
                        class="progress-ring-circle" 
                        cx="80" 
                        cy="80" 
                        r="50" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        stroke-width="10"
                        stroke-linecap="round"
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}; transform: rotate(-90deg); transform-origin: center;"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#00ffff;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                </svg>
                <div class="text-center">
                    <p class="text-4xl font-bold text-cyan-400 mb-2">${winRate.toFixed(1)}%</p>
                    <p class="text-gray-400 text-sm tracking-wider">
                        ${this.userProfile?.gameStatus?.totalWins || 0} WINS / ${this.userProfile?.gameStatus?.totalGames || 0} GAMES
                    </p>
                </div>
            </div>
        `;
    }

    private renderGameModesChart(): string 
    {
        // Calculate stats by game type from match history
        const pongMatches = this.matchHistory.filter(m => m.type === 'PONG');
        const racerMatches = this.matchHistory.filter(m => m.type === 'RACER');
        
        const pongWins = pongMatches.filter(m => m.winnerId === this.currentUserId).length;
        const racerWins = racerMatches.filter(m => m.winnerId === this.currentUserId).length;

        const pongWinRate = pongMatches.length > 0 ? (pongWins / pongMatches.length) * 100 : 0;
        const racerWinRate = racerMatches.length > 0 ? (racerWins / racerMatches.length) * 100 : 0;

        // Count tournament matches
        const tournamentMatches = this.matchHistory.filter(m => 
            m.mode && m.mode.includes('TOURNAMENT')
        ).length;
        
        const tournamentWins = this.matchHistory.filter(m => 
            m.mode && m.mode.includes('TOURNAMENT') && m.winnerId === this.currentUserId
        ).length;

        return `
            <div class="space-y-4">
                <!-- Pong Stats -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-cyan-400 font-bold text-sm tracking-wider">PONG</span>
                        <span class="text-gray-400 text-xs">${pongWins}W / ${pongMatches.length}L</span>
                    </div>
                    <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div class="chart-bar h-full rounded-full" style="width: ${pongWinRate}%;"></div>
                    </div>
                </div>

                <!-- Pod Racer Stats -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-purple-400 font-bold text-sm tracking-wider">POD RACER</span>
                        <span class="text-gray-400 text-xs">${racerWins}W / ${racerMatches.length}L</span>
                    </div>
                    <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div class="chart-bar h-full rounded-full" style="width: ${racerWinRate}%;"></div>
                    </div>
                </div>

                <!-- Tournaments -->
                <div class="pt-4 border-t border-gray-700">
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-400 font-bold text-sm tracking-wider">TOURNAMENTS</span>
                        <span class="text-yellow-400 font-bold text-lg">${tournamentWins} WINS</span>
                    </div>
                    <p class="text-gray-500 text-xs mt-1">${tournamentMatches} TOTAL PARTICIPATIONS</p>
                </div>
            </div>
        `;
    }

    private renderPerformanceStats(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        const totalWins = this.userProfile.gameStatus?.totalWins || 0;
        const totalLosses = this.userProfile.gameStatus?.totalLosses || 0;
        const totalDraws = this.userProfile.gameStatus?.totalDraws || 0;
        const totalPoints = (totalWins * 3) + (totalDraws * 1); // Example point system
        const winRate = this.calculateWinRate();

        return `
            <div class="space-y-4">
                <!-- Wins -->
                <div class="flex justify-between items-center">
                    <span class="text-green-400 font-bold text-sm tracking-wider">WINS</span>
                    <span class="text-green-400 font-bold text-2xl">${totalWins}</span>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full" style="width: ${totalWins > 0 ? 100 : 0}%;"></div>
                </div>

                <!-- Losses -->
                <div class="flex justify-between items-center">
                    <span class="text-red-400 font-bold text-sm tracking-wider">LOSSES</span>
                    <span class="text-red-400 font-bold text-2xl">${totalLosses}</span>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-red-500 rounded-full" style="width: ${totalLosses > 0 ? (totalLosses / (totalWins + totalLosses)) * 100 : 0}%;"></div>
                </div>

                <!-- Draws -->
                <div class="flex justify-between items-center">
                    <span class="text-yellow-400 font-bold text-sm tracking-wider">DRAWS</span>
                    <span class="text-yellow-400 font-bold text-2xl">${totalDraws}</span>
                </div>
                <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-500 rounded-full" style="width: ${totalDraws > 0 ? 10 : 0}%;"></div>
                </div>

                <!-- Additional Stats -->
                <div class="pt-4 border-t border-gray-700 space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-cyan-400 text-sm tracking-wider">TOTAL POINTS:</span>
                        <span class="text-cyan-400 font-bold text-xl">${totalPoints}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-cyan-400 text-sm tracking-wider">WIN PERCENTAGE:</span>
                        <span class="text-cyan-400 font-bold text-xl">${winRate.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }

    private renderMatchHistory(): string 
    {
        if (this.matchHistory.length === 0) 
        {
            return `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🎮</div>
                    <h3 class="text-xl font-bold text-gray-400 mb-2 tracking-wider">NO MATCH HISTORY AVAILABLE YET</h3>
                    <p class="text-gray-500 tracking-wide">START PLAYING TO SEE YOUR MATCH HISTORY HERE</p>
                </div>
            `;
        }

        const recentMatches = this.matchHistory.slice(0, 10);

        return `
            <div class="space-y-3">
                ${recentMatches.map(match => this.renderMatchItem(match)).join('')}
            </div>
            
            ${this.matchHistory.length > 10 ? `
                <div class="text-center mt-6">
                    <p class="text-gray-500 text-sm">Showing 10 of ${this.matchHistory.length} matches</p>
                </div>
            ` : ''}
        `;
    }

    private renderMatchItem(match: Match): string 
    {
        // Find current user's result
        const myResult = match.results.find(r => r.userId === this.currentUserId);
        const opponentResult = match.results.find(r => r.userId !== this.currentUserId);
        
        if (!myResult || !opponentResult) 
        {
            return '';
        }

        const isWin = match.winnerId === this.currentUserId;
        const isDraw = !match.winnerId;
        
        let resultClass = '';
        let resultText = '';
        let resultColor = '';

        if (isDraw) 
        {
            resultClass = 'draw';
            resultText = 'DRAW';
            resultColor = 'text-yellow-400';
        } 
        else if (isWin) 
        {
            resultClass = 'win';
            resultText = 'VICTORY';
            resultColor = 'text-green-400';
        } 
        else 
        {
            resultClass = 'loss';
            resultText = 'DEFEAT';
            resultColor = 'text-red-400';
        }

        const date = new Date(match.playedAt);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        // Get opponent info from cache
        const opponentInfo = this.userCache[opponentResult.userId] || { username: 'Unknown Player' };
        
        // Game type badge
        const gameTypeBadge = match.type === 'PONG' 
            ? '<span class="game-type-badge badge-pong">🏓 PONG</span>'
            : '<span class="game-type-badge badge-racer">🏎️ POD RACER</span>';

        // Avatar fallback
        const avatarUrl = opponentInfo.avatarUrl || '/assets/images/default-avatar.jpeg';

        return `
            <div class="match-item ${resultClass} rounded-lg p-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                            ${gameTypeBadge}
                            <span class="${resultColor} font-bold text-lg tracking-wide">${resultText}</span>
                            <span class="text-gray-500 text-sm">•</span>
                            <span class="text-gray-400 text-sm">${dateStr} at ${timeStr}</span>
                        </div>
                        
                        <!-- Players Info -->
                        <div class="flex items-center gap-4 mb-2">
                            <!-- Current User -->
                            <div class="flex items-center gap-2">
                                <img src="${this.userProfile?.avatarUrl || '/assets/images/default-avatar.jpeg'}" 
                                     alt="You" 
                                     class="avatar-small"
                                     onerror="this.src='/assets/images/default-avatar.jpeg'">
                                <span class="text-cyan-300 font-semibold">You</span>
                            </div>
                            
                            <span class="text-gray-500 font-bold text-xl">VS</span>
                            
                            <!-- Opponent -->
                            <div class="flex items-center gap-2">
                                <img src="${avatarUrl}" 
                                     alt="${this.escapeHtml(opponentInfo.username)}" 
                                     class="avatar-small"
                                     onerror="this.src='/assets/images/default-avatar.jpeg'">
                                <span class="text-gray-300 font-semibold">${this.escapeHtml(opponentInfo.username)}</span>
                            </div>
                        </div>
                        
                        <!-- Score -->
                        <div class="flex items-center gap-2 text-cyan-300">
                            <span class="font-mono text-2xl font-bold">${myResult.score}</span>
                            <span class="text-gray-500">-</span>
                            <span class="font-mono text-2xl font-bold text-gray-400">${opponentResult.score}</span>
                        </div>
                        
                        <!-- Additional Stats -->
                        ${this.renderAdditionalStats(match, myResult)}
                    </div>
                </div>
            </div>
        `;
    }

    private renderAdditionalStats(match: Match, myResult: MatchResult): string 
    {
        const stats: string[] = [];

        // Duration
        const minutes = Math.floor(match.duration / 60);
        const seconds = match.duration % 60;
        stats.push(`⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Accuracy (if available)
        if (myResult.accuracy !== null && myResult.accuracy !== undefined) 
        {
            stats.push(`🎯 ${myResult.accuracy.toFixed(1)}% accuracy`);
        }

        // Top Speed (if racer game)
        if (match.type === 'RACER' && myResult.topSpeed) 
        {
            stats.push(`⚡ ${myResult.topSpeed.toFixed(0)} km/h`);
        }

        // Fastest Lap (if available)
        if (match.fastestLap) 
        {
            stats.push(`🏁 ${match.fastestLap.toFixed(2)}s fastest lap`);
        }

        if (stats.length === 0) 
        {
            return '';
        }

        return `
            <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                ${stats.map(stat => `<span>${stat}</span>`).join('')}
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
                    <p class="text-red-300 mb-6 text-lg">${this.escapeHtml(message || this.error || 'Failed to load dashboard')}</p>
                </div>
            </div>
        `;
    }

    protected async afterMount(): Promise<void> 
    {
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    private async loadDashboardData(): Promise<void> 
    {
        showLoading();
        
        try 
        {
            // Fetch user profile
            const profileResponse = await fetch(getUserApiUrl('/profile'), 
            {
                method: 'GET',
                headers: 
                {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (profileResponse.status === 401) 
            {
                localStorage.removeItem('accessToken');
                hideLoading();
                (window as any).navigateTo('/login');
                return;
            }

            if (!profileResponse.ok) 
            {
                throw new Error('Failed to fetch profile');
            }

            this.userProfile = await profileResponse.json();
            this.currentUserId = this.userProfile?.id || '';

            // Fetch match history from game service
            try 
            {
                const matchHistoryResponse = await fetch(getGameApiUrl('/match-history'), 
                {
                    method: 'GET',
                    headers: 
                    {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (matchHistoryResponse.ok) 
                {
                    const matches: Match[] = await matchHistoryResponse.json();
                    this.matchHistory = matches;
                    
                    // Fetch user info for all opponents
                    await this.cacheOpponentData(matches);
                } 
                else 
                {
                    console.warn('Match history endpoint returned error:', matchHistoryResponse.status);
                    this.matchHistory = [];
                }
            }
            catch (matchError)
            {
                console.warn('Match history not available:', matchError);
                this.matchHistory = [];
            }

            this.error = null;
        } 
        catch (err) 
        {
            this.error = (err as Error).message;
        } 
        finally 
        {
            hideLoading();
            this.rerender();
        }
    }

    private async cacheOpponentData(matches: Match[]): Promise<void> 
    {
        // Get unique opponent user IDs
        const opponentIds = new Set<string>();
        
        matches.forEach(match => 
        {
            match.results.forEach(result => 
            {
                if (result.userId !== this.currentUserId) 
                {
                    opponentIds.add(result.userId);
                }
            });
        });

        // Fetch user data for each opponent
        const fetchPromises = Array.from(opponentIds).map(async (userId) => 
        {
            try 
            {
                const response = await fetch(getUserApiUrl(`/profile/${userId}`), 
                {
                    method: 'GET',
                    headers: 
                    {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) 
                {
                    const userData = await response.json();
                    this.userCache[userId] = 
                    {
                        username: userData.username || 'Unknown Player',
                        avatarUrl: userData.avatarUrl
                    };
                }
            }
            catch (error) 
            {
                console.warn(`Failed to fetch user data for ${userId}:`, error);
                this.userCache[userId] = { username: 'Unknown Player' };
            }
        });

        await Promise.all(fetchPromises);
    }

    private rerender(): void 
    {
        const container = this.container || document.querySelector('#content-mount .page-content');
        if (container) 
        {
            container.innerHTML = this.render();
            this.setupEventListeners();
        }
    }

    private setupEventListeners(): void 
    {
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
    }

    private calculateWinRate(): number 
    {
        if (!this.userProfile) 
        {
            return 0;
        }

        const totalGames = this.userProfile.gameStatus?.totalGames || 0;
        const totalWins = this.userProfile.gameStatus?.totalWins || 0;

        if (totalGames === 0) 
        {
            return 0;
        }

        return (totalWins / totalGames) * 100;
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}