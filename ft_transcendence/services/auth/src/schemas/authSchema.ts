// Registration schema
export const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'username'],
    properties: {
      email: { 
        type: 'string', 
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
        maxLength: 255
      },
      password: { 
        type: 'string',
        minLength: 8,
        maxLength: 72,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.])[A-Za-z\\d@$!%*?&.]{8,}$',
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9._-]+$',
      }
    }
  },
};

// Login schema
export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { 
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 100
      },
    }
  }
};

// Refresh token schema
export const refreshTokenSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { 
        type: 'string',
        minLength: 1
      }
    }
  }
};

// Logout schema
export const logoutSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { 
        type: 'string',
        minLength: 1
      }
    }
  }
};

// Verify token schema
export const verifySchema = {
  response: {
    200: {
      type: 'object',
      required: ['success', 'user'],
      properties: {
        success: {
          type: 'boolean'
        },
        user: {
          type: 'object',
          required: ['sub', 'email', 'username', 'type'],
          properties: {
            sub: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            username: {
              type: 'string'
            },
            type: {
              type: 'string'
            },
            iat: {
              type: 'number'
            },
            exp: {
              type: 'number'
            },
            iss: {
              type: 'string'
            }
          }
        }
      }
    },
    401: {
      type: 'object',
      properties: {
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};