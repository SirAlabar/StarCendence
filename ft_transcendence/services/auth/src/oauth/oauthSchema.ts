

export const googleOauthUsernameSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
       username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9._-]+$',
      }
    }
  },
}