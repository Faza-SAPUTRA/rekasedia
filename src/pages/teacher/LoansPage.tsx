import { useState, useEffect } from 'react';
import { fetchLoans, getUser } from '../../services/api';
import styles from '../../styles/loans.module.css';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

export default function TeacherLoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const user = getUser();

  useEffect(() => {
    const loadData = async () => {
      try {
        const allLoans = await fetchLoans();
        setLoanList(allLoans.filter((l: any) => l.borrower_id === user?.id));
      } catch (err) {
        console.error('Gagal mengambil data peminjaman', err);
        setErrorMessage(err instanceof Error ? err.message : 'Gagal memuat data peminjaman.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const parseDisplayDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const match = dateString.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!match) return null;

    const months: Record<string, number> = {
      jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2,
      apr: 3, april: 3, mei: 4, jun: 5, juni: 5, jul: 6, juli: 6,
      agu: 7, agustus: 7, sep: 8, september: 8, okt: 9, oktober: 9,
      nov: 10, november: 10, des: 11, desember: 11,
    };

    const [, day, monthName, year] = match;
    const month = months[monthName.toLowerCase()];
    if (month === undefined) return null;
    return new Date(Number(year), month, Number(day));
  };

  const formatDate = (dateString: string) => {
    const parsed = parseDisplayDate(dateString);
    if (!parsed) return dateString;
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysDiff = (dueDateStr: string) => {
    const dueDate = parseDisplayDate(dueDateStr);
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (isLoading) return <PageSkeleton variant="loans" rows={4} />;

  const activeLoans = loanList.filter((l) => l.status === 'DIPINJAM');
  const returnedLoans = loanList.filter((l) => l.status === 'DIKEMBALIKAN');

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Peminjaman Aset</h1>
          <p className={styles.pageSubtitle}>
            Pantau status aset inventaris yang sedang Anda pinjam beserta riwayat pengembalian.
          </p>
        </div>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--primary-text)' }}>
            <i className="fas fa-clock" style={{ marginRight: '8px', color: 'var(--sage-green)' }}></i>
            Sedang Dipinjam ({activeLoans.length})
          </h2>
          <div className={styles.loanGrid}>
            {activeLoans.map((loan) => {
              const diffDays = getDaysDiff(loan.due_date);
              const isOverdue = diffDays !== null && diffDays < 0;
              const isDueToday = diffDays === 0;

              return (
                <div key={loan.id} className={styles.loanCard}>
                  <div className={styles.loanCardContent}>
                    <div className={styles.loanImage}>
                      <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                    </div>

                    <div className={styles.loanDetails}>
                      <div className={styles.loanItemName}>
                        {loan.quantity && loan.quantity > 1 ? `${loan.quantity}x ` : ''}
                        {loan.item_name}
                      </div>
                      <div className={styles.loanDates}>
                        <span><strong>Tanggal Pinjam:</strong> {formatDate(loan.borrow_date)}</span>
                        <span><strong>Batas Kembali:</strong> {formatDate(loan.due_date)}</span>
                      </div>
                      {isOverdue && diffDays !== null && (
                        <span className={styles.dueTodayWarning}>
                          <i className="fas fa-exclamation-triangle"></i>
                          Terlambat {Math.abs(diffDays)} hari — segera kembalikan ke Ruang Sarpras
                        </span>
                      )}
                      {isDueToday && (
                        <span className={styles.dueTodayWarning}>
                          <i className="fas fa-exclamation-triangle"></i>
                          Harus dikembalikan hari ini ke Ruang Sarpras!
                        </span>
                      )}
                    </div>

                    <div
                      className={styles.returnedBadge}
                      style={
                        isOverdue
                          ? { background: '#FEECEC', color: '#C84B31' }
                          : { background: '#E8F0EA', color: '#3E634D' }
                      }
                    >
                      <i className={isOverdue ? 'fas fa-exclamation-circle' : 'fas fa-hand-holding'}></i>
                      {isOverdue ? 'Melewati Batas — Kembalikan ke Sarpras' : 'Sedang Dipinjam'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeLoans.length === 0 && returnedLoans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--gray-text)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}></i>
          <p>Anda belum memiliki peminjaman aset. Ajukan peminjaman melalui menu <strong>Barang Modal</strong> atau <strong>Persediaan</strong>.</p>
        </div>
      )}

      {/* Returned section */}
      {returnedLoans.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '28px 0 12px', color: 'var(--primary-text)' }}>
            <i className="fas fa-check-circle" style={{ marginRight: '8px', color: '#22c55e' }}></i>
            Riwayat Dikembalikan ({returnedLoans.length})
          </h2>
          <div className={styles.loanGrid}>
            {returnedLoans.map((loan) => (
              <div key={loan.id} className={styles.loanCard} style={{ opacity: 0.72 }}>
                <div className={styles.loanCardContent}>
                  <div className={styles.loanImage}>
                    <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                  </div>
                  <div className={styles.loanDetails}>
                    <div className={styles.loanItemName}>{loan.item_name}</div>
                    <div className={styles.loanDates}>
                      <span>{formatDate(loan.borrow_date)} — {formatDate(loan.due_date)}</span>
                    </div>
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

      {/* Info Box */}
      <div className={styles.infoBox}>
        <i className="fas fa-info-circle"></i>
        <div className={styles.infoContent}>
          <h4>Informasi Peminjaman &amp; Pengembalian</h4>
          <p>
            Untuk mengembalikan barang, serahkan unit langsung ke staf <strong>Admin Sarpras</strong> agar status pengembalian dikonfirmasi oleh admin. Pastikan kondisi dan kelengkapan unit sesuai sebelum batas waktu.
          </p>
        </div>
      </div>

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />
    </div>
  );
}
