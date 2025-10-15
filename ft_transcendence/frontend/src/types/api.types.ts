//  API response type definitions


const API_CONFIG = {
    development: {
        BASE_URL: 'http://localhost:3004',
        AUTH_BASE_URL: 'http://localhost:3001'
    },
    production: {
        BASE_URL: 'https://starcendence.dev',
        AUTH_BASE_URL: 'https://starcendence.dev/api/auth'
    },
    local: {
        BASE_URL: 'https://localhost:8443',
        AUTH_BASE_URL: 'https://localhost:8443/api/auth'
    }
};


//Detects the current environment and returns the appropriate API configuration
const getEnvironmentConfig = () => 
{
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDevelopment = import.meta.env?.MODE === 'development';

    if (isLocal && !isDevelopment) 
    {
        return API_CONFIG.local;
    }
    
    if (isDevelopment) 
    {
        return API_CONFIG.development;
    }
    
    return API_CONFIG.production;
};


//Current API configuration based on environment
export const API = getEnvironmentConfig();


//Helper function to get full avatar URL
export const getAvatarUrl = (avatarPath: string | null | undefined): string | null => 
{
    if (!avatarPath) 
    {
        return null;
    }
    return `${API.BASE_URL}${avatarPath}`;
};

//Helper function to construct API endpoint URLs
export const getApiUrl = (endpoint: string): string => 
{
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API.BASE_URL}${normalizedEndpoint}`;
};

//Helper function to construct Auth API endpoint URLs
export const getAuthUrl = (endpoint: string): string => 
{
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API.AUTH_BASE_URL}${normalizedEndpoint}`;
};


//Get the auth base URL for the current environment
export const getAuthBaseUrl = (): string => 
{
    return API.AUTH_BASE_URL;
};


//Get the base URL for the current environment
export const getBaseUrl = (): string => 
{
    return API.BASE_URL;
};