import { gameManager } from '@/game/managers/PongManager';
import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { GameConfig } from '@/game/utils/GameTypes';

export default class PongLobbyPage extends BaseComponent 
{
    private gameLobby: GameLobby | null = null;
   
    
    
    render(): string 
    {
        return '<div id="lobbyContainer"></div>';
    }
    
    mount(): void 
    {
        const config: LobbyConfig = 
        {
            gameType: 'pong',
            maxPlayers: 2,
            onStartGame: () => this.startPongGame(),
            onBack: () => navigateTo('/pong')
        };
        
        this.gameLobby = new GameLobby(config);
        
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            container.innerHTML = this.gameLobby.render();
            this.gameLobby.mount();
        }
    }
    
    private async startPongGame(): Promise<void> 
    {
        //this is what i am doing on pong page to start the game manager
        const canvas = document.getElementById('lobbyContainer') as HTMLCanvasElement;
        // Build game config
        try 
        {
            const config : GameConfig =
            {
                mode:'online-multiplayer',
                difficulty: undefined,
                paddlecolor1: gameManager.getPaddleColor(1),
                paddlecolor2: gameManager.getPaddleColor(2),
                gamewidth: canvas.width,
                gameheight: canvas.height
            };
            await gameManager.init2DGame(canvas, config);    
            gameManager.startGame();        
        }
        catch (error) 
        {
            console.log("failed to start game!")
        }
        
    }
    
    public dispose(): void 
    {
        if (this.gameLobby) 
        {
            this.gameLobby.dispose();
            this.gameLobby = null;
        }
    }
}