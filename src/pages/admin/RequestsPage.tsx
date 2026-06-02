import { useState, useEffect } from 'react';
import styles from '../../styles/adminRequests.module.css';
import { fetchRequests, updateRequestStatus, getUser } from '../../services/api';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{ id: number, type: 'APPROVED' | 'REJECTED' | 'COMPLETED', name: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const reqsData = await fetchRequests();
        setRequests(reqsData);
      } catch (err) {
        console.error('Gagal mengambil permintaan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const tabs = [
    { label: 'Semua', count: requests.length },
    { label: 'Menunggu Validasi', count: requests.filter(r => r.status === 'PENDING').length },
    { label: 'Disetujui', count: requests.filter(r => r.status === 'APPROVED').length },
    { label: 'Selesai', count: requests.filter(r => r.status === 'COMPLETED').length },
    { label: 'Ditolak', count: requests.filter(r => r.status === 'REJECTED').length },
  ];

  const filteredRequests = activeTab === 'Semua' 
    ? requests 
    : requests.filter(r => {
        if (activeTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeTab === 'Disetujui') return r.status === 'APPROVED';
        if (activeTab === 'Selesai') return r.status === 'COMPLETED';
        if (activeTab === 'Ditolak') return r.status === 'REJECTED';
        return false;
      });

  const handleApproveClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'APPROVED', name });
  };

  const handleRejectClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'REJECTED', name });
  };

  const handleCompleteClick = (id: number, name: string) => {
    setConfirmModal({ id, type: 'COMPLETED', name });
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setConfirmModal(null);
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const user = getUser();
      await updateRequestStatus(confirmModal.id, confirmModal.type, user?.id);
      setRequests(prev => prev.map(req => req.id === confirmModal.id ? { ...req, status: confirmModal.type } : req));
      setConfirmModal(null);
    } catch (err) {
      console.error(err);
      setErrorMessage('Gagal mengupdate status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageSkeleton variant="requests" rows={6} />;
  }

  return (
    <div>
      {/* Header Tabs */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`${styles.tab} ${activeTab === tab.label ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Validasi</th>
              <th>Nama Barang</th>
              <th>Pemohon</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id}>
                <td>
                  <span className={styles.reqCode}>{req.req_code}</span>
                </td>
                <td className={styles.itemName}>
                  {req.quantity}x {req.item_name}
                </td>
                <td>
                  <div className={styles.requesterInfo}>
                    <span>{req.requester_name}</span>
                    <span>{req.requester_role}</span>
                  </div>
                </td>
                <td>
                  {req.status === 'PENDING' && <span className={`${styles.badge} ${styles.reguler}`}>Menunggu</span>}
                  {req.status === 'APPROVED' && <span className={`${styles.badge} ${styles.approved}`}>Disetujui</span>}
                  {req.status === 'REJECTED' && <span className={`${styles.badge} ${styles.rejected}`}>Ditolak</span>}
                  {req.status === 'COMPLETED' && <span className={`${styles.badge} ${styles.completed}`}>Selesai</span>}
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
                  ) : req.status === 'APPROVED' ? (
                    <button
                      className={styles.btnComplete}
                      onClick={() => handleCompleteClick(req.id, req.item_name)}
                    >
                      Tandai Diambil
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Selesai diproses</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  Tidak ada data permintaan di kategori ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal - Using Portal */}
      <Modal isOpen={confirmModal !== null} onClose={closeModal}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={closeModal} title="Tutup">
              <i className="fas fa-times"></i>
          </button>
          <div className={`globalModalIcon ${confirmModal?.type !== 'REJECTED' ? 'success' : 'error'}`} style={confirmModal?.type === 'REJECTED' ? { background: 'var(--badge-red-bg)', color: 'var(--error-red)' } : {}}>
            <i className={`fas ${confirmModal?.type !== 'REJECTED' ? 'fa-check' : 'fa-times'}`}></i>
          </div>
          <h3>Konfirmasi Tindakan</h3>
          <p>
            Apakah Anda yakin ingin <strong>{confirmModal?.type === 'APPROVED' ? 'MENYETUJUI' : confirmModal?.type === 'REJECTED' ? 'MENOLAK' : 'MENANDAI BARANG SUDAH DIAMBIL'}</strong> untuk <strong>{confirmModal?.name}</strong>?
          </p>
          <div className="globalModalBtns">
            <button 
              className="globalModalBtnCancel" 
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <LoadingButton
              className="globalModalBtnConfirm" 
              onClick={handleConfirmAction}
              isLoading={isSubmitting}
              loadingText="Memproses..."
              style={confirmModal?.type === 'REJECTED' ? { backgroundColor: 'var(--error-red)', borderColor: 'var(--error-red)' } : {}}
            >
              Ya, Lanjutkan
            </LoadingButton>
          </div>
        </div>
      </Modal>
      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}
