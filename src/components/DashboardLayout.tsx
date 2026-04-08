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
            <button className={styles.notifBtn} aria-label="Notifikasi">
              <i className="fas fa-bell"></i>
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
