
export const saveMessageSchema = {
  body: {
    type: 'object',
    properties: {
      fromUserId: { type: 'string' },
      roomId: { type: 'string' },
      message: { type: 'string' },
    },
    required: ['fromUserId', 'roomId', 'message'],
  },
};