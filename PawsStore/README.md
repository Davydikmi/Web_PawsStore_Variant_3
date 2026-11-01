# PawsStore Frontend

Angular 21 с серверным рендерингом (SSR) и SCSS. Клиентская часть учебного магазина PawsStore: каталог, карточка товара, аутентификация, корзина и промокоды. Все данные загружаются из REST API, локального JSON-каталога больше нет.

Общая инструкция по проекту и backend — в [корневом README](../README.md).

## Требования

- Node.js 20.19+ (или 22.12+)
- npm
- Запущенный backend на `http://localhost:3000` (см. `backend/docker-compose.yml`)

## Запуск

Сначала поднимите API:

```powershell
cd ../backend
docker compose up --build
```

Затем фронтенд:

```powershell
cd PawsStore
npm ci
npm start
```

Приложение: <http://localhost:4200>. Dev-сервер автоматически пересобирает страницы при изменениях.

Если `localhost:4200` не открывается:

```powershell
npm start -- --host 127.0.0.1 --port 4200
```

## Адрес API

Задаётся в `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

Для production-сборки используется `environment.production.ts` (значение нужно заменить при необходимости).

## Маршруты

| Путь | Доступ | Описание |
|---|---|---|
| `/` | все | каталог с поиском, фильтрами, сортировкой и пагинацией |
| `/product/:id` | все | карточка товара, слайдер, related products |
| `/login` | все | вход |
| `/register` | все | регистрация |
| `/cart` | только авторизованные | корзина и промокод |

Неавторизованный переход в `/cart` перенаправляет на `/login?returnUrl=/cart`.

## Возможности

- каталог и фильтры работают через query-параметры API (без фильтрации в памяти);
- поиск с debounce, фильтры по рейтингу/цене, сортировка, пагинация;
- JWT хранится в `localStorage`, интерсептор добавляет `Authorization: Bearer`;
- корзина хранится на сервере, итоги (`subtotal`, `discount`, `total`) приходят с API;
- промокод `SAVE10` применяется через `POST /api/cart/apply-promo`;
- SSR для каталога/карточки, корзина рендерится на клиенте.

## Команды

| Команда | Описание |
|---|---|
| `npm start` | dev-сервер |
| `npm run build` | production-сборка + SSR |
| `npm run watch` | сборка в watch-режиме |
| `npm test` | unit-тесты (Vitest) |
| `npm run serve:ssr:PawsStore` | запуск собранного SSR-сервера (порт 4000) |

## Структура

```
src/app/
  auth/           AuthService, storage, guard, interceptor, login/register
  catalog/        каталог
  product-page/   карточка товара
  cart/           корзина
  header/         шапка, состояние пользователя и счётчик корзины
  services/       products.service, cart.service
  models/         Product, ProductCategory
src/environments/ apiUrl для dev/prod
```

## Troubleshooting

| Проблема | Решение |
|---|---|
| Каталог пустой / ошибка загрузки | проверьте, что backend запущен на `http://localhost:3000` |
| CORS-ошибка | в backend `.env` укажите `CORS_ORIGIN=http://localhost:4200` |
| 401 при работе с корзиной | войдите заново — истёк JWT |
| Порт 4200 занят | `npm start -- --port 4201` |
| Нужно сменить API | поправьте `apiUrl` в `environment.ts` |
