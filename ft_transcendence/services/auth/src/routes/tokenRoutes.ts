import { FastifyInstance } from 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as refreshController from '../controllers/refreshController';
import * as authSchema from '../schemas/authSchema';
import { authenticateToken } from '../middleware/authMiddleware';
  
export async function tokenRoutes(fastify: FastifyInstance) {

	fastify.post('/internal/token/verify',
	{	preHandler: [authenticateToken] },
	async (req: FastifyRequest, reply: FastifyReply) => {
		return reply.send({ user: req.user });
	});

  fastify.post('/token/refresh',
	{
		schema: authSchema.refreshTokenSchema
	},
	refreshController.refreshAccessToken);
}