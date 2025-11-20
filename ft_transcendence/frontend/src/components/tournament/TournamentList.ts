import { BaseComponent } from '../BaseComponent';
import { Modal } from '../common/Modal';

export interface Tournament 
{
    id: string;
    name: string;
    gameType: 'pong' | 'podracer';
    status: 'live' | 'soon' | 'completed';
    currentPlayers: number;
    maxPlayers: number;
    prizePool: number;
    timeInfo: string; // "2h 15m" or "1 day" or "Ended"
    description: string;
}

export interface TournamentListConfig 
{
    tournaments: Tournament[];
    onJoinTournament?: (tournamentId: string) => void;
    onViewBracket?: (tournamentId: string) => void;
}

export class TournamentList extends BaseComponent 
{
    private config: TournamentListConfig;

    constructor(config: TournamentListConfig) 
    {
        super();
        this.config = config;
    }

    render(): string 
    {
        if (!this.config.tournaments || this.config.tournaments.length === 0) 
        {
            return this.renderEmptyState();
        }

        return `
            <div class="space-y-4">
                ${this.config.tournaments.map(tournament => this.renderTournament(tournament)).join('')}
            </div>
        `;
    }

    private renderTournament(tournament: Tournament): string 
    {
        const statusBadge = this.getStatusBadge(tournament.status);
        const borderColor = this.getBorderColor(tournament.status);
        const actionButton = this.getActionButton(tournament);

        return `
            <div class="bg-gray-800/80 rounded-lg p-6 border-2 ${borderColor} hover:shadow-lg hover:shadow-${borderColor.split('-')[1]}/30 transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1">${tournament.name}</h3>
                        <p class="text-gray-300">${tournament.description}</p>
                    </div>
                    ${statusBadge}
                </div>
                
                <div class="grid md:grid-cols-3 gap-4 mb-4">
                    <div class="text-center bg-gray-900/50 rounded-lg p-3">
                        <p class="text-gray-400 text-sm mb-1">Players</p>
                        <p class="text-white font-bold text-lg">${tournament.currentPlayers}/${tournament.maxPlayers}</p>
                    </div>
                    <div class="text-center bg-gray-900/50 rounded-lg p-3">
                        <p class="text-gray-400 text-sm mb-1">Prize Pool</p>
                        <p class="text-yellow-400 font-bold text-lg">${tournament.prizePool} pts</p>
                    </div>
                    <div class="text-center bg-gray-900/50 rounded-lg p-3">
                        <p class="text-gray-400 text-sm mb-1">${this.getTimeLabel(tournament.status)}</p>
                        <p class="${this.getTimeColor(tournament.status)} font-bold text-lg">${tournament.timeInfo}</p>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    ${actionButton}
                    <button 
                        onclick="handleViewBracket('${tournament.id}')"
                        class="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-bold transition-all"
                    >
                        View Bracket
                    </button>
                </div>
            </div>
        `;
    }

    private getStatusBadge(status: Tournament['status']): string 
    {
        const badges = {
            live: '<span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">LIVE</span>',
            soon: '<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">SOON</span>',
            completed: '<span class="bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-bold">ENDED</span>'
        };
        return badges[status];
    }

    private getBorderColor(status: Tournament['status']): string 
    {
        const colors = {
            live: 'border-yellow-500',
            soon: 'border-purple-500',
            completed: 'border-gray-500'
        };
        return colors[status];
    }

    private getActionButton(tournament: Tournament): string 
    {
        if (tournament.status === 'completed') 
        {
            return `
                <button 
                    disabled
                    class="flex-1 bg-gray-700 text-gray-400 py-3 rounded-lg font-bold cursor-not-allowed"
                >
                    Tournament Ended
                </button>
            `;
        }

        if (tournament.currentPlayers >= tournament.maxPlayers) 
        {
            return `
                <button 
                    disabled
                    class="flex-1 bg-gray-700 text-gray-400 py-3 rounded-lg font-bold cursor-not-allowed"
                >
                    Full
                </button>
            `;
        }

        const buttonColor = tournament.status === 'live' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-purple-600 hover:bg-purple-700';
        const buttonText = tournament.status === 'live' ? 'Join Tournament' : 'Register';

        return `
            <button 
                onclick="handleJoinTournament('${tournament.id}')"
                class="flex-1 ${buttonColor} text-white py-3 rounded-lg font-bold transition-all"
            >
                ${buttonText}
            </button>
        `;
    }

    private getTimeLabel(status: Tournament['status']): string 
    {
        if (status === 'live') 
        {
            return 'Time Left';
        }
        if (status === 'soon') 
        {
            return 'Starts In';
        }
        return 'Ended';
    }

    private getTimeColor(status: Tournament['status']): string 
    {
        if (status === 'live') 
        {
            return 'text-red-400';
        }
        if (status === 'soon') 
        {
            return 'text-blue-400';
        }
        return 'text-gray-400';
    }

    private renderEmptyState(): string 
    {
        return `
            <div class="bg-gray-800/80 border border-gray-600 rounded-lg p-12 text-center">
                <div class="text-6xl mb-4">🏆</div>
                <h3 class="text-2xl font-bold text-gray-400 mb-2">No Tournaments Available</h3>
                <p class="text-gray-500 mb-6">Check back soon for upcoming tournaments!</p>
                <button 
                    onclick="navigateTo('/games')"
                    class="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 font-bold"
                >
                    Practice Games
                </button>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        // Setup global handlers
        (window as any).handleJoinTournament = async (tournamentId: string) => 
        {
            if (this.config.onJoinTournament) 
            {
                this.config.onJoinTournament(tournamentId);
            }
            else 
            {
                await Modal.alert('Coming Soon', 'Tournament registration will be available soon!');
            }
        };

        (window as any).handleViewBracket = (tournamentId: string) => 
        {
            if (this.config.onViewBracket) 
            {
                this.config.onViewBracket(tournamentId);
            }
        };
    }

    public updateTournaments(tournaments: Tournament[]): void 
    {
        this.config.tournaments = tournaments;
        
        if (this.container) 
        {
            this.container.innerHTML = this.render();
            this.afterMount();
        }
    }

    public dispose(): void 
    {
        delete (window as any).handleJoinTournament;
        delete (window as any).handleViewBracket;
    }
}