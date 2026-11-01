import type { FastifyInstance } from 'fastify';
import { login, register } from '../controllers/auth.controller.js';
import { authBodySchema } from '../schemas/auth.schema.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/register',
    { schema: { tags: ['auth'], summary: 'Register a customer', body: authBodySchema } },
    register,
  );
  app.post(
    '/login',
    { schema: { tags: ['auth'], summary: 'Login and receive a JWT', body: authBodySchema } },
    login,
  );
}
