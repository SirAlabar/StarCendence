import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  username: string;
  type: string;
  iat?: number;
  exp?: number;
  iss?: string;
}
