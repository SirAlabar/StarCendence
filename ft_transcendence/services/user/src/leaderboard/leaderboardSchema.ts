import { UserStatus } from '../profile/user.types';

// Leaderboard schema for GET /leaderboard
export const getLeaderboardSchema = 
{
  response: 
  {
    200: 
    {
      type: 'array',
      items: 
      {
        type: 'object',
        properties: 
        {
          id: { type: 'string' },
          username: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          status: { type: 'string', enum: Object.values(UserStatus) },
          wins: { type: 'number' },
          losses: { type: 'number' },
          points: { type: 'number' },
          rank: { type: 'number' }
        }
      }
    }
  }
};