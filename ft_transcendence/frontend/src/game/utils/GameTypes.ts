
export type GameMode = 'local-multiplayer' | 'ai' | 'online-multiplayer';
export type Ailevel = 'easy' | 'hard';
export type Paddlecolor = 'neon' | 'fire' | 'ice' | 'rainbow' | 'matrix' | 'gold' | 'shadow' | 'default';

export interface GameState
{
    ball:
    { 
        x:number;
        y:number;
        dx:number;
        dy:number;
        radius: number;
    };

    paddle1:
    {
        x:number;
        y:number;
        width:number;
        height:number;
        color: Paddlecolor;
    };

    paddle2:
    {
        x:number;
        y:number;
        width:number;
        height:number;
        color: Paddlecolor;
    };
    
    scores:
    {
        player1:number;
        player2:number;
    };
    timestamp: number;  //for lag compensation

}

//player input that will be sent to server
export interface PlayerInput
{
    type: 'paddle-move';
    direction: 'up' | 'down' | 'none';
    timestamp: number;
}

//Game configuration
export interface GameConfig
{
    mode: GameMode;
    difficulty?: Ailevel;
    paddlecolor1?: Paddlecolor;
    paddlecolor2?: Paddlecolor;
    gamewidth: number;
    gameheight: number;
}

//Match info for online games
export interface MatchInfo
{
    matchId: number;
    player1Id: number;
    player2Id: number;
    player1Name: string;
    player2Name: string;
    startTime: number;
}

//Game event to emit
export type GameEvent = 
    | {type: 'goal-scored'; scorer: 'player1' | 'player2'}
    | {type: 'paddle-hit'; paddle: 'left' | 'right'}
    | {type: 'wall-hit'}
    | {type: 'game-started'}
    | {type: 'game-ended'; winner: 'player1' | 'player2'}
    | {type: 'game-paused'}
    | {type: 'game-resumed'};

//interface for inputs
export interface IInputHandler
{
    getInput(): PlayerInput;
    destroy(): void;
}


//Interface for game render(2d/3d)
export interface IGameRender
{   
    render(state: GameState): void;
    clear(): void;
    resize(width:number, height: number): void;
    destroy(): void;
}

//interface for gameengine (local or sync)
export interface IGameEngine
{
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    getState(): GameState;
    onEvent(callback: (event: GameEvent)=> void): void;
}

