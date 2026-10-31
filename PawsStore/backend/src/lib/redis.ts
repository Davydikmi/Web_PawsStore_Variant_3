import { Redis } from 'ioredis';

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) {
    return client;
  }

  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error('REDIS_URL environment variable is required');
  }

  client = new Redis(url, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 2,
    retryStrategy: (attempt: number) => Math.min(attempt * 200, 2000),
  });

  client.on('error', (error: Error) => {
    console.error(`[redis] ${error.message}`);
  });

  return client;
}

export async function closeRedis(): Promise<void> {
  if (!client) {
    return;
  }

  const current = client;
  client = null;

  try {
    await current.quit();
  } catch {
    current.disconnect();
  }
}
