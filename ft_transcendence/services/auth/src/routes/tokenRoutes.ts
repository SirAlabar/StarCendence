import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as refreshController from '../controllers/refreshController';
import * as authSchema from '../schemas/authSchema';
import  * as tokenController from '../controllers/tokenController';
  
export async function tokenRoutes(fastify: FastifyInstance) {

	fastify.post('/internal/token/verify', tokenController.tokenVerify);

  fastify.post('/token/refresh',
	{
		schema: authSchema.refreshTokenSchema
	},
	refreshController.refreshAccessToken);
}