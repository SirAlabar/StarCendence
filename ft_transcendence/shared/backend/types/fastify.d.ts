import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      sub: string;
      email: string;
      username: string;
      type: string;
      iat?: number;
      exp?: number;
      iss?: string;
    };
  }
}
