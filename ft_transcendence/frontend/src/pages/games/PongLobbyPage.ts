import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';

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
        // TODO: Start multiplayer pong game with selected players
        await Modal.alert('Alert', 'Starting Pong game! (Multiplayer implementation pending)');
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