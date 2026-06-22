import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import loginIllustration from '../assets/login-illustration.png';
import styles from '../styles/auth.module.css';
import cStyles from '../styles/components.module.css';
import { changePassword, getUser, logout } from '../services/api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = getUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('Konfirmasi password baru tidak sama.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate(user?.role === 'admin' ? '/admin' : '/teacher', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengganti password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <AuthLayout
      brandPosition="below"
      illustrationSrc={loginIllustration}
      illustrationAlt="Ilustrasi keamanan akun RekaSedia"
      tagline="Amankan akun Anda dengan password pribadi sebelum melanjutkan."
    >
      <h1 className={`${styles.formHeading} animate-fade-in-up`}>Buat Password Baru</h1>
      <p className={`${styles.formSubtitle} animate-fade-in-up delay-1`}>
        Password sementara hanya dapat digunakan satu kali. Buat password baru minimal 8 karakter.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="animate-fade-in-up delay-2">
          <InputField
            id="currentPassword"
            label="Password Sementara"
            placeholder="Masukkan password dari admin"
            autoComplete="current-password"
            isPassword
            required
            value={currentPassword}
            onChange={(value) => { setCurrentPassword(value); setError(''); }}
          />
        </div>
        <div className="animate-fade-in-up delay-3">
          <InputField
            id="newPassword"
            label="Password Baru"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            isPassword
            required
            value={newPassword}
            onChange={(value) => { setNewPassword(value); setError(''); }}
          />
        </div>
        <div className="animate-fade-in-up delay-4">
          <InputField
            id="confirmPassword"
            label="Ulangi Password Baru"
            placeholder="Ketik ulang password baru"
            autoComplete="new-password"
            isPassword
            required
            value={confirmation}
            onChange={(value) => { setConfirmation(value); setError(''); }}
            error={error}
          />
        </div>

        <button
          type="submit"
          className={`${cStyles.btn} ${cStyles.btnPrimary} animate-fade-in-up delay-5`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>

      <button type="button" className={styles.authTextButton} onClick={handleLogout}>
        Keluar dan kembali ke login
      </button>
    </AuthLayout>
  );
}
