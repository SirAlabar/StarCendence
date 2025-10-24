/**
 * Custom HTTP Error class for consistent error handling
 */
export class HttpError extends Error
{
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true)
  {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // // Maintains proper stack trace for where error was thrown
    // Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a 400 Bad Request error
 */
export function badRequest(message: string): HttpError
{
  return new HttpError(message, 400);
}

/**
 * Creates a 401 Unauthorized error
 */
export function unauthorized(message: string = 'Unauthorized'): HttpError
{
  return new HttpError(message, 401);
}

/**
 * Creates a 403 Forbidden error
 */
export function forbidden(message: string = 'Forbidden'): HttpError
{
  return new HttpError(message, 403);
}

/**
 * Creates a 404 Not Found error
 */
export function notFound(message: string): HttpError
{
  return new HttpError(message, 404);
}

/**
 * Creates a 409 Conflict error
 */
export function conflict(message: string): HttpError
{
  return new HttpError(message, 409);
}

/**
 * Creates a 500 Internal Server Error
 */
export function internalError(message: string = 'Internal server error'): HttpError
{
  return new HttpError(message, 500);
}
