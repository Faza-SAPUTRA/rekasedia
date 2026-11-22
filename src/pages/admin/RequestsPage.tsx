import { useState, useEffect, useRef } from 'react';
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

  // Evidence photo state (for COMPLETED)
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evidence viewer modal
  const [viewingEvidence, setViewingEvidence] = useState<string | null>(null);

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
    setEvidencePhoto(null);
    setEvidencePreview(null);
  };

  // Handle photo file selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa gambar (JPG, PNG, dll).');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEvidencePhoto(base64);
      setEvidencePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setEvidencePhoto(null);
    setEvidencePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal || isSubmitting) return;

    // Require evidence photo for COMPLETED
    if (confirmModal.type === 'COMPLETED' && !evidencePhoto) {
      setErrorMessage('Foto bukti pengambilan wajib dilampirkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = getUser();
      await updateRequestStatus(
        confirmModal.id,
        confirmModal.type,
        user?.id,
        confirmModal.type === 'COMPLETED' ? (evidencePhoto || undefined) : undefined
      );
      setRequests(prev => prev.map(req =>
        req.id === confirmModal.id
          ? {
              ...req,
              status: confirmModal.type,
              ...(confirmModal.type === 'COMPLETED' ? { evidence_photo: evidencePhoto } : {}),
            }
          : req
      ));
      setConfirmModal(null);
      setEvidencePhoto(null);
      setEvidencePreview(null);
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
                  ) : req.status === 'COMPLETED' && req.evidence_photo ? (
                    <button
                      onClick={() => setViewingEvidence(req.evidence_photo)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--white)',
                        fontSize: '12px',
                        color: 'var(--sage-green)',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <i className="fas fa-image"></i>
                      Lihat Bukti
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

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal !== null} onClose={closeModal}>
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={closeModal} title="Tutup">
              <i className="fas fa-times"></i>
          </button>
          <div className={`globalModalIcon ${confirmModal?.type !== 'REJECTED' ? 'success' : 'error'}`} style={confirmModal?.type === 'REJECTED' ? { background: 'var(--badge-red-bg)', color: 'var(--error-red)' } : {}}>
            <i className={`fas ${confirmModal?.type === 'COMPLETED' ? 'fa-camera' : confirmModal?.type !== 'REJECTED' ? 'fa-check' : 'fa-times'}`}></i>
          </div>
          <h3>{confirmModal?.type === 'COMPLETED' ? 'Konfirmasi Pengambilan Barang' : 'Konfirmasi Tindakan'}</h3>
          <p>
            {confirmModal?.type === 'COMPLETED' ? (
              <>
                Tandai barang <strong>{confirmModal?.name}</strong> sudah diambil. 
                Lampirkan <strong>foto bukti pengambilan</strong> sebagai evidence.
              </>
            ) : (
              <>
                Apakah Anda yakin ingin <strong>{confirmModal?.type === 'APPROVED' ? 'MENYETUJUI' : 'MENOLAK'}</strong> untuk <strong>{confirmModal?.name}</strong>?
              </>
            )}
          </p>

          {/* Evidence Photo Upload (only for COMPLETED) */}
          {confirmModal?.type === 'COMPLETED' && (
            <div style={{ margin: '16px 0' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
                id="evidence-photo-input"
              />

              {!evidencePreview ? (
                <label
                  htmlFor="evidence-photo-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '28px 20px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: '#FAFAF8',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sage-green)';
                    e.currentTarget.style.background = '#f0f6f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = '#FAFAF8';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'var(--badge-green-bg)',
                    color: 'var(--sage-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    <i className="fas fa-camera"></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark-text)', marginBottom: '4px' }}>
                      Upload Foto Bukti
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-text)' }}>
                      Klik untuk mengambil foto atau pilih dari galeri
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--light-text)', marginTop: '4px' }}>
                      Format: JPG, PNG • Maks 2MB
                    </div>
                  </div>
                </label>
              ) : (
                <div style={{ position: 'relative' }}>
                  <img
                    src={evidencePreview}
                    alt="Bukti pengambilan"
                    style={{
                      width: '100%',
                      maxHeight: '220px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  <button
                    onClick={removePhoto}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                    title="Hapus foto"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--success-green)',
                    fontWeight: 600,
                  }}>
                    <i className="fas fa-check-circle"></i>
                    Foto bukti siap dilampirkan
                  </div>
                </div>
              )}
            </div>
          )}

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
              style={
                confirmModal?.type === 'REJECTED'
                  ? { backgroundColor: 'var(--error-red)', borderColor: 'var(--error-red)' }
                  : confirmModal?.type === 'COMPLETED' && !evidencePhoto
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : {}
              }
            >
              {confirmModal?.type === 'COMPLETED' ? (
                <>
                  <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                  Konfirmasi & Simpan
                </>
              ) : (
                'Ya, Lanjutkan'
              )}
            </LoadingButton>
          </div>
        </div>
      </Modal>

      {/* Evidence Viewer Modal */}
      <Modal isOpen={viewingEvidence !== null} onClose={() => setViewingEvidence(null)}>
        <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={() => setViewingEvidence(null)} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon success">
            <i className="fas fa-image"></i>
          </div>
          <h3>Bukti Pengambilan Barang</h3>
          {viewingEvidence && (
            <img
              src={viewingEvidence}
              alt="Bukti pengambilan barang"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginTop: '12px',
              }}
            />
          )}
          <div className="globalModalBtns" style={{ marginTop: '16px' }}>
            <button className="globalModalBtnCancel" onClick={() => setViewingEvidence(null)}>
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}
