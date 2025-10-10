// User creation in user service, internal route /create-user
import { UserStatus } from "./user.types";

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
    required: ['bio'],
    additionalProperties: false,
    properties: {
      bio: { type: 'string', maxLength: 160, nullable: true },
    },
  }
};


export const updateUserStatusSchema = {
  body: {
    type: 'object',
    required: ['userId', 'status'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      status: { type: 'string', enum: Object.values(UserStatus)}
    }
  },
}
