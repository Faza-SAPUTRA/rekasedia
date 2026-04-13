import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { fetchStats, fetchRequests, updateRequestStatus, type DashboardStats } from '../../services/api';
import styles from '../../styles/adminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function DashboardPage() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{ id: number, type: 'APPROVED' | 'REJECTED', name: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setConfirmModal(null);
      setIsClosing(false);
    }, 300); // Wait for fadeOutDown animation
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, reqsData] = await Promise.all([
          fetchStats(),
          fetchRequests()
        ]);
        setStats(statsData);
        // Tampilkan 5 permintaan terbaru saja di dashboard
        setReqs(reqsData.slice(0, 5));
      } catch (err) {
        console.error('Gagal mengambil data dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleApproveClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'APPROVED', name });
  };

  const handleRejectClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'REJECTED', name });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    try {
      await updateRequestStatus(confirmModal.id, confirmModal.type);
      setReqs(prev => prev.map(r => (r.id === confirmModal.id ? { ...r, status: confirmModal.type } : r)));
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses permintaan');
    }
  };

  if (isLoading || !stats) {
    return <div style={{ padding: '24px' }}>Memuat data dashboard...</div>;
  }

  const { pendingRequests, criticalStockCount, criticalItems } = stats;

  // Weekly activity chart data
  const chartData = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
    datasets: [
      {
        data: [18, 25, 15, 30, 22],
        backgroundColor: ['#B8C9B8', '#8A9E8A', '#B8C9B8', '#6B8F71', '#8A9E8A'],
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' }, color: '#7A7A7A' },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className={styles.statsRow}>
        {/* Card 1: Total Permintaan Hari Ini */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span>Total Permintaan Hari Ini</span>
            <div className={`${styles.statCardIcon} ${styles.default}`}>
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
          <div className={styles.statValue}>24</div>
          <div className={styles.statTrend}>↗ +12% dari kemarin</div>
        </div>

        {/* Card 2: Stok Menipis */}
        <div className={`${styles.statCard} ${styles.alert}`}>
          <div className={styles.statCardHeader}>
            <span>Stok Menipis</span>
            <div className={`${styles.statCardIcon} ${styles.warning}`}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className={`${styles.statValue} ${styles.alertValue}`}>
            {criticalStockCount} Item
          </div>
          <div className={`${styles.statSubtitle} ${styles.alertSubtitle}`}>
            Tindakan segera diperlukan
          </div>
        </div>

        {/* Card 3: Menunggu Validasi */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span>Menunggu Validasi</span>
            <div className={`${styles.statCardIcon} ${styles.info}`}>
              <i className="fas fa-clipboard-list"></i>
            </div>
          </div>
          <div className={styles.statValue}>{pendingRequests}</div>
          <div className={styles.statSubtitle}>Pemeriksaan dokumen</div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Permintaan Terbaru</h3>
        <a href="#" className={styles.sectionLink}>Lihat Semua</a>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID REQ</th>
              <th>NAMA BARANG</th>
              <th>PEMOHON</th>
              <th>TANGGAL</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((req) => (
              <tr key={req.id}>
                <td>
                  <span className={styles.reqCode}>{req.req_code}</span>
                </td>
                <td>
                  <span className={styles.itemName}>{req.item_name}</span>
                </td>
                <td>
                  <div className={styles.requesterInfo}>
                    <span>{req.requester_name}</span>
                    <span>({req.requester_role})</span>
                  </div>
                </td>
                <td>{new Date(req.request_date).toLocaleDateString('id-ID')}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      req.priority === 'URGENT' ? styles.urgent : styles.reguler
                    }`}
                  >
                    {req.priority}
                  </span>
                </td>
                <td>
                  {req.status === 'PENDING' ? (
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.btnApprove}
                        onClick={() => handleApproveClick(req.id, req.item_name)}
                      >
                        Setujui
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => handleRejectClick(req.id, req.item_name)}
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`${styles.badge} ${
                        req.status === 'APPROVED' ? styles.reguler : styles.urgent
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Grid */}
      <div className={styles.bottomGrid}>
        {/* Critical Stock */}
        <div className={styles.criticalCard}>
          <div className={styles.criticalHeader}>
            <i className="fas fa-exclamation-circle"></i>
            <h3>Stok Kritis</h3>
          </div>
          <div className={styles.criticalList}>
            {criticalItems.map((item) => (
              <div key={item.id} className={styles.criticalItem}>
                <span className={styles.criticalItemName}>{item.name}</span>
                <span className={styles.criticalBadge}>Sisa {item.stock}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3>Ringkasan Aktivitas</h3>
            <p>Penggunaan inventaris minggu ini</p>
          </div>
          <div className={styles.chartContainer}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className={`globalModalOverlay ${isClosing ? 'closing' : ''}`} onClick={closeModal}>
          <div className={`globalModal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="globalModalClose" onClick={closeModal} title="Tutup">
                <i className="fas fa-times"></i>
            </button>
            <div className={`globalModalIcon ${confirmModal.type === 'APPROVED' ? 'success' : 'error'}`}>
              <i className={`fas ${confirmModal.type === 'APPROVED' ? 'fa-check' : 'fa-times'}`}></i>
            </div>
            <h3>Konfirmasi Tindakan</h3>
            <p>
              Apakah Anda yakin ingin <strong>{confirmModal.type === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}</strong> permintaan untuk <strong>{confirmModal.name}</strong>?
            </p>
            <div className="globalModalBtns">
              <button 
                className="globalModalBtnCancel" 
                onClick={closeModal}
              >
                Batal
              </button>
              <button 
                className="globalModalBtnConfirm" 
                onClick={handleConfirmAction}
                style={confirmModal.type === 'REJECTED' ? { backgroundColor: 'var(--error-red)' } : {}}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
