// entities/Player.ts
import UserService from "@/services/user/UserService";


export interface UserProfile 
{
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    displayName?: string;
    level?: number;
    wins?: number;
    losses?: number;
   
}

export class player 
{
    score: number;
    
    // User profile data
    userId?: string;
    username?: string;
    avatarUrl?: string;
   
    isAuthenticated: boolean;
    
    // Game stats (if available from profile)
    totalWins?: number;
    totalLosses?: number;
    level?: number;
    
    constructor() 
    {
        this.score = 0;
        this.isAuthenticated = false;
    }
    
    async loadProfile(): Promise<boolean> 
    {
        try 
        {
            console.log('[Player] 🔄 Loading user profile...');
            
            
            const profile = await UserService.getProfile();
            
            // Store profile data
            this.userId = profile.id;
            this.username = profile.username;
            this.avatarUrl = profile.avatarUrl || '/assets/images/default-avatar.jpeg';
            
            this.isAuthenticated = true;
            
           
            
            console.log('[Player] ✅ Profile loaded:', 
            {
                userId: this.userId,
                username: this.username,
                wins: this.totalWins,
                losses: this.totalLosses
            });
            
            return true;
            
        } catch (error) 
        {
            console.warn('[Player] ⚠️ Failed to load profile (user might not be logged in):', error);
            this.isAuthenticated = false;
            return false;
        }
    }
    
    
    hasProfile(): boolean 
    {
        return this.isAuthenticated && !!this.userId;
    }
    

    getAvatarUrl(): string 
    {
        return this.avatarUrl || '/assets/images/default-avatar.jpeg';
    }
    

    getPlayerInfo() 
    {
        return {
            userId: this.userId,
            username: this.username,
            avatarUrl: this.getAvatarUrl(),
            score: this.score,
            isAuthenticated: this.isAuthenticated
        };
    }
    
    
    resetScore(): void 
    {
        this.score = 0;
    }
    
    
    clearProfile(): void 
    {
        this.userId = undefined;
        this.username = undefined;
        this.avatarUrl = undefined;
        this.isAuthenticated = false;
        this.totalWins = undefined;
        this.totalLosses = undefined;
        this.level = undefined;
        this.score = 0;
    }
}