import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as refreshController from './refreshController';
import * as authSchema from '../auth/authSchema';
import  * as tokenController from './tokenController';
  
export async function tokenRoutes(fastify: FastifyInstance) {

	fastify.post('/internal/token/verify', tokenController.tokenVerify);

  fastify.post('/token/refresh',
	{
		schema: authSchema.refreshTokenSchema
	},
	refreshController.refreshAccessToken);
}