import { FastifyInstance } from 'fastify';
import * as refreshController from '../controllers/refreshController';
import * as authSchema from '../schemas/authSchema';

// Internal routes for token refresh
export async function internalRoutes(fastify: FastifyInstance){
	fastify.post('/refreshAccessToken',
	{
		schema: authSchema.refreshTokenSchema
	},
	refreshController.refreshAccessToken);
}
