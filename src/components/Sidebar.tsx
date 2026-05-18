import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from '../styles/sidebar.module.css';
import { logout } from '../services/api';
import Modal from './Modal';

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
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
        <button 
          className={styles.logoutBtn} 
          onClick={() => setShowLogoutModal(true)}
          title="Keluar dari akun"
        >
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      {/* Logout Confirmation Modal - Using Portal */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
        <button className="globalModalClose" onClick={() => setShowLogoutModal(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div className="globalModalIcon" style={{ background: 'var(--badge-red-bg)', color: 'var(--error-red)' }}>
            <i className="fas fa-sign-out-alt"></i>
        </div>
        <h3>Yakin ingin keluar?</h3>
        <p>Anda perlu masuk kembali untuk mengakses dashboard inventory sekolah.</p>
        <div className="globalModalBtns">
          <button 
            className="globalModalBtnCancel" 
            onClick={() => setShowLogoutModal(false)}
          >
            Batal
          </button>
          <button 
            className="globalModalBtnConfirm" 
            style={{ background: 'var(--error-red)', borderColor: 'var(--error-red)' }}
            onClick={handleLogout}
          >
            Ya, Keluar Akun
          </button>
        </div>
      </Modal>
    </aside>
  );
}
