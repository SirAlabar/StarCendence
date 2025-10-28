import { BaseComponent } from '../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../components/game/GameLobby';
import { navigateTo } from '../router/router';

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
            maxPlayers: 4,
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
    
    private startPongGame(): void 
    {
        // TODO: Start multiplayer pong game with selected players
        console.log('Starting Pong multiplayer game...');
        alert('Starting Pong game! (Multiplayer implementation pending)');
        // Future: Pass player data to game engine and start
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