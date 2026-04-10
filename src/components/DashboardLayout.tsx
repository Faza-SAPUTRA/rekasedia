import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from '../styles/dashboard.module.css';

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard Admin',
  '/admin/inventory': 'Inventaris',
  '/admin/requests': 'Permintaan Masuk',
  '/admin/reports': 'Laporan',
};

export default function DashboardLayout() {
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getTitle = () => {
    return pageTitles[location.pathname] || 'Dashboard';
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <h2 className={styles.pageTitle}>{getTitle()}</h2>
          <div className={styles.topBarRight}>
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Cari data..." />
            </div>
            <button 
              className={styles.notifBtn} 
              aria-label="Notifikasi"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <i className="fas fa-bell"></i>
              <span className={styles.notifBadge}></span>
              
              {isNotifOpen && (
                <div className={styles.notifDropdown} onClick={e => e.stopPropagation()}>
                  <div className={styles.notifHeader}>
                    Notifikasi
                    <span>Tandai sudah dibaca</span>
                  </div>
                  <div className={styles.notifList}>
                    <div className={styles.notifItem}>
                      <div className={styles.notifIcon}>
                        <i className="fas fa-file-alt"></i>
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifText}>Permintaan baru dari <strong>Ibu Sarah Putri</strong>.</div>
                        <div className={styles.notifTime}>5 menit yang lalu</div>
                      </div>
                    </div>
                    <div className={styles.notifItem}>
                      <div className={`${styles.notifIcon} ${styles.warning}`}>
                        <i className="fas fa-exclamation-triangle"></i>
                      </div>
                      <div className={styles.notifContent}>
                        <div className={styles.notifText}>Peringatan: Stok Kertas A4 kurang dari 5 RIM.</div>
                        <div className={styles.notifTime}>1 jam yang lalu</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
