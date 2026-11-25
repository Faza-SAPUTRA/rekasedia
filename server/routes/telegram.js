import { Router } from 'express';
import pool from '../db.js';
import {
  ensureTelegramSchema,
  escapeHtml,
  linkTelegramAccountByEmail,
  linkTelegramAccountByNip,
  sendTelegramMessage,
} from '../services/telegram.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCommand(text) {
  const trimmed = String(text || '').trim();
  const match = trimmed.match(/^\/([a-zA-Z0-9_]+)(?:@[a-zA-Z0-9_]+)?(?:\s+([\s\S]+))?$/);
  if (!match) return { command: null, args: trimmed };
  return {
    command: match[1].toLowerCase(),
    args: (match[2] || '').trim(),
  };
}

function formatRoleLabel(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'Admin' : 'Guru';
}

function buildLinkedSuccessMessage(user) {
  const isAdmin = String(user.role || '').toLowerCase() === 'admin';
  const roleLabel = formatRoleLabel(user.role);
  const footer = isAdmin
    ? 'Notifikasi permintaan barang baru, peminjaman aset, dan keterlambatan akan dikirim langsung ke DM Telegram ini.'
    : 'Akun Telegram Anda sekarang terhubung untuk menerima notifikasi & tag dari RekaSedia.';

  return (
    `✅ <b>Akun ${roleLabel} Berhasil Ditautkan!</b>\n\n` +
    `Nama: <b>${escapeHtml(user.full_name)}</b>\n` +
    `Email: <code>${escapeHtml(user.email)}</code>\n` +
    `Role: <b>${roleLabel}</b>\n\n` +
    footer
  );
}

async function setPendingEmailSession(chatId) {
  await ensureTelegramSchema();
  await pool.query(
    `INSERT INTO telegram_link_sessions (chat_id, step, expires_at)
     VALUES ($1, 'AWAITING_EMAIL', NOW() + INTERVAL '10 minutes')
     ON CONFLICT (chat_id)
     DO UPDATE SET step = 'AWAITING_EMAIL', expires_at = NOW() + INTERVAL '10 minutes'`,
    [String(chatId)]
  );
}

async function hasPendingEmailSession(chatId) {
  await ensureTelegramSchema();
  const { rows } = await pool.query(
    `SELECT step
     FROM telegram_link_sessions
     WHERE chat_id = $1 AND expires_at > NOW()
     LIMIT 1`,
    [String(chatId)]
  );
  return rows[0]?.step === 'AWAITING_EMAIL';
}

async function clearPendingSession(chatId) {
  await ensureTelegramSchema();
  await pool.query('DELETE FROM telegram_link_sessions WHERE chat_id = $1', [String(chatId)]);
}

async function handleEmailLinking(chatId, username, emailInput) {
  const email = String(emailInput || '').trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    await sendTelegramMessage(
      chatId,
      '⚠️ Format email tidak valid.\n\n' +
        'Silakan kirim email yang digunakan untuk login RekaSedia.\n' +
        'Contoh: <code>sarah.putri@rekasedia.sch.id</code>\n\n' +
        '<i>Ketik /batal untuk membatalkan.</i>'
    );
    return { ok: true, handled: 'email_tidak_valid' };
  }

  const linkedUser = await linkTelegramAccountByEmail(chatId, username, email);
  if (!linkedUser) {
    await sendTelegramMessage(
      chatId,
      `❌ Email <code>${escapeHtml(email)}</code> tidak ditemukan di RekaSedia.\n\n` +
        'Pastikan email sama persis dengan yang dipakai untuk login, lalu kirim ulang (atau ketik <code>/batal</code>).'
    );
    return { ok: true, handled: 'email_tidak_ditemukan' };
  }

  await clearPendingSession(chatId);
  await sendTelegramMessage(chatId, buildLinkedSuccessMessage(linkedUser));
  return {
    ok: true,
    handled: 'terhubung_email',
    user_id: linkedUser.id,
    role: linkedUser.role,
  };
}

/**
 * Webhook Telegram Bot.
 * Dipasang TANPA middleware JWT — Telegram tidak mengirim token aplikasi.
 * Keamanan: cocokkan header X-Telegram-Bot-Api-Secret-Token dengan env
 * TELEGRAM_WEBHOOK_SECRET (kalau diisi).
 *
 * Perintah yang didukung (via DM pribadi ke bot):
 *   /tautkan              -> bot meminta email login, lalu otomatis assign sesuai role (admin/guru)
 *   /tautkan <email>      -> langsung menautkan email tanpa langkah kedua
 *   /status               -> cek akun RekaSedia yang sedang tertaut di Telegram ini
 *   /batal                -> batalkan proses penautan yang sedang berlangsung
 *   /start [NIP]          -> panduan awal (atau tautkan cepat via NIP untuk kompatibilitas lama)
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
  const chatType = message.chat?.type || 'private';
  const username = message.from?.username || null;
  const text = String(message.text || '').trim();

  if (!chatId || !text) {
    return res.json({ ok: true, skipped: 'abaikan' });
  }

  const { command, args } = parseCommand(text);

  try {
    // 1. Perintah /tautkan (bisa /tautkan saja atau /tautkan email@domain)
    if (command === 'tautkan') {
      if (chatType !== 'private') {
        await sendTelegramMessage(
          chatId,
          '🔒 Untuk keamanan, kirim perintah <code>/tautkan</code> lewat <b>chat pribadi (DM)</b> langsung ke bot ini ya.'
        );
        return res.json({ ok: true, handled: 'tolak_grup' });
      }

      if (args) {
        const result = await handleEmailLinking(chatId, username, args);
        return res.json(result);
      }

      await setPendingEmailSession(chatId);
      await sendTelegramMessage(
        chatId,
        '🔗 <b>Tautkan Akun RekaSedia</b>\n\n' +
          'Masukkan <b>email</b> yang Anda gunakan untuk login ke RekaSedia.\n' +
          'Contoh: <code>sarah.putri@rekasedia.sch.id</code>\n\n' +
          '<i>Role (Admin / Guru) akan terdeteksi otomatis. Ketik /batal untuk membatalkan.</i>',
        {
          reply_markup: {
            force_reply: true,
            input_field_placeholder: 'sarah.putri@rekasedia.sch.id',
          },
        }
      );
      return res.json({ ok: true, handled: 'minta_email' });
    }

    // 2. Perintah /batal
    if (command === 'batal') {
      await clearPendingSession(chatId);
      await sendTelegramMessage(chatId, 'Proses penautan akun dibatalkan. Kirim <code>/tautkan</code> kapan saja untuk memulai lagi.');
      return res.json({ ok: true, handled: 'dibatalkan' });
    }

    // 3. Perintah /status — cek akun yang sedang terhubung
    if (command === 'status') {
      if (chatType !== 'private') {
        return res.json({ ok: true, skipped: 'status_di_grup' });
      }
      await ensureTelegramSchema();
      const { rows } = await pool.query(
        `SELECT full_name, email, role
         FROM users
         WHERE telegram_chat_id = $1
         LIMIT 1`,
        [chatId]
      );

      if (rows.length === 0) {
        await sendTelegramMessage(
          chatId,
          'ℹ️ Telegram ini belum terhubung ke akun RekaSedia mana pun.\n\nKirim <code>/tautkan</code> untuk menghubungkan akun Anda.'
        );
        return res.json({ ok: true, handled: 'status_belum_tertaut' });
      }

      const u = rows[0];
      await sendTelegramMessage(
        chatId,
        `ℹ️ <b>Status Penautan RekaSedia</b>\n\n` +
          `Nama: <b>${escapeHtml(u.full_name)}</b>\n` +
          `Email: <code>${escapeHtml(u.email)}</code>\n` +
          `Role: <b>${formatRoleLabel(u.role)}</b>\n\n` +
          `Ingin pindah akun? Kirim <code>/tautkan</code>.`
      );
      return res.json({ ok: true, handled: 'status_tertaut' });
    }

    // 4. Perintah /start (tanpa argumen -> panduan; dengan NIP/email -> langsung tautkan)
    if (command === 'start') {
      if (chatType !== 'private') {
        return res.json({ ok: true, skipped: 'start_di_grup' });
      }

      if (!args) {
        await sendTelegramMessage(
          chatId,
          '👋 <b>Halo! Selamat datang di Bot RekaSedia.</b>\n\n' +
            'Untuk menghubungkan akun <b>Admin</b> maupun <b>Guru</b> secara otomatis, kirim perintah:\n' +
            '<code>/tautkan</code>\n\n' +
            'Perintah lainnya:\n' +
            '• <code>/status</code> — cek akun yang sedang tertaut\n' +
            '• <code>/batal</code> — batalkan proses penautan'
        );
        return res.json({ ok: true, handled: 'panduan_start' });
      }

      // Jika user kirim /start email@domain
      if (EMAIL_REGEX.test(args)) {
        const result = await handleEmailLinking(chatId, username, args);
        return res.json(result);
      }

      // Kompatibilitas lama: /start <NIP>
      const linkedByNip = await linkTelegramAccountByNip(chatId, username, args);
      if (!linkedByNip) {
        await sendTelegramMessage(
          chatId,
          `❌ NIP <code>${escapeHtml(args)}</code> tidak ditemukan di RekaSedia.\n\nAtau gunakan <code>/tautkan</code> untuk menghubungkan dengan email login Anda.`
        );
        return res.json({ ok: true, handled: 'nip_tidak_ditemukan' });
      }

      await clearPendingSession(chatId);
      await sendTelegramMessage(chatId, buildLinkedSuccessMessage(linkedByNip));
      return res.json({ ok: true, handled: 'terhubung_nip', user_id: linkedByNip.id, role: linkedByNip.role });
    }

    // 5. Pesan non-command di DM: cek apakah user sedang diminta memasukkan email setelah /tautkan
    if (!command && chatType === 'private') {
      const awaitingEmail = await hasPendingEmailSession(chatId);
      if (awaitingEmail) {
        const result = await handleEmailLinking(chatId, username, text);
        return res.json(result);
      }
    }

    return res.json({ ok: true, skipped: 'abaikan' });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return res.status(500).json({ error: 'Gagal memproses webhook.' });
  }
});

export default router;
