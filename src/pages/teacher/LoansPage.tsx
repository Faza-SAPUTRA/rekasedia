import { useState, useEffect } from 'react';
import { fetchLoans, returnLoan, getUser } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';

export default function TeacherLoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successItemName, setSuccessItemName] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getUser();
        const allLoans = await fetchLoans();
        // Filter peminjaman yang dimiliki oleh user yang sedang login (ID 6 for Ibu Sarah)
        setLoanList(allLoans.filter((l: any) => l.borrower_id === user?.id));
      } catch (err) {
        console.error('Gagal mengambil data peminjaman', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const isDueToday = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    return dueDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  };

  const handleReturnClick = (loan: any) => {
    setConfirmModal(loan);
  };

  const closeModal = () => {
    setConfirmModal(null);
  };

  const handleConfirmReturn = async () => {
    if (confirmModal) {
      try {
        await returnLoan(confirmModal.id);
        setLoanList((prev) =>
          prev.map((l) =>
            l.id === confirmModal.id ? { ...l, status: 'DIKEMBALIKAN' } : l
          )
        );
        setSuccessItemName(confirmModal.item_name);
        closeModal();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error('Gagal mengembalikan aset', err);
        alert('Gagal memproses pengembalian');
      }
    }
  };

  if (isLoading) {
      return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>Memuat data peminjaman...</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Barang Pinjaman Anda</h1>
        <p className={styles.pageSubtitle}>
          Kelola dan pantau status aset inventaris yang sedang Anda gunakan saat ini.
        </p>
      </div>

      {/* Loan Cards */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {loanList.map((loan) => {
          const overdue = isDueToday(loan.due_date);
          const returned = loan.status === 'DIKEMBALIKAN';

          return (
            <div key={loan.id} className={styles.loanCard}>
              <div className={styles.loanCardContent}>
                <div className={styles.loanImage}>
                  <div className={styles.loanImagePlaceholder}>
                    <i className={`fas fa-${loan.item_name.toLowerCase().includes('projector') ? 'video' : 'laptop'}`}></i>
                    <span>ASET</span>
                  </div>
                </div>

                <div className={styles.loanDetails}>
                  <div className={styles.loanItemName}>{loan.item_name}</div>
                  <div className={styles.loanDate}>
                    <i className="fas fa-calendar-alt"></i>
                    Dipinjam: {loan.borrow_date}
                  </div>
                </div>

                <div
                  className={`${styles.dueDateBadge} ${
                    overdue && !returned ? styles.overdue : styles.normal
                  }`}
                >
                  <div className={styles.dueDateLabel}>BATAS WAKTU</div>
                  <div className={styles.dueDateValue}>
                    {overdue && !returned ? (
                      <i className="fas fa-exclamation-triangle"></i>
                    ) : (
                      <i className="fas fa-clock"></i>
                    )}
                    {loan.due_date}
                  </div>
                  {overdue && !returned && <div className={styles.dueDateExtra}>(Hari Ini)</div>}
                </div>
              </div>

              {returned ? (
                <div className={styles.returnedBadge}>
                  <i className="fas fa-check-circle"></i>
                  Sudah Dikembalikan
                </div>
              ) : (
                <button
                  className={styles.returnBtn}
                  onClick={() => handleReturnClick(loan)}
                >
                  <i className="fas fa-undo-alt"></i>
                  Kembalikan Sekarang
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loanList.length === 0 && (
        <div style={{textAlign: 'center', padding: '60px 40px', color: 'var(--gray-text)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)'}}>
          <i className="fas fa-box-open" style={{fontSize: '40px', marginBottom: '16px', opacity: 0.3}}></i>
          <p>Anda tidak memiliki peminjaman aktif saat ini.</p>
        </div>
      )}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <i className="fas fa-info-circle"></i>
        <div className={styles.infoContent}>
          <h4>Informasi Pengembalian</h4>
          <p>
            Pastikan barang dikembalikan dalam kondisi yang sama saat dipinjam. Jika ada kerusakan atau kendala teknis pada aset, silakan segera melapor ke staf Sarana & Prasarana.
          </p>
        </div>
      </div>

      {/* Confirmation Modal - Using Portal */}
      <Modal isOpen={confirmModal !== null} onClose={closeModal}>
        <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            <button className="globalModalClose" onClick={closeModal} title="Tutup">
                <i className="fas fa-times"></i>
            </button>
            <div className="globalModalIcon" style={{ background: 'var(--badge-green-bg)', color: 'var(--sage-green)' }}>
                <i className="fas fa-undo-alt"></i>
            </div>
            <h3>Konfirmasi Pengembalian</h3>
            <p>
                Apakah Anda yakin ingin mengembalikan <strong>{confirmModal?.item_name}</strong> sekarang? Pastikan kelengkapan unit sudah sesuai.
            </p>
            <div className="globalModalBtns">
                <button className="globalModalBtnCancel" onClick={closeModal}>Batal</button>
                <button className="globalModalBtnConfirm" onClick={handleConfirmReturn}>Ya, Kembalikan</button>
            </div>
        </div>
      </Modal>

      {/* Success Notification - Using Portal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)}>
        <button className="globalModalClose" onClick={() => setShowSuccess(false)}>
            <i className="fas fa-times"></i>
        </button>
        <div className="globalModalIcon success">
            <i className="fas fa-check"></i>
        </div>
        <h3>Pengembalian Diproses</h3>
        <p>
            Permintaan pengembalian <strong>{successItemName}</strong> telah dikirim ke sistem. Silakan bawa fisik barang ke ruang Sarpras.
        </p>
      </Modal>
    </div>
  );
}
