export class BaseService 
{
    protected getToken(): string | null 
    {
        return localStorage.getItem('access_token');
    }

    protected getHeaders(): HeadersInit 
    {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    protected handleAuthError(): void 
    {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    protected async handleResponse<T>(response: Response): Promise<T> 
    {
        if (!response.ok) 
        {
            if (response.status === 401) 
            {
                this.handleAuthError();
                throw new Error('Session expired');
            }

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
                    // If response is not JSON, get text
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

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) 
        {
            return await response.json();
        }
        else 
        {
            throw new Error(`Expected JSON response but received: ${contentType || 'unknown'}`);
        }
    }

    protected requireAuth(): void 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }
    }

    // Direct fetch
    protected async fetchRequest(url: string, options: RequestInit = {}): Promise<Response> 
    {
        return fetch(url, options);
    }
}