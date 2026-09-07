import { beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import request from 'supertest';

const TEST_URL = process.env.DATABASE_URL!;

let app: Awaited<ReturnType<typeof import('../app')['createApp']>>;

beforeAll(async () => {
  // отдельная тестовая база: пересоздаём схему начисто
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_URL },
    stdio: 'pipe',
  });
  app = (await import('../app')).createApp();
});

const registerAndLogin = async () => {
  const reg = await request(app).post('/api/auth/register').send({
    name: 'Тест Тестович',
    email: 'test@cookbook.com',
    password: 'secret123',
  });
  if (reg.status === 201) return reg.body as { user: { id: string }; token: string };

  const login = await request(app).post('/api/auth/login').send({
    email: 'test@cookbook.com',
    password: 'secret123',
  });
  return login.body as { user: { id: string }; token: string };
};

describe('auth', () => {
  it('регистрирует пользователя и выдаёт токен', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Юзер',
      email: 'user@cookbook.com',
      password: 'secret123',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('user@cookbook.com');
  });

  it('отклоняет дубликат email и неверный пароль', async () => {
    const dup = await request(app).post('/api/auth/register').send({
      name: 'Юзер',
      email: 'user@cookbook.com',
      password: 'secret123',
    });
    expect(dup.status).toBe(409);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@cookbook.com', password: 'nope' });
    expect(bad.status).toBe(401);
  });

  it('возвращает профиль по токену', async () => {
    const { token } = await registerAndLogin();
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('test@cookbook.com');

    const anon = await request(app).get('/api/auth/me');
    expect(anon.status).toBe(401);
  });
});

describe('recipes', () => {
  let token = '';
  let recipeId = '';

  beforeAll(async () => {
    ({ token } = await registerAndLogin());
  });

  it('без токена рецепт не создать', async () => {
    const res = await request(app).post('/api/recipes').send({ title: 'X' });
    expect(res.status).toBe(401);
  });

  it('создаёт рецепт с категорией и ингредиентами', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Борщ тестовый',
        description: 'Описание',
        category: 'Супы',
        cookingTime: 90,
        servings: 4,
        ingredients: [
          { ingredientName: 'Свёкла', quantity: '2', unit: 'шт' },
          { ingredientName: 'Капуста', quantity: '300', unit: 'г' },
        ],
        steps: ['Варить'],
      });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Супы');
    expect(
      [...res.body.ingredients.map((i: { ingredientName: string }) => i.ingredientName)].sort()
    ).toEqual(['Капуста', 'Свёкла']);
    recipeId = res.body.id;
  });

  it('ищет по названию, категории и ингредиентам', async () => {
    const byTitle = await request(app).get('/api/recipes?search=борщ');
    expect(byTitle.body.total).toBe(1);

    const byCategory = await request(app).get('/api/recipes?category=Супы');
    expect(byCategory.body.total).toBe(1);

    const byIngredient = await request(app).get('/api/recipes?ingredients=свёкла');
    expect(byIngredient.body.recipes[0].title).toBe('Борщ тестовый');
  });

  it('пагинирует список', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/recipes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Салат номер ${i}`,
          description: '',
          category: 'Салаты',
          cookingTime: 10,
          servings: 1,
          ingredients: [{ ingredientName: 'Огурец', quantity: '1', unit: 'шт' }],
          steps: ['Нарезать'],
        });
    }
    const page = await request(app).get('/api/recipes?limit=2&page=2');
    expect(page.body.recipes.length).toBe(2);
    expect(page.body.total).toBe(4);
    expect(page.body.totalPages).toBe(2);
  });

  it('комментарии и оценка', async () => {
    const comment = await request(app)
      .post(`/api/recipes/${recipeId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Отлично!' });
    expect(comment.status).toBe(201);

    const list = await request(app).get(`/api/recipes/${recipeId}/comments`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].userName).toBe('Тест Тестович');

    const rated = await request(app)
      .post(`/api/recipes/${recipeId}/rate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 5 });
    expect(rated.body.rating).toBe(2.5); // (0 + 5) / 2
  });

  it('избранное: добавить, список, убрать', async () => {
    const add = await request(app)
      .post(`/api/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(add.status).toBe(200);

    const list = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].title).toBe('Борщ тестовый');

    const del = await request(app)
      .delete(`/api/favorites/${recipeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(200);

    const empty = await request(app)
      .get('/api/favorites')
      .set('Authorization', `Bearer ${token}`);
    expect(empty.body).toHaveLength(0);
  });

  it('план питания сохраняется и читается', async () => {
    const put = await request(app)
      .put('/api/plan')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          { dayOfWeek: 0, mealType: 'lunch', recipeId },
          { dayOfWeek: 2, mealType: 'dinner', recipeId },
        ],
      });
    expect(put.status).toBe(200);
    expect(put.body).toHaveLength(2);

    const get = await request(app).get('/api/plan').set('Authorization', `Bearer ${token}`);
    expect(get.body.map((i: { dayOfWeek: number }) => i.dayOfWeek)).toEqual([0, 2]);
    expect(get.body[0].recipeTitle).toBe('Борщ тестовый');
  });
});
