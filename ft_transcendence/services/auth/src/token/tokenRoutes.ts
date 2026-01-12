import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as refreshController from './refreshController';
import * as authSchema from '../auth/authSchema';
import  * as tokenController from './tokenController';
import { verifyUserToken } from '../middleware/authMiddleware';
  
export async function tokenRoutes(fastify: FastifyInstance) {

	fastify.post('/internal/token/verify', tokenController.tokenVerify);

  fastify.post('/token/refresh',
	{
		preHandler: [verifyUserToken],
		schema: authSchema.refreshTokenSchema
	},
	refreshController.refreshAccessToken);
}