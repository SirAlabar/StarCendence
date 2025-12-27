export const getChatHistorySchema = {
  params: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: {
        type: 'string',
        minLength: 1,
      },
    },
  },
};

export const sendMessageSchema = {
  body: {
    type: 'object',
    required: ['receiverId', 'message'],
    properties: {
      receiverId: {
        type: 'string',
        minLength: 1,
      },
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 1000,
      },
    },
  },
};

export const markAsReadSchema = {
  params: {
    type: 'object',
    required: ['friendId'],
    properties: {
      friendId: {
        type: 'string',
        minLength: 1,
      },
    },
  },
};