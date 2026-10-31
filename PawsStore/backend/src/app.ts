import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from 'fastify';
import jwt from '@fastify/jwt';
import { closeRedis } from './lib/redis.js';
import { authRoutes } from './routes/auth.routes.js';
import { cartRoutes } from './routes/cart.routes.js';
import { productRoutes } from './routes/product.routes.js';

export async function buildApp(
  options: FastifyServerOptions = {},
): Promise<FastifyInstance> {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = Fastify(options);

  await app.register(jwt, {
    secret: jwtSecret,
    sign: { expiresIn: '24h' },
  });

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(cartRoutes, { prefix: '/api/cart' });
  await app.register(productRoutes, { prefix: '/api/products' });

  app.addHook('onClose', async () => {
    await closeRedis();
  });

  return app;
}
