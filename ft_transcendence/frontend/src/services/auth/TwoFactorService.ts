// TwoFactorService.ts - 2FA management with rate limit handling
import { getAuthApiUrl } from '../../types/api.types';
import { LoginService } from './LoginService';

// Request/Response Types
export interface Setup2FAResponse 
{
    otpauthUrl: string;
    qrCodeDataURL: string;
    secret: string;
}

export interface Verify2FARequest 
{
    token: string;
}

export interface Verify2FAResponse 
{
    success: boolean;
}

export interface Verify2FALoginRequest 
{
    tempToken: string;
    token: string;
}

export interface Verify2FALoginResponse 
{
    accessToken: string;
    refreshToken: string;
}

export interface TwoFactorStatusResponse 
{
    twoFactorEnabled: boolean;
}

// Custom error class to include status code
export class TwoFactorError extends Error 
{
    status: number;
    
    constructor(message: string, status: number) 
    {
        super(message);
        this.status = status;
        this.name = 'TwoFactorError';
    }
}

export class TwoFactorService 
{
    private static getHeaders(): HeadersInit 
    {
        const token = LoginService.getAccessToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Helper to handle fetch responses with proper error codes
    private static async handleResponse<T>(response: Response): Promise<T> 
    {
        const data = await response.json();

        if (!response.ok) 
        {
            // Handle rate limiting (429)
            if (response.status === 429) 
            {
                throw new TwoFactorError(
                    data.message || 'Too many requests. Please wait a moment before trying again.',
                    429
                );
            }

            // Handle other errors
            throw new TwoFactorError(
                data.message || 'Request failed',
                response.status
            );
        }

        return data;
    }

    // Check 2FA status
    static async get2FAStatus(): Promise<TwoFactorStatusResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/2fa/status'), 
            {
                method: 'GET',
                headers: this.getHeaders()
            });

            return await this.handleResponse<TwoFactorStatusResponse>(response);
        } 
        catch (error) 
        {
            console.error('2FA status check error:', error);
            // Return default for status check (non-critical)
            return { twoFactorEnabled: false };
        }
    }

    // Setup 2FA - Get QR code and secret
    static async setup2FA(): Promise<Setup2FAResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/2fa/setup'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({})
            });

            return await this.handleResponse<Setup2FAResponse>(response);
        } 
        catch (error) 
        {
            console.error('2FA setup error:', error);
            throw error;
        }
    }

    // Verify 2FA code and enable 2FA
    static async verify2FA(code: string): Promise<Verify2FAResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/2fa/verify'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ token: code })
            });

            return await this.handleResponse<Verify2FAResponse>(response);
        } 
        catch (error) 
        {
            console.error('2FA verification error:', error);
            throw error;
        }
    }

    // Disable 2FA
    static async disable2FA(): Promise<Verify2FAResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/2fa/disable'), 
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({})
            });

            return await this.handleResponse<Verify2FAResponse>(response);
        } 
        catch (error) 
        {
            console.error('2FA disable error:', error);
            throw error;
        }
    }

    // Verify 2FA code during login (with tempToken)
    static async verify2FALogin(tempToken: string, code: string): Promise<Verify2FALoginResponse> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/login/2fa-verify'), 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ token: code })
            });

            const data = await this.handleResponse<Verify2FALoginResponse>(response);

            // Store tokens after successful 2FA verification
            if (data.accessToken && data.refreshToken) 
            {
                LoginService.setTokens(data.accessToken, data.refreshToken);
            }

            return data;
        } 
        catch (error) 
        {
            console.error('2FA login verification error:', error);
            throw error;
        }
    }
}