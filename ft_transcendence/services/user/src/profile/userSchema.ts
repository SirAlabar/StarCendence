import { UserStatus } from "./user.types";

// User creation in user service, internal route /create-user
export const createUserSchema = {
  body: {
    type: 'object',
    required: ['authId', 'email', 'username'],
    properties: {
      authId: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      username: { type: 'string', minLength: 3, maxLength: 30 },
      oauthEnabled: { type: 'boolean' }
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

// User search schema for GET /profile/:username
export const searchUserByUsernameSchema = {
  params: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 30 }
    }
  }
};

// User status update schema for internal PUT /internal/update-user-status
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

// User search schema for GET /users/search
export const searchUsersSchema = {
  querystring: 
  {
    type: 'object',
    required: ['q'],
    properties: {
      q: { type: 'string', minLength: 2, maxLength: 50 }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          username: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true },
          status: { type: 'string', enum: Object.values(UserStatus) }
        }
      }
    }
  }
};

// Update two-factor authentication state schema for internal PATCH /internal/update-2fa-state
export const updateTwoFactorStateSchema = {
  body: {
    type: 'object',
    required: ['userId', 'twoFactorEnabled'],
    properties: {
      userId: { type: 'string', format: 'uuid' },
      twoFactorEnabled: { type: 'boolean' }
    }
  }
};

// User settings update schema for PATCH /settings
export const updateUserSettingsSchema = {
  body: {
    type: 'object',
    required:['showOnlineStatus','allowFriendRequests', 'showGameActivity',
      'notifyFriendRequests','notifyGameInvites','notifyMessages'],
    properties: {
      showOnlineStatus: { type: 'boolean' },
      allowFriendRequests: { type: 'boolean' },
      showGameActivity: { type: 'boolean' },
      notifyFriendRequests: { type: 'boolean' },
      notifyGameInvites: { type: 'boolean' },
      notifyMessages: { type: 'boolean' }
    },
    additionalProperties: false
  }
};

export const deleteUserProfileSchema = {
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', format: 'uuid' }
    }
  }
};
