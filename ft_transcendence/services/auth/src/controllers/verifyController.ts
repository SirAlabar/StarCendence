// Verify token endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';

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

export async function verify(req: FastifyRequest, reply: FastifyReply) {
  return { success: true, user: req.user };
}