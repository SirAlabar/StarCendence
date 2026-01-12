import { getAuthApiUrl } from '../types/api.types';

type RefreshResponse = {
    accessToken: string;
    refreshToken?: string;
    success?: boolean;
};

export class BaseService 
{
    private static refreshInFlight: Promise<void> | null = null;

    // Token management
    protected getToken(): string | null 
    {
        return localStorage.getItem('accessToken');
    }

    protected getRefreshToken(): string | null 
    {
        return localStorage.getItem('refreshToken');
    }

    protected setTokens(accessToken: string, refreshToken?: string): void 
    {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) 
        {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    protected clearTokens(): void 
    {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    // Header management
    protected getHeaders(): HeadersInit 
    {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Auth error handling
    protected handleAuthError(): void 
    {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Response handling
    protected async handleResponse<T>(response: Response): Promise<T> 
    {
        if (!response.ok) 
        {
            let errorMessage = 'Request failed';
            
            try 
            {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) 
                {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                }
                else 
                {
                    const text = await response.text();
                    errorMessage = `${errorMessage}: ${response.status} ${response.statusText}`;
                    
                    if (text && text.length < 200) 
                    {
                        errorMessage += ` - ${text}`;
                    }
                }
            } 
            catch 
            {
                errorMessage = `Request failed: ${response.status} ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        // Handle 204 No Content
        if (response.status === 204) 
        {
            return undefined as unknown as T;
        }

        // Parse JSON response
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) 
        {
            return await response.json();
        }

        throw new Error(`Expected JSON response but received: ${contentType || 'unknown'}`);
    }

    // Auth requirement check
    protected requireAuth(): void 
    {
        const token = this.getToken();
        
        if (!token) 
        {
            throw new Error('Not authenticated');
        }
    }

    // Token refresh logic (private)
    private async refreshTokens(): Promise<void> 
    {
        // If refresh is already in progress, wait for it
        if (BaseService.refreshInFlight) 
        {
            return BaseService.refreshInFlight;
        }

        BaseService.refreshInFlight = (async () => 
        {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) 
            {
                throw new Error('No refresh token available');
            }

            try 
            {
                const response = await fetch(getAuthApiUrl('/token/refresh'), 
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });

                if (!response.ok) 
                {
                    throw new Error('Token refresh failed');
                }

                const data = (await response.json()) as RefreshResponse;
                
                if (!data.accessToken) 
                {
                    throw new Error('No access token returned');
                }
                this.setTokens(data.accessToken, data.refreshToken);
            } 
            catch (error) 
            {
                throw error;
            }
        })().finally(() => 
        {
            BaseService.refreshInFlight = null;
        });

        return BaseService.refreshInFlight;
    }

    // Enhanced fetch with auto-retry on 401
    protected async fetchRequest(url: string, options: RequestInit = {}): Promise<Response> 
    {
        const isRefreshEndpoint = url.includes('/token/refresh');

        const buildOptions = (): RequestInit => 
        {
            // Handle headers properly
            const headers = options.headers instanceof Headers
                ? new Headers(options.headers)
                : new Headers(options.headers as HeadersInit | undefined);

            // Check if body is FormData (don't set Content-Type for FormData)
            const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

            if (!isFormData && !headers.has('Content-Type')) 
            {
                headers.set('Content-Type', 'application/json');
            }

            // Add auth token if available
            const token = this.getToken();
            if (token) 
            {
                headers.set('Authorization', `Bearer ${token}`);
            }

            return { ...options, headers };
        };

        // First attempt
        let response = await fetch(url, buildOptions());

        // If not 401 or this is the refresh endpoint, return immediately
        if (response.status !== 401 || isRefreshEndpoint) 
        {
            return response;
        }

        try 
        {
            await this.refreshTokens();
        } 
        catch (error) 
        {
            this.handleAuthError();
            throw new Error('Session expired');
        }

        response = await fetch(url, buildOptions());

        if (response.status === 401) 
        {
            this.handleAuthError();
            throw new Error('Session expired');
        }
        return response;
    }
}