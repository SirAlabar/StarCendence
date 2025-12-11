import { BaseComponent } from '../../components/BaseComponent';
import { navigateTo } from '../../router/router';

export default class PongGamePage extends BaseComponent 
{
    private lobbyId: string | null = null;

    constructor() 
    {
        super();
    }

    render(): string 
    {
        return `
            <div class="d-flex flex-column align-items-center justify-content-center vh-100">
                <h1>Hello guys!</h1>
                <p>Game is running in Lobby ID: <span id="lobby-id-display" class="fw-bold text-primary">Loading...</span></p>
                <button id="back-btn" class="btn btn-secondary mt-3">Back to Menu</button>
            </div>
        `;
    }

    async mount(): Promise<void> 
    {
        // 1. Get the Lobby ID from the URL parameters
        const params = new URLSearchParams(window.location.search);
        this.lobbyId = params.get('lobby');

        // 2. Display it to prove we passed the data correctly
        const displayElement = document.getElementById('lobby-id-display');
        if (displayElement) 
        {
            displayElement.innerText = this.lobbyId || 'Error: No Lobby ID';
        }

        // 3. Add a temporary back button listener
        document.getElementById('back-btn')?.addEventListener('click', () => {
            navigateTo('/pong');
        });

        console.log(`[PongGamePage] Mounted with Lobby ID: ${this.lobbyId}`);
        
        // This is where you will eventually initialize your game canvas
        // e.g., this.initGame(this.lobbyId);
    }
}