import { BaseComponent } from '../../components/BaseComponent';
import { OAuthService } from '../../services/auth/OAuthService';
import { webSocketService } from '../../services/websocket/WebSocketService';

export default class OAuthCallbackPage extends BaseComponent 
{
    render(): string 
    {
        return `
            <div class="max-w-md mx-auto">
                <div class="bg-gray-800/80 backdrop-blur rounded-3xl p-8 border border-gray-600 text-center">
                    <div class="mb-6">
                        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
                    </div>
                    <h1 class="text-2xl font-bold text-cyan-400 mb-2">Processing Login...</h1>
                    <p class="text-gray-300">Please wait while we complete your authentication</p>
                </div>
            </div>
        `;
    }

    protected afterMount(): void 
    {
        this.handleCallback();
    }

    private async handleCallback(): Promise<void> 
    {
        try 
        {
            const params = new URLSearchParams(window.location.search);
            const result = OAuthService.handleOAuthCallback(params);

            if (result.accessToken && result.refreshToken) 
            {
                // Existing user - connect WebSocket and redirect
                try {
                    await webSocketService.connect();
                } catch (error) {
                    // Silently handle connection errors
                }
                window.location.replace('/profile');
            } 
            else if (result.token) 
            {
                // New user - store temp token in sessionStorage
                sessionStorage.setItem('oauth_temp_token', result.token);
                // Redirect to login page
                window.location.replace('/login?mode=setup');
            }
        } 
        catch (error) 
        {
            console.error('OAuth callback error:', error);
            window.location.replace('/login');
        }
    }
}