export enum UserStatus 
{
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    IN_GAME = 'IN_GAME',
    AWAY = 'AWAY'
}

// GAME STATUS
export interface UserGameStatus 
{
    totalGames: number;
    totalWins: number;
    totalLosses: number;
    totalDraws: number;

    totalPongWins: number;
    totalPongLoss: number;
    totalRacerWins: number;
    totalRacerLoss: number;

    totalWinPercent?: number;

    tournamentWins: number;
    tournamentParticipations: number;

    rank: number;
    points: number;
}

// SETTINGS
export interface UserSettings 
{
    twoFactorEnabled: boolean;
    oauthEnabled: boolean;

    // Privacy
    showOnlineStatus: boolean;
    allowFriendRequests: boolean;
    showGameActivity: boolean;

    // Notifications
    notifyFriendRequests: boolean;
    notifyGameInvites: boolean;
    notifyMessages: boolean;
}

// PROFILE
export interface UserProfile 
{
    id: string;
    email: string;
    username: string;
    bio?: string;
    avatarUrl?: string;
    status: string;

    createdAt: string;
    updatedAt: string;

    gameStatus?: UserGameStatus | null;
    settings?: UserSettings | null;
}

export interface UpdateUserBody 
{
    bio?: string | null;
}

export interface UpdateSettingsBody 
{
    showOnlineStatus?: boolean;
    allowFriendRequests?: boolean;
    showGameActivity?: boolean;
    notifyFriendRequests?: boolean;
    notifyGameInvites?: boolean;
    notifyMessages?: boolean;
}
