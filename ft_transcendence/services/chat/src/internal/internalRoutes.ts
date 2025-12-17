import { FastifyInstance } from 'fastify';
import * as internalSchema from './internalSchema';
import * as internalController from './internalController';

export async function internalRoutes(fastify: FastifyInstance) {
  fastify.post('/save-message',
  {
    schema: internalSchema.saveMessageSchema,
  },
  internalController.saveMessage);

}