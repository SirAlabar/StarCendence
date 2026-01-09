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
                // Try to get response as text
                await response.text();
                throw new Error(`Invalid response format: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) 
            {              
                throw new Error(data.message || `Registration failed: ${response.status} ${response.statusText}`);
            }
            return data;
        } 
        catch (error) 
        {
            if (error instanceof TypeError && error.message.includes('fetch')) 
            {
                throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
            }
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
            return false;
        }
    }
}