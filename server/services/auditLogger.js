/**
 * Audit Logger Helper
 * Command Pattern — insert manual ke tabel audit_logs dari Controller
 * Sebagai fallback/supplement untuk Database Triggers
 */
import pool from '../db.js';

/**
 * Catat aksi ke tabel audit_logs
 * @param {object} params
 * @param {number|null} params.actorId - ID user yang melakukan aksi
 * @param {string|null} params.actorRole - Role user (admin/guru)
 * @param {string} params.actionType - 'INSERT' | 'UPDATE' | 'DELETE'
 * @param {string} params.tableAffected - Nama tabel yang terpengaruh
 * @param {number|null} params.recordId - ID record yang terpengaruh
 * @param {object|null} params.changeDetails - Detail perubahan (JSON)
 * @param {string|null} params.ipAddress - IP address pelaku
 * @param {object|null} params.client - pg client (jika dalam transaksi)
 */
export async function logAudit({
  actorId = null,
  actorRole = null,
  actionType,
  tableAffected,
  recordId = null,
  changeDetails = null,
  ipAddress = null,
  client = null,
}) {
  try {
    const queryTarget = client || pool;
    await queryTarget.query(
      `INSERT INTO audit_logs (actor_id, actor_role, action_type, table_affected, record_id, change_details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        actorId,
        actorRole,
        actionType,
        tableAffected,
        recordId,
        changeDetails ? JSON.stringify(changeDetails) : null,
        ipAddress,
      ]
    );
  } catch (error) {
    // Log tetap append-only, jangan crash API utama kalau audit gagal
    console.error('[AuditLog] Gagal mencatat audit:', error.message);
  }
}

export default logAudit;
