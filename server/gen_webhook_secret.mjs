/**
 * Membuat TELEGRAM_WEBHOOK_SECRET acak (kalau belum ada di .env),
 * lalu menulisnya ke .env.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const envPath = 'D:/rekasedia/.env';
const envText = fs.readFileSync(envPath, 'utf8');

const existing = (envText.match(/^TELEGRAM_WEBHOOK_SECRET=(.*)$/m) || [])[1]?.trim();
if (existing) {
  console.log('TELEGRAM_WEBHOOK_SECRET sudah ada, tidak diubah.');
  process.exit(0);
}

const secret = crypto.randomBytes(24).toString('hex');
const lines = envText.split(/\r?\n/).filter((line) => line.trim() !== '');
lines.push(`TELEGRAM_WEBHOOK_SECRET=${secret}`);
fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
console.log(`TELEGRAM_WEBHOOK_SECRET dibuat (${secret.length} karakter) dan ditulis ke .env`);
