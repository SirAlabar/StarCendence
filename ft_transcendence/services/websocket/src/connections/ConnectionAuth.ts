// Connection authentication
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/securityConfig';

export interface AuthResult {
  userId: string;
  email?: string;
  username?: string;
}

export class ConnectionAuth
{
  static verifyToken(token: string): AuthResult
  {
    try
    {
      const jwtSecret = getJwtSecret();
      
      const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
      
      if (!decoded.sub)
      {
        throw new Error('Token missing user ID (sub field)');
      }

      return {
        userId: decoded.sub,
        email: decoded.email as string | undefined,
        username: decoded.username as string | undefined,
      };
    }
    catch (error)
    {
      if (error instanceof jwt.JsonWebTokenError)
      {
        throw new Error('Invalid JWT token');
      }
      if (error instanceof jwt.TokenExpiredError)
      {
        throw new Error('JWT token has expired');
      }
      throw error;
    }
  }

  static extractTokenFromRequest(url?: string): string | null
  {
    if (!url)
    {
      return null;
    }

    try
    {
      // Make sure URL has http:// or ws:// at the start
      const fullUrl = url.startsWith('http') || url.startsWith('ws') 
        ? url 
        : `ws://localhost${url}`;
      
      const urlObj = new URL(fullUrl);
      return urlObj.searchParams.get('token');
    }
    catch (error)
    {
      // If URL parsing fails try to find token in the string
      const match = url.match(/[?&]token=([^&]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
  }
}
