import { NavLink, useLocation } from 'react-router-dom';
import styles from '../styles/sidebar.module.css';

interface NavItemDef {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItemDef[] = [
  { path: '/teacher', icon: 'fa-th-large', label: 'Dashboard' },
  { path: '/teacher/inventory', icon: 'fa-archive', label: 'Inventaris' },
  // { path: '/teacher/requests', icon: 'fa-shopping-bag', label: 'Pesanan' }, // Hidden based on request
  { path: '/teacher/loans', icon: 'fa-clipboard-list', label: 'Peminjaman' },
  { path: '/teacher/reports', icon: 'fa-file-alt', label: 'Laporan' },
];

export default function TeacherSidebar() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <i className="fas fa-clipboard-check"></i>
        </div>
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

      {/* User Card */}
      <div className={styles.userCard}>
        <div className={styles.userAvatar}>
          <i className="fas fa-user"></i>
        </div>
        <div className={styles.userInfo}>
          <h4>Ibu Sarah Putri</h4>
          <span>Wali Kelas 10-A</span>
        </div>
      </div>
    </aside>
  );
}
