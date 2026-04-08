import { useState } from 'react';
import { loans as initialLoans } from '../../data/mockData';
import type { Loan } from '../../data/mockData';
import styles from '../../styles/loans.module.css';

export default function TeacherLoansPage() {
  // Hanya menampilkan peminjaman milik 'Ibu Sarah Putri'
  const [loanList, setLoanList] = useState<Loan[]>(
    initialLoans.filter((l) => l.borrower_name === 'Ibu Sarah Putri')
  );
  
  const [confirmModal, setConfirmModal] = useState<Loan | null>(null);
  const [successModal, setSuccessModal] = useState<string | null>(null);

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
        <h1 className={styles.pageTitle}>Barang Pinjaman Anda</h1>
        <p className={styles.pageSubtitle}>
          Kelola dan pantau status aset inventaris yang sedang Anda gunakan saat ini.
        </p>
      </div>

      {/* Loan Cards */}
      {loanList.map((loan) => {
        const overdue = isDueToday(loan.due_date);
        const returned = loan.status === 'DIKEMBALIKAN';

        return (
          <div key={loan.id} className={styles.loanCard}>
            <div className={styles.loanCardContent}>
              <div className={styles.loanImage}>
                <div className={styles.loanImagePlaceholder}>
                  <i className="fas fa-laptop"></i>
                </div>
              </div>

              <div className={styles.loanDetails}>
                <div className={styles.loanItemName}>{loan.item_name}</div>
                <div className={styles.loanDate}>
                  <i className="fas fa-calendar"></i>
                  Tanggal Pinjam: {loan.borrow_date}
                </div>
              </div>

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
                Kembalikan
              </button>
            )}
          </div>
        );
      })}

      {loanList.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
          Anda tidak memiliki peminjaman aktif saat ini.
        </div>
      )}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <i className="fas fa-info-circle"></i>
        <div className={styles.infoContent}>
          <h4>Informasi Tambahan</h4>
          <p>
            Pastikan barang dikembalikan dalam kondisi yang sama saat dipinjam. Jika ada kerusakan, silakan lapor ke staf Sarpras.
          </p>
        </div>
      </div>

      {/* Modals are reusing the same basic structure but modified copy */}
      {confirmModal && (
        <div className="globalModalOverlay" onClick={() => setConfirmModal(null)}>
          <div className="globalModal" onClick={(e) => e.stopPropagation()}>
            <div className="globalModalIcon">
              <i className="fas fa-undo-alt"></i>
            </div>
            <h3>Konfirmasi Pengebalian</h3>
            <p>
              Yakin mengembalikan <strong>{confirmModal.item_name}</strong> sekarang?
            </p>
            <div className="globalModalBtns">
              <button className="globalModalBtnCancel" onClick={() => setConfirmModal(null)}>Batal</button>
              <button className="globalModalBtnConfirm" onClick={handleConfirmReturn}>Ya, Kembalikan</button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="globalModalOverlay" onClick={() => setSuccessModal(null)}>
          <div className="globalModal" onClick={(e) => e.stopPropagation()}>
            <div className="globalModalIcon success">
              <i className="fas fa-check"></i>
            </div>
            <h3>Pengembalian Diproses</h3>
            <p>
              Permintaan pengembalian <strong>{successModal}</strong> telah dikirim ke admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
