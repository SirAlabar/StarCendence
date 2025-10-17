import { FastifyInstance } from 'fastify'
import * as oauthSchema from './oauthSchema'
import * as oauthController from './oauthController'
import { verifyUserToken } from '../middleware/authMiddleware';

export async function oauthRoutes(fastify: FastifyInstance) {
  fastify.get('/oauth/google',
  {
    // schema: oauthSchema.googleOAuthRequestSchema
  },
  oauthController.googleOAuthHandler)

  fastify.get('/oauth/google/callback',
  {
    // schema: oauthSchema.googleOAuthCallbackSchema
  },
  oauthController.googleOAuthCallbackHandler)

  fastify.post('/oauth/google/set-username',
  {
    // preHandler: verifyUserToken,
    schema: oauthSchema.googleOauthUsernameSchema
  },
  oauthController.googleOAuthUsernameHandler)
}