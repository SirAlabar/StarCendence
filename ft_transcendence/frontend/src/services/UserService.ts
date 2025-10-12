import { UserProfile } from '../types/user.types';

const API_BASE_URL = 'http://localhost:3004';

class UserService 
{
    private getToken(): string | null 
    {
        return localStorage.getItem('access_token');
    }

    private getHeaders(): HeadersInit 
    {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // GET /profile - Get authenticated user's profile
    async getProfile(): Promise<UserProfile> 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) 
        {
            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to get profile');
        }

        return await response.json();
    }

    // GET /profile/:username - Get public profile by username
    async getPublicProfile(username: string): Promise<UserProfile> 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }

        if (!username || username.length < 3) 
        {
            throw new Error('Invalid username');
        }

        const response = await fetch(`${API_BASE_URL}/profile/${username}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) 
        {
            if (response.status === 404) 
            {
                throw new Error('User not found');
            }
            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Session expired');
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to get user profile');
        }

        return await response.json();
    }

    // PUT /profile - Update user's bio
    async updateProfile(bio: string): Promise<UserProfile> 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }

        if (bio.length > 160) 
        {
            throw new Error('Bio must be 160 characters or less');
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ bio })
        });

        if (!response.ok) 
        {
            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Session expired');
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        return await response.json();
    }

    // POST /profile-image - Upload avatar
    async uploadAvatar(file: File): Promise<string> 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) 
        {
            throw new Error('Invalid file type. Only JPG, PNG, GIF, and WEBP are allowed.');
        }

        // Validate file size
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) 
        {
            throw new Error('File size must be less than 5MB');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/profile-image`, 
        {
            method: 'POST',
            headers: 
            {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) 
        {
            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Session expired');
            }
            
            let errorMessage = 'Failed to upload avatar';
            try 
            {
                const error = await response.json();
                errorMessage = error.message || error.error || errorMessage;
            } 
            catch 
            {
                errorMessage = `Upload failed: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.avatarUrl || data;
    }

    // GET /users/search?q=query - Search users by username
    async searchUsers(query: string): Promise<UserProfile[]> 
    {
        const token = this.getToken();
        if (!token) 
        {
            throw new Error('Not authenticated');
        }

        if (!query || query.length < 2) 
        {
            throw new Error('Search query must be at least 2 characters');
        }

        const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (!response.ok) 
        {
            if (response.status === 401) 
            {
                localStorage.removeItem('access_token');
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Session expired');
            }
            const error = await response.json();
            throw new Error(error.message || 'Failed to search users');
        }

        return await response.json();
    }
}

// Export singleton instance
export default new UserService();