# 🍳 CookBook

Кулинарная книга: рецепты с поиском и фильтрами, избранное, план питания на неделю,
рейтинги и комментарии, загрузка фото, авторизация.

| Слой      | Технологии                                                              |
| --------- | ----------------------------------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, MUI v5, axios, vitest + testing-library     |
| Backend   | Node.js, Express, Prisma ORM, PostgreSQL, JWT, multer, vitest + supertest |

---

## Как запустить (пошагово)

### Требования

- **Node.js 18+** (проверка: `node -v`)
- **PostgreSQL 15+** — или Docker, тогда ничего ставить не нужно

### Шаг 1. База данных

**Вариант А — Docker (проще всего):**

```bash
docker run --name cookbook-pg -p 5432:5432 \
  -e POSTGRES_USER=cookbook -e POSTGRES_PASSWORD=cookbook -e POSTGRES_DB=cookbook \
  -d postgres:17
```

**Вариант Б — установленный PostgreSQL.** Подключитесь к серверу
(Windows: `psql -U postgres` или pgAdmin → Query Tool; Linux: `sudo -u postgres psql`)
и выполните:

```sql
CREATE USER cookbook WITH PASSWORD 'cookbook';
CREATE DATABASE cookbook OWNER cookbook;
CREATE DATABASE cookbook_test OWNER cookbook;   -- нужна только для npm test
```

### Шаг 2. Бэкенд (терминал 1)

```bash
cd backend
npm install
cp .env.example .env          # Windows: copy .env.example .env
npx prisma db push            # создаст все таблицы
npm run db:seed               # демо-пользователь + 12 рецептов + 8 категорий
npm run dev                   # API: http://localhost:8000/api
```

Проверка: откройте http://localhost:8000/api/health → `{"status":"ok"}`.

### Шаг 3. Фронтенд (терминал 2)

```bash
cd frontend
npm install
npm run dev                   # приложение: http://localhost:5173
```

### Шаг 4. Вход

```
email:  demo@cookbook.com
пароль: demo123
```

Демо-аккаунт создаётся на шаге 2 (`npm run db:seed`). Если вход не работает —
убедитесь, что сидирование прошло без ошибок.

### Каждый следующий запуск

База и зависимости уже установлены, поэтому достаточно двух команд:

```bash
cd backend  && npm run dev     # терминал 1
cd frontend && npm run dev     # терминал 2
```

---

## Запуск без базы и бэкенда (mock-режим)

Фронтенд умеет работать на встроенных мок-данных (12 рецептов в 8 категориях,
локальные фото в `public/images/`):

```bash
cd frontend
npm install
npm run dev
```

Если в `frontend/.env` стоит `VITE_USE_MOCK=false`, поменяйте на `true`
и перезапустите dev-сервер. Вход тот же: `demo@cookbook.com` / `demo123`.
В mock-режиме данные хранятся в localStorage браузера.

## Возможные проблемы

| Симптом | Решение |
| ------- | ------- |
| `"vite" не является внутренней или внешней командой` | не установлены зависимости: `npm install` в `frontend` |
| `Can't reach database server at "localhost:5432"` | PostgreSQL не запущен (или контейнер: `docker start cookbook-pg`) |
| `Role "cookbook" does not exist` / `database does not exist` | не выполнен SQL из шага 1 |
| Ошибка `Table ... does not exist` | не выполнена миграция: `npx prisma db push` в `backend` |
| Логин не пускает демо-пользователя | не выполнен `npm run db:seed` в `backend` |
| Порт занят (`EADDRINUSE`) | поменяйте `PORT` в `backend/.env` и прокси в `frontend/vite.config.ts` |
| Изменили `.env` — изменения не применились | перезапустите dev-сервер (env читается при старте) |

## Команды

**Frontend** (`cd frontend`):

| Команда | Что делает |
| ------- | ---------- |
| `npm run dev` | dev-сервер с HMR (порт 5173, прокси `/api` → 8000) |
| `npm run build` | проверка типов + прод-сборка в `dist` |
| `npm run preview` | отдаёт собранную `dist` на порту 4173 |
| `npm run typecheck` / `npm run lint` / `npm run format` | проверки и форматирование |
| `npm test` | unit-тесты (vitest + testing-library, всегда в mock-режиме) |
| `npm run test:coverage` | те же тесты + отчёт о покрытии (`coverage/`) |
| `node e2e/drawer.e2e.mjs` | e2e в реальном Chromium (нужен запущенный `npm run dev`) |

**Backend** (`cd backend`):

| Команда | Что делает |
| ------- | ---------- |
| `npm run dev` | dev-сервер с авторестартом (tsx watch, порт 8000) |
| `npm run typecheck` | проверка типов `tsc --noEmit` |
| `npm test` | API-тесты (vitest + supertest, база `cookbook_test`) |
| `npm run db:push` | применить схему Prisma к базе |
| `npm run db:seed` | демо-данные (перезаписывает рецепты и пользователя) |

CI: `.github/workflows/ci.yml` — lint → typecheck → test → build (Node 20).

## Как устроен проект

```
cookbook/
├── frontend/
│   └── src/
│       ├── components/   common (Layout, ProtectedRoute, ErrorBoundary…), recipes (RecipeCard…)
│       ├── contexts/     AuthContext, ThemeContext, FavoritesContext
│       ├── hooks/        useAuth, useRecipes, useFavorites, useDebounce, useDocumentTitle
│       ├── pages/        Home (дашборд), Recipes (каталог), Recipe, CreateRecipe,
│       │                 Favorites, Plan, Login, Register, NotFound
│       ├── services/     api (axios), authService, recipeService, recipeStore, useMock
│       └── types/        интерфейсы домена
└── backend/
    ├── prisma/           schema.prisma (Users, Recipes, Comments, Favorites,
    │                     PlanItems, RecipeIngredients, Ingredients, Categories)
    └── src/
        ├── controllers/  auth, recipe, user, plan, upload
        ├── services/     бизнес-логика
        ├── repositories/ доступ к данным через Prisma
        ├── middleware/   auth (JWT), upload (multer), error, CORS
        └── seed.ts       демо-данные
```

Слои бэкенда: **Controllers → Services → Middleware → Repository (Prisma) → PostgreSQL**.

Фронтенд общается с API через относительный путь `/api` — в dev-режиме
`vite.config.ts` проксирует его на `http://localhost:8000` (CORS не нужен).
Переключение mock/API — флаг `VITE_USE_MOCK` в `frontend/.env`.

### API-контракт

| Метод | Путь | Описание |
| ----- | ---- | -------- |
| GET   | `/api/health` | проверка живости |
| POST  | `/api/auth/register`, `/api/auth/login` | `{user, token}` (JWT, 7 дней) |
| GET   | `/api/auth/me` | текущий пользователь (Bearer) |
| GET   | `/api/recipes?search&category&ingredients&page&limit` | пагинация `{recipes, total, page, totalPages}` |
| GET/POST | `/api/recipes`, `/api/recipes/:id` | CRUD (создание/правка — авторизованы) |
| POST  | `/api/recipes/:id/rate` | оценка 1–5, рейтинг усредняется |
| GET/POST | `/api/recipes/:id/comments` | комментарии |
| GET   | `/api/categories`, `/api/ingredients?search` | справочники |
| GET/POST/DELETE | `/api/favorites[/:recipeId]` | избранное пользователя |
| GET/PUT | `/api/plan` | план питания (PUT заменяет весь план) |
| POST  | `/api/upload` | загрузка фото (multipart `image`, до 5 МБ) → `{url}` |

## Паттерны GoF

| Паттерн | Файлы | Где работает |
| ------- | ----- | ------------ |
| Factory Method | `services/RecipeFactory.ts` | `recipeService.createRecipe`: фабрика по категории задаёт дефолты |
| Observer | `services/EventBus.ts`, `services/FavoriteObserver.ts` | `FavoritesContext` публикует `FAVORITE_TOGGLED`, `PlanPage` — `PLAN_UPDATED`; список покупок автосинхронизируется с планом |
| Strategy | `services/SearchStrategies.ts` | `useRecipes`: поиск по названию / ингредиентам / категории комбинируется стратегиями |
