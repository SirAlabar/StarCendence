import { BaseComponent } from '../components/BaseComponent';
import { getUserApiUrl, getBaseUrl } from '../types/api.types';
import { showLoading, hideLoading } from '../router/LayoutManager';

// Leaderboard entry (flat structure from backend)
export interface LeaderboardEntry 
{
    id: string;
    username: string;
    avatarUrl: string | null;
    status: string;
    wins: number;      // FLAT from backend transformation
    losses: number;    // FLAT from backend transformation
    points: number;    // FLAT from backend transformation
    rank: number;      // FLAT from backend transformation
}

// User rank response (nested structure from backend)
export interface UserRankResponse 
{
    id: string;
    username: string;
    avatarUrl: string | null;
    status: string;
    gameStatus: 
    {
        totalGames: number;
        totalWins: number;
        totalLosses: number;
        points: number;
        rank: number;
    };
}

export default class LeaderboardPage extends BaseComponent 
{
    private leaderboard: LeaderboardEntry[] = [];
    private userRank: UserRankResponse | null = null;
    private error: string | null = null;

    async mount(selector: string): Promise<void> 
    {
        super.mount(selector);
        await this.loadData();
    }

    private async loadData(): Promise<void> 
    {
        showLoading();
        
        try 
        {
            await Promise.all([
                this.loadLeaderboard(),
                this.loadUserRank()
            ]);
        }
        finally 
        {
            hideLoading();
        }
    }

    private getPlaceholderLeaderboard(): LeaderboardEntry[] 
    {
        const placeholderData = [
            { username: 'Player1', wins: 145, losses: 32, points: 2450 },
            { username: 'Player2', wins: 132, losses: 45, points: 2180 },
            { username: 'Player3', wins: 118, losses: 51, points: 1920 },
            { username: 'Player4', wins: 105, losses: 60, points: 1800 },
            { username: 'Player5', wins: 98, losses: 65, points: 1700 },
            { username: 'Player6', wins: 92, losses: 68, points: 1600 },
            { username: 'Player7', wins: 87, losses: 73, points: 1500 },
            { username: 'Player8', wins: 81, losses: 78, points: 1400 },
            { username: 'Player9', wins: 76, losses: 82, points: 1300 },
            { username: 'Player10', wins: 72, losses: 87, points: 1200 }
        ];

        return placeholderData.map((player, index) => ({
            id: `placeholder-${index}`,
            username: player.username,
            avatarUrl: '/assets/images/default-avatar.jpeg',
            status: 'OFFLINE',
            wins: player.wins,
            losses: player.losses,
            points: player.points,
            rank: index + 1
        }));
    }

    private async loadLeaderboard(): Promise<void> 
    {
        try 
        {
            const response = await fetch(getUserApiUrl('/leaderboard'), 
            {
                method: 'GET',
                headers: 
                {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) 
            {
                throw new Error('Failed to load leaderboard');
            }

            this.leaderboard = await response.json();
            this.error = null;
            this.update();
        } 
        catch (error) 
        {
            console.error('Failed to load leaderboard:', error);
            this.error = 'Unable to load live data';
            this.leaderboard = this.getPlaceholderLeaderboard();
            this.update();
        }
    }

    private async loadUserRank(): Promise<void> 
    {
        try 
        {
            const token = localStorage.getItem('access_token');
            if (!token) 
            {
                return;
            }

            const response = await fetch(getUserApiUrl('/rank'), 
            {
                method: 'GET',
                headers: 
                {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                return;
            }

            if (response.ok) 
            {
                this.userRank = await response.json();
                this.update();
            }
        } 
        catch (error) 
        {
            console.error('Failed to load user rank:', error);
        }
    }

    private update(): void 
    {
        if (this.container) 
        {
            this.container.innerHTML = this.render();
        }
    }

    private getRankIcon(rank: number): string 
    {
        if (rank === 1) 
        {
            return '🥇';
        }
        if (rank === 2) 
        {
            return '🥈';
        }
        if (rank === 3) 
        {
            return '🥉';
        }
        return '🏅';
    }

    private getRankClass(rank: number): string 
    {
        if (rank === 1) 
        {
            return 'bg-gradient-to-br from-yellow-300/30 via-yellow-500/20 to-amber-600/30 border-yellow-400/60 shadow-[0_0_15px_rgba(255,215,0,0.2)]';
        }
        if (rank === 2) 
        {
            return 'bg-gradient-to-br from-gray-200/20 via-gray-400/30 to-gray-600/30 border-gray-300/60 shadow-[0_0_15px_rgba(200,200,200,0.2)]';
        }
        if (rank === 3) 
        {
            return 'bg-gradient-to-br from-orange-400/20 via-amber-600/20 to-amber-800/30 border-orange-400/60 shadow-[0_0_15px_rgba(255,140,0,0.2)]';
        }

        return 'bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 border-gray-700/50';
    }

    private getStatusColor(status: string): string 
    {
        if (status === 'ONLINE') 
        {
            return 'bg-green-500';
        }
        if (status === 'IN_GAME') 
        {
            return 'bg-blue-500';
        }
        if (status === 'AWAY') 
        {
            return 'bg-yellow-500';
        }
        return 'bg-gray-500';
    }

    private getAvatarUrl(avatarUrl: string | null): string 
    {
        if (!avatarUrl) 
        {
            return '/avatars/default.jpeg';
        }
        
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) 
        {
            return avatarUrl;
        }
        
        return `${getBaseUrl()}${avatarUrl}`;
    }

    render(): string 
    {
        const topThree = this.leaderboard.slice(0, 3);
        const restOfLeaderboard = this.leaderboard.slice(3);

        return `
            <div class="container mx-auto px-4 py-8 max-w-7xl">
                ${this.error ? `
                <div class="mb-6 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm">
                    <p class="text-yellow-400 text-center font-bold">
                        ⚠️ ${this.escapeHtml(this.error)} - Showing placeholder data
                    </p>
                </div>
                ` : ''}

                <!-- Header -->
                <div class="text-center mb-12">
                    <h1 class="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 mb-4">
                        🏆 LEADERBOARD
                    </h1>
                    <p class="text-gray-400 text-lg">Top Players of the Galaxy</p>
                </div>

                <!-- User Rank Card -->
                ${this.renderUserRank()}

                <!-- Top 3 Podium -->
                ${topThree.length >= 3 ? `
                <div class="grid grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
                    ${this.renderTopPlayer(topThree[1])}
                    ${this.renderTopPlayer(topThree[0])}
                    ${this.renderTopPlayer(topThree[2])}
                </div>
                ` : ''}

                <!-- Rest of Leaderboard -->
                ${this.renderRestOfLeaderboard(restOfLeaderboard)}

                <!-- Action Buttons -->
                <div class="flex justify-center gap-4 mt-12">
                    <button 
                        onclick="navigateTo('/games')" 
                        class="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:from-yellow-700 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                        🎮 Play to Climb
                    </button>
                    <button 
                        onclick="navigateTo('/')" 
                        class="bg-gray-700 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-600 transition-all transform hover:scale-105"
                    >
                        🏠 Home
                    </button>
                </div>
            </div>
        `;
    }

    private renderUserRank(): string 
    {
        const token = localStorage.getItem('access_token');
        
        if (!token) 
        {
            return `
                <div class="mb-8 bg-gradient-to-r from-purple-900/40 to-blue-900/40 rounded-xl border-2 border-purple-500/50 p-6 backdrop-blur-sm">
                    <div class="flex items-center justify-between flex-wrap gap-4">
                        <div class="flex items-center gap-4">
                            <div class="text-4xl">🏆</div>
                            <div>
                                <p class="text-purple-300 font-bold text-lg">Want to see your rank?</p>
                                <p class="text-gray-400 text-sm">Login to track your progress and compete!</p>
                            </div>
                        </div>
                        <button 
                            onclick="navigateTo('/login')" 
                            class="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                        >
                            🔐 Login Now
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (!this.userRank) 
        {
            return '';
        }

        return `
            <div class="mb-8 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-xl border-2 border-cyan-500/50 p-6 backdrop-blur-sm">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-4">
                        <div class="text-4xl">${this.getRankIcon(this.userRank.gameStatus.rank || 0)}</div>
                        <div>
                            <p class="text-gray-400 text-sm">Your Rank</p>
                            <p class="text-3xl font-bold text-cyan-400">#${this.userRank.gameStatus.rank}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Wins</p>
                            <p class="text-2xl font-bold text-green-400">${this.userRank.gameStatus.totalWins}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Losses</p>
                            <p class="text-2xl font-bold text-red-400">${this.userRank.gameStatus.totalLosses}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Points</p>
                            <p class="text-2xl font-bold text-yellow-400">${this.userRank.gameStatus.points}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderTopPlayer(player: LeaderboardEntry): string 
    {
        const avatarUrl = this.getAvatarUrl(player.avatarUrl);

        let avatarSizeClass = 'w-24 h-24';
        if (player.rank === 1) 
        {
            avatarSizeClass = 'w-36 h-36';
        } 
        else if (player.rank === 2) 
        {
            avatarSizeClass = 'w-28 h-28';
        }

        let podiumOffset = 'translate-y-0';
        if (player.rank === 1) 
        {
            podiumOffset = '-translate-y-12';
        } 
        else if (player.rank === 2) 
        {
            podiumOffset = '-translate-y-6';
        }
        
        return `
            <div class="flex flex-col justify-end transform transition-all duration-300 hover:scale-105 ${podiumOffset}">
                <div class="relative ${this.getRankClass(player.rank)} rounded-xl border-2 p-6 backdrop-blur-sm min-h-[360px] flex flex-col justify-between">
                    <div class="absolute -top-4 -right-4 text-5xl drop-shadow-lg">
                        ${this.getRankIcon(player.rank)}
                    </div>
                    <div class="text-center flex flex-col items-center justify-center flex-1">
                        <div class="relative inline-block mb-4">
                            <img 
                                src="${avatarUrl}" 
                                alt="${this.escapeHtml(player.username)}"
                                class="${avatarSizeClass} rounded-full border-4 ${
                                    player.rank === 1
                                        ? 'border-yellow-500'
                                        : player.rank === 2
                                            ? 'border-gray-400'
                                            : 'border-orange-500'
                                } object-cover"
                                onerror="this.src='/avatars/default.jpeg'"
                            />
                            <div class="absolute bottom-0 right-0 w-4 h-4 ${this.getStatusColor(player.status)} rounded-full border-2 border-gray-900"></div>
                        </div>
                        <h3 class="font-bold text-xl mb-2 ${
                            player.rank === 1
                                ? 'text-yellow-400'
                                : player.rank === 2
                                    ? 'text-gray-300'
                                    : 'text-orange-400'
                        }">
                            ${this.escapeHtml(player.username)}
                        </h3>
                        <div class="flex justify-center gap-4 text-sm mb-3">
                            <span class="text-green-400">${player.wins}W</span>
                            <span class="text-gray-500">|</span>
                            <span class="text-red-400">${player.losses}L</span>
                        </div>
                        <div class="text-2xl font-bold ${
                            player.rank === 1
                                ? 'text-yellow-400'
                                : player.rank === 2
                                    ? 'text-gray-300'
                                    : 'text-orange-400'
                        }">
                            ${player.points.toLocaleString()} pts
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderRestOfLeaderboard(players: LeaderboardEntry[]): string 
    {
        if (players.length === 0) 
        {
            return '';
        }

        return `
            <div class="bg-gray-900/60 rounded-xl border border-gray-700 overflow-hidden backdrop-blur-sm">
                <div class="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700">
                    <h2 class="text-xl font-bold text-center text-gray-200">TOP PLAYERS</h2>
                </div>
                <div class="divide-y divide-gray-800">
                    ${players.map(player => this.renderPlayerRow(player)).join('')}
                </div>
            </div>
        `;
    }

    private renderPlayerRow(player: LeaderboardEntry): string 
    {
        const avatarUrl = this.getAvatarUrl(player.avatarUrl);

        return `
            <div class="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="text-2xl font-bold text-gray-500 w-12 text-center flex-shrink-0">
                        #${player.rank}
                    </div>
                    <div class="relative flex-shrink-0">
                        <img 
                            src="${avatarUrl}" 
                            alt="${this.escapeHtml(player.username)}"
                            class="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
                            onerror="this.src='/avatars/default.jpeg'"
                        />
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${this.getStatusColor(player.status)} rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate">${this.escapeHtml(player.username)}</p>
                        <div class="flex gap-3 text-xs">
                            <span class="text-green-400">${player.wins}W</span>
                            <span class="text-red-400">${player.losses}L</span>
                        </div>
                    </div>
                </div>
                <div class="text-right flex-shrink-0 ml-4">
                    <p class="text-xl font-bold text-cyan-400">${player.points.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">points</p>
                </div>
            </div>
        `;
    }

    private escapeHtml(text: string): string 
    {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}