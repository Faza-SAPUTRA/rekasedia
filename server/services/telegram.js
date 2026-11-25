/**
 * Telegram Bot Notification Service
 * Webhook Adapter untuk mengirim notifikasi real-time via Telegram Bot API
 * Sesuai arsitektur SOA (REST) di SADD v1.0 — EXT-01
 *
 * Rute notifikasi:
 * - Admin  -> DM ke semua akun role='admin' yang sudah menautkan Telegram via /tautkan
 *             (fallback ke env TELEGRAM_ADMIN_CHAT_ID bila belum ada admin tertaut di DB)
 * - Guru   -> grup guru (TELEGRAM_TEACHER_GROUP_CHAT_ID), di-tag sesuai identitasnya
 *             (fallback ke DM guru kalau chat_id-nya ada)
 */

import pool from '../db.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TEACHER_GROUP_CHAT_ID = process.env.TELEGRAM_TEACHER_GROUP_CHAT_ID;
const BASE_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

let telegramSchemaReady;

/**
 * Pastikan kolom identitas Telegram di `users` dan tabel sesi interaktif
 * `telegram_link_sessions` tersedia tanpa perlu migrasi manual.
 */
export async function ensureTelegramSchema() {
  if (!telegramSchemaReady) {
    telegramSchemaReady = (async () => {
      await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(64) DEFAULT NULL;
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(64) DEFAULT NULL;
        CREATE TABLE IF NOT EXISTS telegram_link_sessions (
          chat_id VARCHAR(64) PRIMARY KEY,
          step VARCHAR(32) NOT NULL DEFAULT 'AWAITING_EMAIL',
          expires_at TIMESTAMP NOT NULL
        );
      `);
    })().catch((error) => {
      telegramSchemaReady = undefined;
      throw error;
    });
  }
  return telegramSchemaReady;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Bangun mention guru yang valid di grup.
 * Prioritas: @username, lalu chat_id (link tg://user?id=), terakhir nama biasa.
 *
 * @param {{ fullName?: string, username?: string, chatId?: string|number }} teacher
 * @returns {string} potongan HTML siap pakai
 */
export function formatMention(teacher) {
  const name = escapeHtml(teacher?.fullName || 'Guru');
  const username = String(teacher?.username || '').replace(/^@/, '').trim();
  const chatId = teacher?.chatId ? String(teacher.chatId).trim() : '';

  if (username && /^[A-Za-z0-9_]{4,64}$/.test(username)) {
    return `<a href="https://t.me/${username}">${name}</a>`;
  }
  if (chatId && /^-?\d+$/.test(chatId)) {
    return `<a href="tg://user?id=${chatId}">${name}</a>`;
  }
  return `${name} <i>(belum menautkan Telegram)</i>`;
}

/**
 * Kirim pesan teks ke Telegram chat
 * @param {string} chatId - Telegram chat ID tujuan
 * @param {string} text - Isi pesan (mendukung HTML parse mode)
 * @param {object} [extra] - Opsi tambahan Telegram sendMessage (misal reply_markup)
 * @returns {Promise<object|null>}
 */
export async function sendTelegramMessage(chatId, text, extra = {}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || BOT_TOKEN;
  const baseUrl = botToken ? `https://api.telegram.org/bot${botToken}` : BASE_URL;

  if (!baseUrl) {
    console.warn('[Telegram] BOT_TOKEN belum dikonfigurasi. Notifikasi dilewati.');
    return null;
  }
  if (!chatId) {
    console.warn('[Telegram] chat_id tujuan kosong. Notifikasi dilewati.');
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...extra,
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('[Telegram] Gagal kirim pesan:', result.description);
    }
    return result;
  } catch (error) {
    // Jangan crash seluruh API hanya karena Telegram gagal
    console.error('[Telegram] Error saat mengirim pesan:', error.message);
    return null;
  }
}

/**
 * Ambil daftar chat_id admin dari database (hasil /tautkan).
 * Jika belum ada admin yang menautkan di DB, fallback ke env TELEGRAM_ADMIN_CHAT_ID.
 * @returns {Promise<string[]>}
 */
export async function getAdminChatIds() {
  try {
    await ensureTelegramSchema();
    const { rows } = await pool.query(
      `SELECT DISTINCT TRIM(telegram_chat_id) AS chat_id
       FROM users
       WHERE LOWER(role) = 'admin'
         AND telegram_chat_id IS NOT NULL
         AND TRIM(telegram_chat_id) <> ''`
    );
    const dbChatIds = rows.map((row) => String(row.chat_id)).filter(Boolean);
    if (dbChatIds.length > 0) {
      return dbChatIds;
    }
  } catch (error) {
    console.error('[Telegram] Gagal membaca admin chat_id dari DB:', error.message);
  }

  const envAdminChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || ADMIN_CHAT_ID || '').trim();
  return envAdminChatId ? [envAdminChatId] : [];
}

/**
 * Tautkan chat_id Telegram ke akun user (admin maupun guru) berdasarkan email login.
 * Jika chat_id sebelumnya tertaut ke akun lain, otomatis dipindahkan agar tidak
 * bentrok dengan unique index users_telegram_chat_id_key.
 */
export async function linkTelegramAccountByEmail(chatId, username, email) {
  await ensureTelegramSchema();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const cleanChatId = String(chatId || '').trim();
  const cleanUsername = username ? String(username).replace(/^@/, '').trim() : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: found } = await client.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE LOWER(TRIM(email)) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (found.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const user = found[0];

    // Lepas chat_id dari akun lama jika Telegram ini sebelumnya tertaut ke akun lain
    await client.query(
      `UPDATE users
       SET telegram_chat_id = NULL,
           telegram_username = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_chat_id = $1 AND id <> $2`,
      [cleanChatId, user.id]
    );

    await client.query(
      `UPDATE users
       SET telegram_chat_id = $1,
           telegram_username = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [cleanChatId, cleanUsername, user.id]
    );

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Tautkan chat_id Telegram berdasarkan NIP (kompatibilitas perintah /start <NIP>).
 */
export async function linkTelegramAccountByNip(chatId, username, nip) {
  await ensureTelegramSchema();
  const cleanNip = String(nip || '').trim();
  const cleanChatId = String(chatId || '').trim();
  const cleanUsername = username ? String(username).replace(/^@/, '').trim() : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: found } = await client.query(
      `SELECT id, full_name, email, role
       FROM users
       WHERE nip = $1
       LIMIT 1`,
      [cleanNip]
    );

    if (found.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const user = found[0];

    await client.query(
      `UPDATE users
       SET telegram_chat_id = NULL,
           telegram_username = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE telegram_chat_id = $1 AND id <> $2`,
      [cleanChatId, user.id]
    );

    await client.query(
      `UPDATE users
       SET telegram_chat_id = $1,
           telegram_username = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [cleanChatId, cleanUsername, user.id]
    );

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Kirim pesan ke semua admin yang terhubung (DM pribadi admin)
 */
export async function sendToAdmin(text) {
  const adminChatIds = await getAdminChatIds();
  if (adminChatIds.length === 0) {
    console.warn('[Telegram] Belum ada admin tertaut (DB maupun TELEGRAM_ADMIN_CHAT_ID). Notifikasi admin dilewati.');
    return null;
  }

  const results = await Promise.all(
    adminChatIds.map((chatId) => sendTelegramMessage(chatId, text))
  );
  return results.length === 1 ? results[0] : results;
}

/**
 * Kirim pesan ke grup guru
 */
export async function sendToTeacherGroup(text) {
  const groupChatId = process.env.TELEGRAM_TEACHER_GROUP_CHAT_ID || TEACHER_GROUP_CHAT_ID;
  return sendTelegramMessage(groupChatId, text);
}

/**
 * Kirim notifikasi ke guru: utamakan grup guru, fallback DM guru.
 */
export async function notifyTeacher(teacher, text) {
  const groupChatId = process.env.TELEGRAM_TEACHER_GROUP_CHAT_ID || TEACHER_GROUP_CHAT_ID;
  if (groupChatId) {
    return sendTelegramMessage(groupChatId, text);
  }
  if (teacher?.chatId) {
    return sendTelegramMessage(teacher.chatId, text);
  }
  // Jangan pernah kirim notifikasi guru ke DM admin: itu bikin admin mengira
  // pesan guru adalah pesan untuknya. Lebih baik tidak terkirim + tercatat di log.
  console.error('[Telegram] TELEGRAM_TEACHER_GROUP_CHAT_ID belum diset & guru belum menautkan DM — notifikasi guru tidak dikirim.');
  return null;
}

/**
 * Notifikasi ke Admin (DM): Permintaan ATK baru diajukan Guru
 */
export async function notifyNewRequest(requesterName, items, schedule = null) {
  const itemList = items
    .map((item) => `- ${escapeHtml(item.item_name)} x${item.quantity}`)
    .join('\n');

  const scheduleLine =
    schedule?.borrow_date && schedule?.due_date
      ? `\nJadwal Pinjam: <b>${escapeHtml(schedule.borrow_date)}</b> s/d <b>${escapeHtml(schedule.due_date)}</b>\n`
      : '\n';

  const text =
    `📦 <b>Permintaan Barang Baru</b>\n\n` +
    `Dari: <b>${escapeHtml(requesterName)}</b>\n` +
    `Barang:\n${itemList}` +
    scheduleLine +
    `\nSilakan buka dashboard admin untuk mereview.`;

  return sendToAdmin(text);
}

/**
 * Notifikasi ke Guru (grup/DM): Permintaan ATK di-Approve
 * @param {{ fullName?: string, username?: string, chatId?: string|number }|null} teacher
 */
export async function notifyRequestApproved(teacher, reqCode, itemName, quantity) {
  const text =
    `✅ <b>Permintaan Disetujui</b>\n\n` +
    `Guru: ${formatMention(teacher)}\n` +
    `Kode: <b>${escapeHtml(reqCode)}</b>\n` +
    `Barang: ${quantity}x ${escapeHtml(itemName)}\n\n` +
    `Silakan ambil di ruang Sarpras.`;

  return notifyTeacher(teacher, text);
}

/**
 * Notifikasi ke Guru (grup/DM): Permintaan ATK di-Reject
 */
export async function notifyRequestRejected(teacher, reqCode, itemName) {
  const text =
    `❌ <b>Permintaan Ditolak</b>\n\n` +
    `Guru: ${formatMention(teacher)}\n` +
    `Kode: <b>${escapeHtml(reqCode)}</b>\n` +
    `Barang: ${escapeHtml(itemName)}\n\n` +
    `Hubungi admin Sarpras untuk informasi lebih lanjut.`;

  return notifyTeacher(teacher, text);
}

/**
 * Notifikasi reminder (grup/DM guru): 24 jam sebelum due date pengembalian aset
 * @param {{ fullName?: string, username?: string, chatId?: string|number }|null} teacher
 */
export async function notifyLoanDueReminder(teacher, borrowerName, itemName, dueDate) {
  const text =
    `⏰ <b>Pengingat Pengembalian Aset</b>\n\n` +
    `Peminjam: ${formatMention(teacher || { fullName: borrowerName })}\n` +
    `Barang: ${escapeHtml(itemName)}\n` +
    `Batas waktu: <b>${escapeHtml(dueDate)}</b>\n\n` +
    `Harap kembalikan tepat waktu ke ruang Sarpras.`;

  return notifyTeacher(teacher, text);
}

/**
 * Notifikasi ke Admin (DM): Peminjaman aset baru dibuat
 */
export async function notifyNewLoan(borrowerName, itemName, borrowDate, dueDate) {
  const text =
    `📋 <b>Peminjaman Aset Baru</b>\n\n` +
    `Peminjam: <b>${escapeHtml(borrowerName)}</b>\n` +
    `Barang: ${escapeHtml(itemName)}\n` +
    `Tanggal pinjam: ${escapeHtml(borrowDate)}\n` +
    `Batas kembali: ${escapeHtml(dueDate)}\n\n` +
    `Tercatat di sistem RekaSedia.`;

  return sendToAdmin(text);
}

/**
 * Notifikasi ke Grup Guru & Admin: Daftar peminjaman yang terlambat dikembalikan
 * @param {Array<{borrower_name: string, item_name: string, due_date: string, days_overdue: number, borrower_telegram_username?: string, borrower_telegram_chat_id?: string}>} overdueLoans
 */
export async function notifyOverdueLoans(overdueLoans) {
  if (!overdueLoans || overdueLoans.length === 0) return null;

  const loanLines = overdueLoans.map((loan) => {
    const teacher = {
      fullName: loan.borrower_name,
      username: loan.borrower_telegram_username,
      chatId: loan.borrower_telegram_chat_id,
    };
    const dueDate = new Date(loan.due_date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    return `• ${escapeHtml(loan.item_name)} — ${formatMention(teacher)}\n  Jatuh tempo: ${dueDate} (${loan.days_overdue} hari terlambat)`;
  }).join('\n\n');

  const text =
    `🚨 <b>Peringatan: Barang Belum Dikembalikan</b>\n\n` +
    `Terdapat <b>${overdueLoans.length}</b> peminjaman yang melewati batas waktu pengembalian:\n\n` +
    `${loanLines}\n\n` +
    `Harap segera mengembalikan ke ruang Sarpras.`;

  const groupChatId = process.env.TELEGRAM_TEACHER_GROUP_CHAT_ID || TEACHER_GROUP_CHAT_ID;
  if (groupChatId) {
    await sendTelegramMessage(groupChatId, text);
  }

  await sendToAdmin(text);

  return { sent: true, count: overdueLoans.length };
}

export { ADMIN_CHAT_ID, TEACHER_GROUP_CHAT_ID };
