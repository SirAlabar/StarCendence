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

// User profile update schema for PUT /profile
export const updateUserProfileSchema = {
  body: {
    type: 'object',
    required: ['bio', 'avatarUrl'],
    additionalProperties: false,
    properties: {
      bio: { type: 'string', maxLength: 160, nullable: true },
      avatarUrl: { type: 'string', format: 'uri', nullable: true }
    },
  }
};