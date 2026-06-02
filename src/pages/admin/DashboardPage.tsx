import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { fetchStats, fetchRequests, updateRequestStatus, fetchPendingUsers, updateUserApproval, type DashboardStats, type PendingUser } from '../../services/api';
import styles from '../../styles/adminDashboard.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import PageSkeleton from '../../components/PageSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function DashboardPage() {
  const [reqs, setReqs] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [processingUserAction, setProcessingUserAction] = useState<string | null>(null);
  
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{ id: number, type: 'APPROVED' | 'REJECTED', name: string } | null>(null);

  const closeModal = () => {
    if (isSubmittingRequest) return;
    setConfirmModal(null);
  };

  const loadData = async () => {
    try {
      const [statsData, reqsData, pendingUsersData] = await Promise.all([
        fetchStats(),
        fetchRequests(),
        fetchPendingUsers()
      ]);
      setStats(statsData);
      setReqs(reqsData.slice(0, 5));
      setPendingUsers(pendingUsersData);
    } catch (err) {
      console.error('Gagal mengambil data dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'APPROVED', name });
  };

  const handleRejectClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'REJECTED', name });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || isSubmittingRequest) return;
    setIsSubmittingRequest(true);
    try {
      await updateRequestStatus(confirmModal.id, confirmModal.type);
      await loadData();
      setConfirmModal(null);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses permintaan');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleUserApproval = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    const actionKey = `${id}-${status}`;
    if (processingUserAction) return;
    setProcessingUserAction(actionKey);
    try {
      await updateUserApproval(id, status);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses akun guru');
    } finally {
      setProcessingUserAction(null);
    }
  };

  if (isLoading || !stats) {
    return <PageSkeleton variant="dashboard" />;
  }

  const { pendingRequests, todayRequests, criticalStockCount, criticalItems } = stats;
  const approvedRequests = reqs.filter((req) => req.status === 'APPROVED').length;
  const pendingRecentRequests = reqs.filter((req) => req.status === 'PENDING').length;

  const chartData = {
    labels: ['Hari Ini', 'Menunggu', 'Disetujui', 'Stok Kritis'],
    datasets: [
      {
        data: [todayRequests, pendingRequests, approvedRequests, criticalStockCount],
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
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span>Total Permintaan Hari Ini</span>
            <div className={`${styles.statCardIcon} ${styles.default}`}>
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
          <div className={styles.statValue}>{todayRequests}</div>
          <div className={styles.statTrend}>Diperbarui otomatis</div>
        </div>

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

      {/* New Account Approvals */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Persetujuan Akun Guru</h3>
        <span className={styles.sectionCount}>{pendingUsers.length} Menunggu</span>
      </div>

      <div className={styles.approvalPanel}>
        {pendingUsers.length === 0 ? (
          <div className={styles.emptyApproval}>
            <i className="fas fa-user-check"></i>
            Tidak ada akun guru baru yang menunggu persetujuan.
          </div>
        ) : (
          pendingUsers.map((user) => (
            <div key={user.id} className={styles.approvalItem}>
              <div className={styles.approvalAvatar}>
                <i className="fas fa-user-graduate"></i>
              </div>
              <div className={styles.approvalInfo}>
                <strong>{user.full_name}</strong>
                <span>{user.email}</span>
                <small>{user.department} • {new Date(user.request_date).toLocaleDateString('id-ID')}</small>
              </div>
              <div className={styles.actionBtns}>
                <LoadingButton
                  className={styles.btnApprove}
                  onClick={() => handleUserApproval(user.id, 'APPROVED')}
                  isLoading={processingUserAction === `${user.id}-APPROVED`}
                  disabled={processingUserAction !== null}
                  loadingText="Memproses..."
                >
                  Setujui
                </LoadingButton>
                <LoadingButton
                  className={styles.btnReject}
                  onClick={() => handleUserApproval(user.id, 'REJECTED')}
                  isLoading={processingUserAction === `${user.id}-REJECTED`}
                  disabled={processingUserAction !== null}
                  loadingText="Memproses..."
                >
                  Tolak
                </LoadingButton>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Requests */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Permintaan Terbaru</h3>
        <a href="/admin/requests" className={styles.sectionLink}>Lihat Semua</a>
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
                        req.status === 'APPROVED' ? styles.reguler : req.status === 'COMPLETED' ? styles.completed : styles.urgent
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'COMPLETED' ? 'Selesai' : 'Ditolak'}
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
        <div className={styles.criticalCard}>
          <div className={styles.criticalHeader}>
            <i className="fas fa-exclamation-circle"></i>
            <h3>Stok Kritis</h3>
          </div>
          <div className={styles.criticalList}>
            {criticalItems.map((item) => (
              <div key={item.id} className={styles.criticalItem}>
                <div className={styles.criticalItemLeft}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className={styles.criticalThumb} />
                  ) : (
                    <div className={styles.criticalPlaceholder}>
                      <i className="fas fa-box"></i>
                    </div>
                  )}
                  <span className={styles.criticalItemName}>{item.name}</span>
                </div>
                <span className={styles.criticalBadge}>Sisa {item.stock}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3>Ringkasan Aktivitas</h3>
            <p>{pendingRecentRequests} permintaan terbaru masih menunggu validasi</p>
          </div>
          <div className={styles.chartContainer}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Confirmation Modal - Using Portal */}
      <Modal isOpen={confirmModal !== null} onClose={closeModal}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={closeModal} title="Tutup">
              <i className="fas fa-times"></i>
          </button>
          <div className={`globalModalIcon ${confirmModal?.type === 'APPROVED' ? 'success' : 'error'}`} style={confirmModal?.type === 'REJECTED' ? { background: 'var(--badge-red-bg)', color: 'var(--error-red)' } : {}}>
            <i className={`fas ${confirmModal?.type === 'APPROVED' ? 'fa-check' : 'fa-times'}`}></i>
          </div>
          <h3>Konfirmasi Tindakan</h3>
          <p>
            Apakah Anda yakin ingin <strong>{confirmModal?.type === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}</strong> permintaan untuk <strong>{confirmModal?.name}</strong>?
          </p>
          <div className="globalModalBtns">
            <button 
              className="globalModalBtnCancel" 
              onClick={closeModal}
              disabled={isSubmittingRequest}
            >
              Batal
            </button>
            <LoadingButton
              className="globalModalBtnConfirm" 
              onClick={handleConfirmAction}
              isLoading={isSubmittingRequest}
              loadingText="Memproses..."
              style={confirmModal?.type === 'REJECTED' ? { backgroundColor: 'var(--error-red)', borderColor: 'var(--error-red)' } : {}}
            >
              Ya, Lanjutkan
            </LoadingButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
