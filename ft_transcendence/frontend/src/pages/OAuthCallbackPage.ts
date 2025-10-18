import { BaseComponent } from '../components/BaseComponent';
import { OAuthService } from '../services/OAuthService';

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
                // User logged in successfully
                setTimeout(() => 
                {
                    if ((window as any).navigateTo) 
                    {
                        (window as any).navigateTo('/profile');
                    } 
                    else 
                    {
                        window.location.href = '/profile';
                    }
                }, 1000);
            } 
            else if (result.token) 
            {
                // New user needs to set username - redirect to login page with token
                setTimeout(() => 
                {
                    if ((window as any).navigateTo) 
                    {
                        (window as any).navigateTo(`/login?token=${result.token}`);
                    } 
                    else 
                    {
                        window.location.href = `/login?token=${result.token}`;
                    }
                }, 1000);
            }
        } 
        catch (error) 
        {
            console.error('OAuth callback error:', error);
            setTimeout(() => 
            {
                if ((window as any).navigateTo) 
                {
                    (window as any).navigateTo('/login');
                } 
                else 
                {
                    window.location.href = '/login';
                }
            }, 2000);
        }
    }
}