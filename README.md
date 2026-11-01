# PawsStore — учебный интернет-магазин

Локальный учебный проект для зачёта: интернет-магазин товаров для животных с REST API, JWT-аутентификацией, корзиной, промокодами, админским CRUD и кэшированием каталога.

> **Область проекта:** только локальный запуск. Облачные сервисы (Supabase, Koyeb, Cloud Storage), CI и автотесты в рамках зачёта не используются.

## Стек

| Слой | Технологии |
|---|---|
| Frontend | Angular 21, SSR, SCSS, RxJS |
| Backend | Node.js 20, Fastify 5, TypeScript |
| ORM / БД | Prisma 6, PostgreSQL 15+ |
| Кэш | Redis 7 |
| Auth | JWT (`@fastify/jwt`), bcrypt |
| Инфраструктура | Docker, Docker Compose |

## Структура

```
PawsStore/
  backend/            Fastify API, Prisma, Docker
    prisma/           схема, миграции, seed, демо-данные
    src/              routes / controllers / services / middleware
    Dockerfile
    docker-compose.yml
  src/                Angular-приложение
    app/auth/         вход, регистрация, guard, интерсептор
    app/catalog/      каталог с фильтрами и пагинацией
    app/cart/         корзина и промокод
    app/product-page/ карточка товара
  public/assets/      локальные изображения товаров
```

## Быстрый старт (Docker)

Нужен установленный Docker Desktop.

```powershell
cd PawsStore/backend
Copy-Item .env.example .env
# откройте .env и задайте свой JWT_SECRET
docker compose up --build
```

После запуска:

- API: <http://localhost:3000>
- Swagger UI: <http://localhost:3000/docs>
- Health: <http://localhost:3000/health>

Сервис `migrate` автоматически применяет миграции и выполняет seed (админ, промокод, 6 демо-товаров), после чего стартует `app`.

Если порт 3000 занят, укажите другой в `.env`:

```env
APP_PORT=3001
```

и поменяйте `apiUrl` в `PawsStore/src/environments/environment.ts` на `http://localhost:3001`.

### Frontend

```powershell
cd PawsStore
npm ci
npm start
```

Приложение: <http://localhost:4200>. API по умолчанию ожидается на `http://localhost:3000`.

### Остановка и сброс данных

```powershell
cd PawsStore/backend
docker compose down       # остановить
docker compose down -v    # остановить и удалить БД (volume pgdata)
```

После `down -v` при следующем `up` миграции и seed выполнятся заново.

## Демо-данные

Seed создаёт:

- администратора: `admin@pawsstore.local` / `admin12345`;
- промокод `SAVE10` (10%);
- 6 товаров с изображениями, категориями и характеристиками.

Креды админа можно изменить через `ADMIN_EMAIL` / `ADMIN_PASSWORD` в `.env` — seed обновит пользователя при следующем запуске.

## Сценарий демонстрации

1. Откройте <http://localhost:3000/docs>.
2. `POST /api/auth/login` с админскими кредами → скопируйте `token` → кнопка **Authorize** → `Bearer <token>` (Swagger сам подставит `Bearer`).
3. `POST /api/products` — создайте товар (нужно минимум 3 URL изображений), проверьте `GET /api/products`, затем `PATCH`/`DELETE`.
4. На фронтенде зарегистрируйте покупателя через `/register`.
5. В каталоге проверьте поиск, фильтры по рейтингу/цене, сортировку и пагинацию.
6. Добавьте товары в корзину, измените количество.
7. Примените промокод `SAVE10` — итог пересчитается на сервере.
8. Проверьте, что после админского изменения товара каталог показывает актуальные данные (кэш инвалидируется).

## API

| Метод | Путь | Доступ | Описание |
|---|---|---|---|
| POST | `/api/auth/register` | все | регистрация (email, password) |
| POST | `/api/auth/login` | все | логин, JWT на 24 часа |
| GET | `/api/products` | все | каталог: `page`, `limit`, `search`, `min_price`, `max_price`, `min_rating`, `category`, `sort_by` (`price/title/rating`), `order` |
| GET | `/api/products/:id` | все | карточка товара |
| POST | `/api/products` | admin | создать товар |
| PATCH | `/api/products/:id` | admin | изменить товар |
| DELETE | `/api/products/:id` | admin | удалить товар (CartItem — Cascade) |
| GET | `/api/cart` | customer | корзина текущего пользователя |
| POST | `/api/cart/items` | customer | добавить товар (`productId`, `quantity`) |
| PATCH | `/api/cart/items/:id` | customer | изменить количество |
| DELETE | `/api/cart/items/:id` | customer | удалить позицию |
| POST | `/api/cart/apply-promo` | customer | применить промокод (`code`) |
| GET | `/health`, `/health/ready` | все | liveness / проверка Postgres + Redis |
| GET | `/docs`, `/docs/json` | все | Swagger UI / OpenAPI |

Формат каталога:

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

## Переменные окружения

Файл: `PawsStore/backend/.env` (шаблон — `.env.example`).

| Переменная | Назначение |
|---|---|
| `NODE_ENV` | окружение Node |
| `PORT` | порт приложения внутри контейнера/локально |
| `APP_PORT` | опубликованный порт compose |
| `JWT_SECRET` | секрет подписи JWT (обязателен) |
| `CORS_ORIGIN` | разрешённый origin фронтенда (можно список через запятую) |
| `DATABASE_URL` | строка подключения Prisma (локальный запуск) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | параметры контейнера Postgres |
| `REDIS_URL` | строка подключения Redis |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | демо-админ, создаётся seed |

Для Docker Compose `DATABASE_URL` и `REDIS_URL` подставляются автоматически на имена сервисов `postgres` и `redis`.

## База данных

- PostgreSQL 15+ (в compose — `postgres:15-alpine`), Prisma ORM.
- Миграции: `init`, `product_delete_cascade`, `add_product_catalog_fields`.
- Модели: `User`, `Product`, `Cart`, `CartItem`, `PromoCode`; роли `customer/admin`, категории товара.
- Удаление товара каскадно удаляет позиции корзин; удаление пользователя — его корзину.

Команды (из `PawsStore/backend`):

```bash
npm run db:migrate    # prisma migrate dev
npm run db:deploy     # prisma migrate deploy
npm run db:seed       # seed: админ, SAVE10, демо-товары
npm run db:studio     # Prisma Studio
```

## Кэширование

- Кэшируется только `GET /api/products`.
- Ключ строится из query-строки: `products:limit=12&page=1&...`.
- TTL — 120 секунд.
- Создание/изменение/удаление товара очищает все ключи `products:*`.
- Персональные данные (корзина, пользователь) не кэшируются.

## Локальная разработка без Docker

Нужны PostgreSQL и Redis, доступные по `DATABASE_URL` и `REDIS_URL` из `.env`.

```powershell
cd PawsStore/backend
npm ci
npx prisma migrate dev
npm run db:seed
npm run build
npm start
```

Frontend:

```powershell
cd PawsStore
npm ci
npm start
```

## Особенности и ограничения

- Изображения товаров лежат локально в `PawsStore/public/assets/images`; API хранит URL. Облачное хранилище не используется.
- Налог не начисляется: `total = subtotal − discount`.
- Product расширен полями `category`, `reviews`, `shortDescription`, `highlights`, `specifications` для существующего UI.
- Checkout и очистка корзины/снятие промокода не реализованы — в ТЗ таких эндпоинтов нет.
- Docker-образ использует `node:20-alpine`; зависимость `cookie@2` формально просит Node ≥22, но приложение запускается и работает (предупреждение при `npm ci`).
- После рестарта Postgres первый запрос Prisma может вернуть `P1017` — повторите запрос (пул переподключится).

## Troubleshooting

| Проблема | Решение |
|---|---|
| `JWT_SECRET is required` | задайте `JWT_SECRET` в `PawsStore/backend/.env` |
| Порт 3000 занят | измените `APP_PORT` и `apiUrl` фронтенда |
| CORS-ошибка | проверьте `CORS_ORIGIN` (например, `http://localhost:4200`) |
| Нужен чистый стенд | `docker compose down -v && docker compose up --build` |
| Забыли пароль админа | перезапустите seed / `docker compose up` — пароль сбросится к `ADMIN_PASSWORD` |
| Swagger не авторизует | получите токен через `/api/auth/login`, нажмите Authorize, вставьте только токен |
