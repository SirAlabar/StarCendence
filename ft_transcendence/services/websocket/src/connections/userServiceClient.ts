// Client for User Service communication
import { getInternalApiKey } from '../utils/getSecrets';

export class UserServiceError extends Error
{
    constructor(
        message: string,
        public statusCode: number
    )
    {
        super(message);
        this.name = 'UserServiceError';
    }
}

// Update user status in User Service
export async function updateUserStatus(authId: string, status: string): Promise<void>
{
    if (!authId || !status)
    {
        throw new UserServiceError('Auth ID and status are required', 400);
    }

    try
    {
        const response = await fetch('http://user-service:3004/internal/update-user-status',
        {
            method: 'PATCH',
            headers:
            {
                'Content-Type': 'application/json',
                'X-API-Key': getInternalApiKey()
            },
            body: JSON.stringify({
                userId: authId,
                status
            })
        });

        if (!response.ok)
        {
            const errorText = await response.text();
            throw new UserServiceError(
                `User service responded with ${response.status}: ${errorText}`,
                response.status
            );
        }
    }
    catch (error)
    {
        if (error instanceof UserServiceError)
        {
            throw error;
        }
        
        console.error('Failed to update user status:', error);
        throw new UserServiceError(
            `Failed to communicate with user service: ${error instanceof Error ? error.message : 'Unknown error'}`,
            500
        );
    }
}