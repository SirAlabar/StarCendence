import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as friendSchema from './friendSchema';
import * as friendsController from './friendController';
import * as friendRepository from './friendRepository';


export async function friendRoutes(fastify: FastifyInstance) {

   //debug
  fastify.get('/friendships', async (request: any, reply: any) => {
    return await friendRepository.findAllFriendships();
  });

  fastify.get('/friends',
  {
    preHandler: [verifyUserToken]
  },
  friendsController.getFriends);

  fastify.get('/friend-requests',
  {
    preHandler: [verifyUserToken]
  },
  friendsController.getFriendRequests);

  fastify.get('/friend-requests/sent',
  {
    preHandler: [verifyUserToken]
  },
  friendsController.getSentFriendRequests);

  fastify.post('/friend-request',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.sendFriendRequestSchema
  },
  friendsController.sendFriendRequest);

  fastify.post('/friend-request/:requestId/accept',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.requestIdSchema
  },
  friendsController.acceptFriendRequest);

  fastify.post('/friend-request/:requestId/decline',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.requestIdSchema
  },
  friendsController.declineFriendRequest);

  fastify.delete('/friend-request/:requestId',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.requestIdSchema
  },
  friendsController.cancelFriendRequest);

  fastify.delete('/friends/:friendId',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.friendIdSchema
  },
  friendsController.unfriend);
}

// export async function friendRoutes(fastify: FastifyInstance) {
//   fastify.get('/friends');
//   // GET /friend-requests (incoming),
//   // GET /friend-requests/sent,
//   // POST /friend-requests/:recipientId (send request),
//   // POST /friend-requests/:requestId/accept,
//   // POST /friend-requests/:requestId/decline,
//   // DELETE /friend-requests/:requestId (cancel/remove),
//   // DELETE /friends/:friendId (unfriend).
// }