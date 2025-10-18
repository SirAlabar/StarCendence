import { API } from '../types/api.types';
import { LoginService } from './LoginService';

export interface SetUsernameRequest 
{
  tempToken: string;
  username: string;
}

export interface OAuthCallbackParams 
{
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

export class OAuthService 
{
  // Initiate Google OAuth flow
  static initiateGoogleLogin(): void 
  {
    window.location.href = `${API.AUTH_BASE_URL}/oauth/google`;
  }

  // Handle OAuth callback - called from callback page
  static handleOAuthCallback(params: URLSearchParams): OAuthCallbackParams 
  {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const token = params.get('token');

    if (accessToken && refreshToken) 
    {
      // User already exists, store tokens
      LoginService.setTokens(accessToken, refreshToken);
      return { accessToken, refreshToken };
    }

    if (token) 
    {
      // New user needs to set username
      return { token };
    }

    throw new Error('Invalid OAuth callback parameters');
  }

  // Set username for new OAuth user
  static async setUsername(request: SetUsernameRequest): Promise<{ accessToken: string; refreshToken: string }> 
  {
    try 
    {
      const response = await fetch(`${API.AUTH_BASE_URL}/oauth/google/set-username`, 
      {
        method: 'POST',
        headers: 
        {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok) 
      {
        throw new Error(data.message || 'Failed to set username');
      }

      // Store tokens after successful username creation
      if (data.accessToken && data.refreshToken) 
      {
        LoginService.setTokens(data.accessToken, data.refreshToken);
        return { accessToken: data.accessToken, refreshToken: data.refreshToken };
      }

      throw new Error('No tokens received');
    } 
    catch (error) 
    {
      console.error('Set username error:', error);
      throw error;
    }
  }
}