import { useState, useEffect } from 'react';
import { fetchLoans, returnLoan, fetchItems, createLoan, getUser, fetchLoanAvailability } from '../../services/api';
import type { LoanAvailability } from '../../services/api';
import styles from '../../styles/loans.module.css';
import Modal from '../../components/Modal';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import ErrorModal from '../../components/ErrorModal';

export default function LoansPage() {
  const [loanList, setLoanList] = useState<any[]>([]);
  const [loanableItems, setLoanableItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Booking form state
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allLoans, allItems] = await Promise.all([fetchLoans(), fetchItems()]);
      setLoanList(allLoans);
      setLoanableItems(allItems.filter((i: any) => i.is_loanable));
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

  // --- Return flow ---
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

  // --- Booking flow ---
  const openBookingModal = () => {
    const user = getUser();
    setBookingForm({
      item_id: loanableItems[0]?.id || 0,
      borrower_id: user?.id || 0,
      borrow_date: new Date().toISOString().slice(0, 10),
      due_date: '',
      condition_note: '',
    });
    setAvailability(null);
    setShowBookingModal(true);
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
    setIsSubmitting(true);
    try {
      const result = await createLoan(bookingForm);
      setSuccessMessage(result.message);
      setShowBookingModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadData(); // Refresh
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal membuat peminjaman.');
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className={styles.pageTitle}>
              <i className="fas fa-handshake" style={{ marginRight: '10px', color: 'var(--sage-green)' }}></i>
              Manajemen Peminjaman
            </h1>
            <p className={styles.pageSubtitle}>
              Kelola semua peminjaman aset inventaris sekolah. {activeLoans.length} aktif, {returnedLoans.length} selesai.
            </p>
          </div>
          {loanableItems.length > 0 && (
            <button onClick={openBookingModal} style={addBtnStyle}>
              <i className="fas fa-plus-circle"></i>
              Buat Peminjaman
            </button>
          )}
        </div>
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
        <div style={emptyStateStyle}>
          <i className="fas fa-box-open" style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.3 }}></i>
          <p>Tidak ada peminjaman aktif saat ini.</p>
        </div>
      )}

      {/* Returned loans section */}
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

      {/* Booking Modal */}
      <Modal isOpen={showBookingModal} onClose={() => !isSubmitting && setShowBookingModal(false)}>
        <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={() => !isSubmitting && setShowBookingModal(false)} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon" style={{ background: 'var(--badge-green-bg)', color: 'var(--sage-green)' }}>
            <i className="fas fa-calendar-plus"></i>
          </div>
          <h3>Buat Peminjaman Baru</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={labelStyle}>Pilih Aset *</label>
              <select
                value={bookingForm.item_id}
                onChange={(e) => handleItemChange(Number(e.target.value))}
                style={inputStyle}
              >
                <option value={0}>-- Pilih aset --</option>
                {loanableItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} (Stok: {item.stock})</option>
                ))}
              </select>
            </div>

            {/* Availability info */}
            {isCheckingAvailability && (
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-text)' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
                Mengecek ketersediaan...
              </div>
            )}
            {availability && !isCheckingAvailability && (
              <div style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <strong>{availability.item.name}</strong> — {availability.total_active} dari {availability.item.stock} unit sedang dipinjam
                {availability.active_bookings.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    {availability.active_bookings.map((b) => (
                      <div key={b.id} style={{ marginLeft: '12px', color: 'var(--gray-text)' }}>
                        • {b.borrower_name}: {formatDate(b.borrow_date)} — {formatDate(b.due_date)}
                      </div>
                    ))}
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
                  onChange={(e) => setBookingForm((f) => ({ ...f, borrow_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Batas Kembali *</label>
                <input
                  type="date"
                  value={bookingForm.due_date}
                  min={bookingForm.borrow_date}
                  onChange={(e) => setBookingForm((f) => ({ ...f, due_date: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Catatan (opsional)</label>
              <input
                type="text"
                placeholder="Kondisi barang, tujuan pinjam, dll."
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
              Buat Peminjaman
            </LoadingButton>
          </div>
        </div>
      </Modal>

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

// --- Inline styles ---
const addBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px',
  padding: '10px 20px', background: 'var(--sage-green)', color: 'white',
  border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
  fontWeight: 600, fontSize: '0.9rem',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center', padding: '60px 40px', color: 'var(--gray-text)',
  background: 'var(--white)', borderRadius: 'var(--radius-lg)',
  border: '1px dashed var(--border-color)',
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
