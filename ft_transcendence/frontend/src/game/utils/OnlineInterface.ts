// OUTGOING: Engine > WebSocket

export interface OGameInput         //payload to inform of player movement
{
    type: 'game:input';
    payload: 
    {
        gameId: string;
        playerId: string;
        input:
        {
            direction: 'up' | 'down' | 'none';
            //timestamp: number;
        }
    }

}

export interface OGameReady             //payload to inform game is ready to start
{
    type: 'game:ready';
    payload:
    {
        gameId: string;
        playerId: string;
    };
}

export interface OLeaveGame
{
    type: 'game:leave';                 //payload to inform player left
    payload:
    {
        gameId: string;
        playerId: string;
    };
    
}

export type OutgoingGameMessage = 
    | OGameInput
    | OGameReady
    | OLeaveGame;


// INCOMING: WebSocket > Engine


export interface OGameStateUpdate 
{
    type: 'game:state';                         //payload to pass game state (full snapshot with timestamp)
    payload: 
    {
        gameId: string;
        state: 
        {
            ball: 
            {
                x: number;
                y: number;
                dx: number;
                dy: number;
            };
            paddle1: 
            {
                y: number;
            };
            paddle2: 
            {
                y: number;
            };
            scores: 
            {
                player1: number;
                player2: number;
            };
        };
        timestamp: number;
    };
}

export interface OGameEvent             //payload to infor of game event like goals and hits
{
    type: 'game:event';
    payload:
    {
        gameId: string;
        event:
        {
            type: 'goal' | 'paddle-hit' | 'wall-hit' | 'game-end';
            data?: any;
        };
    };
}

export interface OGameStart         //payload to inform ready to start game 
{
    type: 'game:start';
    payload:
    {
        gameId:string;
        playerId: string;
        playerSide: 'left' | 'right';
        player1Name: string;
        player2Name: string;
        config?:
        {
            paddleColor1: string;
            paddleColor2: string;
        }
    }
}

export type IncomingGameMessage = 
    | OGameStateUpdate
    | OGameEvent
    | OGameStart;


export interface IOnlineGameConnection      //need to make a class to implement this to work with the game and websocket
{
    //Send a message to the server
    send(message: OutgoingGameMessage): boolean;
    
    //Subscribe to incoming messages
    on(messageType: string, callback: (payload: any) => void): void;
    
    //Unsubscribe from messages
    off(messageType: string, callback: (payload: any) => void): void;
    
    //Check if connection is active
    isConnected(): boolean;
}