import { initRouter } from './router/router';
import { LoginService } from './services/auth/LoginService';
import { webSocketService } from './services/websocket/websocketService';

export class App 
{
    private container: HTMLElement | null = null;

    constructor() 
    {
    }

    mount(selector: string): void 
    {
        this.container = document.querySelector(selector);
        if (!this.container) 
        {
            throw new Error(`Element with selector "${selector}" not found`);
        }

        // Initialize the functional router system
        initRouter();

        // Auto-connect WebSocket if user is already authenticated
        this.initializeWebSocket();
    }

    private initializeWebSocket(): void {
        // Check if user is authenticated and connect WebSocket
        if (LoginService.isAuthenticated()) {
            const token = LoginService.getAccessToken();
            if (token) {
                webSocketService.connect(token);
            }
        }
    }
}