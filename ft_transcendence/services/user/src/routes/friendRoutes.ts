import { FastifyInstance } from 'fastify';
import { verifyUserToken } from '../middleware/authMiddleware';
import * as friendSchema from '../schemas/friendSchema';
import * as friendsController from '../controllers/friendsController';


export async function friendRoutes(fastify: FastifyInstance) {
  // fastify.get('/friends',
  // {
  //   preHandler: [verifyUserToken]
  // },
  // friendsController.getFriends);

  // fastify.get('/friend-requests',
  // {
  //   preHandler: [verifyUserToken]
  // },
  // friendsController.getFriendRequests);

  // fastify.get('/friend-requests/sent',
  // {
  //   preHandler: [verifyUserToken]
  // },
  // friendsController.getSentFriendRequests);

  fastify.post('/friend-requests',
  {
    preHandler: [verifyUserToken],
    schema: friendSchema.sendFriendRequestSchema
  },
  friendsController.sendFriendRequest);
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