import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/teacherRequests.module.css';
import { fetchLoans, fetchRequests, getUser } from '../../services/api';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';

type MainTab = 'requests' | 'loans';

export default function TeacherRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('requests');
  const [activeRequestTab, setActiveRequestTab] = useState('Semua');
  const [activeLoanTab, setActiveLoanTab] = useState('Semua');

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
    { label: 'Ditolak', count: requests.filter((r: any) => r.status === 'REJECTED').length },
  ];

  const loanTabs = [
    { label: 'Semua', count: loans.length },
    { label: 'Dipinjam', count: loans.filter((loan: any) => loan.status === 'DIPINJAM').length },
    { label: 'Selesai', count: loans.filter((loan: any) => loan.status === 'DIKEMBALIKAN').length },
  ];

  const filteredRequests = activeRequestTab === 'Semua'
    ? requests
    : requests.filter((r: any) => {
        if (activeRequestTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeRequestTab === 'Siap Diambil') return r.status === 'APPROVED';
        if (activeRequestTab === 'Ditolak') return r.status === 'REJECTED';
        return false;
      });

  const filteredLoans = activeLoanTab === 'Semua'
    ? loans
    : loans.filter((loan: any) => {
        if (activeLoanTab === 'Dipinjam') return loan.status === 'DIPINJAM';
        if (activeLoanTab === 'Selesai') return loan.status === 'DIKEMBALIKAN';
        return false;
      });

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (isLoading) {
    return <PageSkeleton variant="requests" rows={5} />;
  }

  return (
    <div className="animate-fade-in">
      <div className={styles.pageHeader}>
        <div>
          <h1>Pesanan & Peminjaman</h1>
          <p>Pantau status permintaan barang dan aset yang sedang atau sudah Anda pinjam.</p>
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
              <div key={req.id} className={styles.requestCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <span className={styles.reqCode}>{req.req_code}</span>
                    <span className={styles.reqDate}>
                      <i className="far fa-calendar-alt"></i>
                      {formatDate(req.request_date)}
                    </span>
                  </div>
                  <div className={`${styles.statusPill} ${req.status === 'PENDING' ? styles.pending : req.status === 'APPROVED' ? styles.ready : styles.rejected}`}>
                    {req.status === 'PENDING' ? 'Menunggu Validasi' : (req.status === 'APPROVED' ? 'Siap Diambil' : 'Ditolak')}
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.itemList}>{req.quantity}x {req.item_name}</div>
                  <div className={styles.destination}>
                    <i className="fas fa-map-marker-alt"></i>
                    Pengambilan di Ruang Sarpras
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

              return (
                <div key={loan.id} className={styles.loanCard}>
                  <div className={styles.loanThumb}>
                    <img src={getItemImage({ name: loan.item_name, image_url: loan.item_image, category_name: 'Elektronik' })} alt={loan.item_name} />
                  </div>
                  <div className={styles.loanInfo}>
                    <div className={styles.loanTitle}>{loan.item_name}</div>
                    <div className={styles.loanMeta}>
                      <span>Pinjam: {formatDate(loan.borrow_date)}</span>
                      <span>Batas: {formatDate(loan.due_date)}</span>
                      {loan.return_date && <span>Kembali: {formatDate(loan.return_date)}</span>}
                    </div>
                  </div>
                  <span className={`${styles.statusPill} ${returned ? styles.ready : styles.pending}`}>
                    {returned ? 'Selesai' : 'Sedang Dipinjam'}
                  </span>
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
          <p>Ajukan permintaan barang untuk keperluan kegiatan belajar mengajar.</p>
        </div>
        <Link to="/teacher/inventory" style={{ textDecoration: 'none' }}>
          <div className={styles.ctaIcon}>
            <i className="fas fa-plus"></i>
          </div>
        </Link>
      </div>
    </div>
  );
}
