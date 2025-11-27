import { initRouter } from './router/router';
import { LoginService } from './services/auth/LoginService';
import { webSocketService } from './services/websocket/WebSocketService';
import { globalWebSocketHandler } from './services/websocket/GlobalWebSocketHandler';

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

        // Initialize global WebSocket handler
        globalWebSocketHandler.initialize();

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
                // Log warning but don't block app initialization
                console.warn('[App] WebSocket connection failed - will retry automatically:', error);
            }
        }
    }
}