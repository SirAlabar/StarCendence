// Pong Game Types - All Pong-specific entities and logic

/**
 * Complete Pong game state
 */
export interface PongState
{
  ball: Ball;
  paddles: Paddle[];
  scores: number[];
}

/**
 * Pong ball
 */
export interface Ball
{
  x: number;
  y: number;
  vx: number; // Velocity X
  vy: number; // Velocity Y
  radius: number;
  speed: number;
}

/**
 * Pong paddle
 */
export interface Paddle
{
  playerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  side: 'left' | 'right'; // Which side of screen
}

/**
 * Pong player input
 */
export interface PongInput
{
  direction: 'up' | 'down' | 'stop';
}

/**
 * Pong-specific event data
 */
export interface PongEventData
{
  // Ball hit event
  ballHit?: {
    playerId: string;
    ballSpeed: number;
    paddlePosition: { x: number; y: number };
  };
  
  // Score event
  scored?: {
    playerId: string;
    newScore: number;
    totalScore: number[];
  };
  
  // Wall hit event
  wallHit?: {
    wall: 'top' | 'bottom';
    ballPosition: { x: number; y: number };
  };
}
