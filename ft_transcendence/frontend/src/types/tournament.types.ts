export interface TournamentPlayer 
{
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    isAI: boolean;
    aiDifficulty?: 'easy' | 'hard';
    seed: number; // 1-4 for bracket position
}

export interface TournamentMatch 
{
    id: string;
    tournamentId: string;
    round: 'semi-final' | 'final';
    matchNumber: number; // 1 or 2 for semi-finals, 1 for final
    player1: TournamentPlayer | null;
    player2: TournamentPlayer | null;
    winner: TournamentPlayer | null;
    score: {
        player1: number;
        player2: number;
    };
    status: 'waiting' | 'in-progress' | 'completed';
    startedAt?: Date;
    completedAt?: Date;
}

export interface Tournament 
{
    id: string;
    lobbyId: string;
    name: string;
    hostId: string;
    hostUsername: string;
    players: TournamentPlayer[];
    matches: TournamentMatch[];
    status: 'waiting' | 'in-progress' | 'completed';
    prizePool: number;
    currentRound: 'semi-final' | 'final' | null;
    winner: TournamentPlayer | null;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export interface CreateTournamentData 
{
    name: string;
}

export interface TournamentBracketData 
{
    semiFinal1: TournamentMatch;
    semiFinal2: TournamentMatch;
    final: TournamentMatch;
}