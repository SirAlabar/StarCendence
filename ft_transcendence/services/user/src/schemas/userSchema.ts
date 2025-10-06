// User creation in user service, internal route /create-user
export const createUserSchema = {
  body: {
    type: 'object',
    required: ['authId', 'email', 'username'],
    properties: {
      authId: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 30 }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' }
          }
        }
      }
    }
  }
};
