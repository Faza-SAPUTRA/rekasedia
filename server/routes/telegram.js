import { Router } from 'express';
import pool from '../db.js';
import { sendTelegramMessage } from '../services/telegram.js';

const router = Router();

/**
 * Webhook Telegram Bot.
 * Dipasang TANPA middleware JWT — Telegram tidak mengirim token aplikasi.
 * Keamanan: cocokkan header X-Telegram-Bot-Api-Secret-Token dengan env
 * TELEGRAM_WEBHOOK_SECRET (kalau diisi).
 *
 * Perintah yang didukung:
 *   /start <NIP>  -> tautkan chat_id Telegram guru ke akunnya, supaya bot bisa nge-tag.
 */
router.post('/webhook', async (req, res) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.get('X-Telegram-Bot-Api-Secret-Token') !== secret) {
    return res.status(401).json({ error: 'Secret token webhook tidak valid.' });
  }

  const message = req.body?.message;
  if (!message) {
    return res.json({ ok: true, skipped: 'bukan pesan teks' });
  }

  const chatId = message.chat?.id ? String(message.chat.id) : null;
  const username = message.from?.username || null;
  const text = String(message.text || '').trim();

  if (!chatId || !text.startsWith('/start')) {
    return res.json({ ok: true, skipped: 'abaikan' });
  }

  const nip = text.split(/\s+/).slice(1).join(' ').trim();
  if (!nip) {
    await sendTelegramMessage(
      chatId,
      'Halo! Untuk menghubungkan akun RekaSedia, kirim perintah:\n' +
        '<code>/start NIP_ANDA</code>\n\n' +
        'Contoh: <code>/start 198807272022212013</code>'
    );
    return res.json({ ok: true, handled: 'minta_nip' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE users
       SET telegram_chat_id = $1,
           telegram_username = COALESCE($2, telegram_username),
           updated_at = CURRENT_TIMESTAMP
       WHERE nip = $3
       RETURNING id, full_name`,
      [chatId, username, nip]
    );

    if (rows.length === 0) {
      await sendTelegramMessage(
        chatId,
        `NIP <code>${nip}</code> tidak ditemukan di RekaSedia. Cek kembali NIP Anda.`
      );
      return res.json({ ok: true, handled: 'nip_tidak_ditemukan' });
    }

    await sendTelegramMessage(
      chatId,
      `✅ <b>Terhubung</b>\n\nAkun <b>${rows[0].full_name}</b> sudah terhubung.\n` +
        'Notifikasi akan dikirim ke grup guru dan Anda akan di-tag di sana.'
    );
    return res.json({ ok: true, handled: 'terhubung', user_id: rows[0].id });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return res.status(500).json({ error: 'Gagal memproses webhook.' });
  }
});

export default router;
