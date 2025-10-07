//  Friends management
import { FastifyRequest, FastifyReply } from 'fastify';
import * as friendService from '../services/friendService';


// Send a friend request to another user
export async function sendFriendRequest(req: FastifyRequest, reply: FastifyReply) {
  const { username } = req.body as { username: string };
  const senderId = req.user?.sub;
  if (!senderId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  if (!username) {
    return reply.status(400).send({ error: 'Username is required' });
  }

  await friendService.sendFriendRequest(senderId, username);

  reply.send({ message: `Friend request sent to ${username}` });
}
