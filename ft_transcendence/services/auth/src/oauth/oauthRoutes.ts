import { FastifyInstance } from 'fastify'
import * as oauthSchema from './oauthSchema'
import * as oauthController from './oauthController'

export async function oauthRoutes(fastify: FastifyInstance) {
  fastify.get('/oauth/google',
  {
    schema: oauthSchema.googleOAuthRequestSchema
  },
  oauthController.googleOAuthHandler)

  fastify.get('/oauth/google/callback',
  {
    schema: oauthSchema.googleOAuthCallbackSchema
  },
  oauthController.googleOAuthCallbackHandler)

}