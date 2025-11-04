// Player entity implementation
//pong2d

export class player
{
    score : number;
    

    constructor()
    {
        this.score = 0;
    }
}


/*

export interface UserProfile 
{
    id: number;
    username: string;
    avatarUrl?: string;
    wins?: number;
}

export class Player 
{
    private score: number;
    private userId?: string;
    private username?: string;
    private avatarUrl?: string;
    private totalWins?: number;

    
    constructor() 
    {
        this.score = 0;
        this.loadProfile();
    }
    
    
    async loadProfile(): Promise<boolean> 
    {
        const currentUser = await UserService.getProfile();
        if(!currentUser)
        {
            console.log("failed to load profile");
            return false;
        }
        this.userId = currentUser.id;
        this.username = currentUser.username;
        this.avatarUrl = currentUser.avatarUrl;
        this.totalWins = currentUser.totalWinPercent;
        return true;
    }
    
    getUsername():string
    {
        return this.username || "Guest";
    }

    getPlayerInfo() 
    {
        return 
        {
            userId: this.userId,
            username: this.username,
            avatarUrl: this.avatarUrl,
            score: this.score,
            totalWins: this.totalWins
        };
    }
    
}
*/