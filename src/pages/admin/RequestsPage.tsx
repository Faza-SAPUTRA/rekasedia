import { useState } from 'react';
import styles from '../../styles/adminRequests.module.css';

// Mock Data spesifik untuk diulas Admin (Lebih kompleks dibanding Teacher view)
const initialRequests = [
  {
    id: 1,
    reqCode: 'REQ-2023-1044',
    item: '2x Kertas A4 80gr, 1x Tinta',
    requesterName: 'Ibu Sarah Putri',
    requesterRole: 'Wali Kelas 10-A',
    status: 'MENUNGGU', // MENUNGGU, DISETUJUI, DITOLAK
  },
  {
    id: 2,
    reqCode: 'REQ-2023-1043',
    item: '5x Penghapus Papan',
    requesterName: 'Bapak Budi Darma',
    requesterRole: 'Guru Matematika',
    status: 'MENUNGGU',
  },
  {
    id: 3,
    reqCode: 'REQ-2023-1012',
    item: '10x Spidol Whiteboard',
    requesterName: 'Ibu Sarah Putri',
    requesterRole: 'Wali Kelas 10-A',
    status: 'DISETUJUI',
  },
  {
    id: 4,
    reqCode: 'REQ-2023-0998',
    item: '1x Kipas Angin Portable',
    requesterName: 'Ibu Lestari',
    requesterRole: 'Lab Bahasa',
    status: 'DITOLAK',
  },
];

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [activeTab, setActiveTab] = useState('Semua');

  const tabs = [
    { label: 'Semua', count: requests.length },
    { label: 'Menunggu Validasi', count: requests.filter(r => r.status === 'MENUNGGU').length },
    { label: 'Disetujui', count: requests.filter(r => r.status === 'DISETUJUI').length },
    { label: 'Ditolak', count: requests.filter(r => r.status === 'DITOLAK').length },
  ];

  const filteredRequests = activeTab === 'Semua' 
    ? requests 
    : requests.filter(r => {
        if (activeTab === 'Menunggu Validasi') return r.status === 'MENUNGGU';
        if (activeTab === 'Disetujui') return r.status === 'DISETUJUI';
        if (activeTab === 'Ditolak') return r.status === 'DITOLAK';
        return false;
      });

  const handleAction = (id: number, newStatus: string) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
  };

  return (
    <div>
      {/* Header Tabs */}
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

      {/* Requests Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Validasi</th>
              <th>Nama Barang</th>
              <th>Pemohon</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req.id}>
                <td>
                  <span className={styles.reqCode}>{req.reqCode}</span>
                </td>
                <td className={styles.itemName}>{req.item}</td>
                <td>
                  <div className={styles.requesterInfo}>
                    <span>{req.requesterName}</span>
                    <span>{req.requesterRole}</span>
                  </div>
                </td>
                <td>
                  {req.status === 'MENUNGGU' && <span className={`${styles.badge} ${styles.reguler}`}>Menunggu</span>}
                  {req.status === 'DISETUJUI' && <span className={`${styles.badge} ${styles.approved}`}>Disetujui</span>}
                  {req.status === 'DITOLAK' && <span className={`${styles.badge} ${styles.rejected}`}>Ditolak</span>}
                </td>
                <td>
                  {req.status === 'MENUNGGU' ? (
                    <div className={styles.actionBtns}>
                      <button 
                        className={styles.btnApprove}
                        onClick={() => handleAction(req.id, 'DISETUJUI')}
                      >
                        Setujui
                      </button>
                      <button 
                        className={styles.btnReject}
                        onClick={() => handleAction(req.id, 'DITOLAK')}
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Selesai diproses</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  Tidak ada data permintaan di kategori ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
