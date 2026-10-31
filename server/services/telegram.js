/**
 * Telegram Bot Notification Service
 * Webhook Adapter untuk mengirim notifikasi real-time via Telegram Bot API
 * Sesuai arsitektur SOA (REST) di SADD v1.0 — EXT-01
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const BASE_URL = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;

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

  try {
    const response = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
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
 * Notifikasi ke Admin: Permintaan ATK baru diajukan Guru
 */
export async function notifyNewRequest(requesterName, items) {
  if (!ADMIN_CHAT_ID) return;

  const itemList = items
    .map((i) => `  • ${i.quantity}x ${i.item_name}`)
    .join('\n');

  const text =
    `📦 <b>Permintaan ATK Baru</b>\n\n` +
    `Dari: <b>${requesterName}</b>\n` +
    `Barang:\n${itemList}\n\n` +
    `Silakan buka dashboard admin untuk mereview.`;

  return sendTelegramMessage(ADMIN_CHAT_ID, text);
}

/**
 * Notifikasi ke Guru: Permintaan ATK di-Approve
 */
export async function notifyRequestApproved(chatId, reqCode, itemName, quantity) {
  const text =
    `✅ <b>Permintaan Disetujui</b>\n\n` +
    `Kode: <b>${reqCode}</b>\n` +
    `Barang: ${quantity}x ${itemName}\n\n` +
    `Silakan ambil di ruang Sarpras.`;

  return sendTelegramMessage(chatId || ADMIN_CHAT_ID, text);
}

/**
 * Notifikasi ke Guru: Permintaan ATK di-Reject
 */
export async function notifyRequestRejected(chatId, reqCode, itemName) {
  const text =
    `❌ <b>Permintaan Ditolak</b>\n\n` +
    `Kode: <b>${reqCode}</b>\n` +
    `Barang: ${itemName}\n\n` +
    `Hubungi admin Sarpras untuk informasi lebih lanjut.`;

  return sendTelegramMessage(chatId || ADMIN_CHAT_ID, text);
}

/**
 * Notifikasi reminder: 24 jam sebelum due date pengembalian aset
 */
export async function notifyLoanDueReminder(chatId, borrowerName, itemName, dueDate) {
  const text =
    `⏰ <b>Pengingat Pengembalian Aset</b>\n\n` +
    `Peminjam: <b>${borrowerName}</b>\n` +
    `Barang: ${itemName}\n` +
    `Batas waktu: <b>${dueDate}</b>\n\n` +
    `Harap kembalikan tepat waktu ke ruang Sarpras.`;

  return sendTelegramMessage(chatId || ADMIN_CHAT_ID, text);
}

/**
 * Notifikasi ke Admin: Peminjaman aset baru dibuat
 */
export async function notifyNewLoan(borrowerName, itemName, borrowDate, dueDate) {
  if (!ADMIN_CHAT_ID) return;

  const text =
    `📋 <b>Peminjaman Aset Baru</b>\n\n` +
    `Peminjam: <b>${borrowerName}</b>\n` +
    `Barang: ${itemName}\n` +
    `Tanggal pinjam: ${borrowDate}\n` +
    `Batas kembali: ${dueDate}\n\n` +
    `Tercatat di sistem RekaSedia.`;

  return sendTelegramMessage(ADMIN_CHAT_ID, text);
}

export { ADMIN_CHAT_ID };
