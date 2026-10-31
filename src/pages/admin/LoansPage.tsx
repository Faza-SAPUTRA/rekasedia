import { useState, useEffect } from 'react';
import { fetchLoans, returnLoan } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

export default function LoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
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

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isDueToday = (dueDateStr: string) => {
    const d = new Date(dueDateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDateStr: string) => {
    const d = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return d < today;
  };

  const handleReturnClick = (loan: any) => setConfirmModal(loan);

  const handleConfirmReturn = async () => {
    if (!confirmModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await returnLoan(confirmModal.id);
      setLoanList((prev) => prev.map((l) => l.id === confirmModal.id ? { ...l, status: 'DIKEMBALIKAN' } : l));
      setSuccessMessage(`${confirmModal.item_name} berhasil dikembalikan.`);
      setConfirmModal(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengembalikan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageSkeleton variant="loans" rows={5} />;

  const activeLoans = loanList.filter((l) => l.status === 'DIPINJAM');
  const returnedLoans = loanList.filter((l) => l.status === 'DIKEMBALIKAN');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <i className="fas fa-handshake" style={{ marginRight: '10px', color: 'var(--sage-green)' }}></i>
          Manajemen Peminjaman
        </h1>
        <p className={styles.pageSubtitle}>
          Pantau semua peminjaman aset sekolah. {activeLoans.length} aktif, {returnedLoans.length} selesai.
        </p>
      </div>

      {/* Active Loans */}
      <div className={styles.loanGrid}>
        {activeLoans.map((loan) => {
          const overdue = isOverdue(loan.due_date);
          const dueToday = isDueToday(loan.due_date);

          return (
            <div key={loan.id} className={styles.loanCard}>
              <div className={styles.loanCardContent}>
                <div className={styles.loanImage}>
                  <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                </div>

                <div className={styles.loanDetails}>
                  <div className={styles.loanItemName}>{loan.item_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)', marginBottom: '4px' }}>
                    <i className="fas fa-user" style={{ marginRight: '6px' }}></i>
                    {loan.borrower_name}
                  </div>
                  <div className={styles.loanDates}>
                    <span><strong>Pinjam:</strong> {formatDate(loan.borrow_date)}</span>
                    <span><strong>Kembali:</strong> {formatDate(loan.due_date)}</span>
                  </div>
                  {(overdue || dueToday) && (
                    <span className={styles.dueTodayWarning}>
                      <i className="fas fa-exclamation-triangle"></i>
                      {overdue ? 'Sudah lewat batas waktu!' : 'Harus dikembalikan hari ini!'}
                    </span>
                  )}
                </div>

                <button className={styles.returnBtn} onClick={() => handleReturnClick(loan)}>
                  <i className="fas fa-undo-alt"></i>
                  Kembalikan
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeLoans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--gray-text)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}></i>
          <p>Tidak ada peminjaman aktif saat ini.</p>
        </div>
      )}

      {/* Returned */}
      {returnedLoans.length > 0 && (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '32px 0 16px', color: 'var(--primary-text)' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#22c55e' }}></i>
            Sudah Dikembalikan ({returnedLoans.length})
          </h2>
          <div className={styles.loanGrid}>
            {returnedLoans.slice(0, 6).map((loan) => (
              <div key={loan.id} className={styles.loanCard} style={{ opacity: 0.7 }}>
                <div className={styles.loanCardContent}>
                  <div className={styles.loanImage}>
                    <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                  </div>
                  <div className={styles.loanDetails}>
                    <div className={styles.loanItemName}>{loan.item_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)' }}>{loan.borrower_name}</div>
                  </div>
                  <div className={styles.returnedBadge}>
                    <i className="fas fa-check-circle"></i>
                    Dikembalikan
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirm Return Modal */}
      <Modal isOpen={confirmModal !== null} onClose={() => !isSubmitting && setConfirmModal(null)}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={() => setConfirmModal(null)} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon" style={{ background: 'var(--badge-green-bg)', color: 'var(--sage-green)' }}>
            <i className="fas fa-undo-alt"></i>
          </div>
          <h3>Konfirmasi Pengembalian</h3>
          <p>
            Kembalikan <strong>{confirmModal?.item_name}</strong> yang dipinjam oleh <strong>{confirmModal?.borrower_name}</strong>?
          </p>
          <div className="globalModalBtns">
            <button className="globalModalBtnCancel" onClick={() => setConfirmModal(null)} disabled={isSubmitting}>Batal</button>
            <LoadingButton className="globalModalBtnConfirm" onClick={handleConfirmReturn} isLoading={isSubmitting} loadingText="Memproses...">
              Ya, Kembalikan
            </LoadingButton>
          </div>
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
