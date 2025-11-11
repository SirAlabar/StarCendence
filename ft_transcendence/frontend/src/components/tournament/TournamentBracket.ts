import { BaseComponent } from '../BaseComponent';
import { TournamentBracketData, TournamentMatch, TournamentPlayer } from '../../types/tournament.types';

export class TournamentBracket extends BaseComponent 
{
    private bracketData: TournamentBracketData | null = null;

    constructor(bracketData: TournamentBracketData | null = null) 
    {
        super();
        this.bracketData = bracketData;
    }

    updateBracket(bracketData: TournamentBracketData): void 
    {
        this.bracketData = bracketData;
        if (this.container) 
        {
            this.container.innerHTML = this.render();
        }
    }

    render(): string 
    {
        if (!this.bracketData) 
        {
            return this.renderEmptyBracket();
        }

        return `
            <div class="tournament-bracket">
                <!-- Semi-Finals -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    ${this.renderMatch(this.bracketData.semiFinal1, 'Semi-Final 1')}
                    ${this.renderMatch(this.bracketData.semiFinal2, 'Semi-Final 2')}
                </div>

                <!-- Connector Lines -->
                <div class="flex justify-center mb-8">
                    <div class="w-full max-w-2xl">
                        <svg class="w-full h-24" viewBox="0 0 400 100" preserveAspectRatio="xMidYMid meet">
                            <path d="M 50 20 L 50 50 L 200 50" 
                                  stroke="rgba(99, 234, 254, 0.5)" 
                                  stroke-width="2" 
                                  fill="none"/>
                            
                            <path d="M 350 20 L 350 50 L 200 50" 
                                  stroke="rgba(168, 85, 247, 0.5)" 
                                  stroke-width="2" 
                                  fill="none"/>
                            
                            <circle cx="200" cy="50" r="6" 
                                    fill="rgba(251, 191, 36, 0.8)"
                                    stroke="rgba(251, 191, 36, 1)"
                                    stroke-width="2"/>
                        </svg>
                    </div>
                </div>

                <!-- Final -->
                <div class="max-w-xl mx-auto">
                    ${this.renderMatch(this.bracketData.final, 'Final', true)}
                </div>
            </div>
        `;
    }

    private renderEmptyBracket(): string 
    {
        return `
            <div class="text-center py-16">
                <div class="text-6xl mb-4">🏆</div>
                <h3 class="text-2xl font-bold text-cyan-400 mb-2">Bracket Not Generated</h3>
                <p class="text-gray-400">Waiting for 4 players to start the tournament</p>
            </div>
        `;
    }

    private renderMatch(match: TournamentMatch, title: string, isFinal: boolean = false): string 
    {
        const borderColor = isFinal ? 'border-yellow-500/50' : 
                           match.matchNumber === 1 ? 'border-cyan-500/50' : 'border-purple-500/50';

        return `
            <div class="bg-gray-800/80 rounded-lg border-2 ${borderColor} p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold ${isFinal ? 'text-yellow-400' : 'text-cyan-400'}">
                        ${title}
                    </h3>
                    ${this.renderMatchStatus(match)}
                </div>

                <div class="space-y-3">
                    ${this.renderPlayer(match.player1, match.winner, match.score.player1)}
                    
                    <div class="flex justify-center">
                        <span class="text-gray-500 font-bold text-xl">VS</span>
                    </div>
                    
                    ${this.renderPlayer(match.player2, match.winner, match.score.player2)}
                </div>

                ${match.winner ? `
                    <div class="mt-4 pt-4 border-t border-gray-700 text-center">
                        <span class="text-green-400 font-bold">🏆 Winner: ${match.winner.username}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private renderPlayer(player: TournamentPlayer | null, winner: TournamentPlayer | null, score: number): string 
    {
        if (!player) 
        {
            return `
                <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                                <span class="text-gray-600">?</span>
                            </div>
                            <div>
                                <p class="text-gray-500 font-semibold">Waiting...</p>
                                <p class="text-xs text-gray-600">TBD</p>
                            </div>
                        </div>
                        <div class="text-2xl font-bold text-gray-700">-</div>
                    </div>
                </div>
            `;
        }

        const isWinner = winner && winner.userId === player.userId;
        const bgColor = isWinner ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-900/50 border-gray-700';
        const textColor = isWinner ? 'text-green-400' : 'text-white';

        return `
            <div class="rounded-lg p-4 border-2 ${bgColor} transition-all duration-300">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <img src="${player.avatarUrl}" 
                                 alt="${player.username}" 
                                 class="w-12 h-12 rounded-full border-2 ${isWinner ? 'border-green-500' : 'border-gray-600'}"
                                 onerror="this.src='/assets/images/default-avatar.jpeg'">
                            ${player.isAI ? `
                                <div class="absolute -bottom-1 -right-1 bg-purple-600 rounded-full p-1">
                                    <span class="text-xs">🤖</span>
                                </div>
                            ` : ''}
                            ${isWinner ? `
                                <div class="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                                    <span class="text-xs">👑</span>
                                </div>
                            ` : ''}
                        </div>
                        <div>
                            <p class="${textColor} font-semibold">${player.username}</p>
                            <p class="text-xs text-gray-500">Seed ${player.seed}</p>
                        </div>
                    </div>
                    <div class="text-3xl font-bold ${textColor}">${score}</div>
                </div>
            </div>
        `;
    }

    private renderMatchStatus(match: TournamentMatch): string 
    {
        switch (match.status) 
        {
            case 'waiting':
                return '<span class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">WAITING</span>';
            case 'in-progress':
                return '<span class="bg-green-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">LIVE</span>';
            case 'completed':
                return '<span class="bg-gray-600 text-white px-3 py-1 rounded-full text-sm">COMPLETED</span>';
            default:
                return '';
        }
    }
}