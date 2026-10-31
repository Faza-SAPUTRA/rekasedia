import { useState, useEffect } from 'react';
import { fetchLoans, returnLoan, fetchItems, createLoan, getUser, fetchLoanAvailability } from '../../services/api';
import type { LoanAvailability } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

export default function TeacherLoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [loanableItems, setLoanableItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Booking form
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    item_id: 0,
    borrower_id: 0,
    borrow_date: '',
    due_date: '',
    condition_note: '',
  });
  const [availability, setAvailability] = useState<LoanAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const user = getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allLoans, allItems] = await Promise.all([fetchLoans(), fetchItems()]);
      setLoanList(allLoans.filter((l: any) => l.borrower_id === user?.id));
      setLoanableItems(allItems.filter((i: any) => i.is_loanable));
    } catch (err) {
      console.error('Gagal mengambil data', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const isDueToday = (dueDateStr: string) => {
    const dueDate = parseDisplayDate(dueDateStr);
    const today = new Date();
    if (!dueDate) return false;
    return dueDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
  };

  // --- Return flow ---
  const handleReturnClick = (loan: any) => setConfirmModal(loan);

  const closeModal = () => {
    if (isSubmitting) return;
    setConfirmModal(null);
  };

  const handleConfirmReturn = async () => {
    if (!confirmModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await returnLoan(confirmModal.id);
      setLoanList((prev) => prev.map((l) =>
        l.id === confirmModal.id ? { ...l, status: 'DIKEMBALIKAN' } : l
      ));
      setSuccessMessage(`${confirmModal.item_name} berhasil dikembalikan.`);
      setConfirmModal(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses pengembalian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Booking flow ---
  const openBookingModal = () => {
    setBookingForm({
      item_id: loanableItems[0]?.id || 0,
      borrower_id: user?.id || 0,
      borrow_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      condition_note: '',
    });
    setAvailability(null);
    setShowBookingModal(true);
    if (loanableItems[0]?.id) {
      checkAvailability(loanableItems[0].id);
    }
  };

  const checkAvailability = async (itemId: number) => {
    if (!itemId) return;
    setIsCheckingAvailability(true);
    try {
      const data = await fetchLoanAvailability(itemId);
      setAvailability(data);
    } catch {
      setAvailability(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleItemChange = (id: number) => {
    setBookingForm((f) => ({ ...f, item_id: id }));
    checkAvailability(id);
  };

  const handleCreateLoan = async () => {
    if (!bookingForm.item_id || !bookingForm.borrow_date || !bookingForm.due_date) {
      setErrorMessage('Lengkapi semua field yang wajib diisi.');
      return;
    }
    if (new Date(bookingForm.borrow_date) > new Date(bookingForm.due_date)) {
      setErrorMessage('Tanggal pinjam tidak boleh melebihi tanggal kembali.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createLoan(bookingForm);
      setSuccessMessage(result.message);
      setShowBookingModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal membuat peminjaman.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <PageSkeleton variant="loans" rows={4} />;

  const activeLoans = loanList.filter((l) => l.status === 'DIPINJAM');
  const returnedLoans = loanList.filter((l) => l.status === 'DIKEMBALIKAN');

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className={styles.pageTitle}>Peminjaman Aset</h1>
            <p className={styles.pageSubtitle}>
              Kelola peminjaman aset inventaris Anda. Ajukan peminjaman baru atau kembalikan barang.
            </p>
          </div>
          {loanableItems.length > 0 && (
            <button onClick={openBookingModal} style={bookBtnStyle}>
              <i className="fas fa-calendar-plus"></i>
              Pinjam Barang
            </button>
          )}
        </div>
      </div>

      {/* Active Loans */}
      <div className={styles.loanGrid}>
        {activeLoans.map((loan) => {
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
                  <button className={styles.returnBtn} onClick={() => handleReturnClick(loan)}>
                    <i className="fas fa-undo-alt"></i>
                    Kembalikan Sekarang
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeLoans.length === 0 && returnedLoans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: 'var(--gray-text)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
          <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}></i>
          <p>Anda belum memiliki peminjaman.</p>
          {loanableItems.length > 0 && (
            <button onClick={openBookingModal} style={{ ...bookBtnStyle, marginTop: '16px' }}>
              <i className="fas fa-calendar-plus"></i>
              Pinjam Barang Sekarang
            </button>
          )}
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
              <div key={loan.id} className={styles.loanCard} style={{ opacity: 0.65 }}>
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
          <h4>Informasi Peminjaman</h4>
          <p>
            Pastikan barang dikembalikan dalam kondisi yang sama saat dipinjam dan sebelum batas waktu yang ditentukan. Jika ada kerusakan atau kendala teknis, segera melapor ke staf Sarana &amp; Prasarana.
          </p>
        </div>
      </div>

      {/* ===== BOOKING MODAL ===== */}
      <Modal isOpen={showBookingModal} onClose={() => !isSubmitting && setShowBookingModal(false)}>
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={() => !isSubmitting && setShowBookingModal(false)} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon" style={{ background: 'var(--badge-green-bg)', color: 'var(--sage-green)' }}>
            <i className="fas fa-calendar-plus"></i>
          </div>
          <h3>Ajukan Peminjaman Baru</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--gray-text)', marginBottom: '16px' }}>
            Pilih aset yang ingin dipinjam dan tentukan jadwal penggunaan.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Pilih Aset *</label>
              <select
                value={bookingForm.item_id}
                onChange={(e) => handleItemChange(Number(e.target.value))}
                style={inputStyle}
              >
                <option value={0}>-- Pilih aset yang tersedia --</option>
                {loanableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Tersedia: {item.stock} unit)
                  </option>
                ))}
              </select>
            </div>

            {/* Availability info */}
            {isCheckingAvailability && (
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                Mengecek jadwal...
              </div>
            )}
            {availability && !isCheckingAvailability && (
              <div style={{ background: 'var(--bg-color)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  <i className="fas fa-calendar-check" style={{ marginRight: '6px', color: 'var(--sage-green)' }}></i>
                  Jadwal {availability.item.name}
                </div>
                <div style={{ color: 'var(--gray-text)' }}>
                  {availability.total_active} dari {availability.item.stock} unit sedang dipinjam
                </div>
                {availability.active_bookings.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Jadwal aktif:</div>
                    {availability.active_bookings.map((b) => (
                      <div key={b.id} style={{ marginLeft: '8px', color: 'var(--gray-text)', fontSize: '0.82rem' }}>
                        • {b.borrower_name}: {formatDate(b.borrow_date)} — {formatDate(b.due_date)}
                      </div>
                    ))}
                  </div>
                )}
                {availability.total_active < availability.item.stock && (
                  <div style={{ color: '#22c55e', fontWeight: 600, marginTop: '6px', fontSize: '0.82rem' }}>
                    ✅ {availability.item.stock - availability.total_active} unit tersedia untuk dipinjam
                  </div>
                )}
                {availability.total_active >= availability.item.stock && (
                  <div style={{ color: '#ef4444', fontWeight: 600, marginTop: '6px', fontSize: '0.82rem' }}>
                    ❌ Semua unit sedang dipinjam — pilih tanggal lain atau tunggu pengembalian
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Tanggal Pinjam *</label>
                <input
                  type="date"
                  value={bookingForm.borrow_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBookingForm((f) => ({ ...f, borrow_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Batas Kembali *</label>
                <input
                  type="date"
                  value={bookingForm.due_date}
                  min={bookingForm.borrow_date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBookingForm((f) => ({ ...f, due_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Catatan / Tujuan (opsional)</label>
              <input
                type="text"
                placeholder="Contoh: untuk presentasi kelas 10-A"
                value={bookingForm.condition_note}
                onChange={(e) => setBookingForm((f) => ({ ...f, condition_note: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="globalModalBtns" style={{ marginTop: '20px' }}>
            <button className="globalModalBtnCancel" onClick={() => setShowBookingModal(false)} disabled={isSubmitting}>
              Batal
            </button>
            <LoadingButton
              className="globalModalBtnConfirm"
              onClick={handleCreateLoan}
              isLoading={isSubmitting}
              loadingText="Memproses..."
            >
              <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
              Ajukan Peminjaman
            </LoadingButton>
          </div>
        </div>
      </Modal>

      {/* Confirm Return Modal */}
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
            <button className="globalModalBtnCancel" onClick={closeModal} disabled={isSubmitting}>Batal</button>
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

// --- Styles ---
const bookBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 20px', background: 'var(--sage-green)', color: 'white',
  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
  fontWeight: 600, fontSize: '0.9rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.85rem',
  marginBottom: '6px', color: 'var(--primary-text)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-color)', fontSize: '0.9rem',
  background: 'var(--white)', boxSizing: 'border-box',
};
