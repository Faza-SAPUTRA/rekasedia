import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import styles from '../styles/dashboard.module.css';

const pageTitles: Record<string, string> = {
  '/teacher': 'Halo, Bapak/Ibu Guru! 👋',
  '/teacher/inventory': 'Inventaris',
  '/teacher/requests': 'Status Pesanan Saya',
  '/teacher/loans': 'Peminjaman',
  '/teacher/reports': 'Laporan Tersimpan',
};

export default function TeacherLayout() {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getTitle = () => {
    return pageTitles[location.pathname] || 'Dashboard Guru';
  };

  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <h2 className={styles.pageTitle}>{getTitle()}</h2>
          <div className={styles.topBarRight}>
            <button 
              className={styles.notifBtn} 
              aria-label="Notifikasi"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <i className="fas fa-bell"></i>
              <span className={styles.notifBadge}></span>
              
              <div className={`${styles.notifDropdown} ${isNotifOpen ? styles.open : ''}`} onClick={e => e.stopPropagation()}>
                <div className={styles.notifHeader}>
                  Notifikasi
                  <span>Tandai sudah dibaca</span>
                </div>
                <div className={styles.notifList}>
                  <div className={styles.notifItem}>
                    <div className={styles.notifIcon}>
                      <i className="fas fa-check"></i>
                    </div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifText}>Permintaan <strong>Spidol Whiteboard</strong> disetujui.</div>
                      <div className={styles.notifTime}>Baru saja</div>
                    </div>
                  </div>
                  <div className={styles.notifItem}>
                    <div className={`${styles.notifIcon} ${styles.warning}`}>
                      <i className="fas fa-undo-alt"></i>
                    </div>
                    <div className={styles.notifContent}>
                      <div className={styles.notifText}>Jatuh tempo: Proyektor harus dikembalikan hari ini.</div>
                      <div className={styles.notifTime}>3 jam yang lalu</div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
