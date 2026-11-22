import { useState, useEffect } from 'react';
import { fetchAuditLogs, fetchAuditStats } from '../../services/api';
import type { AuditLogEntry, AuditStats } from '../../services/api';
import ErrorModal from '../../components/ErrorModal';

const ACTION_CONFIG: Record<string, { label: string; bg: string; color: string; icon: string }> = {
  INSERT: { label: 'Tambah', bg: '#dcfce7', color: '#16a34a', icon: 'fa-plus-circle' },
  UPDATE: { label: 'Ubah', bg: '#dbeafe', color: '#2563eb', icon: 'fa-pen' },
  DELETE: { label: 'Hapus', bg: '#fee2e2', color: '#dc2626', icon: 'fa-trash-alt' },
};

const TABLE_LABELS: Record<string, { label: string; icon: string }> = {
  items: { label: 'Inventaris', icon: 'fa-boxes' },
  requests: { label: 'Permintaan ATK', icon: 'fa-file-alt' },
  loans: { label: 'Peminjaman', icon: 'fa-handshake' },
  users: { label: 'Pengguna', icon: 'fa-users' },
  audit_logs: { label: 'Audit Log', icon: 'fa-history' },
};

/** Human-readable change detail formatter */
function formatChangeDetail(details: any, actionType: string, tableAffected: string): { summary: string; lines: string[] } {
  if (!details || typeof details !== 'object') return { summary: String(details || '-'), lines: [] };

  const lines: string[] = [];
  const summaryParts: string[] = [];

  // For requests table
  if (tableAffected === 'requests') {
    if (details.old_status && details.new_status) {
      summaryParts.push(`Status: ${details.old_status} → ${details.new_status}`);
    }
    if (details.req_code) summaryParts.push(`Kode: ${details.req_code}`);
    if (details.item_name) summaryParts.push(`Barang: ${details.item_name}`);
    if (details.quantity) lines.push(`Jumlah: ${details.quantity}`);
    if (details.requester_name) lines.push(`Pemohon: ${details.requester_name}`);
  }

  // For items table
  if (tableAffected === 'items') {
    if (details.new?.name || details.name) summaryParts.push(`Barang: ${details.new?.name || details.name}`);
    if (details.new?.sku || details.sku) lines.push(`SKU: ${details.new?.sku || details.sku}`);
    if (details.old_stock !== undefined && details.new_stock !== undefined) {
      summaryParts.push(`Stok: ${details.old_stock} → ${details.new_stock}`);
    }
    if (details.new?.stock !== undefined) lines.push(`Stok: ${details.new.stock}`);
  }

  // For loans table
  if (tableAffected === 'loans') {
    if (details.item_name) summaryParts.push(`Barang: ${details.item_name}`);
    if (details.old_status && details.new_status) {
      summaryParts.push(`Status: ${details.old_status} → ${details.new_status}`);
    }
    if (details.borrow_date) lines.push(`Tgl pinjam: ${details.borrow_date}`);
    if (details.due_date) lines.push(`Batas kembali: ${details.due_date}`);
  }

  // For users table
  if (tableAffected === 'users') {
    if (details.full_name) summaryParts.push(`Nama: ${details.full_name}`);
    if (details.email) lines.push(`Email: ${details.email}`);
    if (details.old_status && details.new_status) {
      summaryParts.push(`Status: ${details.old_status} → ${details.new_status}`);
    }
  }

  // Generic fallback: extract key fields
  if (summaryParts.length === 0) {
    const d = details.new || details;
    if (d.name) summaryParts.push(d.name);
    if (d.item_name) summaryParts.push(d.item_name);
    if (d.req_code) summaryParts.push(d.req_code);
    if (d.status) summaryParts.push(`Status: ${d.status}`);
  }

  return {
    summary: summaryParts.join(' • ') || (actionType === 'INSERT' ? 'Data baru ditambahkan' : actionType === 'DELETE' ? 'Data dihapus' : 'Data diperbarui'),
    lines,
  };
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const limit = 25;

  useEffect(() => {
    loadData();
  }, [page, filterAction, filterTable]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logRes, statsRes] = await Promise.all([
        fetchAuditLogs({
          page,
          limit,
          action_type: filterAction || undefined,
          table_affected: filterTable || undefined,
        }),
        page === 1 ? fetchAuditStats() : Promise.resolve(null),
      ]);
      setLogs(logRes?.logs || []);
      setTotal(logRes?.total || 0);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error('Audit log error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat audit log.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        hourCycle: 'h23',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (isLoading && page === 1) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
        <p>Memuat audit log...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fas fa-history" style={{ color: 'var(--sage-green)' }}></i>
          Audit Trail
        </h1>
        <p style={{ color: 'var(--gray-text)', marginTop: '4px', fontSize: '0.9rem' }}>
          Rekam jejak semua perubahan data dalam sistem RekaSedia.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && stats.total_logs > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--sage-green)' }}>{stats.total_logs}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px' }}>Total Log</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a' }}>{stats.total_inserts}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="fas fa-plus-circle" style={{ color: '#16a34a' }}></i> Tambah
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2563eb' }}>{stats.total_updates}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="fas fa-pen" style={{ color: '#2563eb' }}></i> Ubah
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#dc2626' }}>{stats.total_deletes}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <i className="fas fa-trash-alt" style={{ color: '#dc2626' }}></i> Hapus
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--dark-text)' }}>{stats.today_count}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px' }}>Hari Ini</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--dark-text)' }}>{stats.week_count}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-text)', marginTop: '2px' }}>7 Hari Terakhir</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          style={selectStyle}
          aria-label="Filter berdasarkan aksi"
        >
          <option value="">Semua Aksi</option>
          <option value="INSERT">Tambah</option>
          <option value="UPDATE">Ubah</option>
          <option value="DELETE">Hapus</option>
        </select>
        <select
          value={filterTable}
          onChange={(e) => { setFilterTable(e.target.value); setPage(1); }}
          style={selectStyle}
          aria-label="Filter berdasarkan tabel"
        >
          <option value="">Semua Tabel</option>
          <option value="items">Inventaris</option>
          <option value="requests">Permintaan ATK</option>
          <option value="loans">Peminjaman</option>
          <option value="users">Pengguna</option>
        </select>
        <div style={{ marginLeft: 'auto', color: 'var(--gray-text)', fontSize: '0.85rem' }}>
          {total} catatan ditemukan
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border-color, #e5e7eb)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color, #f9fafb)', borderBottom: '2px solid var(--border-color, #e5e7eb)' }}>
              <th style={thStyle}>Waktu</th>
              <th style={thStyle}>Aktor</th>
              <th style={thStyle}>Aksi</th>
              <th style={thStyle}>Tabel</th>
              <th style={thStyle}>Detail Perubahan</th>
              <th style={{ ...thStyle, width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--gray-text, #6b7280)' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', opacity: 0.25 }}></i>
                  <span style={{ fontSize: '0.9rem' }}>Belum ada log yang tercatat.</span>
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionCfg = ACTION_CONFIG[log.action_type] || { label: log.action_type, bg: '#f3f4f6', color: '#6b7280', icon: 'fa-circle' };
                const tableCfg = TABLE_LABELS[log.table_affected] || { label: log.table_affected, icon: 'fa-database' };
                const detail = formatChangeDetail(log.change_details, log.action_type, log.table_affected);
                const isExpanded = expandedId === log.id;

                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid var(--border-color, #e5e7eb)',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--bg-color, #f9fafb)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <td style={tdStyle}>
                      <span style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDate(log.created_at)}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.actor_name || `User #${log.actor_id}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)', textTransform: 'capitalize' }}>
                        {log.actor_role}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                        background: actionCfg.bg, color: actionCfg.color,
                        letterSpacing: '0.02em', userSelect: 'none',
                      }}>
                        <i className={`fas ${actionCfg.icon}`} style={{ fontSize: '0.7rem' }}></i>
                        {actionCfg.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                        <i className={`fas ${tableCfg.icon}`} style={{ color: 'var(--sage-green)', fontSize: '0.78rem' }}></i>
                        {tableCfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '320px' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 500, color: 'var(--dark-text)' }}>
                        {detail.summary}
                      </div>
                      {detail.lines.length > 0 && !isExpanded && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-text)', marginTop: '2px' }}>
                          {detail.lines[0]}{detail.lines.length > 1 ? ` +${detail.lines.length - 1} lainnya` : ''}
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{
                          marginTop: '8px', padding: '10px 12px',
                          background: 'var(--white)', border: '1px solid var(--border-color, #e5e7eb)',
                          borderRadius: '8px', fontSize: '0.78rem',
                        }}>
                          {detail.lines.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                              {detail.lines.map((line, i) => (
                                <div key={i} style={{ padding: '2px 0', color: 'var(--dark-text)' }}>{line}</div>
                              ))}
                            </div>
                          )}
                          <details style={{ cursor: 'pointer' }}>
                            <summary style={{ fontSize: '0.72rem', color: 'var(--gray-text)', fontWeight: 600, userSelect: 'none' }}>
                              Lihat JSON Mentah
                            </summary>
                            <code style={{
                              display: 'block', marginTop: '6px', padding: '8px',
                              background: 'var(--bg-color, #f3f4f6)', borderRadius: '6px',
                              fontSize: '0.72rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                              maxHeight: '200px', overflow: 'auto', color: 'var(--dark-text)',
                            }}>
                              {typeof log.change_details === 'object'
                                ? JSON.stringify(log.change_details, null, 2)
                                : String(log.change_details || '-')}
                            </code>
                          </details>
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <i
                        className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                        style={{ fontSize: '0.7rem', color: 'var(--gray-text)', transition: 'transform 0.2s' }}
                      ></i>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={pageBtnStyle}
            title="Halaman pertama"
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageBtnStyle}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--primary-text)', fontWeight: 500 }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pageBtnStyle}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={pageBtnStyle}
            title="Halaman terakhir"
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}

// --- Inline styles ---
const statCardStyle: React.CSSProperties = {
  background: 'var(--white, #fff)',
  borderRadius: '12px',
  border: '1px solid var(--border-color, #e5e7eb)',
  padding: '18px 14px',
  textAlign: 'center' as const,
  transition: 'box-shadow 0.2s, transform 0.2s',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: '8px',
  border: '1px solid var(--border-color, #e5e7eb)',
  background: 'var(--white, #fff)',
  fontSize: '0.88rem',
  color: 'var(--primary-text, #1f2937)',
  cursor: 'pointer',
  outline: 'none',
};

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left' as const,
  fontWeight: 700,
  fontSize: '0.75rem',
  color: 'var(--gray-text, #6b7280)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  verticalAlign: 'top' as const,
};

const pageBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border-color, #e5e7eb)',
  background: 'var(--white, #fff)',
  cursor: 'pointer',
  fontSize: '0.82rem',
  color: 'var(--primary-text)',
  transition: 'background 0.15s',
};
