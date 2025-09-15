import { HttpError } from '../utils/HttpError';

export function fastifyErrorHandler(error: any, request: any, reply: any) {
  // Log the error
  request.log.error(error);

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return reply.status(401).send({ error: 'Invalid or malformed JWT token' });
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
