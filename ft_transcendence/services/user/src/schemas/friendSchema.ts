
export const sendFriendRequestSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 100 }
    }
  }
};