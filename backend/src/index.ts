import { createApp } from './app';
import { CONFIG } from './config';

const app = createApp();

app.listen(CONFIG.port, '0.0.0.0', () => {
  console.log(`🍳 CookBook API слушает порт ${CONFIG.port}`);
});
