import { initRouter } from './router/router';
import { LoginService } from './services/auth/LoginService';
import { webSocketService } from './services/websocket/WebSocketService';

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

        // Connect WebSocket automatically if user is authenticated
        this.initializeWebSocket();
    }

    private async initializeWebSocket(): Promise<void> 
    {
        // Check if user is authenticated
        if (LoginService.isAuthenticated()) 
        {
            try 
            {
                // Check if already connected
                if (!webSocketService.isConnected()) 
                {
                    await webSocketService.connect();
                }
            } 
            catch (error) 
            {
                // Silently handle connection errors
            }
        }
    }
}