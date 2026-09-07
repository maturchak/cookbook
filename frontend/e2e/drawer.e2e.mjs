/**
 * e2e-проверка поведения Drawer/бэкдропа при навигации.
 * Запуск: node e2e/drawer.e2e.mjs  (нужен запущенный `npm run dev`)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5173';

const inspect = async (page, label) => {
  const state = await page.evaluate(() => {
    const backdrops = Array.from(document.querySelectorAll('.MuiBackdrop-root')).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { opacity: cs.opacity, visibility: cs.visibility, display: cs.display, w: r.width, h: r.height };
    });
    const mid = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    const dialog = document.querySelector('[role="presentation"].MuiModal-root, .MuiDrawer-root');
    return {
      backdrops,
      midElement: mid ? `${mid.tagName}.${(mid.className || '').toString().split(' ').slice(0, 2).join('.')}` : null,
      hasDrawerRoot: Boolean(dialog),
      drawerOpenAttr: document.querySelector('[data-drawer-open]')?.getAttribute('data-drawer-open'),
      url: location.pathname,
    };
  });
  console.log(`--- ${label}`, JSON.stringify(state));
  return state;
};

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 200));
  });

  await page.goto(`${BASE}/login`);
  await page.waitForSelector('text=Добро пожаловать в CookBook');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Что сегодня приготовим?');
  console.log('logged in');

  // Открываем drawer
  await page.click('button[aria-label="Открыть навигацию"]');
  await page.waitForSelector('.MuiDrawer-root');
  await inspect(page, 'drawer открыт');

  // Переходим в раздел через пункт меню
  await page.click('.MuiDrawer-root >> text=Избранное');
  await page.waitForTimeout(900); // даём транзишенам завершиться
  const after = await inspect(page, 'после перехода в Избранное');

  // Пробуем кликнуть по центру: должен попасть в контент, а не в бэкдроп
  await page.mouse.click(640, 400);
  await page.waitForTimeout(400);
  const afterClick = await inspect(page, 'после клика по центру');

  // Переход в ещё один раздел, если клики работают
  const blocked = after.backdrops.some((b) => b.visibility !== 'hidden' && b.display !== 'none' && Number(b.opacity) > 0.05);
  console.log(blocked ? 'RESULT-A: BUG — бэкдроп активен после навигации' : 'RESULT-A: OK');

  // Сценарий B: закрыть drawer кликом по бэкдропу БЕЗ навигации
  await page.click('button[aria-label="Открыть навигацию"]');
  await page.waitForTimeout(400);
  await page.mouse.click(1100, 400); // клик по бэкдропу справа
  await page.waitForTimeout(700);
  await inspect(page, 'сценарий B: закрытие без навигации');

  // Сценарий C: навигация, потом Escape
  await page.click('button[aria-label="Открыть навигацию"]');
  await page.waitForTimeout(400);
  await page.click('.MuiDrawer-root >> text=План питания');
  await page.waitForTimeout(700);
  await inspect(page, 'сценарий C до Escape');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);
  await inspect(page, 'сценарий C после Escape');

  await browser.close();
  process.exit(0);
};

run().catch((e) => {
  console.error('E2E FAILED:', e.message);
  process.exit(1);
});
