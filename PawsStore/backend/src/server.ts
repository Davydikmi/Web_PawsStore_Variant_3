import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.js';

const envPath = fileURLToPath(new URL('../.env', import.meta.url));

if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

const app = await buildApp({ logger: true });
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
