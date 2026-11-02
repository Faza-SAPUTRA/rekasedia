/**
 * Telegram Bot Notification Service
 * Webhook Adapter untuk mengirim notifikasi real-time via Telegram Bot API
 * Sesuai arsitektur SOA (REST) di SADD v1.0 — EXT-01
 *
 * Rute notifikasi:
 * - Admin  -> DM admin (TELEGRAM_ADMIN_CHAT_ID)
 * - Guru   -> grup guru (TELEGRAM_TEACHER_GROUP_CHAT_ID), di-tag sesuai identitasnya
 * - Fallback: kalau grup belum diset, kirim DM ke guru (kalau chat id-nya ada), lalu ke admin.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TEACHER_GROUP_CHAT_ID = process.env.TELEGRAM_TEACHER_GROUP_CHAT_ID;
const BASE_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Bangun mention guru yang valid di grup.
 * Prioritas: chat_id (link tg://user?id=) supaya pasti nge-tag,
 * lalu @username, terakhir nama biasa (tanpa tag).
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
  // Belum pernah /start NIP: tampilkan penanda supaya guru sadar perlu menautkan.
  return `${name} <i>(belum menautkan Telegram)</i>`;
}

/**
 * Kirim pesan teks ke Telegram chat
 * @param {string} chatId - Telegram chat ID tujuan
 * @param {string} text - Isi pesan (mendukung HTML parse mode)
 * @returns {Promise<object|null>}
 */
export async function sendTelegramMessage(chatId, text) {
  if (!BASE_URL) {
    console.warn('[Telegram] BOT_TOKEN belum dikonfigurasi. Notifikasi dilewati.');
    return null;
  }
  if (!chatId) {
    console.warn('[Telegram] chat_id tujuan kosong. Notifikasi dilewati.');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
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
 * Kirim pesan ke admin (DM pribadi admin)
 */
export async function sendToAdmin(text) {
  return sendTelegramMessage(ADMIN_CHAT_ID, text);
}

/**
 * Kirim pesan ke grup guru
 */
export async function sendToTeacherGroup(text) {
  return sendTelegramMessage(TEACHER_GROUP_CHAT_ID, text);
}

/**
 * Kirim notifikasi ke guru: utamakan grup guru, fallback DM guru, terakhir DM admin.
 */
export async function notifyTeacher(teacher, text) {
  if (TEACHER_GROUP_CHAT_ID) {
    return sendTelegramMessage(TEACHER_GROUP_CHAT_ID, text);
  }
  if (teacher?.chatId) {
    return sendTelegramMessage(teacher.chatId, text);
  }
  // Jangan pernah kirim notifikasi guru ke DM admin: itu bikin admin mengira
  // pesan guru adalah pesan untuknya. Lebih baik tidak terkirim + tercatat di log.
  console.error('[Telegram] TELEGRAM_TEACHER_GROUP_CHAT_ID belum diset — notifikasi guru tidak dikirim.');
  return null;
}

/**
 * Notifikasi ke Admin (DM): Permintaan ATK baru diajukan Guru
 */
export async function notifyNewRequest(requesterName, items) {
  if (!ADMIN_CHAT_ID) {
    console.warn('[Telegram] ADMIN_CHAT_ID belum diset. Notifikasi admin dilewati.');
    return null;
  }

  const itemList = items
    .map((item) => `- ${escapeHtml(item.item_name)} x${item.quantity}`)
    .join('\n');

  const text =
    `📦 <b>Permintaan ATK Baru</b>\n\n` +
    `Dari: <b>${escapeHtml(requesterName)}</b>\n` +
    `Barang:\n${itemList}\n\n` +
    `Silakan buka dashboard admin untuk mereview.`;

  return sendToAdmin(text);
}

/**
 * Notifikasi ke Guru (grup): Permintaan ATK di-Approve
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
 * Notifikasi ke Guru (grup): Permintaan ATK di-Reject
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
 * Notifikasi reminder (grup guru): 24 jam sebelum due date pengembalian aset
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
  if (!ADMIN_CHAT_ID) return null;

  const text =
    `📋 <b>Peminjaman Aset Baru</b>\n\n` +
    `Peminjam: <b>${escapeHtml(borrowerName)}</b>\n` +
    `Barang: ${escapeHtml(itemName)}\n` +
    `Tanggal pinjam: ${escapeHtml(borrowDate)}\n` +
    `Batas kembali: ${escapeHtml(dueDate)}\n\n` +
    `Tercatat di sistem RekaSedia.`;

  return sendToAdmin(text);
}

export { ADMIN_CHAT_ID, TEACHER_GROUP_CHAT_ID };
