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
    bio?: string | null;
    avatarUrl?: string | null;
    status?: UserStatus;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserBody 
{
    bio?: string | null;
}