import { FastifyReply, FastifyRequest } from 'fastify'
import * as oauthService from './oauthService'
import { HttpError } from '../utils/HttpError'
import { getGoogleClientId } from '../utils/getSecrets'

// Handler to initiate Google OAuth flow
export async function googleOAuthHandler( req: FastifyRequest, reply: FastifyReply ) {
  const redirectUri = `http://localhost/api/auth/oauth/google/callback`

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: 'someRandomState'
  })

  reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}

// Handler for Google OAuth callback
export async function googleOAuthCallbackHandler( req: FastifyRequest, reply: FastifyReply ) {
  const { code, state } = req.query as { code: string; state: string }
  const redirectUri = `http://localhost/api/auth/oauth/google/callback`

  if (!code) {
    throw new HttpError('Authorization code is required', 400)
  }

  const tokens = await oauthService.getGoogleTokens(code, redirectUri)
  const userInfo = await oauthService.getGoogleUserInfo(tokens.access_token)
  const tokenInfo = await oauthService.getGoogleIdTokenInfo(tokens.id_token)
  console.log('Google ID Token Info:', tokenInfo)
  console.log('Google User Info:', userInfo)

  // const appUser = await oauthService.findOrCreateUser(userInfo)
  
  reply.send({ tokens })
}