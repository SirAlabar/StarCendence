// LoginService.ts
import { getAuthApiUrl } from '../../types/api.types';
import { Modal } from '@/components/common/Modal';

// Types for login operations
export interface LoginRequest 
{
    email: string;
    password: string;
}

export interface LoginResponse 
{
    accessToken?: string;
    refreshToken?: string;
    tempToken?: string;
    type?: string;
}

export interface RefreshRequest 
{
    refreshToken: string;
}

export interface RefreshResponse 
{
    success: boolean;
    accessToken: string;
    refreshToken: string;
}

export interface LogoutRequest 
{
    refreshToken: string;
}

export interface VerifyResponse 
{
    success: boolean;
    user: 
    {
        sub: string;
        email: string;
        username: string;
        type: string;
        iat?: number;
        exp?: number;
        iss?: string;
    };
}

export class LoginService 
{
    private static accessToken: string | null = null;

    // Token management methods
    public static setTokens(accessToken: string, refreshToken?: string): void 
    {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) 
        {
            localStorage.setItem('refreshToken', refreshToken);
        }
        this.accessToken = accessToken;
    }

    static getAccessToken(): string | null 
    {
        if (this.accessToken) 
        {
            return this.accessToken;
        }
        return localStorage.getItem('accessToken');
    }

    static getRefreshToken(): string | null 
    {
        return localStorage.getItem('refreshToken');
    }

    static clearTokens(): void 
    {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.accessToken = null;
    }

    private static getHeaders(): HeadersInit 
    {
        const token = this.getAccessToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Login - matches your /login endpoint
    static async login(credentials: LoginRequest): Promise<LoginResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/login'), 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) 
            {
                throw new Error(data.message || 'Login failed');
            }

            // Store tokens
            if (data.accessToken) 
            {
                this.setTokens(data.accessToken, data.refreshToken);
            }

            return data;
        } 
        catch (error) 
        {
            throw error;
        }
    }

    // Refresh tokens - matches your /refresh endpoint
    static async refreshToken(): Promise<RefreshResponse> 
    {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) 
        {
            throw new Error('No refresh token available');
        }

        try 
        {
            const response = await fetch(getAuthApiUrl('/refresh'), 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (!response.ok) 
            {
                throw new Error(data.message || 'Token refresh failed');
            }

            // Update stored tokens
            this.setTokens(data.accessToken, data.refreshToken);

            return data;
        } 
        catch (error) 
        {
            this.clearTokens(); // Clear invalid tokens
            throw error;
        }
    }

    // Logout - matches your /logout endpoint
    static async logout(): Promise<void> 
    {
      const refreshToken = this.getRefreshToken();
        if (!refreshToken) 
        {
            this.clearTokens();
            return;
        }

        try 
        {
            const response = await fetch(getAuthApiUrl('/logout'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({})
            });
            
            const data = await response.json();

            if (!response.ok) 
            {
                throw new Error(data.message || 'Logout failed');
            }

            return data;
        } 
        catch (error) 
        {
        } 
        finally 
        {
            this.clearTokens();
        }
    }

    // Logout from all devices - matches your /logout-all endpoint
    static async logoutAllDevices(userId: string): Promise<void> 
    {
        try 
        {
            await fetch(getAuthApiUrl('/logout-all'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });
        } 
        catch (error) 
        {
        } 
        finally 
        {
            this.clearTokens();
        }
    }

    // Verify token - matches your /verify endpoint
    static async verifyToken(): Promise<VerifyResponse> 
    {
        const token = this.getAccessToken();
        if (!token) 
        {
            throw new Error('No access token available');
        }

        try 
        {
            const response = await fetch(getAuthApiUrl('/verify'), 
            {
                method: 'GET',
                headers: this.getHeaders()
            });

            const data = await response.json();

            if (!response.ok) 
            {
                if (response.status === 401) 
                {
                    // Try to refresh token
                    await this.refreshToken();
                    // Retry verification with new token
                    return this.verifyToken();
                }
                throw new Error(data.message || 'Token verification failed');
            }

            return data;
        } 
        catch (error) 
        {
            throw error;
        }
    }

    // Check if user is authenticated
    static isAuthenticated(): boolean 
    {
        return !!this.getAccessToken();
    }

    // Get current user info from stored token (without API call)
    static getCurrentUser(): any 
    {
        const token = this.getAccessToken();
        if (!token) 
        {
            return null;
        }

        try 
        {
            // Decode JWT token (basic decode, not verification)
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            return payload;
        } 
        catch (error) 
        {
            return null;
        }
    }

    // Redirect to login if not authenticated
    static requireAuth(): void 
    {
        if (!this.isAuthenticated()) 
        {
            window.location.href = '/login';
        }
    }

    // Handle session expiry
    static async handleSessionExpiry(): Promise<void> 
    {
        this.clearTokens();
        await Modal.alert('Session Expired','Your session has expired. Please log in again.');
        window.location.href = '/login';
    }

    // Verify 2FA code during login
    static async verify2FALogin(tempToken: string, code: string): Promise<LoginResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/login/2fa-verify'), 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                           'Authorization': `Bearer ${tempToken}` },
                body: JSON.stringify({ twoFACode: code })
            });

            const data = await response.json();

            if (!response.ok) 
            {
                throw new Error(data.message || '2FA verification failed');
            }

            // Store tokens
            if (data.accessToken) 
            {
                this.setTokens(data.accessToken, data.refreshToken);
            }

            return data;
        } 
        catch (error) 
        {
            throw error;
        }
    }
}