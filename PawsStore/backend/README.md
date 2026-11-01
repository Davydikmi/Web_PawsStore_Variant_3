# PawsStore Backend

Fastify 5 + TypeScript + Prisma + PostgreSQL + Redis. Часть учебного проекта PawsStore; общая инструкция и сценарий демонстрации — в [корневом README](../../README.md).

## Запуск через Docker Compose

```powershell
Copy-Item .env.example .env
# задайте JWT_SECRET в .env
docker compose up --build
```

Поднимаются:

- `postgres` — PostgreSQL 15, volume `pgdata`;
- `redis` — Redis 7;
- `migrate` — применяет миграции и seed, затем завершается;
- `app` — API на `http://localhost:3000` (порт задаётся `APP_PORT`).

Swagger: `http://localhost:3000/docs`, health: `http://localhost:3000/health`.

## Локальный запуск без Docker

Нужны PostgreSQL и Redis по адресам из `.env`.

```powershell
npm ci
npx prisma migrate dev
npm run db:seed
npm run dev
```

`npm run dev` собирает TypeScript и запускает `dist/server.js` через nodemon.

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | разработка с пересборкой |
| `npm run build` | компиляция TypeScript |
| `npm start` | запуск собранного приложения |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` |
| `npm run db:seed` | seed: админ, `SAVE10`, 6 товаров |
| `npm run db:studio` | Prisma Studio |
| `npm run prisma:generate` | генерация Prisma Client |

## Переменные окружения

Шаблон — [.env.example](.env.example). Основные:

| Переменная | Обязательна | Описание |
|---|---|---|
| `JWT_SECRET` | да | секрет подписи JWT |
| `DATABASE_URL` | да | PostgreSQL для Prisma |
| `REDIS_URL` | да | Redis |
| `CORS_ORIGIN` | нет | origin фронтенда (по умолчанию `*`) |
| `PORT` | нет | порт приложения (3000) |
| `APP_PORT` | нет | внешний порт compose (3000) |
| `POSTGRES_USER/PASSWORD/DB` | нет | параметры контейнера Postgres |
| `ADMIN_EMAIL/ADMIN_PASSWORD` | нет | демо-админ для seed |

## Структура

```
prisma/
  schema.prisma       модели и связи
  migrations/         миграции
  seed.mjs            админ + SAVE10 + демо-товары
  data/products.json  демо-каталог
src/
  app.ts              сборка Fastify, CORS, Swagger, JWT
  server.ts           загрузка .env и запуск
  routes/             auth, products, cart, health
  controllers/        HTTP-слой
  services/           Prisma-логика, кэш, корзина
  middleware/         JWT и роли
  schemas/            JSON Schema валидации
  lib/                Prisma и Redis
```

## Демо-данные

- `admin@pawsstore.local` / `admin12345` (или `ADMIN_*` из `.env`);
- промокод `SAVE10` — 10%;
- 6 товаров с тремя изображениями (локальные URL фронтенда).

Seed идемпотентен: товары создаются только при отсутствии, админ обновляется.

## Кэш

`GET /api/products` кэшируется в Redis с TTL 120 секунд. Ключ — `products:<query>`. Любая админская запись (`POST/PATCH/DELETE /api/products`) удаляет все ключи `products:*`.

## Особенности

- Удаление товара каскадно удаляет `CartItem`.
- `images` при создании/изменении товара — минимум 3.
- Налог не начисляется: итог корзины считается как `subtotal − discount`.
- Swagger-схемы защищённых эндпоинтов используют `bearerAuth`.
