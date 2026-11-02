import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { closeRedis } from './lib/redis.js';
import { authRoutes } from './routes/auth.routes.js';
import { cartRoutes } from './routes/cart.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { productRoutes } from './routes/product.routes.js';

function getCorsOrigin(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();

  if (!raw || raw === '*') {
    return true;
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function buildApp(
  options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = Fastify(options);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        message: 'Validation failed',
        details: error.validation,
      });
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    return reply.status(500).send({ message: 'Internal server error' });
  });

  await app.register(cors, {
    origin: getCorsOrigin(),
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(helmet, { contentSecurityPolicy: false });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'PawsStore API',
        description: 'REST API for the PawsStore pet shop',
        version: '1.0.0',
      },
      tags: [
        { name: 'auth', description: 'Registration and login' },
        { name: 'products', description: 'Catalog and admin product CRUD' },
        { name: 'cart', description: 'User cart and promo codes' },
        { name: 'health', description: 'Liveness and readiness probes' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  await app.register(jwt, {
    secret: jwtSecret,
    sign: { expiresIn: '24h' },
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(cartRoutes, { prefix: '/api/cart' });
  await app.register(productRoutes, { prefix: '/api/products' });

  app.addHook('onClose', async () => {
    await closeRedis();
  });

  return app;
}
