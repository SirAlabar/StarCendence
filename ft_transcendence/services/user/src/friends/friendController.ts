//  Friends management
import { FastifyRequest, FastifyReply } from 'fastify';
import * as friendService from './friendService';

// GET /friends - Get list of friends
export async function getFriends(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const friends = await friendService.getFriends(userId);

  return reply.send(friends);
}

// GET /friend-requests - Get incoming friend requests
export async function getFriendRequests(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const requests = await friendService.getFriendRequests(userId);

  return reply.send(requests);
}

// GET /friend-requests/sent - Get sent friend requests
export async function getSentFriendRequests(req: FastifyRequest, reply: FastifyReply) {
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  const requests = await friendService.getSentFriendRequests(userId);

  return reply.send(requests);
}

// POST /friend-request - Send a friend request, if reciprocal request exists, accept it
export async function sendFriendRequest(req: FastifyRequest, reply: FastifyReply) {
  const { username } = req.body as { username: string };
  const senderId = req.user?.sub;
  if (!senderId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  if (!username) {
    return reply.status(400).send({ error: 'Username is required' });
  }

  const result = await friendService.sendFriendRequest(senderId, username);

  if (result === 'ACCEPTED') {
    reply.send({ message: `Friend request accepted` });
  } else {
    reply.send({ message: `Friend request sent to ${username}` });
  }
}

// POST /friend-requests/:requestId/accept - Accept a friend request
export async function acceptFriendRequest(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { requestId } = req.params as { requestId: number };
    const userId = req.user?.sub;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized: user id missing' });
    }
    if (!requestId) {
      return reply.status(400).send({ error: 'Request ID is required' });
    }

    await friendService.acceptFriendRequest(requestId, userId);
    return reply.send({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('❌ acceptFriendRequest error:', err);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
}


// POST /friend-requests/:requestId/decline - Decline a friend request
export async function declineFriendRequest(req: FastifyRequest, reply: FastifyReply) {
  const { requestId } = req.params as { requestId: number };
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  if (!requestId) {
    return reply.status(400).send({ error: 'Request ID is required' });
  }
  
  await friendService.rejectFriendRequest(requestId, userId);

  reply.send({ message: 'Friend request declined' });
}

// DELETE /friend-requests/:requestId - Cancel a sent friend request
export async function cancelFriendRequest(req: FastifyRequest, reply: FastifyReply) {
  const { requestId } = req.params as { requestId: number };
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }
  
  if (!requestId) {
    return reply.status(400).send({ error: 'Request ID is required' });
  }

  await friendService.cancelFriendRequest(requestId, userId);
  
  reply.send({ message: 'Friend request canceled' });
}

// DELETE /friends/:friendId - Unfriend a user
export async function unfriend(req: FastifyRequest, reply: FastifyReply) {
  const { friendId } = req.params as { friendId: string };
  const userId = req.user?.sub;
  if (!userId) {
    return reply.status(401).send({ error: 'Unauthorized: user id missing' });
  }

  if (!friendId) {
    return reply.status(400).send({ error: 'Friend ID is required' });
  }

  await friendService.unfriend(friendId, userId);

  reply.send({ message: 'Unfriended successfully' });
}