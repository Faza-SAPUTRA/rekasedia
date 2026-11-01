/**
 * Skrip sekali jalan untuk memasang webhook bot Telegram.
 * Pakai: node server/setup_telegram_webhook.js <APP_BASE_URL>
 */
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = (process.argv[2] || process.env.APP_BASE_URL || '').replace(/\/$/, '');

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN belum diset di .env');
  process.exit(1);
}
if (!appUrl) {
  console.error('URL publik wajib: node server/setup_telegram_webhook.js https://domain-anda.vercel.app');
  process.exit(1);
}

const webhookUrl = `${appUrl}/api/telegram/webhook`;
const body = { url: webhookUrl, allowed_updates: ['message'] };
if (secret) body.secret_token = secret;

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const result = await response.json();
console.log(JSON.stringify({ webhookUrl, ...result }, null, 2));
if (!result.ok) process.exit(1);
