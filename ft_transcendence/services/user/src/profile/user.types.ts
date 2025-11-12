//  Core user types

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  IN_GAME = 'IN_GAME',
  AWAY = 'AWAY'
}

export interface CreateUserBody {
  authId: string
  email: string
  username: string,
  oauthEnabled?: boolean
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  totalWins?: number;
  totalLosses?: number;
  points?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserBody {
  bio?: string | null;
}

