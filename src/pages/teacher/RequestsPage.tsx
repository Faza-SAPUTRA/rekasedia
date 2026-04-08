import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/teacherRequests.module.css';

// Simulasi data untuk guru (berbeda struktur sedikit dengan admin untuk tampilan di frontend ini)
const mockRequests = [
  {
    id: 1,
    reqCode: 'REQ-2023-1044',
    date: '24 Oktober 2023, 08:30',
    status: 'PENDING',
    itemsDesc: '2x Kertas A4 80gr, 1x Tinta Printer HP Black',
    location: 'Ruang Guru Lt. 2 (Ibu Sarah Putri)',
  },
  {
    id: 2,
    reqCode: 'REQ-2023-1012',
    date: '10 Oktober 2023, 11:15',
    status: 'READY',
    itemsDesc: '10x Spidol Whiteboard (Biru), 2x Penghapus Papan',
    location: 'Ruang Guru Lt. 2 (Ibu Sarah Putri)',
  },
];

export default function TeacherRequestsPage() {
  const [activeTab, setActiveTab] = useState('Semua');

  const tabs = [
    { label: 'Semua', count: mockRequests.length },
    { label: 'Menunggu Validasi', count: mockRequests.filter(r => r.status === 'PENDING').length },
    { label: 'Siap Diambil', count: mockRequests.filter(r => r.status === 'READY').length },
    { label: 'Selesai', count: 0 },
    { label: 'Ditolak', count: 0 },
  ];

  const filteredRequests = activeTab === 'Semua' 
    ? mockRequests 
    : mockRequests.filter(r => {
        if (activeTab === 'Menunggu Validasi') return r.status === 'PENDING';
        if (activeTab === 'Siap Diambil') return r.status === 'READY';
        return false;
      });

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
                <span className={styles.reqCode}>{req.reqCode}</span>
                <span className={styles.reqDate}>
                  <i className="far fa-calendar-alt" style={{marginRight: '6px'}}></i>
                  {req.date}
                </span>
              </div>
              <div className={`${styles.statusPill} ${req.status === 'PENDING' ? styles.pending : styles.ready}`}>
                {req.status === 'PENDING' ? 'Menunggu Validasi' : 'Siap Diambil'}
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.itemList}>{req.itemsDesc}</div>
              <div className={styles.destination}>
                <i className="fas fa-map-marker-alt"></i>
                {req.location}
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
