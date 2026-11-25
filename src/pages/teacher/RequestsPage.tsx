import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/teacherRequests.module.css';
import { fetchLoans, fetchRequests, getUser } from '../../services/api';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';
import Modal from '../../components/Modal';

type MainTab = 'requests' | 'loans';

interface AssetLoanEntry {
  key: string;
  source: 'loan' | 'request';
  ticketCode: string;
  item_name: string;
  item_image?: string | null;
  category_name?: string | null;
  quantity: number;
  unit?: string | null;
  status: 'PENDING' | 'APPROVED' | 'DIPINJAM' | 'DIKEMBALIKAN' | 'COMPLETED' | 'REJECTED';
  request_date?: string | null;
  borrow_date?: string | null;
  due_date?: string | null;
  return_date?: string | null;
  completed_at?: string | null;
  note?: string | null;
  pickup_evidence_photo?: string | null;
  return_evidence_photo?: string | null;
  sortTime: number;
}

type DetailSelection =
  | { type: 'request'; data: any }
  | { type: 'asset'; data: AssetLoanEntry }
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

  // Tab 1: Permintaan Barang -> KHUSUS Persediaan (habis pakai, tanpa tanggal kembali)
  const persediaanRequests = useMemo(
    () => requests.filter((r: any) => !Boolean(r.is_loanable)),
    [requests]
  );

  // Tab 2: Peminjaman Aset -> SEMUA Barang Modal (baik yang masih di requests maupun yang sudah masuk loans)
  // dengan nomor tiket REQ-... dan tanpa duplikasi antara requests & loans.
  const assetLoanEntries = useMemo<AssetLoanEntry[]>(() => {
    const linkedRequestIds = new Set<number>();
    const entries: AssetLoanEntry[] = [];

    for (const loan of loans) {
      if (loan.request_id) {
        linkedRequestIds.add(Number(loan.request_id));
      }
      const ticketCode = loan.req_code || `LOAN-${String(loan.id).padStart(4, '0')}`;
      const sortDate = loan.created_at || loan.borrow_date || '';
      entries.push({
        key: `loan-${loan.id}`,
        source: 'loan',
        ticketCode,
        item_name: loan.item_name,
        item_image: loan.item_image,
        category_name: 'Elektronik',
        quantity: Number(loan.quantity || 1),
        unit: 'Unit',
        status: loan.status === 'DIKEMBALIKAN' ? 'DIKEMBALIKAN' : 'DIPINJAM',
        borrow_date: loan.borrow_date,
        due_date: loan.due_date,
        return_date: loan.return_date,
        note: loan.condition_note,
        pickup_evidence_photo: loan.pickup_evidence_photo || null,
        return_evidence_photo: loan.return_evidence_photo || null,
        sortTime: sortDate ? new Date(sortDate).getTime() : Number(loan.id || 0),
      });
    }

    for (const req of requests) {
      if (!Boolean(req.is_loanable)) continue;
      if (linkedRequestIds.has(Number(req.id))) continue;

      const sortDate = req.created_at || req.request_date || '';
      entries.push({
        key: `req-${req.id}`,
        source: 'request',
        ticketCode: req.req_code || `REQ-${req.id}`,
        item_name: req.item_name,
        category_name: req.category_name,
        quantity: Number(req.quantity || 1),
        unit: req.unit || 'Unit',
        status: req.status,
        request_date: req.request_date,
        borrow_date: req.borrow_date,
        due_date: req.due_date,
        completed_at: req.completed_at,
        note: req.notes,
        pickup_evidence_photo: req.evidence_photo || null,
        return_evidence_photo: null,
        sortTime: sortDate ? new Date(sortDate).getTime() : Number(req.id || 0),
      });
    }

    return entries.sort((a, b) => b.sortTime - a.sortTime);
  }, [loans, requests]);

  const requestTabs = [
    { label: 'Semua', count: persediaanRequests.length },
    { label: 'Menunggu Validasi', count: persediaanRequests.filter((r: any) => r.status === 'PENDING').length },
    { label: 'Siap Diambil', count: persediaanRequests.filter((r: any) => r.status === 'APPROVED').length },
    { label: 'Selesai', count: persediaanRequests.filter((r: any) => r.status === 'COMPLETED').length },
    { label: 'Ditolak', count: persediaanRequests.filter((r: any) => r.status === 'REJECTED').length },
  ];

  const loanTabs = [
    { label: 'Semua', count: assetLoanEntries.length },
    { label: 'Menunggu', count: assetLoanEntries.filter((e) => e.status === 'PENDING').length },
    { label: 'Siap Diambil', count: assetLoanEntries.filter((e) => e.status === 'APPROVED').length },
    { label: 'Dipinjam', count: assetLoanEntries.filter((e) => e.status === 'DIPINJAM').length },
    { label: 'Dikembalikan', count: assetLoanEntries.filter((e) => e.status === 'DIKEMBALIKAN' || e.status === 'COMPLETED').length },
    { label: 'Ditolak', count: assetLoanEntries.filter((e) => e.status === 'REJECTED').length },
  ];

  const filteredRequests = activeRequestTab === 'Semua'
    ? persediaanRequests
    : persediaanRequests.filter((r: any) => {
        if (activeRequestTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeRequestTab === 'Siap Diambil') return r.status === 'APPROVED';
        if (activeRequestTab === 'Selesai') return r.status === 'COMPLETED';
        if (activeRequestTab === 'Ditolak') return r.status === 'REJECTED';
        return false;
      });

  const filteredAssetLoans = activeLoanTab === 'Semua'
    ? assetLoanEntries
    : assetLoanEntries.filter((entry) => {
        if (activeLoanTab === 'Menunggu') return entry.status === 'PENDING';
        if (activeLoanTab === 'Siap Diambil') return entry.status === 'APPROVED';
        if (activeLoanTab === 'Dipinjam') return entry.status === 'DIPINJAM';
        if (activeLoanTab === 'Dikembalikan') return entry.status === 'DIKEMBALIKAN' || entry.status === 'COMPLETED';
        if (activeLoanTab === 'Ditolak') return entry.status === 'REJECTED';
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

  const getStatusLabel = (status: string) => {
    if (status === 'PENDING') return 'Menunggu Validasi';
    if (status === 'APPROVED') return 'Siap Diambil';
    if (status === 'DIPINJAM') return 'Sedang Dipinjam';
    if (status === 'DIKEMBALIKAN') return 'Dikembalikan';
    if (status === 'COMPLETED') return 'Selesai';
    return 'Ditolak';
  };

  const getStatusClass = (status: string) => {
    if (status === 'PENDING' || status === 'DIPINJAM') return styles.pending;
    if (status === 'APPROVED' || status === 'DIKEMBALIKAN') return styles.ready;
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
          <p>Pantau tracking permintaan barang persediaan dan peminjaman aset (barang modal). Klik kartu untuk melihat detail &amp; foto bukti.</p>
        </div>
      </div>

      <div className={styles.segmentedTabs}>
        <button
          className={`${styles.segmentedTab} ${activeMainTab === 'requests' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('requests')}
        >
          <i className="fas fa-shopping-basket"></i>
          Permintaan Barang
          <span>{persediaanRequests.length}</span>
        </button>
        <button
          className={`${styles.segmentedTab} ${activeMainTab === 'loans' ? styles.active : ''}`}
          onClick={() => setActiveMainTab('loans')}
        >
          <i className="fas fa-hand-holding"></i>
          Peminjaman Aset
          <span>{assetLoanEntries.length}</span>
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
                  <div className={`${styles.statusPill} ${getStatusClass(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.itemList}>{req.quantity}x {req.item_name}</div>
                  <div className={styles.destination}>
                    <i className="fas fa-map-marker-alt"></i>
                    {req.status === 'COMPLETED' ? 'Barang persediaan sudah diambil' : 'Pengambilan di Ruang Sarpras'}
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
                Belum ada permintaan barang persediaan di kategori ini.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className={styles.loanInfoBanner}>
            <i className="fas fa-info-circle"></i>
            <span>
              Semua pengajuan &amp; peminjaman <strong>Barang Modal (Aset)</strong> ditampilkan di sini lengkap dengan nomor tiket. Pengembalian dikonfirmasi oleh <strong>Admin Sarpras</strong>.
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
            {filteredAssetLoans.map((entry) => {
              const hasPhoto = Boolean(entry.return_evidence_photo || entry.pickup_evidence_photo);

              return (
                <div
                  key={entry.key}
                  className={styles.loanCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDetail({ type: 'asset', data: entry })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDetail({ type: 'asset', data: entry });
                    }
                  }}
                >
                  <div className={styles.loanThumb}>
                    <img
                      src={getItemImage({
                        name: entry.item_name,
                        image_url: entry.item_image,
                        category_name: entry.category_name || 'Elektronik',
                      })}
                      alt={entry.item_name}
                    />
                  </div>
                  <div className={styles.loanInfo}>
                    <div className={styles.reqCode} style={{ fontSize: '12.5px', marginBottom: '3px' }}>
                      {entry.ticketCode}
                    </div>
                    <div className={styles.loanTitle}>
                      {entry.quantity > 1 ? `${entry.quantity}x ` : ''}
                      {entry.item_name}
                    </div>
                    <div className={styles.loanMeta}>
                      {entry.borrow_date && <span>Pinjam: {formatDate(entry.borrow_date)}</span>}
                      {entry.due_date && <span>Batas Kembali: {formatDate(entry.due_date)}</span>}
                      {!entry.borrow_date && entry.request_date && (
                        <span>Diajukan: {formatDate(entry.request_date)}</span>
                      )}
                      {entry.return_date && <span>Kembali: {formatDate(entry.return_date)}</span>}
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
                    <span className={`${styles.statusPill} ${getStatusClass(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </span>
                    <span className={styles.detailHint} style={{ fontSize: '12px' }}>
                      Detail <i className="fas fa-chevron-right" style={{ fontSize: '10px' }}></i>
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredAssetLoans.length === 0 && (
              <div className={styles.emptyState}>
                <i className="fas fa-box-open"></i>
                Belum ada data peminjaman aset di kategori ini.
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.newRequestCta}>
        <div className={styles.ctaText}>
          <h4>Butuh perlengkapan baru?</h4>
          <p>Ajukan barang persediaan atau pinjam barang modal melalui katalog inventaris.</p>
        </div>
        <Link to="/teacher/inventory/barang-modal" className={styles.ctaIcon} title="Buka Katalog Inventaris">
          <i className="fas fa-plus"></i>
        </Link>
      </div>

      {/* Detail Modal for Persediaan Request or Asset Loan */}
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
                  Detail Permintaan Barang (Persediaan)
                </div>
              </div>
              <span className={`${styles.statusPill} ${getStatusClass(selectedDetail.data.status)}`}>
                {getStatusLabel(selectedDetail.data.status)}
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

        {selectedDetail?.type === 'asset' && (
          <div className={styles.detailBox} style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button className="globalModalClose" onClick={() => setSelectedDetail(null)} title="Tutup">
              <i className="fas fa-times"></i>
            </button>

            <div className={styles.detailHeader}>
              <div>
                <div className={styles.reqCode}>{selectedDetail.data.ticketCode}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-text)', marginTop: '3px' }}>
                  Detail Peminjaman Aset (Barang Modal)
                </div>
              </div>
              <span className={`${styles.statusPill} ${getStatusClass(selectedDetail.data.status)}`}>
                {getStatusLabel(selectedDetail.data.status)}
              </span>
            </div>

            <div className={styles.detailItemHero}>
              <div className={styles.detailItemThumb}>
                <img
                  src={getItemImage({
                    name: selectedDetail.data.item_name,
                    image_url: selectedDetail.data.item_image,
                    category_name: selectedDetail.data.category_name || 'Elektronik',
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
                <div className={styles.detailMetaLabel}>Tanggal Pinjam</div>
                <div className={styles.detailMetaValue}>
                  {formatDate(selectedDetail.data.borrow_date || selectedDetail.data.request_date)}
                </div>
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
              {selectedDetail.data.note && (
                <div className={styles.detailMetaItem} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailMetaLabel}>Catatan</div>
                  <div className={styles.detailMetaValue}>{selectedDetail.data.note}</div>
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

            {(selectedDetail.data.pickup_evidence_photo || selectedDetail.data.status === 'COMPLETED') && (
              <div className={styles.evidenceSection}>
                <div className={styles.evidenceSectionTitle}>
                  <i className="fas fa-image" style={{ color: 'var(--sage-dark)' }}></i>
                  Foto Bukti Pengambilan
                </div>
                {selectedDetail.data.pickup_evidence_photo ? (
                  <img
                    src={selectedDetail.data.pickup_evidence_photo}
                    alt="Bukti pengambilan aset"
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
      </Modal>
    </div>
  );
}
