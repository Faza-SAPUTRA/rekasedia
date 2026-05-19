import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/sidebar.module.css';
import Modal from './Modal';
import { getUser, logout, updateCurrentUserProfile, type UserProfile } from '../services/api';

const avatarColors = ['#8A9E8A', '#5B7A6A', '#3178C6', '#E8946A', '#6B8F71'];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function UserProfileCard() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<UserProfile | null>(() => getUser());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    department: user?.department || '',
    avatar_color: user?.avatar_color || avatarColors[0],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const openSettings = () => {
    setForm({
      full_name: user?.full_name || '',
      department: user?.department || '',
      avatar_color: user?.avatar_color || avatarColors[0],
    });
    setError('');
    setShowSettingsModal(true);
    setIsMenuOpen(false);
  };

  const handleSaveProfile = () => {
    try {
      const updatedUser = updateCurrentUserProfile(form);
      setUser(updatedUser);
      setShowSettingsModal(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Profile gagal disimpan.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const avatarColor = user.avatar_color || avatarColors[0];

  return (
    <>
      <div className={styles.userCard} ref={menuRef}>
        <button
          type="button"
          className={styles.userProfileBtn}
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-expanded={isMenuOpen}
          aria-label="Buka menu profile"
        >
          <div className={styles.userAvatar} style={{ background: avatarColor }}>
            <span>{getInitials(user.full_name) || 'U'}</span>
          </div>
          <div className={styles.userInfo}>
            <h4>{user.full_name}</h4>
            <span>{user.department}</span>
          </div>
          <i className={`fas fa-chevron-up ${styles.userMenuChevron}`}></i>
        </button>

        {isMenuOpen && (
          <div className={styles.userMenu}>
            <button type="button" onClick={openSettings}>
              <i className="fas fa-user-cog"></i>
              Pengaturan Profil
            </button>
            <button
              type="button"
              className={styles.userMenuDanger}
              onClick={() => {
                setShowLogoutModal(true);
                setIsMenuOpen(false);
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Keluar Akun
            </button>
          </div>
        )}
      </div>

      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} className={styles.profileModal}>
        <button className="globalModalClose" onClick={() => setShowSettingsModal(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div className={styles.profileModalAvatar} style={{ background: form.avatar_color }}>
          {getInitials(form.full_name) || 'U'}
        </div>
        <h3>Pengaturan Profil</h3>
        <p>Ubah informasi yang tampil di akun Anda.</p>

        <div className={styles.profileForm}>
          <label>
            Email Login
            <input value={user.email} disabled />
          </label>
          <label>
            Nama Lengkap
            <input
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Masukkan nama lengkap"
            />
          </label>
          <label>
            Jabatan atau Kelas
            <input
              value={form.department}
              onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              placeholder="Masukkan jabatan atau kelas"
            />
          </label>
          <div className={styles.colorField}>
            <span>Warna Avatar</span>
            <div className={styles.colorOptions}>
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={form.avatar_color === color ? styles.colorOptionActive : ''}
                  style={{ background: color }}
                  onClick={() => setForm((current) => ({ ...current, avatar_color: color }))}
                  aria-label={`Pilih warna avatar ${color}`}
                />
              ))}
            </div>
          </div>
          {error && <div className={styles.profileError}>{error}</div>}
        </div>

        <div className="globalModalBtns">
          <button className="globalModalBtnCancel" onClick={() => setShowSettingsModal(false)}>
            Batal
          </button>
          <button className="globalModalBtnConfirm" onClick={handleSaveProfile}>
            Simpan Profil
          </button>
        </div>
      </Modal>

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
          <button className="globalModalBtnCancel" onClick={() => setShowLogoutModal(false)}>
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
    </>
  );
}
