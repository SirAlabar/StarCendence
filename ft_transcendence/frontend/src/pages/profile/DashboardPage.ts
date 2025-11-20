import { BaseComponent } from '../../components/BaseComponent';
import { getUserApiUrl} from '../../types/api.types';
import { UserProfile } from '../../types/user.types';
import { showLoading, hideLoading } from '../../router/LayoutManager';

interface MatchHistoryEntry 
{
    id: number;
    player1Id: string;
    player2Id: string;
    result: string;
    player1Score: number;
    player2Score: number;
    playedAt: string;
}

export default class DashboardPage extends BaseComponent 
{
    private userProfile: UserProfile | null = null;
    private matchHistory: MatchHistoryEntry[] = [];
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
                    <text x="80" y="85" text-anchor="middle" class="text-3xl font-bold" fill="#00ffff">
                        ${winRate.toFixed(1)}%
                    </text>
                </svg>
                <div class="text-center text-gray-400 text-sm">
                    <p>${this.userProfile?.gameStatus?.totalWins || 0} Wins / ${this.userProfile?.gameStatus?.totalGames || 0} Games</p>
                </div>
            </div>
        `;
    }

    private renderGameModesChart(): string 
    {
        if (!this.userProfile) 
        {
            return '';
        }

        const pongWins = this.userProfile.gameStatus?.totalPongWins || 0;
        const pongLosses = this.userProfile.gameStatus?.totalPongLoss || 0;
        const racerWins = this.userProfile.gameStatus?.totalRacerWins || 0;
        const racerLosses = this.userProfile.gameStatus?.totalRacerLoss || 0;

        const pongRate = pongWins + pongLosses > 0 ? (pongWins / (pongWins + pongLosses)) * 100 : 0;
        const racerRate = racerWins + racerLosses > 0 ? (racerWins / (racerWins + racerLosses)) * 100 : 0;

        return `
            <div class="space-y-6">
                <!-- Pong -->
                <div>
                    <div class="flex justify-between mb-2">
                        <span class="text-cyan-300 font-bold text-sm">PONG</span>
                        <span class="text-gray-400 text-sm">${pongWins}W / ${pongLosses}L</span>
                    </div>
                    <div class="h-8 bg-gray-700/50 rounded-lg overflow-hidden">
                        <div class="chart-bar h-full rounded-lg" style="width: ${pongRate.toFixed(1)}%"></div>
                    </div>
                </div>

                <!-- Pod Racer -->
                <div>
                    <div class="flex justify-between mb-2">
                        <span class="text-purple-300 font-bold text-sm">POD RACER</span>
                        <span class="text-gray-400 text-sm">${racerWins}W / ${racerLosses}L</span>
                    </div>
                    <div class="h-8 bg-gray-700/50 rounded-lg overflow-hidden">
                        <div class="chart-bar h-full rounded-lg" style="width: ${racerRate.toFixed(1)}%"></div>
                    </div>
                </div>

                <!-- Tournament Stats -->
                <div class="pt-4 border-t border-gray-700/50">
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-300 font-bold text-sm">TOURNAMENTS</span>
                        <span class="text-gray-400 text-sm">${this.userProfile.gameStatus?.tournamentWins || 0} Wins</span>
                    </div>
                    <p class="text-gray-500 text-xs mt-1">
                        ${this.userProfile.gameStatus?.tournamentParticipations || 0} Total Participations
                    </p>
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

        const totalGames = this.userProfile.gameStatus?.totalGames || 0;
        const totalWins = this.userProfile.gameStatus?.totalWins || 0;
        const totalLosses = this.userProfile.gameStatus?.totalLosses || 0;
        const totalDraws = this.userProfile.gameStatus?.totalDraws || 0;

        const winPercentage = totalGames > 0 ? (totalWins / totalGames * 100) : 0;
        const lossPercentage = totalGames > 0 ? (totalLosses / totalGames * 100) : 0;
        const drawPercentage = totalGames > 0 ? (totalDraws / totalGames * 100) : 0;

        return `
            <div class="space-y-4">
                <!-- Win/Loss/Draw Distribution -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-green-400 text-sm font-bold">WINS</span>
                        <span class="text-gray-300 text-lg font-bold">${totalWins}</span>
                    </div>
                    <div class="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div class="h-full bg-green-500" style="width: ${winPercentage.toFixed(1)}%"></div>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-red-400 text-sm font-bold">LOSSES</span>
                        <span class="text-gray-300 text-lg font-bold">${totalLosses}</span>
                    </div>
                    <div class="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div class="h-full bg-red-500" style="width: ${lossPercentage.toFixed(1)}%"></div>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-yellow-400 text-sm font-bold">DRAWS</span>
                        <span class="text-gray-300 text-lg font-bold">${totalDraws}</span>
                    </div>
                    <div class="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                        <div class="h-full bg-yellow-500" style="width: ${drawPercentage.toFixed(1)}%"></div>
                    </div>
                </div>

                <!-- Additional Stats -->
                <div class="pt-4 border-t border-gray-700/50 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Total Points:</span>
                        <span class="text-cyan-400 font-bold">${this.userProfile.gameStatus?.points || 0}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-400">Win Percentage:</span>
                        <span class="text-cyan-400 font-bold">${this.userProfile.gameStatus?.totalWinPercent?.toFixed(1) || '0.0'}%</span>
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
                    <div class="text-6xl mb-4 opacity-50">🎮</div>
                    <p class="text-gray-400 text-lg">No match history available yet</p>
                    <p class="text-gray-500 text-sm mt-2">Start playing to see your match history here</p>
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

    private renderMatchItem(match: MatchHistoryEntry): string 
    {
        const isPlayer1 = match.player1Id === this.currentUserId;
        const playerScore = isPlayer1 ? match.player1Score : match.player2Score;
        const opponentScore = isPlayer1 ? match.player2Score : match.player1Score;
        
        let resultClass = '';
        let resultText = '';
        let resultColor = '';

        if (match.result === 'DRAW') 
        {
            resultClass = 'draw';
            resultText = 'DRAW';
            resultColor = 'text-yellow-400';
        } 
        else if ((match.result === 'PLAYER1_WIN' && isPlayer1) || (match.result === 'PLAYER2_WIN' && !isPlayer1)) 
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

        return `
            <div class="match-item ${resultClass} rounded-lg p-4">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="${resultColor} font-bold text-lg tracking-wide">${resultText}</span>
                            <span class="text-gray-500 text-sm">•</span>
                            <span class="text-gray-400 text-sm">${dateStr} at ${timeStr}</span>
                        </div>
                        <div class="flex items-center gap-2 text-cyan-300">
                            <span class="font-mono text-2xl font-bold">${playerScore}</span>
                            <span class="text-gray-500">-</span>
                            <span class="font-mono text-2xl font-bold text-gray-400">${opponentScore}</span>
                        </div>
                    </div>
                </div>
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
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (profileResponse.status === 401) 
            {
                localStorage.removeItem('access_token');
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

            // Fetch match history
            try 
            {
                const matchHistoryResponse = await fetch(getUserApiUrl('/match-history'), 
                {
                    method: 'GET',
                    headers: 
                    {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (matchHistoryResponse.ok) 
                {
                    this.matchHistory = await matchHistoryResponse.json();
                } 
                else 
                {
                    console.warn('Match history endpoint not available yet');
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
            console.error('Failed to load dashboard data:', err);
        } 
        finally 
        {
            hideLoading();
            this.rerender();
        }
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