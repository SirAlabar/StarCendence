// WebSocket configuration
import * as dotenv from 'dotenv';
import { WS_PORT, WS_PATH, HEALTH_PATH } from '../utils/constants';

dotenv.config();

export interface WSConfig {
  port: number;
  path: string;
  healthPath: string;
  jwtSecret: string;
  nodeEnv: string;
}

export function getWSConfig(): WSConfig {
  let jwtSecret: string;
  
  // Try to read from Docker secret first (production)
  try {
    const fs = require('fs');
    jwtSecret = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim();
  } catch {
    // Fallback to environment variable (development)
    jwtSecret = process.env.JWT_SECRET || '';
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured. Set it in .env or Docker secret');
    }
  }

  return {
    port: parseInt(process.env.PORT || String(WS_PORT), 10),
    path: process.env.WS_PATH || WS_PATH,
    healthPath: HEALTH_PATH,
    jwtSecret,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
