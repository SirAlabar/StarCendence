import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Registry } from 'prom-client';
import { getMetricsUser, getMetricsPass } from '../utils/getSecrets';

const METRICS_USER = getMetricsUser();
const METRICS_PASS = getMetricsPass();

export async function metrics(fastify: FastifyInstance, register: Registry) {
  fastify.get('/metrics', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!METRICS_USER || !METRICS_PASS) {
      fastify.log.error('Metrics credentials are not configured');
      return reply.code(500).send();
    }

    const auth = req.headers.authorization;

    if (!auth?.startsWith('Basic ')) {
      return reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="metrics"')
        .send();
    }

    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    const user = sep >= 0 ? decoded.slice(0, sep) : '';
    const pass = sep >= 0 ? decoded.slice(sep + 1) : '';

    if (user !== METRICS_USER || pass !== METRICS_PASS) {
      return reply.code(403).send();
    }

    return reply
      .header('Content-Type', register.contentType)
      .header('Cache-Control', 'no-store')
      .send(await register.metrics());
  });
}
