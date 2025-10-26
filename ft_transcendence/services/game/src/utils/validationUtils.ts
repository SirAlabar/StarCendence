// Game input validation utilities
import { PongInput } from '../types/pong.types';
import { badRequest } from './HttpError';

/**
 * Validate Pong player input
 */
export function validatePongInput(input: any): PongInput
{
  if (!input || typeof input !== 'object')
  {
    throw badRequest('Invalid input format');
  }

  const { direction } = input;

  if (!direction || !['up', 'down', 'stop'].includes(direction))
  {
    throw badRequest('Invalid direction. Must be: up, down, or stop');
  }

  return { direction } as PongInput;
}

/**
 * Validate player ID format
 */
export function validatePlayerId(playerId: string): void
{
  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0)
  {
    throw badRequest('Invalid player ID');
  }
}

/**
 * Validate game ID format
 */
export function validateGameId(gameId: string): void
{
  if (!gameId || typeof gameId !== 'string' || gameId.trim().length === 0)
  {
    throw badRequest('Invalid game ID');
  }
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: number): void
{
  if (!timestamp || typeof timestamp !== 'number' || timestamp <= 0)
  {
    throw badRequest('Invalid timestamp');
  }

  // Check if timestamp is too old (more than 5 seconds)
  const now = Date.now();
  const diff = Math.abs(now - timestamp);
  if (diff > 5000)
  {
    throw badRequest('Timestamp too old');
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: any): any
{
  if (typeof input === 'string')
  {
    return input.trim();
  }

  if (typeof input === 'object' && input !== null)
  {
    const sanitized: any = {};
    for (const key in input)
    {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }

  return input;
}