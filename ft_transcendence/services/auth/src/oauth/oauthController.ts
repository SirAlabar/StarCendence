import { FastifyReply, FastifyRequest } from 'fastify'
import * as oauthService from './oauthService'
import { HttpError } from '../utils/HttpError'
import { getGoogleClientId } from '../utils/getSecrets'
import * as tokenService from '../token/tokenService'

// Handler to initiate Google OAuth flow
export async function googleOAuthHandler( req: FastifyRequest, reply: FastifyReply ) {
  const redirectUri = `https://localhost:8443/api/auth/oauth/google/callback`

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
  const redirectUri = `https://localhost:8443/api/auth/oauth/google/callback`

  if (!code) {
    throw new HttpError('Authorization code is required', 400)
  }

  const googleTokens = await oauthService.getGoogleTokens(code, redirectUri)
  const userInfo = await oauthService.getGoogleUserInfo(googleTokens.access_token)

  const result = await oauthService.handleOauthLogin(userInfo)

  if (result.needsUsername) {
    return reply.send({ tempToken: result.tempToken, needsUsername: true })
  }

  if (!result.user || !result.tokens) {
    throw new HttpError('Failed to retrieve user or tokens', 500)
  }

  return reply.send(result.tokens)
}

// Handler to set username for OAuth user
export async function googleOAuthUsernameHandler( req: FastifyRequest, reply: FastifyReply ) {
  const tempToken = req.headers['authorization']?.split(' ')[1];
  if (!tempToken) {
    throw new HttpError('Missing or invalid authorization header', 400)
  }

  const payload = await tokenService.verifyAccessToken(tempToken)
  if (!payload || !payload.sub) {
    throw new HttpError('Invalid temporary token', 401)
  }

  const { username } = req.body as { username: string }
  const oauthId = payload.sub
  const email = payload.email

  if (!oauthId || !email || !username) {
    throw new HttpError('Invalid data', 400)
  }

  const newUser = await oauthService.createNewOauthUser(oauthId, email, username)
  if (!newUser) {
    throw new HttpError('Failed to create new user', 500)
  }

  if (!newUser.id || !newUser.email || !newUser.username) {
    throw new HttpError('Incomplete user data', 500)
  }

  const tokens = await tokenService.generateTokens(newUser.id, newUser.email, newUser.username);
  reply.send({ success: true, user: newUser, tokens })
}
