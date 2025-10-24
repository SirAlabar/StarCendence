// AuthService.ts
import { getAuthApiUrl } from '../../types/api.types';

// Types for registration operations
export interface RegisterRequest 
{
    email: string;
    username: string;
    password: string;
}

export interface RegisterResponse 
{
    message: string;
}

// AuthService class - focused on registration
export class AuthService 
{
    // Registration - matches your /register endpoint
    static async register(userData: RegisterRequest): Promise<RegisterResponse> 
    {
        try 
        {
            const requestBody = JSON.stringify(userData);

            const response = await fetch(getAuthApiUrl('/register'), 
            {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json',
                },
                body: requestBody
            });

            let data;
            try 
            {
                data = await response.json();
            }
            catch (parseError) 
            {
                console.error('AuthService.register: Failed to parse response as JSON:', parseError);
                
                // Try to get response as text
                await response.text();
                throw new Error(`Invalid response format: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) 
            {
                console.error('AuthService.register: Request failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    data
                });
                
                throw new Error(data.message || `Registration failed: ${response.status} ${response.statusText}`);
            }
            return data;
        } 
        catch (error) 
        {
            console.error('AuthService.register: Error occurred:', error);
            
            if (error instanceof TypeError && error.message.includes('fetch')) 
            {
                console.error('AuthService.register: Network error - check if backend is running');
                throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
            }
            
            console.error('AuthService.register: Error details:', {
                name: (error as Error).name,
                message: (error as Error).message,
                stack: (error as Error).stack
            });
            
            throw error;
        }
    }

    // Test connection to backend
    static async testConnection(): Promise<boolean> 
    {
        try 
        {
            const response = await fetch(getAuthApiUrl('/health'), 
            {
                method: 'GET',
                headers: 
                {
                    'Content-Type': 'application/json',
                }
            });

            return response.ok;
        } 
        catch (error) 
        {
            console.error('AuthService.testConnection: Connection failed:', error);
            return false;
        }
    }
}