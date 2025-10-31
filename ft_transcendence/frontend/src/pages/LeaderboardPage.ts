import { BaseComponent } from '../components/BaseComponent';

interface UserStats 
{
    id: string;
    username: string;
    avatarUrl: string | null;
    status: string;
    wins: number;
    losses: number;
    points: number;
    rank: number;
}

export default class LeaderboardPage extends BaseComponent 
{
    private leaderboard: UserStats[] = [];
    private userRank: UserStats | null = null;
    private loading: boolean = true;
    private error: string | null = null;

    async mount(selector: string): Promise<void> 
    {
        super.mount(selector);
        await this.loadData();
    }

    private async loadData(): Promise<void> 
    {
        await Promise.all([
            this.loadLeaderboard(),
            this.loadUserRank()
        ]);
    }

    private getPlaceholderLeaderboard(): UserStats[] 
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

        return placeholderData.map((player, index) => (
        {
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
            this.loading = true;
            const response = await fetch('/api/leaderboard?limit=20');
            
            if (!response.ok) 
            {
                throw new Error('Failed to load leaderboard');
            }

            this.leaderboard = await response.json();
            this.error = null;
            this.loading = false;
            this.update();
        } 
        catch (error) 
        {
            console.error('Failed to load leaderboard:', error);
            this.error = 'Unable to load live data';
            this.leaderboard = this.getPlaceholderLeaderboard();
            this.loading = false;
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

            const response = await fetch('/api/rank', 
            {
                headers: 
                {
                    'Authorization': `Bearer ${token}`
                }
            });

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
            return 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 border-yellow-500/50';
        }
        if (rank === 2) 
        {
            return 'bg-gradient-to-br from-gray-400/20 to-gray-500/30 border-gray-400/50';
        }
        if (rank === 3) 
        {
            return 'bg-gradient-to-br from-orange-500/20 to-orange-600/30 border-orange-500/50';
        }
        return 'bg-gray-800/40 border-gray-700/50';
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

    render(): string 
    {
        if (this.loading) 
        {
            return `
                <div class="min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500 mx-auto mb-4"></div>
                        <p class="text-gray-400 text-lg">Loading leaderboard...</p>
                    </div>
                </div>
            `;
        }

        const top3 = this.leaderboard.slice(0, 3);
        const rest = this.leaderboard.slice(3);

        return `
            <div class="container mx-auto px-4 py-8 max-w-6xl">
                <!-- Header -->
                <div class="text-center mb-12">
                    <h1 class="text-5xl font-bold font-game text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-4 drop-shadow-lg">
                        🏆 LEADERBOARD
                    </h1>
                    <p class="text-gray-400 text-lg">Compete with the best players worldwide</p>
                </div>

                ${this.error ? `
                    <div class="mb-6 bg-yellow-900/40 border border-yellow-500/50 rounded-lg p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">⚠️</span>
                            <div>
                                <p class="text-yellow-400 font-semibold">${this.error}</p>
                                <p class="text-gray-400 text-sm">Showing placeholder data. Please refresh to try again.</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${this.renderUserRank()}

                <!-- Top 3 Podium -->
                <div class="mb-12">
                    <h2 class="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                        TOP CHAMPIONS
                    </h2>
                    <div class="grid md:grid-cols-3 gap-6">
                        ${top3.map((player, index) => this.renderTopPlayer(player, index)).join('')}
                    </div>
                </div>

                ${this.renderRestOfLeaderboard(rest)}

                <!-- Action Buttons -->
                <div class="text-center mt-8 space-x-4">
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
        if (!this.userRank) 
        {
            return '';
        }

        return `
            <div class="mb-8 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-xl border-2 border-cyan-500/50 p-6 backdrop-blur-sm">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div class="flex items-center gap-4">
                        <div class="text-4xl">${this.getRankIcon(this.userRank.rank || 0)}</div>
                        <div>
                            <p class="text-gray-400 text-sm">Your Rank</p>
                            <p class="text-3xl font-bold text-cyan-400">#${this.userRank.rank}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-6">
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Wins</p>
                            <p class="text-2xl font-bold text-green-400">${this.userRank.wins}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Losses</p>
                            <p class="text-2xl font-bold text-red-400">${this.userRank.losses}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-gray-400 text-sm">Points</p>
                            <p class="text-2xl font-bold text-yellow-400">${this.userRank.points}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderTopPlayer(player: UserStats, index: number): string 
    {
        return `
            <div class="transform transition-all duration-300 hover:scale-105 ${index === 0 ? 'md:-translate-y-4' : ''}">
                <div class="relative ${this.getRankClass(player.rank)} rounded-xl border-2 p-6 backdrop-blur-sm">
                    <div class="absolute -top-4 -right-4 text-5xl drop-shadow-lg">
                        ${this.getRankIcon(player.rank)}
                    </div>
                    <div class="text-center">
                        <div class="relative inline-block mb-4">
                            <img 
                                src="${player.avatarUrl || '/avatars/default.jpeg'}" 
                                alt="${player.username}"
                                class="w-24 h-24 rounded-full border-4 ${player.rank === 1 ? 'border-yellow-500' : player.rank === 2 ? 'border-gray-400' : 'border-orange-500'} object-cover"
                            />
                            <div class="absolute bottom-0 right-0 w-4 h-4 ${this.getStatusColor(player.status)} rounded-full border-2 border-gray-900"></div>
                        </div>
                        <h3 class="font-bold text-xl mb-2 ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : 'text-orange-400'}">
                            ${player.username}
                        </h3>
                        <div class="flex justify-center gap-4 text-sm mb-3">
                            <span class="text-green-400">${player.wins}W</span>
                            <span class="text-gray-500">|</span>
                            <span class="text-red-400">${player.losses}L</span>
                        </div>
                        <div class="text-2xl font-bold ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-gray-300' : 'text-orange-400'}">
                            ${player.points.toLocaleString()} pts
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private renderRestOfLeaderboard(players: UserStats[]): string 
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

    private renderPlayerRow(player: UserStats): string 
    {
        return `
            <div class="flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="text-2xl font-bold text-gray-500 w-12 text-center flex-shrink-0">
                        #${player.rank}
                    </div>
                    <div class="relative flex-shrink-0">
                        <img 
                            src="${player.avatarUrl || '/avatars/default.jpeg'}" 
                            alt="${player.username}"
                            class="w-12 h-12 rounded-full border-2 border-gray-600 object-cover"
                        />
                        <div class="absolute bottom-0 right-0 w-3 h-3 ${this.getStatusColor(player.status)} rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-semibold truncate">${player.username}</p>
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
}