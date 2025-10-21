// LoginService.ts
import { getAuthUrl } from '../../types/api.types';

// Types for login operations
export interface LoginRequest 
{
    email: string;
    password: string;
}

export interface LoginResponse 
{
    token: string;
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
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) 
        {
            localStorage.setItem('refresh_token', refreshToken);
        }
        this.accessToken = accessToken;
    }

    static getAccessToken(): string | null 
    {
        if (this.accessToken) 
        {
            return this.accessToken;
        }
        return localStorage.getItem('access_token');
    }

    static getRefreshToken(): string | null 
    {
        return localStorage.getItem('refresh_token');
    }

    static clearTokens(): void 
    {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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
            const response = await fetch(getAuthUrl('/login'), 
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
            console.error('Login error:', error);
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
            const response = await fetch(getAuthUrl('/refresh'), 
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
            console.error('Token refresh error:', error);
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
            await fetch(getAuthUrl('/logout'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ refreshToken })
            });
        } 
        catch (error) 
        {
            console.error('Logout error:', error);
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
            await fetch(getAuthUrl('/logout-all'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ userId })
            });
        } 
        catch (error) 
        {
            console.error('Logout all devices error:', error);
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
            const response = await fetch(getAuthUrl('/verify'), 
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
            console.error('Token verification error:', error);
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
            console.error('Error decoding token:', error);
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
    static handleSessionExpiry(): void 
    {
        this.clearTokens();
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
    }
}