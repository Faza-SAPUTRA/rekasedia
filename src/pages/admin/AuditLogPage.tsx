import { useState, useEffect } from 'react';
import { fetchAuditLogs, fetchAuditStats } from '../../services/api';
import type { AuditLogEntry, AuditStats } from '../../services/api';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  INSERT: { label: 'Tambah', color: '#22c55e', icon: 'fa-plus-circle' },
  UPDATE: { label: 'Ubah', color: '#3b82f6', icon: 'fa-edit' },
  DELETE: { label: 'Hapus', color: '#ef4444', icon: 'fa-trash' },
};

const TABLE_LABELS: Record<string, string> = {
  items: 'Inventaris',
  requests: 'Permintaan ATK',
  loans: 'Peminjaman',
  users: 'Pengguna',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');
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
      setLogs(logRes.logs);
      setTotal(logRes.total);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat audit log.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(total / limit);

  if (isLoading && page === 1) {
    return <PageSkeleton variant="table" rows={10} />;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-text)', margin: 0 }}>
          <i className="fas fa-history" style={{ marginRight: '10px', color: 'var(--sage-green)' }}></i>
          Audit Trail
        </h1>
        <p style={{ color: 'var(--gray-text)', marginTop: '4px', fontSize: '0.9rem' }}>
          Rekam jejak semua perubahan data dalam sistem RekaSedia.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--sage-green)' }}>{stats.total_logs}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)' }}>Total Log</div>
          </div>
          {stats.by_action.map((a) => {
            const info = ACTION_LABELS[a.action_type] || { label: a.action_type, color: '#6b7280', icon: 'fa-circle' };
            return (
              <div key={a.action_type} style={statCardStyle}>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: info.color }}>{a.count}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)' }}>
                  <i className={`fas ${info.icon}`} style={{ marginRight: '4px' }}></i>
                  {info.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          style={selectStyle}
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
        >
          <option value="">Semua Tabel</option>
          <option value="items">Inventaris</option>
          <option value="requests">Permintaan</option>
          <option value="loans">Peminjaman</option>
        </select>
        <div style={{ marginLeft: 'auto', color: 'var(--gray-text)', fontSize: '0.85rem', alignSelf: 'center' }}>
          {total} catatan ditemukan
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={thStyle}>Waktu</th>
              <th style={thStyle}>Aktor</th>
              <th style={thStyle}>Aksi</th>
              <th style={thStyle}>Tabel</th>
              <th style={thStyle}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-text)' }}>
                  <i className="fas fa-inbox" style={{ fontSize: '28px', display: 'block', marginBottom: '8px', opacity: 0.3 }}></i>
                  Belum ada log yang tercatat.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action_type] || { label: log.action_type, color: '#6b7280', icon: 'fa-circle' };
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={tdStyle}>
                      <span style={{ whiteSpace: 'nowrap' }}>{formatDate(log.created_at)}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500 }}>{log.actor_name || `User #${log.actor_id}`}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-text)', textTransform: 'capitalize' }}>
                        {log.actor_role}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                        background: `${actionInfo.color}18`, color: actionInfo.color,
                      }}>
                        <i className={`fas ${actionInfo.icon}`}></i>
                        {actionInfo.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {TABLE_LABELS[log.table_affected] || log.table_affected}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '280px' }}>
                      <code style={{
                        fontSize: '0.75rem', background: 'var(--bg-color)',
                        padding: '4px 8px', borderRadius: '4px', display: 'block',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {JSON.stringify(log.change_details, null, 1)}
                      </code>
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={pageBtnStyle(false)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <span style={{ padding: '8px 16px', fontSize: '0.88rem', color: 'var(--primary-text)' }}>
            Halaman {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={pageBtnStyle(false)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}

// --- Inline styles ---
const statCardStyle: React.CSSProperties = {
  background: 'var(--white)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--border-color)',
  padding: '20px',
  textAlign: 'center',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--white)',
  fontSize: '0.88rem',
  color: 'var(--primary-text)',
  cursor: 'pointer',
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.82rem',
  color: 'var(--gray-text)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  verticalAlign: 'top',
};

const pageBtnStyle = (_active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)',
  background: 'var(--white)',
  cursor: 'pointer',
  fontSize: '0.85rem',
});

