# PawsStore — интернет-магазин для животных

Учебный проект для зачёта: полноценный интернет-магазин с каталогом, JWT-аутентификацией, ролями, корзиной, промокодами, админским CRUD, кэшированием каталога в Redis и запуском через Docker Compose.

> **Формат проекта:** только локальный запуск. Облачные сервисы (Supabase, Koyeb, облачное хранилище), CI и автотесты в рамках зачёта не используются. Изображения товаров лежат локально.

---

## Содержание

1. [Возможности](#возможности)
2. [Стек](#стек)
3. [Структура проекта](#структура-проекта)
4. [Подготовка окружения](#подготовка-окружения)
5. [Запуск через Docker Compose](#запуск-через-docker-compose)
6. [Запуск без Docker](#запуск-без-docker)
7. [Демо-данные и сценарий показа](#демо-данные-и-сценарий-показа)
8. [Функционал подробно](#функционал-подробно)
9. [Backend подробно](#backend-подробно)
10. [Frontend кратко](#frontend-кратко)
11. [API](#api)
12. [Переменные окружения](#переменные-окружения)
13. [Ограничения и принятые решения](#ограничения-и-принятые-решения)
14. [Troubleshooting](#troubleshooting)
15. [Git](#git)

---

## Возможности

### Покупатель

- регистрация и вход по email/паролю;
- просмотр каталога с поиском, фильтрами, сортировкой и пагинацией;
- карточка товара со слайдером изображений, характеристиками и похожими товарами;
- корзина на сервере: добавление, изменение количества, удаление;
- проверка остатка товара (`stockQuantity`) при добавлении и изменении;
- применение промокода `SAVE10`;
- расчёт итогов на сервере: `subtotal`, `discount`, `total`.

### Администратор

- вход с ролью `admin`;
- создание, редактирование и удаление товаров;
- валидация полей, включая минимум 3 изображения;
- каскадное удаление позиций корзин при удалении товара;
- автоматическая инвалидация кэша каталога после изменений.

### Инфраструктура

- PostgreSQL 15+ и Prisma ORM;
- Redis-кэш каталога с TTL 120 секунд;
- JWT (24 часа) и bcrypt (10 раундов);
- CORS, Helmet, Swagger UI, health-check;
- Dockerfile с multi-stage build и запуском от `USER node`;
- Docker Compose с PostgreSQL, Redis, миграциями и приложением;
- именованный volume `pgdata` для сохранения БД.

---

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Angular 21, SSR, TypeScript, SCSS, RxJS |
| Backend | Node.js 20, Fastify 5, TypeScript |
| ORM / БД | Prisma 6.19, PostgreSQL 15+ |
| Кэш | Redis 7, ioredis |
| Авторизация | JWT (`@fastify/jwt`), bcryptjs |
| Документация | Swagger / OpenAPI (`@fastify/swagger`) |
| Инфраструктура | Docker, Docker Compose |

---

## Структура проекта

```
.
├── README.md
├── PawsStore/                      Angular-приложение
│   ├── src/app/
│   │   ├── auth/                   login/register, AuthService, guard, interceptor
│   │   ├── catalog/                каталог с фильтрами и пагинацией
│   │   ├── product-page/           карточка товара
│   │   ├── cart/                   корзина и промокод
│   │   ├── header/                 шапка, пользователь, счётчик корзины
│   │   ├── services/               products.service, cart.service
│   │   └── models/                 Product, ProductCategory
│   ├── src/environments/           apiUrl для dev/prod
│   ├── public/assets/images/       локальные изображения товаров
│   └── backend/                    Fastify API
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   ├── seed.mjs
│       │   └── data/products.json
│       ├── src/
│       │   ├── routes/             auth, products, cart, health
│       │   ├── controllers/
│       │   ├── services/           Prisma-логика, кэш, корзина
│       │   ├── middleware/         JWT, роли
│       │   ├── schemas/            JSON Schema
│       │   ├── lib/                Prisma, Redis
│       │   ├── app.ts              сборка Fastify
│       │   └── server.ts           загрузка .env и запуск
│       ├── Dockerfile
│       ├── docker-compose.yml
│       └── .env.example
```

---

## Подготовка окружения

### Что нужно

- **Docker Desktop** — для основного способа запуска (PostgreSQL, Redis, backend).
- **Node.js 20.19+ и npm** — для frontend и локальной разработки backend.
- Свободные порты:
  - `3000` — API;
  - `4200` — Angular dev-server;
  - `5432` и `6379` — только при локальном запуске без Docker.

Проверка Docker:

```powershell
docker version
docker compose version
```

### Переменные окружения

```powershell
cd PawsStore/backend
Copy-Item .env.example .env
```

Откройте `.env` и обязательно задайте `JWT_SECRET`. Например, сгенерировать случайный секрет:

```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
```

Минимально достаточный `.env` для Docker:

```env
JWT_SECRET="длинная-случайная-строка"
APP_PORT=3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=pawsstore
CORS_ORIGIN="http://localhost:4200"
ADMIN_EMAIL=admin@pawsstore.local
ADMIN_PASSWORD=admin12345
```

`DATABASE_URL` и `REDIS_URL` для контейнеров compose подставляются автоматически.

---

## Запуск через Docker Compose

### 1. Запустить Docker Desktop

Дождитесь, пока Docker Engine перейдёт в состояние Running.

### 2. Подготовить `.env`

```powershell
cd PawsStore/backend
Copy-Item .env.example .env
# задайте JWT_SECRET
```

### 3. Поднять стек

```powershell
docker compose up --build
```

Первый запуск занимает несколько минут: скачиваются образы, ставятся зависимости, собирается TypeScript.

Что происходит:

1. `postgres` — поднимается PostgreSQL 15 с volume `pgdata`;
2. `redis` — поднимается Redis 7;
3. `migrate` — ждёт healthy Postgres, применяет `prisma migrate deploy` и запускает `prisma/seed.mjs`;
4. `app` — стартует после успешного завершения `migrate`.

### 4. Проверить

```powershell
docker compose ps
docker compose logs -f app
docker compose logs migrate
```

Ожидаемые адреса:

- API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/docs>
- OpenAPI JSON: <http://localhost:3000/docs/json>
- Health: <http://localhost:3000/health>, readiness: <http://localhost:3000/health/ready>

### 5. Запустить frontend

Docker нужен только для backend. Angular запускается отдельно:

```powershell
cd PawsStore
npm ci
npm start
```

Frontend: <http://localhost:4200>. Он обращается к API по адресу из `src/environments/environment.ts` (`http://localhost:3000`).

### 6. Остановить / сбросить

```powershell
cd PawsStore/backend
docker compose down       # остановить контейнеры
docker compose down -v    # остановить и удалить БД (volume pgdata)
```

После `down -v` следующий `up` заново применит миграции и seed.

### Если порт 3000 занят

В `.env`:

```env
APP_PORT=3001
```

И в `PawsStore/src/environments/environment.ts`:

```ts
apiUrl: 'http://localhost:3001'
```

### Пересборка после изменений

```powershell
docker compose up -d --build
```

При изменении только frontend пересобирать контейнеры не нужно — Angular dev-server обновляется сам.

---

## Запуск без Docker

Понадобятся PostgreSQL и Redis, доступные по `DATABASE_URL` и `REDIS_URL` из `.env` (по умолчанию `localhost:5432` и `localhost:6379`).

Backend:

```powershell
cd PawsStore/backend
npm ci
npx prisma migrate dev
npm run db:seed
npm run build
npm start
```

Или в режиме разработки:

```powershell
npm run dev
```

Frontend:

```powershell
cd PawsStore
npm ci
npm start
```

---

## Демо-данные и сценарий показа

Seed автоматически создаёт:

| Данные | Значение |
|---|---|
| Администратор | `admin@pawsstore.local` / `admin12345` |
| Покупатель | регистрируется через `/register` |
| Промокод | `SAVE10` — 10% |
| Товары | 6 демо-товаров с 3 изображениями каждый |

Креды админа можно переопределить через `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Seed идемпотентен: товары не дублируются, админ обновляется.

### Сценарий для зачёта

1. Открыть <http://localhost:3000/docs>.
2. Выполнить `POST /api/auth/login` с админскими кредами.
3. Скопировать `token`, нажать **Authorize** в Swagger и вставить токен (без слова `Bearer` — Swagger добавит сам).
4. Создать товар через `POST /api/products` (минимум 3 URL изображений), проверить `GET /api/products`, затем `PATCH` и `DELETE`.
5. Открыть frontend, зарегистрировать покупателя на `/register`.
6. В каталоге проверить поиск, фильтры по цене/рейтингу, сортировку.
7. Добавить товары в корзину, изменить количество, удалить позицию.
8. Применить `SAVE10` — проверить, что `subtotal`, `discount` и `total` пересчитаны сервером.
9. После админского изменения товара обновить каталог — данные должны быть актуальны (кэш инвалидирован).

> Пагинация в UI появляется при количестве товаров больше `limit = 12`. В seed их 6; для демонстрации пагинации можно создать ещё товары через админский API или запросить `GET /api/products?page=2&limit=2` в Swagger.

---

## Функционал подробно

### Роли

| Роль | Возможности |
|---|---|
| `customer` | каталог, корзина, промокод, свои данные |
| `admin` | всё выше + создание/редактирование/удаление товаров |

Роль хранится в БД и в JWT. Проверка выполняется на backend, фронтенд лишь скрывает/показывает элементы.

### Каталог

- публичный, без авторизации;
- поиск по названию и описанию без учёта регистра;
- фильтры по цене, рейтингу и категории;
- сортировка по цене, названию, рейтингу;
- пагинация на уровне SQL, без загрузки всех товаров в память;
- карточка товара по UUID с похожими товарами той же категории.

### Корзина

- привязана к `userId` из JWT;
- создаётся автоматически при первом добавлении;
- хранится в PostgreSQL, переживает перезагрузку страницы и перелогин;
- количества ограничены остатком (`stockQuantity`);
- чужие позиции недоступны (404);
- итоги считаются на сервере.

Формулы:

```
subtotal = Σ(price × quantity)
discount = round(subtotal × discountPercentage / 100)
total    = round(subtotal − discount)
```

Налог не начисляется.

### Промокод

- `code` приводится к верхнему регистру и обрезается;
- проверяется наличие в БД, `isActive`, `expiresAt`;
- повторное применение к корзине запрещено (409);
- пустая корзина — 400;
- скидка сохраняется в `Cart.discount`, процент — в связанном `PromoCode`.

### Кэш каталога

- кэшируется только `GET /api/products`;
- ключ: `products:<нормализованная query-строка>`;
- TTL: 120 секунд;
- любое создание/изменение/удаление товара удаляет все ключи `products:*`;
- персональные данные (корзина, пользователи) не кэшируются;
- при недоступности Redis API работает без кэша (fail-open).

---

## Backend подробно

### Архитектура

Fastify-приложение собирается в [`src/app.ts`](PawsStore/backend/src/app.ts):

- `@fastify/cors` — CORS;
- `@fastify/helmet` — security-заголовки;
- `@fastify/swagger` + `@fastify/swagger-ui` — документация `/docs`;
- `@fastify/jwt` — проверка и подпись токенов;
- глобальный error handler;
- роуты `health`, `/api/auth`, `/api/products`, `/api/cart`.

[`src/server.ts`](PawsStore/backend/src/server.ts) загружает `.env`, собирает приложение и слушает порт. Если `JWT_SECRET` не задан, приложение не стартует.

Слои:

| Слой | Ответственность |
|---|---|
| `routes/` | регистрация URL, JSON Schema, middleware |
| `controllers/` | HTTP-ответы, коды ошибок |
| `services/` | Prisma-запросы, кэш, бизнес-правила |
| `middleware/` | проверка JWT и ролей |
| `schemas/` | валидация body/query/params |
| `lib/` | singleton Prisma и Redis |

### Модели данных

Полная схема — [`prisma/schema.prisma`](PawsStore/backend/prisma/schema.prisma).

**User**

| Поле | Тип | Особенности |
|---|---|---|
| `id` | UUID | PK |
| `email` | String | unique, нормализуется в lowercase |
| `passwordHash` | String | bcrypt, 10 раундов |
| `role` | enum `Role` | `customer` / `admin`, default `customer` |
| `createdAt` | DateTime | default now |

**Product**

| Поле | Тип | Особенности |
|---|---|---|
| `id` | UUID | PK |
| `title` | String | название |
| `description` | String | полное описание |
| `shortDescription` | String? | краткое описание |
| `price` | Decimal(10,2) | в API отдаётся числом |
| `rating` | Float | 0–5 |
| `reviews` | Int | количество отзывов |
| `images` | String[] | минимум 3 URL при создании |
| `highlights` | String[] | буллеты |
| `specifications` | Json? | характеристики |
| `category` | enum `ProductCategory`? | `food/toy/accessory/beds/furniture` |
| `stockQuantity` | Int | остаток |
| `createdAt` | DateTime | default now |

**Cart**

| Поле | Тип | Особенности |
|---|---|---|
| `id` | UUID | PK |
| `userId` | UUID | unique, 1 корзина на пользователя |
| `promoCodeId` | UUID? | текущий промокод |
| `discount` | Float | сумма скидки |
| `createdAt` | DateTime | default now |

**CartItem**

| Поле | Тип | Особенности |
|---|---|---|
| `id` | UUID | PK |
| `cartId` | UUID | FK → Cart, Cascade |
| `productId` | UUID | FK → Product, Cascade |
| `quantity` | Int | > 0 |

Уникальность: `@@unique([cartId, productId])`.

**PromoCode**

| Поле | Тип | Особенности |
|---|---|---|
| `id` | UUID | PK |
| `code` | String | unique |
| `discountPercentage` | Float | процент скидки |
| `isActive` | Boolean | default true |
| `expiresAt` | DateTime? | null = бессрочный |

### Аутентификация

**Регистрация** — `POST /api/auth/register`

- body: `email`, `password`;
- email проверяется на формат, пароль — минимум 6 символов;
- email приводится к lowercase;
- пароль хешируется bcrypt (10 раундов);
- роль по умолчанию — `customer`;
- дубликат email → `409`;
- успех → `201 { user: { id, email, role } }`.

**Логин** — `POST /api/auth/login`

- проверка email/пароля через `bcrypt.compare`;
- неверные данные → `401` без раскрытия причины;
- успех → `200 { token, user: { id, email, role } }`;
- JWT payload: `sub`, `email`, `role`;
- срок жизни — 24 часа;
- секрет — `JWT_SECRET`.

**Middleware**

- `authenticate` — `request.jwtVerify()`, ошибка → `401`;
- `requireRole('admin')` — проверка роли, нехватка прав → `403`;
- `request.user` типизирован через module augmentation.

### Каталог

`GET /api/products` — публичный.

Query-параметры:

| Параметр | По умолчанию | Поведение |
|---|---|---|
| `page` | 1 | integer ≥ 1 |
| `limit` | 12 | integer ≥ 1 |
| `search` | — | `ILIKE` по `title` и `description` |
| `min_price` | — | `price >=` |
| `max_price` | — | `price <=` |
| `min_rating` | — | `rating >=` |
| `category` | — | одно из значений enum |
| `sort_by` | `createdAt` | `price`, `title`, `rating` |
| `order` | `desc` для createdAt, `asc` для явной сортировки | `asc` / `desc` |

Особенности:

- `where` и `orderBy` собираются для Prisma;
- `count` и `findMany` выполняются в `$transaction`;
- пагинация через `skip`/`take` — SQL `LIMIT/OFFSET`;
- tie-breaker `id asc` для стабильной выдачи;
- ответ:

```json
{
  "items": [],
  "meta": {
    "total_items": 0,
    "total_pages": 0,
    "current_page": 1,
    "limit": 12
  }
}
```

`GET /api/products/:id` — публичная карточка, `404` если не найдена.

### Корзина

Все эндпоинты требуют JWT.

`GET /api/cart`

- возвращает корзину текущего пользователя;
- если корзины нет — пустая структура с `id: null`, без создания записи.

`POST /api/cart/items`

- body: `productId` (UUID), `quantity` (integer ≥ 1);
- товар обязателен, иначе `404`;
- корзина создаётся через upsert при первом добавлении;
- если товар уже есть — количество суммируется;
- проверка `existingQuantity + quantity <= stockQuantity`, иначе `400`;
- возвращает полную корзину.

`PATCH /api/cart/items/:id`

- body: `quantity` ≥ 1;
- позиция ищется только в корзине текущего пользователя, иначе `404`;
- количество ограничено остатком;
- возвращает полную корзину.

`DELETE /api/cart/items/:id`

- удаляет только свою позицию, иначе `404`;
- возвращает полную корзину.

Формат корзины:

```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 2,
      "title": "Название",
      "price": 10,
      "images": ["..."],
      "stockQuantity": 25,
      "lineTotal": 20
    }
  ],
  "promoCode": "SAVE10",
  "discountPercentage": 10,
  "subtotal": 20,
  "discount": 2,
  "total": 18,
  "itemCount": 2
}
```

`POST /api/cart/apply-promo`

- body: `{ "code": "SAVE10" }`;
- код нормализуется (`trim`, uppercase);
- ошибки: пустая корзина / неизвестный / неактивный / просроченный промокод → `400`; промокод уже применён → `409`;
- скидка сохраняется в `Cart.promoCodeId` и `Cart.discount`;
- возвращает корзину с новыми итогами.

### Админский CRUD

| Метод | Путь | Успех | Ошибки |
|---|---|---|---|
| POST | `/api/products` | `201` | `400` валидация, `401`, `403` |
| PATCH | `/api/products/:id` | `200` | `400`, `401`, `403`, `404` |
| DELETE | `/api/products/:id` | `204` | `400`, `401`, `403`, `404` |

Правила:

- обязательные поля при создании: `title`, `description`, `price`, `images`;
- `images` — минимум 3;
- `category` — enum;
- `price` — число ≥ 0, `rating` 0–5, `reviews` ≥ 0, `stockQuantity` ≥ 0;
- `:id` проверяется как UUID;
- удаление товара каскадно удаляет `CartItem`;
- после успешной записи очищается кэш `products:*`.

### Ошибки и коды

| Код | Когда |
|---|---|
| `400` | невалидное тело/query/params, недостаток stock, пустая корзина, невалидный промокод |
| `401` | нет/просрочен/неверный JWT |
| `403` | роль не `admin` для админских операций |
| `404` | товар/позиция корзины не найдены |
| `409` | дубликат email, повторный промокод |
| `500` | внутренняя ошибка (детали не раскрываются) |

Ошибки валидации Fastify возвращаются как:

```json
{
  "message": "Validation failed",
  "details": []
}
```

### Миграции и seed

Три миграции:

1. `20261030182456_init` — User, Product, Cart, CartItem, PromoCode;
2. `20261031122949_product_delete_cascade` — Cascade для `CartItem.product`;
3. `20261101174402_add_product_catalog_fields` — поля каталога и enum категорий.

Seed (`prisma/seed.mjs`):

- upsert администратора (bcrypt-хеш);
- upsert `SAVE10`;
- upsert 6 демо-товаров из `prisma/data/products.json`.

Команды:

```bash
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
```

### CORS, Swagger, health

- CORS: `CORS_ORIGIN` — один origin или список через запятую; если не задан, разрешены все.
- Swagger UI: `/docs`, JSON: `/docs/json`; схема безопасности `bearerAuth`; защищённые операции отмечены замком.
- `GET /health` — liveness.
- `GET /health/ready` — проверка Postgres (`SELECT 1`) и Redis (`PING`), при ошибке `503`.
- Helmet отключает CSP только для корректной работы Swagger UI.

### Dockerfile

Multi-stage:

1. **deps** — `node:20-alpine`, установка `openssl`, `npm ci`;
2. **builder** — копирование `prisma` и `src`, `prisma generate`, `npm run build`;
3. **runner** — `node:20-alpine`, production-зависимости, копирование `.prisma`, `dist`, `prisma`, `USER node`, `EXPOSE 3000`, запуск `node dist/server.js`.

Образ собирается командой:

```powershell
cd PawsStore/backend
docker build -t pawsstore-backend .
```

### Docker Compose

| Сервис | Образ | Роль |
|---|---|---|
| `postgres` | `postgres:15-alpine` | БД, volume `pgdata`, healthcheck |
| `redis` | `redis:7-alpine` | кэш, healthcheck |
| `migrate` | builder-стадия | `prisma migrate deploy` + seed, завершается |
| `app` | runner-стадия | API, стартует после `migrate` |

`app` получает `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`. Порт наружу — `APP_PORT`.

---

## Frontend кратко

Angular 21, standalone-компоненты, SSR.

| Блок | Файлы | Что делает |
|---|---|---|
| Auth | `src/app/auth/*` | login/register, `AuthService`, localStorage, interceptor, guard |
| Каталог | `src/app/catalog/*` | API-запросы, поиск с debounce, фильтры, сортировка, пагинация |
| Карточка | `src/app/product-page/*` | загрузка по UUID, слайдер, related products |
| Корзина | `src/app/cart/*` | серверная корзина, количество, промокод, итоги |
| Header | `src/app/header/*` | email/вход/выход, счётчик корзины |
| Сервисы | `src/app/services/*` | `ProductsService`, `CartService` |
| Env | `src/environments/*` | `apiUrl` |

Особенности:

- JWT хранится в `localStorage` (SSR-safe);
- интерсептор добавляет `Authorization: Bearer`;
- `/cart` защищён guard;
- каталог загружается с API, фильтрация больше не выполняется в памяти;
- корзина синхронизируется с сервером после логина;
- итоги и скидка отображаются из ответа API, налог не начисляется;
- SSR используется для каталога и карточки, корзина рендерится на клиенте.

Команды:

```bash
npm ci
npm start
npm run build
```

---

## API

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | все | регистрация |
| POST | `/api/auth/login` | все | логин, JWT на 24 часа |
| GET | `/api/products` | все | каталог с фильтрами и пагинацией |
| GET | `/api/products/:id` | все | карточка товара |
| POST | `/api/products` | admin | создать товар |
| PATCH | `/api/products/:id` | admin | изменить товар |
| DELETE | `/api/products/:id` | admin | удалить товар |
| GET | `/api/cart` | customer | корзина пользователя |
| POST | `/api/cart/items` | customer | добавить товар |
| PATCH | `/api/cart/items/:id` | customer | изменить количество |
| DELETE | `/api/cart/items/:id` | customer | удалить позицию |
| POST | `/api/cart/apply-promo` | customer | применить промокод |
| GET | `/health` | все | liveness |
| GET | `/health/ready` | все | проверка БД и Redis |
| GET | `/docs` | все | Swagger UI |

---

## Переменные окружения

Файл `PawsStore/backend/.env` (шаблон — `.env.example`).

| Переменная | Обязательна | Назначение |
|---|---|---|
| `NODE_ENV` | нет | окружение Node |
| `PORT` | нет | порт приложения (3000) |
| `APP_PORT` | нет | внешний порт compose (3000) |
| `JWT_SECRET` | **да** | секрет подписи JWT |
| `CORS_ORIGIN` | нет | origin фронтенда (список через запятую) |
| `DATABASE_URL` | да* | подключение Prisma к PostgreSQL |
| `POSTGRES_USER` | нет | пользователь контейнера Postgres |
| `POSTGRES_PASSWORD` | нет | пароль контейнера |
| `POSTGRES_DB` | нет | имя БД |
| `REDIS_URL` | да* | подключение к Redis |
| `ADMIN_EMAIL` | нет | email демо-админа |
| `ADMIN_PASSWORD` | нет | пароль демо-админа |

\* Для compose `DATABASE_URL` и `REDIS_URL` подставляются автоматически.

---

## Ограничения и принятые решения

- **Только локальный запуск.** Supabase, Koyeb, облачное хранилище, CI и автотесты не используются.
- **Изображения** хранятся локально в `PawsStore/public/assets/images`; API хранит URL-строки.
- **Налог не начисляется:** `total = subtotal − discount`.
- **Product расширен** полями `category`, `reviews`, `shortDescription`, `highlights`, `specifications` — для сохранения текущего UI.
- **Checkout** декоративный, оформление заказа не реализовано (нет в ТЗ).
- **Очистка корзины и снятие промокода** отсутствуют (нет эндпоинтов в ТЗ).
- **Docker** использует `node:20-alpine`; `cookie@2` формально требует Node ≥22, но приложение работает (предупреждение при `npm ci`).
- **P1017** после рестарта PostgreSQL: первый запрос может упасть, повторный проходит.
- **Пагинация в UI** видна при >12 товарах; в seed их 6.
- Пароль администратора сбрасывается при каждом запуске seed.

---

## Troubleshooting

| Проблема | Решение |
|---|---|
| `JWT_SECRET is required` | задайте `JWT_SECRET` в `.env` |
| Порт 3000 занят | измените `APP_PORT` и `apiUrl` фронтенда |
| CORS-ошибка | `CORS_ORIGIN=http://localhost:4200` |
| Каталог пустой | проверьте backend и `docker compose ps` |
| 401 в корзине | истёк JWT — войдите заново |
| Нужен чистый стенд | `docker compose down -v && docker compose up --build` |
| Забыли пароль админа | seed сбросит его к `ADMIN_PASSWORD` |
| Swagger не авторизует | получите токен через `/api/auth/login`, нажмите Authorize, вставьте токен |
| `P1017` после рестарта БД | повторите запрос |
| Порт 4200 занят | `npm start -- --port 4201` |

---

## Git

- `main` и `develop` синхронизированы, содержимое идентично.
- Разработка велась через feature-ветки с merge-коммитами.
- Теги: `v0.2-backend`, `v0.3-api`, `v0.4-auth-ui`, `v0.5-catalog`, `v0.6-cart`, `v0.7-local-demo`.

---

Проект готов к локальной демонстрации и зачёту.
