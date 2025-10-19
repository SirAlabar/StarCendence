const API_CONFIG =
{
  development:
  {
    AUTH_BASE_URL: 'http://localhost:3004'
  },
  production:
  {
    AUTH_BASE_URL: 'https://starcendence.dev/api/friends'
  },
  local:
  {
    AUTH_BASE_URL: 'https://localhost:8443/api/users'
  }
};

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDevelopment = import.meta.env.MODE === 'development';

const API = isLocal && !isDevelopment
  ? API_CONFIG.local
  : isDevelopment
    ? API_CONFIG.development
    : API_CONFIG.production;


export interface Friend {
  requestId: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendsResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  friends: Friend[];
}

export interface FriendRequestsResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  receivedRequests: Friend[];
}

export interface SentRequestsResponse {
  userId: string;
  username: string;
  avatarUrl: string | null;
  sentRequests: Friend[];
}

class FriendService {
  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // GET /friends - Get user's friends list
  async getFriends(): Promise<FriendsResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friends`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      if (response.status === 404) {
        // No friends yet - return empty structure
        return {
          userId: '',
          username: '',
          avatarUrl: null,
          friends: []
        };
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get friends');
    }

    return await response.json();
  }

  // GET /friend-requests - Get received friend requests
  async getFriendRequests(): Promise<FriendRequestsResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-requests`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      if (response.status === 404) {
        // No requests yet - return empty structure
        return {
          userId: '',
          username: '',
          avatarUrl: null,
          receivedRequests: []
        };
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get friend requests');
    }

    return await response.json();
  }

  // GET /friend-requests/sent - Get sent friend requests
  async getSentRequests(): Promise<SentRequestsResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-requests/sent`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      if (response.status === 404) {
        // No sent requests yet - return empty structure
        return {
          userId: '',
          username: '',
          avatarUrl: null,
          sentRequests: []
        };
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to get sent requests');
    }

    return await response.json();
  }

  // POST /friend-request - Send friend request
  async sendFriendRequest(username: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    if (!username || username.length < 3) {
      throw new Error('Invalid username');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-request`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to send friend request');
    }

    await response.json();
  }

  // POST /friend-request/:id/accept - Accept friend request
  async acceptRequest(requestId: number): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-request/${requestId}/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to accept friend request');
    }
  }

  // POST /friend-request/:id/decline - Decline friend request
  async declineRequest(requestId: number): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-request/${requestId}/decline`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to decline friend request');
    }
  }

  // DELETE /friend-request/:id - Cancel sent friend request
  async cancelRequest(requestId: number): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friend-request/${requestId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to cancel friend request');
    }
  }

  // DELETE /friends/:id - Remove friend
  async unfriend(friendId: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API.AUTH_BASE_URL}/friends/${friendId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw new Error('Session expired');
      }
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to remove friend');
    }
  }
}

// Export singleton instance
export default new FriendService();