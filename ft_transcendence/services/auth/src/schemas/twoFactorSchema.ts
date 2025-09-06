// Two-Factor Authentication Schemas
export const setupTwoFactorSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        otpauthUrl: { type: 'string' }, // For QR code generation
        qrCodeDataURL: { type: 'string' }, // Data URL for QR image
        secret: { type: 'string' } // (optional, for backup)
      },
      required: ['otpauthUrl', 'qrCodeDataURL', 'secret']
    }
  }
};

// Schemas for request validation and response structure
export const verifyTwoFactorSchema = {
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', minLength: 6, maxLength: 6 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      },
      required: ['success']
    }
  }
};


// Disable 2FA schema
export const disableTwoFactorSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      },
      required: ['success']
    }
  }
};