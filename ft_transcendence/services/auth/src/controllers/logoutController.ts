// Logout endpoint logic
import { FastifyRequest, FastifyReply } from 'fastify';
import * as sessionService from '../services/sessionService';
import { HttpError } from '../utils/HttpError';

export const logoutSchema = {
  body: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { 
        type: 'string',
        minLength: 1
      }
    }
  }
};

export const logoutAllDevicesSchema = {
  body: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { 
        type: 'string',
        minLength: 1
      }
    }
  }
};

interface LogoutRequestBody {
  refreshToken: string;
}

interface LogoutAllDevicesRequestBody {
  userId: string;
}

// Logout from current session/device
export async function logout(req: FastifyRequest<{ Body: LogoutRequestBody }>, reply: FastifyReply) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new HttpError('Refresh token is required', 400);
  }

  await sessionService.logoutUser(refreshToken);

  return reply.send({ 
    success: true, 
    message: 'Successfully logged out from this device' 
  });
}

// Logout from all devices
export async function logoutAllDevices(req: FastifyRequest<{ Body: LogoutAllDevicesRequestBody }>, reply: FastifyReply) {
  const { userId } = req.body;

  if (!userId) {
    throw new HttpError('User ID is required', 400);
  }

  await sessionService.logoutAllDevices(userId);

  return reply.send({ 
    success: true, 
    message: 'Successfully logged out from all devices' 
  });
}
