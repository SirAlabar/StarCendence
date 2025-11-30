export const createConversationSchema = {
  body: {
    type: 'object',
    required: ['targetUserId'],
    properties: {
      targetUserId: {
        type: 'string',
        minLength: 1
      }
    }
  }
}