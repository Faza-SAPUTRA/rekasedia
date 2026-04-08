import { NavLink, useLocation } from 'react-router-dom';
import styles from '../styles/sidebar.module.css';

interface NavItemDef {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItemDef[] = [
  { path: '/admin', icon: 'fa-th-large', label: 'Dashboard' },
  { path: '/admin/inventory', icon: 'fa-archive', label: 'Inventaris' },
  { path: '/admin/requests', icon: 'fa-inbox', label: 'Permintaan' },
  { path: '/admin/reports', icon: 'fa-file-alt', label: 'Laporan' },
];

export default function Sidebar() {
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
            item.path === '/admin'
              ? location.pathname === '/admin'
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
          <h4>Admin Staff</h4>
          <span>Administrator</span>
        </div>
      </div>
    </aside>
  );
}
