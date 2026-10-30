import type { Role } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthBody } from '../schemas/auth.schema.js';
import {
  EmailAlreadyRegisteredError,
  registerUser,
  verifyCredentials,
} from '../services/auth.service.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: { id: string; email: string; role: Role }) {
  return { id: user.id, email: user.email, role: user.role };
}

export async function register(
  request: FastifyRequest<{ Body: AuthBody }>,
  reply: FastifyReply,
) {
  try {
    const user = await registerUser(
      normalizeEmail(request.body.email),
      request.body.password,
    );

    return reply.code(201).send({ user: publicUser(user) });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return reply.code(409).send({ message: error.message });
    }

    throw error;
  }
}

export async function login(
  request: FastifyRequest<{ Body: AuthBody }>,
  reply: FastifyReply,
) {
  const user = await verifyCredentials(
    normalizeEmail(request.body.email),
    request.body.password,
  );

  if (!user) {
    return reply.code(401).send({ message: 'Invalid email or password' });
  }

  const token = request.server.jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return reply.send({ token, user: publicUser(user) });
}
