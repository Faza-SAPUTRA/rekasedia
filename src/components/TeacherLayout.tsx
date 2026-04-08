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
            <div className={styles.searchBox}>
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Cari data..." />
            </div>
            <button className={styles.notifBtn} aria-label="Notifikasi">
              <i className="fas fa-bell"></i>
              <span className={styles.notifBadge}></span>
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
