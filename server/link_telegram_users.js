/**
 * Menautkan chat_id Telegram guru ke akun RekaSedia TANPA webhook publik.
 *
 * Cara pakai:
 *   1. Tiap guru kirim DM ke bot: /start <NIP>   (format persis begitu)
 *   2. Jalankan: node server/link_telegram_users.js
 *
 * Skrip membaca getUpdates (long polling sekali jalan), mencocokkan NIP,
 * menyimpan telegram_chat_id + telegram_username, lalu membalas konfirmasi.
 * Aman dijalankan berulang; update yang sudah dibaca tidak diproses lagi.
 * JANGAN jalankan kalau webhook sudah aktif (Telegram menolak getUpdates).
 */
import 'dotenv/config';
import pool from './db.js';
import { sendTelegramMessage } from './services/telegram.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN belum diset di .env');
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;

// Webhook aktif memblokir getUpdates. Kalau ada, simpan URL-nya, lepas sementara,
// lalu pasang kembali setelah penautan selesai (deploy Vercel tetap utuh).
const webhook = await (await fetch(`${base}/getWebhookInfo`)).json();
const previousWebhookUrl = webhook.ok ? webhook.result.url || '' : '';
const previousSecret = process.env.TELEGRAM_WEBHOOK_SECRET || '';

if (previousWebhookUrl) {
  console.log(`Webhook aktif: ${previousWebhookUrl} — dilepas sementara.`);
  await fetch(`${base}/deleteWebhook`);
}

async function restoreWebhook() {
  if (!previousWebhookUrl) return;
  const body = { url: previousWebhookUrl, allowed_updates: ['message'] };
  if (previousSecret) body.secret_token = previousSecret;
  const res = await (
    await fetch(`${base}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  ).json();
  console.log(res.ok ? `Webhook dipasang kembali: ${previousWebhookUrl}` : `GAGAL memasang ulang webhook: ${JSON.stringify(res)}`);
}

const updates = await (await fetch(`${base}/getUpdates?limit=100&timeout=0`)).json();
if (!updates.ok) {
  console.error('getUpdates gagal:', JSON.stringify(updates));
  process.exit(1);
}

console.log(`Update dibaca: ${updates.result.length}`);
let linked = 0;
let skipped = 0;

for (const update of updates.result) {
  const message = update.message;
  if (!message?.chat || !message.text) continue;

  const chatId = String(message.chat.id);
  const username = message.from?.username || null;
  const text = String(message.text).trim();

  if (!text.startsWith('/start')) continue;

  const nip = text.split(/\s+/).slice(1).join(' ').trim();
  if (!nip) {
    await sendTelegramMessage(
      chatId,
      'Halo! Untuk menautkan akun RekaSedia, kirim:\n<code>/start NIP_ANDA</code>\n\nContoh: <code>/start 198807272022212013</code>'
    );
    skipped += 1;
    continue;
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET telegram_chat_id = $1,
         telegram_username = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE nip = $3
     RETURNING id, full_name`,
    [chatId, username, nip]
  );

  if (rows.length === 0) {
    await sendTelegramMessage(chatId, `NIP <code>${nip}</code> tidak ditemukan di RekaSedia.`);
    skipped += 1;
    continue;
  }

  await sendTelegramMessage(
    chatId,
    `✅ <b>Terhubung</b>\n\nAkun <b>${rows[0].full_name}</b> sudah tertaut.\n` +
      'Notifikasi akan dikirim ke grup guru dan Anda akan di-tag di sana.'
  );
  linked += 1;
  console.log(`  taut: ${rows[0].full_name} (NIP ${nip}) -> chat ${chatId}`);
}

const { rows: total } = await pool.query(
  `SELECT COUNT(*)::int AS total FROM users WHERE telegram_chat_id IS NOT NULL`
);
console.log(`Selesai. Tertaut baru: ${linked}, dilewati: ${skipped}. Total user punya chat_id: ${total[0].total}`);

await restoreWebhook();
await pool.end();
