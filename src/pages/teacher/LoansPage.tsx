import { useState, useEffect } from 'react';
import { fetchLoans, returnLoan, getUser } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';

export default function TeacherLoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successItemName, setSuccessItemName] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

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
    const dueDate = parseDisplayDate(dueDateStr);
    const today = new Date();
    if (!dueDate) return false;
    return dueDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  };

  const parseDisplayDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const match = dateString.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!match) return null;

    const months: Record<string, number> = {
      jan: 0, januari: 0,
      feb: 1, februari: 1,
      mar: 2, maret: 2,
      apr: 3, april: 3,
      mei: 4,
      jun: 5, juni: 5,
      jul: 6, juli: 6,
      agu: 7, agustus: 7,
      sep: 8, september: 8,
      okt: 9, oktober: 9,
      nov: 10, november: 10,
      des: 11, desember: 11,
    };

    const [, day, monthName, year] = match;
    const month = months[monthName.toLowerCase()];
    if (month === undefined) return null;

    return new Date(Number(year), month, Number(day));
  };

  const formatDate = (dateString: string) => {
    const parsed = parseDisplayDate(dateString);
    if (!parsed) return dateString;

    return parsed.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
  };

  const handleReturnClick = (loan: any) => {
    setConfirmModal(loan);
  };

  const closeModal = () => {
    if (isSubmittingReturn) return;
    setConfirmModal(null);
  };

  const handleConfirmReturn = async () => {
    if (confirmModal && !isSubmittingReturn) {
      setIsSubmittingReturn(true);
      try {
        await returnLoan(confirmModal.id);
        setLoanList((prev) =>
          prev.map((l) =>
            l.id === confirmModal.id ? { ...l, status: 'DIKEMBALIKAN' } : l
          )
        );
        setSuccessItemName(confirmModal.item_name);
        setConfirmModal(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        console.error('Gagal mengembalikan aset', err);
        alert('Gagal memproses pengembalian');
      } finally {
        setIsSubmittingReturn(false);
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
      <div className={styles.loanGrid}>
        {loanList.map((loan) => {
          const overdue = isDueToday(loan.due_date);
          const returned = loan.status === 'DIKEMBALIKAN';

          return (
            <div key={loan.id} className={styles.loanCard}>
              <div className={styles.loanCardContent}>
                <div className={styles.loanImage}>
                  <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                </div>

              <div className={styles.loanDetails}>
                <div className={styles.loanItemName}>{loan.item_name}</div>
                <div className={styles.loanDates}>
                  <span><strong>Tanggal Pinjam:</strong> {formatDate(loan.borrow_date)}</span>
                  <span><strong>Batas Kembali:</strong> {formatDate(loan.due_date)}</span>
                </div>
                {!returned && overdue && (
                  <span className={styles.dueTodayWarning}>
                    <i className="fas fa-exclamation-triangle"></i>
                    Harus dikembalikan hari ini!
                  </span>
                )}
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
                <button className="globalModalBtnCancel" onClick={closeModal} disabled={isSubmittingReturn}>Batal</button>
                <LoadingButton
                  className="globalModalBtnConfirm"
                  onClick={handleConfirmReturn}
                  isLoading={isSubmittingReturn}
                  loadingText="Memproses..."
                >
                  Ya, Kembalikan
                </LoadingButton>
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
