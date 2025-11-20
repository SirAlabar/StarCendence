import { BaseComponent } from '../../components/BaseComponent';
import { GameLobby, LobbyConfig } from '../../components/game/GameLobby';
import { navigateTo } from '../../router/router';
import { Modal } from '@/components/common/Modal';

export default class RacerLobbyPage extends BaseComponent 
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
            gameType: 'podracer',
            maxPlayers: 4,
            onStartGame: () => this.startRace(),
            onBack: () => navigateTo('/pod-racer')
        };
        
        this.gameLobby = new GameLobby(config);
        
        const container = document.getElementById('lobbyContainer');
        if (container) 
        {
            container.innerHTML = this.gameLobby.render();
            this.gameLobby.mount();
        }
    }
    
    private startRace(): void 
    {
        // TODO: Start multiplayer race with selected players and pods
        console.log('Starting Pod Race multiplayer...');
        Modal.showAlert('Alert', 'Starting Race! (Multiplayer implementation pending)');
        // Future: Pass player data and pod selections to race engine
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