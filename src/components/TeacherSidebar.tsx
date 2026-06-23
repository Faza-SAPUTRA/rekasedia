import { NavLink, useLocation } from 'react-router-dom';
import styles from '../styles/sidebar.module.css';
import UserProfileCard from './UserProfileCard';

interface NavItemDef {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItemDef[] = [
  { path: '/teacher', icon: 'fa-th-large', label: 'Dashboard' },
  { path: '/teacher/inventory/barang-modal', icon: 'fa-chair', label: 'Barang Modal' },
  { path: '/teacher/inventory/persediaan', icon: 'fa-box-open', label: 'Persediaan' },
  { path: '/teacher/requests', icon: 'fa-shopping-basket', label: 'Pesanan' },
  { path: '/teacher/loans', icon: 'fa-clipboard-list', label: 'Peminjaman' },
  { path: '/teacher/reports', icon: 'fa-file-alt', label: 'Laporan' },
];

export default function TeacherSidebar() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <img className={styles.brandIcon} src="/logorekasedia.png" alt="Logo RekaSedia" />
        <div className={styles.brandText}>
          <h1>RekaSedia</h1>
          <span>School Inventory</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/teacher'
              ? location.pathname === '/teacher'
              : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>
                <i className={`fas ${item.icon}`}></i>
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Storage Section */}
      <div className={styles.storageSection}>
        <div className={styles.storageLabel}>Penyimpanan Terpakai</div>
        <div className={styles.storageBarTrack}>
          <div className={styles.storageBarFill} style={{ width: '65%' }}></div>
        </div>
        <div className={styles.storageText}>650 dari 1000 item</div>
      </div>

      <UserProfileCard />
    </aside>
  );
}
