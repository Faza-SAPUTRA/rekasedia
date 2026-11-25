import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/teacherRequests.module.css';
import { fetchLoans, fetchRequests, getUser } from '../../services/api';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import Modal from '../../components/Modal';

type MainTab = 'requests' | 'loans';
type DetailSelection =
  | { type: 'request'; data: any }
  | { type: 'loan'; data: any }
  | null;

export default function TeacherRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('requests');
  const [activeRequestTab, setActiveRequestTab] = useState('Semua');
  const [activeLoanTab, setActiveLoanTab] = useState('Semua');
  const [selectedDetail, setSelectedDetail] = useState<DetailSelection>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getUser();
        const [allRequests, allLoans] = await Promise.all([
          fetchRequests(),
          fetchLoans()
        ]);
        setRequests(allRequests.filter((r: any) => r.requester_id === user?.id));
        setLoans(allLoans.filter((loan: any) => loan.borrower_id === user?.id));
      } catch (err) {
        console.error('Gagal mengambil data pesanan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const requestTabs = [
    { label: 'Semua', count: requests.length },
    { label: 'Menunggu Validasi', count: requests.filter((r: any) => r.status === 'PENDING').length },
    { label: 'Siap Diambil', count: requests.filter((r: any) => r.status === 'APPROVED').length },
    { label: 'Selesai', count: requests.filter((r: any) => r.status === 'COMPLETED').length },
    { label: 'Ditolak', count: requests.filter((r: any) => r.status === 'REJECTED').length },
  ];

  const loanTabs = [
    { label: 'Semua', count: loans.length },
    { label: 'Dipinjam', count: loans.filter((loan: any) => loan.status === 'DIPINJAM').length },
    { label: 'Dikembalikan', count: loans.filter((loan: any) => loan.status === 'DIKEMBALIKAN').length },
  ];

  const filteredRequests = activeRequestTab === 'Semua'
    ? requests
    : requests.filter((r: any) => {
        if (activeRequestTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeRequestTab === 'Siap Diambil') return r.status === 'APPROVED';
        if (activeRequestTab === 'Selesai') return r.status === 'COMPLETED';
        if (activeRequestTab === 'Ditolak') return r.status === 'REJECTED';
        return false;
      });

  const filteredLoans = activeLoanTab === 'Semua'
    ? loans
    : loans.filter((loan: any) => {
        if (activeLoanTab === 'Dipinjam') return loan.status === 'DIPINJAM';
        if (activeLoanTab === 'Dikembalikan') return loan.status === 'DIKEMBALIKAN';
        return false;
      });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRequestStatusLabel = (status: string) => {
    if (status === 'PENDING') return 'Menunggu Validasi';
    if (status === 'APPROVED') return 'Siap Diambil';
    if (status === 'COMPLETED') return 'Selesai';
    return 'Ditolak';
  };

  const getRequestStatusClass = (status: string) => {
    if (status === 'PENDING') return styles.pending;
    if (status === 'APPROVED') return styles.ready;
    if (status === 'COMPLETED') return styles.completed;
    return styles.rejected;
  };

  if (isLoading) {
    return <PageSkeleton variant="requests" rows={5} />;
  }

  return (
    <div className="animate-fade-in">
      <div className={styles.pageHeader}>
        <div>
          <h1>Pesanan &amp; Peminjaman</h1>
          <p>Pantau status permintaan barang, peminjaman aset, serta klik riwayat untuk melihat detail dan bukti foto.</p>
        </div>
      </div>

      <div className={styles.segmentedTabs}>
        <button
          className={`${styles.segmentedTab} ${activeMainTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('requests')}
        >
          <i className="fas fa-shopping-basket"></i>
          Permintaan Barang
          <span>{requests.length}</span>
        </button>
        <button
          className={`${styles.segmentedTab} ${activeMainTab === 'loans' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('loans')}
        >
          <i className="fas fa-hand-holding"></i>
          Peminjaman Aset
          <span>{loans.length}</span>
        </button>
      </div>

      {activeMainTab === 'requests' ? (
        <>
          <div className={styles.tabsContainer}>
            {requestTabs.map((tab) => (
              <button
                key={tab.label}
                className={`${styles.tab} ${activeRequestTab === tab.label ? styles.active : ''}`}
                onClick={() => setActiveRequestTab(tab.label)}
              >
                {tab.label}
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.requestsList}>
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className={styles.requestCard}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDetail({ type: 'request', data: req })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDetail({ type: 'request', data: req });
                  }
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <span className={styles.reqCode}>{req.req_code}</span>
                    <span className={styles.reqDate}>
                      <i className="far fa-calendar-alt"></i>
                      {formatDate(req.request_date)}
                    </span>
                  </div>
                  <div className={`${styles.statusPill} ${getRequestStatusClass(req.status)}`}>
                    {getRequestStatusLabel(req.status)}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.itemList}>{req.quantity}x {req.item_name}</div>
                  {req.borrow_date && req.due_date && (
                    <div style={{ fontSize: '13px', color: '#4b6b58', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-calendar-alt"></i>
                      <span>Jadwal Pinjam: {formatDate(req.borrow_date)} — {formatDate(req.due_date)}</span>
                    </div>
                  )}
                  <div className={styles.destination}>
                    <i className="fas fa-map-marker-alt"></i>
                    {req.status === 'COMPLETED'
                      ? ((req.borrow_date && req.due_date) || req.is_loanable
                        ? 'Barang sudah diambil — pantau pengembalian di tab Peminjaman Aset'
                        : 'Barang sudah diambil')
                      : 'Pengambilan di Ruang Sarpras'}
                  </div>

                  <div className={styles.cardFooterHint}>
                    {req.evidence_photo && (
                      <span className={styles.evidenceTag}>
                        <i className="fas fa-camera"></i>
                        Ada Foto Bukti
                      </span>
                    )}
                    <span className={styles.detailHint}>
                      Lihat Detail <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <div className={styles.emptyState}>
                <i className="fas fa-clipboard-list"></i>
                Belum ada data permintaan di kategori ini.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.loanInfoBanner}>
            <i className="fas fa-info-circle"></i>
            <span>
              Pengembalian aset dikonfirmasi langsung oleh <strong>Admin Sarpras</strong>. Klik salah satu kartu di bawah untuk melihat detail jadwal &amp; bukti foto.
            </span>
          </div>

          <div className={styles.tabsContainer}>
            {loanTabs.map((tab) => (
              <button
                key={tab.label}
                className={`${styles.tab} ${activeLoanTab === tab.label ? styles.active : ''}`}
                onClick={() => setActiveLoanTab(tab.label)}
              >
                {tab.label}
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.loanList}>
            {filteredLoans.map((loan) => {
              const returned = loan.status === 'DIKEMBALIKAN';
              const hasPhoto = Boolean(loan.return_evidence_photo || loan.pickup_evidence_photo);

              return (
                <div
                  key={loan.id}
                  className={styles.loanCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDetail({ type: 'loan', data: loan })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDetail({ type: 'loan', data: loan });
                    }
                  }}
                >
                  <div className={styles.loanThumb}>
                    <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                  </div>
                  <div className={styles.loanInfo}>
                    <div className={styles.loanTitle}>
                      {loan.quantity && loan.quantity > 1 ? `${loan.quantity}x ` : ''}
                      {loan.item_name}
                    </div>
                    <div className={styles.loanMeta}>
                      <span>Pinjam: {formatDate(loan.borrow_date)}</span>
                      <span>Batas: {formatDate(loan.due_date)}</span>
                      {loan.return_date && <span>Kembali: {formatDate(loan.return_date)}</span>}
                    </div>
                    {hasPhoto && (
                      <div style={{ marginTop: '8px' }}>
                        <span className={styles.evidenceTag}>
                          <i className="fas fa-camera"></i>
                          Ada Foto Bukti
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={styles.loanRightCol}>
                    <span className={`${styles.statusPill} ${returned ? styles.ready : styles.pending}`}>
                      {returned ? 'Dikembalikan' : 'Sedang Dipinjam'}
                    </span>
                    <span className={styles.detailHint} style={{ fontSize: '12px' }}>
                      Detail <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLoans.length === 0 && (
              <div className={styles.emptyState}>
                <i className="fas fa-box-open"></i>
                Belum ada data peminjaman di kategori ini.
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.newRequestCta}>
        <div className={styles.ctaText}>
          <h4>Butuh perlengkapan baru?</h4>
          <p>Ajukan permintaan atau pinjam barang terjadwal lewat katalog Barang Modal atau Persediaan.</p>
        </div>
        <Link to="/teacher/inventory/barang-modal" className={styles.ctaIcon} title="Buka Katalog Inventaris">
          <i className="fas fa-plus"></i>
        </Link>
      </div>

      {/* Detail Modal for Request or Loan */}
      <Modal isOpen={selectedDetail !== null} onClose={() => setSelectedDetail(null)}>
        {selectedDetail?.type === 'request' && (
          <div className={styles.detailBox} style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="globalModalClose" onClick={() => setSelectedDetail(null)} title="Tutup">
              <i className="fas fa-times"></i>
            </button>

            <div className={styles.detailHeader}>
              <div>
                <div className={styles.reqCode}>{selectedDetail.data.req_code}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-text)', marginTop: '3px' }}>
                  Detail Permintaan Barang
                </div>
              </div>
              <span className={`${styles.statusPill} ${getRequestStatusClass(selectedDetail.data.status)}`}>
                {getRequestStatusLabel(selectedDetail.data.status)}
              </span>
            </div>

            <div className={styles.detailItemHero}>
              <div className={styles.detailItemThumb}>
                <img
                  src={getItemImage({
                    name: selectedDetail.data.item_name,
                    category_name: selectedDetail.data.category_name,
                  })}
                  alt={selectedDetail.data.item_name}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark-text)' }}>
                  {selectedDetail.data.item_name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-text)', marginTop: '2px' }}>
                  Jumlah: <strong>{selectedDetail.data.quantity} {selectedDetail.data.unit || 'Unit'}</strong>
                </div>
              </div>
            </div>

            <div className={styles.detailMetaGrid}>
              <div className={styles.detailMetaItem}>
                <div className={styles.detailMetaLabel}>Tanggal Pengajuan</div>
                <div className={styles.detailMetaValue}>{formatDate(selectedDetail.data.request_date)}</div>
              </div>
              <div className={styles.detailMetaItem}>
                <div className={styles.detailMetaLabel}>Lokasi Pengambilan</div>
                <div className={styles.detailMetaValue}>Ruang Sarpras</div>
              </div>
              {selectedDetail.data.borrow_date && selectedDetail.data.due_date && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Jadwal Peminjaman</div>
                  <div className={styles.detailMetaValue}>
                    {formatDate(selectedDetail.data.borrow_date)} — {formatDate(selectedDetail.data.due_date)}
                  </div>
                </div>
              )}
              {selectedDetail.data.completed_at && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Tanggal Diambil / Selesai</div>
                  <div className={styles.detailMetaValue}>{formatDate(selectedDetail.data.completed_at)}</div>
                </div>
              )}
              {selectedDetail.data.notes && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Catatan</div>
                  <div className={styles.detailMetaValue}>{selectedDetail.data.notes}</div>
                </div>
              )}
            </div>

            {selectedDetail.data.status === 'COMPLETED' && (
              <div className={styles.evidenceSection}>
                <div className={styles.evidenceSectionTitle}>
                  <i className="fas fa-camera" style={{ color: 'var(--sage-dark)' }}></i>
                  Foto Bukti Pengambilan
                </div>
                {selectedDetail.data.evidence_photo ? (
                  <img
                    src={selectedDetail.data.evidence_photo}
                    alt="Bukti pengambilan barang"
                    className={styles.evidencePreviewImg}
                  />
                ) : (
                  <div className={styles.evidenceEmpty}>
                    Tidak ada foto bukti pengambilan yang tersimpan pada riwayat ini.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedDetail?.type === 'loan' && (
          <div className={styles.detailBox} style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="globalModalClose" onClick={() => setSelectedDetail(null)} title="Tutup">
              <i className="fas fa-times"></i>
            </button>

            <div className={styles.detailHeader}>
              <div>
                <div className={styles.reqCode}>
                  {selectedDetail.data.req_code || `LOAN-#${selectedDetail.data.id}`}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-text)', marginTop: '3px' }}>
                  Detail Peminjaman Aset
                </div>
              </div>
              <span className={`${styles.statusPill} ${selectedDetail.data.status === 'DIKEMBALIKAN' ? styles.ready : styles.pending}`}>
                {selectedDetail.data.status === 'DIKEMBALIKAN' ? 'Dikembalikan' : 'Sedang Dipinjam'}
              </span>
            </div>

            <div className={styles.detailItemHero}>
              <div className={styles.detailItemThumb}>
                <img
                  src={getItemImage({
                    name: selectedDetail.data.item_name,
                    image_url: selectedDetail.data.item_image,
                    category_name: 'Elektronik',
                  })}
                  alt={selectedDetail.data.item_name}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark-text)' }}>
                  {selectedDetail.data.item_name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--gray-text)', marginTop: '2px' }}>
                  Jumlah: <strong>{selectedDetail.data.quantity || 1} Unit</strong>
                </div>
              </div>
            </div>

            <div className={styles.detailMetaGrid}>
              <div className={styles.detailMetaItem}>
                <div className={styles.detailMetaLabel}>Tanggal Pinjam</div>
                <div className={styles.detailMetaValue}>{formatDate(selectedDetail.data.borrow_date)}</div>
              </div>
              <div className={styles.detailMetaItem}>
                <div className={styles.detailMetaLabel}>Batas Kembali</div>
                <div className={styles.detailMetaValue}>{formatDate(selectedDetail.data.due_date)}</div>
              </div>
              {selectedDetail.data.return_date && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Tanggal Dikembalikan</div>
                  <div className={styles.detailMetaValue}>{formatDate(selectedDetail.data.return_date)}</div>
                </div>
              )}
              {selectedDetail.data.condition_note && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Catatan</div>
                  <div className={styles.detailMetaValue}>{selectedDetail.data.condition_note}</div>
                </div>
              )}
            </div>

            {selectedDetail.data.status === 'DIKEMBALIKAN' && (
              <div className={styles.evidenceSection}>
                <div className={styles.evidenceSectionTitle}>
                  <i className="fas fa-camera" style={{ color: 'var(--sage-dark)' }}></i>
                  Foto Bukti Pengembalian
                </div>
                {selectedDetail.data.return_evidence_photo ? (
                  <img
                    src={selectedDetail.data.return_evidence_photo}
                    alt="Bukti pengembalian aset"
                    className={styles.evidencePreviewImg}
                  />
                ) : (
                  <div className={styles.evidenceEmpty}>
                    Tidak ada foto bukti pengembalian yang tersimpan pada riwayat ini.
                  </div>
                )}
              </div>
            )}

            {selectedDetail.data.pickup_evidence_photo && (
              <div className={styles.evidenceSection}>
                <div className={styles.evidenceSectionTitle}>
                  <i className="fas fa-image" style={{ color: 'var(--sage-dark)' }}></i>
                  Foto Bukti Pengambilan Awal
                </div>
                <img
                  src={selectedDetail.data.pickup_evidence_photo}
                  alt="Bukti pengambilan awal"
                  className={styles.evidencePreviewImg}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
