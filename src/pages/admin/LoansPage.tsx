import { useState } from 'react';
import { loans as initialLoans } from '../../data/mockData';
import type { Loan } from '../../data/mockData';
import styles from '../../styles/loans.module.css';

export default function LoansPage() {
  const [loanList, setLoanList] = useState<Loan[]>(initialLoans);
  const [confirmModal, setConfirmModal] = useState<Loan | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);

  // Check if due date is today or overdue (simulating "25 Okt 2023" as today)
  const isDueToday = (dueDateStr: string) => {
    return dueDateStr === '25 Okt 2023';
  };

  const handleReturnClick = (loan: Loan) => {
    setConfirmModal(loan);
  };

  const handleConfirmReturn = () => {
    if (confirmModal) {
      setLoanList((prev) =>
        prev.map((l) =>
          l.id === confirmModal.id ? { ...l, status: 'DIKEMBALIKAN' as const } : l
        )
      );
      const name = confirmModal.item_name;
      setConfirmModal(null);
      setSuccessModal(name);
      setTimeout(() => setSuccessModal(null), 2500);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Barang Pinjaman Aktif</h1>
        <p className={styles.pageSubtitle}>
          Kelola dan pantau status barang inventaris yang sedang Anda gunakan.
        </p>
      </div>

      {/* Loan Cards */}
      {loanList.map((loan) => {
        const overdue = isDueToday(loan.due_date);
        const returned = loan.status === 'DIKEMBALIKAN';

        return (
          <div key={loan.id} className={styles.loanCard}>
            <div className={styles.loanCardContent}>
              {/* Image */}
              <div className={styles.loanImage}>
                <div className={styles.loanImagePlaceholder}>
                  <i className="fas fa-laptop"></i>
                  <span>Foto</span>
                </div>
              </div>

              {/* Details */}
              <div className={styles.loanDetails}>
                <div className={styles.loanItemName}>{loan.item_name}</div>
                <div className={styles.loanDate}>
                  <i className="fas fa-calendar"></i>
                  Tanggal Pinjam: {loan.borrow_date}
                </div>
              </div>

              {/* Due Date Badge */}
              <div
                className={`${styles.dueDateBadge} ${
                  overdue ? styles.overdue : styles.normal
                }`}
              >
                <div className={styles.dueDateLabel}>BATAS WAKTU</div>
                <div className={styles.dueDateValue}>
                  {overdue ? (
                    <i className="fas fa-exclamation-triangle"></i>
                  ) : (
                    <i className="fas fa-clock"></i>
                  )}
                  {loan.due_date}
                </div>
                {overdue && <div className={styles.dueDateExtra}>(Hari Ini)</div>}
              </div>
            </div>

            {/* Return Button or Status */}
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
                Ajukan Pengembalian
              </button>
            )}
          </div>
        );
      })}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <i className="fas fa-info-circle"></i>
        <div className={styles.infoContent}>
          <h4>Informasi Tambahan</h4>
          <p>
            Pastikan barang dikembalikan dalam kondisi yang sama saat dipinjam. Jika
            terjadi kerusakan atau keterlambatan, segera hubungi bagian sarana prasarana
            sekolah melalui menu pusat bantuan.
          </p>
        </div>
      </div>

      {/* Confirm Return Modal */}
      {confirmModal && (
        <div className={styles.modalOverlay} onClick={() => setConfirmModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles.confirmIcon}`}>
              <i className="fas fa-undo-alt"></i>
            </div>
            <h3>Konfirmasi Pengembalian</h3>
            <p>
              Apakah Anda yakin ingin mengajukan pengembalian untuk{' '}
              <strong>{confirmModal.item_name}</strong>? Pastikan barang dalam kondisi
              baik.
            </p>
            <div className={styles.modalBtns}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setConfirmModal(null)}
              >
                Batal
              </button>
              <button className={styles.modalConfirmBtn} onClick={handleConfirmReturn}>
                Ya, Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className={styles.modalOverlay} onClick={() => setSuccessModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles.successIcon}`}>
              <i className="fas fa-check"></i>
            </div>
            <h3>Pengembalian Berhasil!</h3>
            <p>
              <strong>{successModal}</strong> telah berhasil dikembalikan. Terima kasih
              telah menjaga inventaris sekolah.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
