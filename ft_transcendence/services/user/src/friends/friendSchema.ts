
// Send a friend request schema
export const sendFriendRequestSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 100 }
    }
  }
};

// Accept a friend request schema
export const requestIdSchema = {
  params: {
    type: 'object',
    required: ['requestId'],
    properties: {
      requestId: { type: 'integer' }
    }
  }
};

// Unfriend schema
export const friendIdSchema = {
  params: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: { type: 'string', format: 'uuid' }
    }
  }
};
