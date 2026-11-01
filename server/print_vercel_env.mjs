/**
 * Menghasilkan berkas VERCEL_ENV.txt berisi daftar environment variable
 * yang harus dipasang di dashboard Vercel. Nilai rahasia diambil dari .env lokal.
 *
 * Jalankan: node server/print_vercel_env.mjs https://domain-vercel-anda
 */
import fs from 'node:fs';
import 'dotenv/config';

const appUrl = (process.argv[2] || process.env.APP_BASE_URL || 'https://GANTI-DOMAIN-VERCEL-ANDA').replace(/\/$/, '');

const envPath = 'D:/rekasedia/.env';
const envText = fs.readFileSync(envPath, 'utf8');
const pick = (key) => {
  const match = envText.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

const required = {
  DATABASE_URL: pick('DATABASE_URL'),
  PORT: '3001',
  VITE_USE_MOCK: 'false',
  TELEGRAM_BOT_TOKEN: pick('TELEGRAM_BOT_TOKEN'),
  TELEGRAM_ADMIN_CHAT_ID: pick('TELEGRAM_ADMIN_CHAT_ID'),
  TELEGRAM_TEACHER_GROUP_CHAT_ID: pick('TELEGRAM_TEACHER_GROUP_CHAT_ID'),
  TELEGRAM_WEBHOOK_SECRET: pick('TELEGRAM_WEBHOOK_SECRET') || 'ganti-dengan-string-acak-panjang',
  APP_BASE_URL: appUrl,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value || value.startsWith('ganti-'))
  .map(([key]) => key);

const lines = Object.entries(required).map(([key, value]) => `${key}=${value}`);
const outPath = 'D:/rekasedia/VERCEL_ENV.txt';
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

console.log(`Ditulis: ${outPath}`);
console.log('Ringkasan (nilai rahasia disamarkan):');
for (const [key, value] of Object.entries(required)) {
  const shown = /TOKEN|SECRET|DATABASE_URL/.test(key) ? (value ? '***terisi***' : '(KOSONG)') : value;
  console.log(`  ${key} = ${shown}`);
}
if (missing.length) console.log('PERLU DILENGKAPI:', missing.join(', '));