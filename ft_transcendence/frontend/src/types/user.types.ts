export enum UserStatus 
{
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    IN_GAME = 'IN_GAME',
    AWAY = 'AWAY'
}

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

  tournamentWins: number;
  tournamentParticipations: number;

  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;

  totalPongWins?: number;
  totalPongLoss?: number;
  totalRacerWins?: number;
  totalRacerLoss?: number;
  totalWinPercent?: number;

  points?: number;
  rank?: number;

  twoFactorEnabled?: boolean;
  hasPassword?: boolean;
  
  // Privacy Settings
  showOnlineStatus?: boolean;
  allowFriendRequests?: boolean;
  showGameActivity?: boolean;
  
  // Notification Settings
  notifyFriendRequests?: boolean;
  notifyGameInvites?: boolean;
  notifyMessages?: boolean;
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
