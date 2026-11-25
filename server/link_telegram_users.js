/**
 * Menautkan chat_id Telegram user (Admin/Guru) ke akun RekaSedia TANPA webhook publik.
 *
 * Cara pakai:
 *   1. User kirim DM ke bot: /tautkan (lalu kirim email login) atau /tautkan <email> atau /start <NIP>
 *   2. Jalankan: npm run telegram:link
 *
 * Skrip membaca getUpdates (long polling sekali jalan), mencocokkan email/NIP,
 * menyimpan telegram_chat_id + telegram_username, lalu membalas konfirmasi.
 */
import 'dotenv/config';
import pool from './db.js';
import {
  escapeHtml,
  linkTelegramAccountByEmail,
  linkTelegramAccountByNip,
  sendTelegramMessage,
} from './services/telegram.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
const awaitingEmailChats = new Set();

for (const update of updates.result) {
  const message = update.message;
  if (!message?.chat || !message.text || message.chat.type !== 'private') continue;

  const chatId = String(message.chat.id);
  const username = message.from?.username || null;
  const text = String(message.text).trim();

  // /tautkan atau /tautkan <email>
  if (/^\/tautkan(@\w+)?(\s|$)/i.test(text)) {
    const emailArg = text.split(/\s+/).slice(1).join(' ').trim();
    if (!emailArg) {
      awaitingEmailChats.add(chatId);
      await sendTelegramMessage(
        chatId,
        '🔗 <b>Tautkan Akun RekaSedia</b>\n\nMasukkan email login Anda (contoh: <code>sarah.putri@rekasedia.sch.id</code>).'
      );
      skipped += 1;
      continue;
    }

    const user = await linkTelegramAccountByEmail(chatId, username, emailArg);
    if (!user) {
      await sendTelegramMessage(chatId, `❌ Email <code>${escapeHtml(emailArg)}</code> tidak ditemukan di RekaSedia.`);
      skipped += 1;
      continue;
    }

    awaitingEmailChats.delete(chatId);
    const roleLabel = String(user.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Guru';
    await sendTelegramMessage(
      chatId,
      `✅ <b>Akun ${roleLabel} Berhasil Ditautkan!</b>\n\nNama: <b>${escapeHtml(user.full_name)}</b>\nEmail: <code>${escapeHtml(user.email)}</code>\nRole: <b>${roleLabel}</b>`
    );
    linked += 1;
    console.log(`  taut (${roleLabel}): ${user.full_name} (${user.email}) -> chat ${chatId}`);
    continue;
  }

  // Balasan email setelah /tautkan
  if (awaitingEmailChats.has(chatId) && EMAIL_REGEX.test(text)) {
    const user = await linkTelegramAccountByEmail(chatId, username, text);
    if (!user) {
      await sendTelegramMessage(chatId, `❌ Email <code>${escapeHtml(text)}</code> tidak ditemukan di RekaSedia.`);
      skipped += 1;
      continue;
    }

    awaitingEmailChats.delete(chatId);
    const roleLabel = String(user.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Guru';
    await sendTelegramMessage(
      chatId,
      `✅ <b>Akun ${roleLabel} Berhasil Ditautkan!</b>\n\nNama: <b>${escapeHtml(user.full_name)}</b>\nEmail: <code>${escapeHtml(user.email)}</code>\nRole: <b>${roleLabel}</b>`
    );
    linked += 1;
    console.log(`  taut (${roleLabel}): ${user.full_name} (${user.email}) -> chat ${chatId}`);
    continue;
  }

  // Kompatibilitas lama: /start <NIP atau email>
  if (/^\/start(@\w+)?\s+/i.test(text)) {
    const arg = text.split(/\s+/).slice(1).join(' ').trim();
    const user = EMAIL_REGEX.test(arg)
      ? await linkTelegramAccountByEmail(chatId, username, arg)
      : await linkTelegramAccountByNip(chatId, username, arg);

    if (!user) {
      await sendTelegramMessage(chatId, `❌ Akun <code>${escapeHtml(arg)}</code> tidak ditemukan di RekaSedia.`);
      skipped += 1;
      continue;
    }

    const roleLabel = String(user.role || '').toLowerCase() === 'admin' ? 'Admin' : 'Guru';
    await sendTelegramMessage(
      chatId,
      `✅ <b>Akun ${roleLabel} Berhasil Ditautkan!</b>\n\nNama: <b>${escapeHtml(user.full_name)}</b>\nEmail: <code>${escapeHtml(user.email)}</code>\nRole: <b>${roleLabel}</b>`
    );
    linked += 1;
    console.log(`  taut (${roleLabel}): ${user.full_name} (${user.email}) -> chat ${chatId}`);
  }
}

const { rows: total } = await pool.query(
  `SELECT COUNT(*)::int AS total FROM users WHERE telegram_chat_id IS NOT NULL`
);
console.log(`Selesai. Tertaut baru: ${linked}, dilewati: ${skipped}. Total user punya chat_id: ${total[0].total}`);

await restoreWebhook();
await pool.end();
