import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/teacherRequests.module.css';
import { fetchRequests, getUser } from '../../services/api';

export default function TeacherRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getUser();
        const allRequests = await fetchRequests();
        setRequests(allRequests.filter((r: any) => r.requester_id === user?.id));
      } catch (err) {
        console.error('Gagal mengambil data permintaan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const tabs = [
    { label: 'Semua', count: requests.length },
    { label: 'Menunggu Validasi', count: requests.filter((r: any) => r.status === 'PENDING').length },
    { label: 'Siap Diambil', count: requests.filter((r: any) => r.status === 'APPROVED').length },
    { label: 'Ditolak', count: requests.filter((r: any) => r.status === 'REJECTED').length },
  ];

  const filteredRequests = activeTab === 'Semua' 
    ? requests 
    : requests.filter((r: any) => {
        if (activeTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeTab === 'Siap Diambil') return r.status === 'APPROVED';
        if (activeTab === 'Ditolak') return r.status === 'REJECTED';
        return false;
      });

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Memuat riwayat permintaan...</div>;
  }

  return (
    <div>
      {/* Tabs Filter */}
      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`${styles.tab} ${activeTab === tab.label ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.label)}
          >
            {tab.label}
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className={styles.requestsList}>
        {filteredRequests.map((req) => (
          <div key={req.id} className={styles.requestCard}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.reqCode}>{req.req_code}</span>
                <span className={styles.reqDate}>
                  <i className="far fa-calendar-alt" style={{marginRight: '6px'}}></i>
                  {new Date(req.request_date).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className={`${styles.statusPill} ${req.status === 'PENDING' ? styles.pending : styles.ready}`}>
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
          <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
            Belum ada data pesanan di kategori ini.
          </div>
        )}
      </div>

      {/* CTA Bottom Container */}
      <div className={styles.newRequestCta}>
        <div className={styles.ctaText}>
          <h4>Butuh perlengkapan baru?</h4>
          <p>Ajukan permintaan barang untuk keperluan kegiatan belajar mengajar.</p>
        </div>
        <Link to="/teacher/inventory" style={{textDecoration: 'none'}}>
          <div className={styles.ctaIcon}>
            <i className="fas fa-plus"></i>
          </div>
        </Link>
      </div>
    </div>
  );
}
