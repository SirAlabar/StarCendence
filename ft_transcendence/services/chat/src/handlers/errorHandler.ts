import { HttpError } from '../utils/HttpError';

export function fastifyErrorHandler(error: any, request: any, reply: any) {
  // Log the error
  request.log.error(error);

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({ error: 'Invalid or malformed JWT token' });
  }

  if (error.name === 'TokenExpiredError') {
    return reply.status(401).send({ error: 'JWT token has expired' });
  }

  if (error.name === 'NotBeforeError') {
    return reply.status(401).send({ error: 'JWT token not active' });
  }

  if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    return reply.status(400).send({ error: 'Malformed JSON in request body' });
  }

  if (error.code === 'ECONNREFUSED') {
    return reply.status(503).send({ error: 'Service unavailable' });
  }

  // Handle HttpError instances with custom status codes
  if (error instanceof HttpError) {
    return reply.status(error.statusCode).send({ 
      message: error.message 
    });
  }
  
  // Handle Fastify validation errors from schema
  if (error.validation) {
    return reply.status(400).send({ 
      message: 'Validation error',
      details: error.validation 
    });
  }
  
  // Default server error for unhandled errors
  return reply.status(500).send({ 
    message: 'Internal server error' 
  });
}
