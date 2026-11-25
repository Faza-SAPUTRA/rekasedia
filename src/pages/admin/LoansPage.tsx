import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchLoans, returnLoan } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

type LoanFilterTab = 'DIPINJAM' | 'TERLAMBAT' | 'DIKEMBALIKAN' | 'SEMUA';

export default function LoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LoanFilterTab>('DIPINJAM');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [returnPhoto, setReturnPhoto] = useState<string | null>(null);
  const [returnPhotoPreview, setReturnPhotoPreview] = useState<string | null>(null);
  const [viewingEvidence, setViewingEvidence] = useState<{ title: string; image: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allLoans = await fetchLoans();
      setLoanList(allLoans);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat data.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysDiffFromToday = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isOverdueLoan = (loan: any) => {
    if (loan.status !== 'DIPINJAM') return false;
    const diff = getDaysDiffFromToday(loan.due_date);
    return diff !== null && diff < 0;
  };

  const getInitials = (name?: string) => {
    const parts = String(name || 'U').trim().split(/\s+/);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
  };

  const handleReturnClick = (loan: any) => {
    setReturnPhoto(null);
    setReturnPhotoPreview(null);
    setConfirmModal(loan);
  };

  const closeConfirmModal = () => {
    if (isSubmitting) return;
    setConfirmModal(null);
    setReturnPhoto(null);
    setReturnPhotoPreview(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File harus berupa gambar (JPG, PNG, dll).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Ukuran foto maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setReturnPhoto(base64);
      setReturnPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setReturnPhoto(null);
    setReturnPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmReturn = async () => {
    if (!confirmModal || isSubmitting) return;

    if (!returnPhoto) {
      setErrorMessage('Foto bukti pengembalian wajib dilampirkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await returnLoan(confirmModal.id, returnPhoto);
      const todayIso = new Date().toISOString().slice(0, 10);
      setLoanList((prev) =>
        prev.map((l) =>
          l.id === confirmModal.id
            ? {
                ...l,
                status: 'DIKEMBALIKAN',
                return_date: todayIso,
                return_evidence_photo: returnPhoto,
              }
            : l
        )
      );
      setSuccessMessage(`${confirmModal.item_name} berhasil dikembalikan.`);
      setConfirmModal(null);
      setReturnPhoto(null);
      setReturnPhotoPreview(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengembalikan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeLoans = useMemo(
    () => loanList.filter((l) => l.status === 'DIPINJAM'),
    [loanList]
  );
  const overdueLoans = useMemo(
    () => loanList.filter((l) => isOverdueLoan(l)),
    [loanList]
  );
  const returnedLoans = useMemo(
    () => loanList.filter((l) => l.status === 'DIKEMBALIKAN'),
    [loanList]
  );

  const filteredLoans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = loanList;
    if (activeTab === 'DIPINJAM') base = activeLoans;
    else if (activeTab === 'TERLAMBAT') base = overdueLoans;
    else if (activeTab === 'DIKEMBALIKAN') base = returnedLoans;

    if (!q) return base;
    return base.filter(
      (loan) =>
        String(loan.req_code || '').toLowerCase().includes(q) ||
        String(loan.item_name || '').toLowerCase().includes(q) ||
        String(loan.borrower_name || '').toLowerCase().includes(q) ||
        String(loan.condition_note || '').toLowerCase().includes(q)
    );
  }, [loanList, activeLoans, overdueLoans, returnedLoans, activeTab, searchQuery]);

  if (isLoading) return <PageSkeleton variant="loans" rows={5} />;

  const tabs: Array<{ key: LoanFilterTab; label: string; count: number }> = [
    { key: 'DIPINJAM', label: 'Sedang Dipinjam', count: activeLoans.length },
    { key: 'TERLAMBAT', label: 'Terlambat', count: overdueLoans.length },
    { key: 'DIKEMBALIKAN', label: 'Dikembalikan', count: returnedLoans.length },
    { key: 'SEMUA', label: 'Semua', count: loanList.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manajemen Peminjaman</h1>
        <p className={styles.pageSubtitle}>
          Pantau seluruh peminjaman aset sekolah, batas pengembalian, dan bukti foto serah terima.
        </p>
      </div>

      {/* KPI Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconActive}`}>
            <i className="fas fa-hand-holding"></i>
          </div>
          <div>
            <div className={styles.summaryLabel}>Sedang Dipinjam</div>
            <div className={styles.summaryValue}>{activeLoans.length}</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconOverdue}`}>
            <i className="fas fa-clock"></i>
          </div>
          <div>
            <div className={styles.summaryLabel}>Melewati Batas</div>
            <div className={styles.summaryValue}>{overdueLoans.length}</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={`${styles.summaryIcon} ${styles.summaryIconDone}`}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <div className={styles.summaryLabel}>Sudah Dikembalikan</div>
            <div className={styles.summaryValue}>{returnedLoans.length}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className={styles.adminToolbar}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              <span className={styles.tabBadge}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchBox}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Cari aset atau peminjam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Clean Data Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th>Aset</th>
              <th>Peminjam</th>
              <th>Jadwal Pinjam</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan) => {
              const isReturned = loan.status === 'DIKEMBALIKAN';
              const diffDays = getDaysDiffFromToday(loan.due_date);
              const overdue = !isReturned && diffDays !== null && diffDays < 0;
              const dueToday = !isReturned && diffDays === 0;

              return (
                <tr key={loan.id}>
                  <td>
                    <div className={styles.assetCell}>
                      <div className={styles.assetThumb}>
                        <img
                          src={getItemImage({
                            name: loan.item_name,
                            image_url: loan.item_image,
                            category_name: 'Elektronik',
                          })}
                          alt={loan.item_name}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--sage-dark)', marginBottom: '2px' }}>
                          {loan.req_code || `LOAN-${String(loan.id).padStart(4, '0')}`}
                        </div>
                        <div className={styles.assetTitle}>
                          {loan.quantity && loan.quantity > 1 ? `${loan.quantity}x ` : ''}
                          {loan.item_name}
                        </div>
                        {loan.condition_note && (
                          <div className={styles.assetNote}>{loan.condition_note}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className={styles.borrowerCell}>
                      <span className={styles.borrowerAvatar}>
                        {getInitials(loan.borrower_name)}
                      </span>
                      <span>{loan.borrower_name}</span>
                    </div>
                  </td>

                  <td>
                    <div className={styles.scheduleRange}>
                      {formatDate(loan.borrow_date)} — {formatDate(loan.due_date)}
                    </div>
                    {overdue && diffDays !== null && (
                      <div className={`${styles.scheduleSub} ${styles.scheduleSubDanger}`}>
                        <i className="fas fa-exclamation-circle"></i>
                        Terlambat {Math.abs(diffDays)} hari
                      </div>
                    )}
                    {dueToday && (
                      <div className={`${styles.scheduleSub} ${styles.scheduleSubWarn}`}>
                        <i className="fas fa-clock"></i>
                        Jatuh tempo hari ini
                      </div>
                    )}
                    {!isReturned && diffDays !== null && diffDays > 0 && (
                      <div className={`${styles.scheduleSub} ${styles.scheduleSubMuted}`}>
                        Sisa {diffDays} hari lagi
                      </div>
                    )}
                    {isReturned && loan.return_date && (
                      <div className={`${styles.scheduleSub} ${styles.scheduleSubMuted}`}>
                        Dikembalikan {formatDate(loan.return_date)}
                      </div>
                    )}
                  </td>

                  <td>
                    {isReturned ? (
                      <span className={`${styles.statusPill} ${styles.statusReturned}`}>
                        <i className="fas fa-check-circle"></i>
                        Dikembalikan
                      </span>
                    ) : overdue ? (
                      <span className={`${styles.statusPill} ${styles.statusOverdue}`}>
                        <i className="fas fa-exclamation-triangle"></i>
                        Terlambat
                      </span>
                    ) : (
                      <span className={`${styles.statusPill} ${styles.statusActive}`}>
                        <i className="fas fa-clock"></i>
                        Dipinjam
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    {isReturned ? (
                      loan.return_evidence_photo ? (
                        <button
                          onClick={() =>
                            setViewingEvidence({
                              title: `Bukti Pengembalian — ${loan.item_name}`,
                              image: loan.return_evidence_photo,
                            })
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--white)',
                            fontSize: '12px',
                            color: 'var(--sage-dark)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          <i className="fas fa-image"></i>
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className={styles.tableDoneLabel}>
                          <i className="fas fa-check"></i>
                          Selesai
                        </span>
                      )
                    ) : (
                      <button
                        className={styles.tableActionBtn}
                        onClick={() => handleReturnClick(loan)}
                      >
                        <i className="fas fa-undo-alt"></i>
                        Kembalikan
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredLoans.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className={styles.emptyTableState}>
                    <i className="fas fa-box-open"></i>
                    <div>
                      {searchQuery
                        ? `Tidak ada peminjaman yang cocok dengan "${searchQuery}".`
                        : activeTab === 'TERLAMBAT'
                          ? 'Tidak ada peminjaman yang melewati batas waktu.'
                          : activeTab === 'DIPINJAM'
                            ? 'Tidak ada peminjaman aktif saat ini.'
                            : 'Belum ada data peminjaman.'}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Return Modal with Evidence Photo Upload */}
      <Modal isOpen={confirmModal !== null} onClose={closeConfirmModal}>
        <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={closeConfirmModal} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon" style={{ background: 'var(--badge-green-bg)', color: 'var(--sage-green)' }}>
            <i className="fas fa-camera"></i>
          </div>
          <h3>Konfirmasi Pengembalian</h3>
          <p>
            Konfirmasi pengembalian <strong>{confirmModal?.item_name}</strong> dari <strong>{confirmModal?.borrower_name}</strong>.
            Lampirkan <strong>foto bukti pengembalian</strong> sebagai dokumentasi.
          </p>

          <div style={{ margin: '16px 0' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
              id="return-evidence-photo-input"
            />

            {!returnPhotoPreview ? (
              <label
                htmlFor="return-evidence-photo-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '24px 20px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: '#FAFAF8',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'var(--badge-green-bg)',
                  color: 'var(--sage-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}>
                  <i className="fas fa-camera"></i>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark-text)', marginBottom: '3px' }}>
                    Upload Foto Bukti Pengembalian
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--gray-text)' }}>
                    Klik untuk ambil foto atau pilih dari galeri (JPG/PNG • Maks 2MB)
                  </div>
                </div>
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={returnPhotoPreview}
                  alt="Bukti pengembalian"
                  style={{
                    width: '100%',
                    maxHeight: '220px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0,0,0,0.65)',
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
              </div>
            )}
          </div>

          <div className="globalModalBtns">
            <button className="globalModalBtnCancel" onClick={closeConfirmModal} disabled={isSubmitting}>
              Batal
            </button>
            <LoadingButton
              className="globalModalBtnConfirm"
              onClick={handleConfirmReturn}
              isLoading={isSubmitting}
              loadingText="Menyimpan..."
              disabled={!returnPhoto}
            >
              Ya, Kembalikan
            </LoadingButton>
          </div>
        </div>
      </Modal>

      {/* Evidence Photo Viewer Modal */}
      <Modal isOpen={viewingEvidence !== null} onClose={() => setViewingEvidence(null)}>
        <div style={{ maxWidth: '540px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={() => setViewingEvidence(null)} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <h3 style={{ marginBottom: '14px' }}>{viewingEvidence?.title}</h3>
          {viewingEvidence?.image && (
            <img
              src={viewingEvidence.image}
              alt={viewingEvidence.title}
              style={{
                width: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: '#FAFAF8',
              }}
            />
          )}
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)}>
        <button className="globalModalClose" onClick={() => setShowSuccess(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div className="globalModalIcon success">
          <i className="fas fa-check"></i>
        </div>
        <h3>Berhasil!</h3>
        <p>{successMessage}</p>
      </Modal>

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}
