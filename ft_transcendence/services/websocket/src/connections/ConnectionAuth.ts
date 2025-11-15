// Connection authentication
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/securityConfig';

export interface AuthResult {
  userId: string;
  email?: string;
  username?: string;
}

export class ConnectionAuth {
  /**
   * Verify JWT token and extract user information
   */
  static verifyToken(token: string): AuthResult {
    try {
      const jwtSecret = getJwtSecret();
      
      // Verify and decode the token
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      
      // Extract user ID from token payload (sub field)
      if (!decoded.sub) {
        throw new Error('Token missing user ID (sub field)');
      }

      return {
        userId: decoded.sub,
        email: decoded.email as string | undefined,
        username: decoded.username as string | undefined,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid JWT token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('JWT token has expired');
      }
      throw error;
    }
  }

  /**
   * Extract token from WebSocket upgrade request
   * Supports query parameter: ?token=...
   */
  static extractTokenFromRequest(url?: string): string | null {
    if (!url) {
      return null;
    }

    try {
      // Handle both relative and absolute URLs
      // If it's a relative path like "/ws?token=...", we need to prepend a base
      const fullUrl = url.startsWith('http') || url.startsWith('ws') 
        ? url 
        : `ws://localhost${url}`;
      
      const urlObj = new URL(fullUrl);
      return urlObj.searchParams.get('token');
    } catch (error) {
      // Fallback: try to extract from query string manually
      const match = url.match(/[?&]token=([^&]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }
}
