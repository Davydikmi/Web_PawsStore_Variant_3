import type { Role } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

export function requireRole(...allowedRoles: Role[]) {
  return async function roleGuard(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const user = request.user;

    if (!user) {
      reply.code(401).send({ message: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      reply.code(403).send({ message: 'Forbidden' });
    }
  };
}

export const requireAdmin = requireRole('admin');
