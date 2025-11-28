// UserService.ts
import { BaseService } from '../BaseService';
import { getUserApiUrl } from '../../types/api.types';
import { UserProfile, UpdateSettingsBody } from '../../types/user.types';

class UserService extends BaseService 
{
    // GET /profile - Get authenticated user's profile
    async getProfile(): Promise<UserProfile> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl('/profile'), {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse<UserProfile>(response);
    }

    // GET /profile/:username - Get public profile by username
    async getPublicProfile(username: string): Promise<UserProfile> 
    {
        this.requireAuth();

        if (!username || username.length < 3) 
        {
            throw new Error('Invalid username');
        }

        const response = await this.fetchRequest(getUserApiUrl(`/profile/${username}`), {
            method: 'GET',
            headers: this.getHeaders()
        });

        if (response.status === 404) 
        {
            throw new Error('User not found');
        }

        return this.handleResponse<UserProfile>(response);
    }

    // PUT /profile - Update user's bio
    async updateProfile(bio: string): Promise<UserProfile> 
    {
        this.requireAuth();

        if (bio.length > 160) 
        {
            throw new Error('Bio must be 160 characters or less');
        }

        const response = await this.fetchRequest(getUserApiUrl('/profile'), {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ bio })
        });

        return this.handleResponse<UserProfile>(response);
    }

    // PATCH /settings - Update user's settings (privacy & notifications)
    async updateSettings(settings: UpdateSettingsBody): Promise<UserProfile> 
    {
        this.requireAuth();

        const response = await this.fetchRequest(getUserApiUrl('/settings'), {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(settings)
        });

        return this.handleResponse<UserProfile>(response);
    }

    // POST /profile-image - Upload avatar
    async uploadAvatar(file: File): Promise<string> 
    {
        this.requireAuth();

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

        const token = this.getToken();
        const response = await this.fetchRequest(getUserApiUrl('/profile-image'), 
        {
            method: 'POST',
            headers: 
            {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await this.handleResponse<any>(response);
        return data.avatarUrl || data;
    }

    // GET /users/search?q=query - Search users by username
    async searchUsers(query: string): Promise<UserProfile[]> 
    {
        this.requireAuth();

        if (!query || query.length < 2) 
        {
            throw new Error('Search query must be at least 2 characters');
        }

        const response = await this.fetchRequest(getUserApiUrl(`/users/search?q=${encodeURIComponent(query)}`), {
            method: 'GET',
            headers: this.getHeaders()
        });

        return this.handleResponse<UserProfile[]>(response);
    }
}

// Export singleton instance
export default new UserService();