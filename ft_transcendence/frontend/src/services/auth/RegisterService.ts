// RegisterService.ts
import { getAuthUrl } from '../../types/api.types';

export interface RegisterRequest 
{
    username: string;
    email: string;
    password: string;
}

export interface RegisterResponse 
{
    message: string;
}

export class RegisterService 
{
    static async register(credentials: RegisterRequest): Promise<RegisterResponse> 
    {
        try 
        {
            const response = await fetch(getAuthUrl('/register'), 
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
                throw new Error(data.error || data.message || 'Registration failed');
            }

            return data;
        } 
        catch (error) 
        {
            console.error('Registration error:', error);
            throw error;
        }
    }
}