import { FastifyRequest, FastifyReply } from 'fastify';
import * as internalService from './internalService';

export async function saveMessage(req: FastifyRequest, reply: FastifyReply) {
  const { fromUserId, roomId, message } = req.body as { fromUserId: string; roomId: string; message: string };
  if (!fromUserId || !roomId || !message) {
    return reply.status(400).send({ error: 'Missing required fields' });
  }

  await internalService.saveMessage(fromUserId, roomId, message);

  reply.send({ status: 'success' });
}