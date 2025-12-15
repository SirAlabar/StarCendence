//  API response type definitions

const API_CONFIG = {
    production: {
        BASE_URL: 'https://starcendence.dev',
        AUTH_BASE_URL: 'https://starcendence.dev/api/auth',
        USERS_BASE_URL: 'https://starcendence.dev/api/users',
        CHAT_BASE_URL: 'https://starcendence.dev/api/chat'
    },
    local: {
        BASE_URL: 'https://localhost:8443',
        AUTH_BASE_URL: 'https://localhost:8443/api/auth',
        USERS_BASE_URL: 'https://localhost:8443/api/users',
        CHAT_BASE_URL: 'https://localhost:8443/api/chat'
    }
};


//Detects the current environment and returns the appropriate API configuration
const getEnvironmentConfig = () => 
{
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) 
    {
        return API_CONFIG.local;
    }
    
    return API_CONFIG.production;
};


//Current API configuration based on environment
export const API = getEnvironmentConfig();

//Helper function to construct Auth API endpoint URLs
export const getAuthApiUrl = (endpoint: string): string => 
{
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API.AUTH_BASE_URL}${normalizedEndpoint}`;
};

// Helper function to construct User API endpoint URLs
export const getUserApiUrl = (endpoint: string): string => 
{
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API.USERS_BASE_URL}${normalizedEndpoint}`;
};

//Get the base URL for the current environment
export const getBaseUrl = (): string => 
{
    return API.BASE_URL;
};

export const getChatApiUrl = (endpoint: string): string => 
{
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API.CHAT_BASE_URL}${normalizedEndpoint}`;
};
