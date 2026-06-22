import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import loginIllustration from '../assets/login-illustration.png';
import styles from '../styles/auth.module.css';
import cStyles from '../styles/components.module.css';
import { forgotPassword } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [requestCode, setRequestCode] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        const loginValue = identifier.trim();
        if (!loginValue) {
            setError('NIP atau email wajib diisi.');
            return;
        }

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);
        const isNip = /^\d{8,20}$/.test(loginValue);
        if (!isEmail && !isNip) {
            setError('Masukkan email valid atau NIP angka 8-20 digit.');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const res = await forgotPassword(loginValue);
            setIsSent(true);
            setSuccessMessage(res.message);
            setRequestCode(res.request_code);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses permintaan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AuthLayout
            brandPosition="below"
            illustrationSrc={loginIllustration}
            illustrationAlt="Ilustrasi perlengkapan sekolah RekaSedia"
            tagline="Pulihkan akses akun inventaris sekolah Anda dengan alur reset password yang sederhana."
        >
            <h1 className={`${styles.formHeading} animate-fade-in-up`}>
                Lupa Password?
            </h1>
            <p className={`${styles.formSubtitle} animate-fade-in-up delay-1`}>
                Masukkan NIP atau email akun. Admin sekolah akan memverifikasi permintaan Anda.
            </p>

            {isSent ? (
                <div className={`${styles.resetSuccessBox} animate-fade-in-up delay-2`}>
                    <div className={styles.resetSuccessIcon}>
                        <i className="fa-solid fa-clipboard-check"></i>
                    </div>
                    <h3>Permintaan Reset Dibuat</h3>
                    <p>
                        {successMessage}
                    </p>
                    <div className={styles.resetRequestCode}>
                        <span>KODE VERIFIKASI</span>
                        <strong>{requestCode}</strong>
                    </div>
                    <p className={styles.resetHelpText}>
                        Berikan kode ini kepada admin sekolah. Demi keamanan, kode tetap ditampilkan meskipun akun tidak ditemukan.
                    </p>
                    <Link to="/" className={`${cStyles.btn} ${cStyles.btnPrimary}`}>
                        Kembali ke Login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} noValidate>
                    <div className="animate-fade-in-up delay-2">
                        <InputField
                            id="resetIdentifier"
                            label="NIP / Email"
                            placeholder="Masukkan NIP atau email akun"
                            icon="fa-regular fa-user"
                            autoComplete="username"
                            required
                            value={identifier}
                            onChange={(val) => {
                                setIdentifier(val.replace(/[^\w.@+-]/g, ''));
                                if (error) setError('');
                            }}
                            error={error}
                        />
                    </div>

                    <button
                        type="submit"
                        className={`${cStyles.btn} ${cStyles.btnPrimary} animate-fade-in-up delay-3`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i> Memproses...
                            </>
                        ) : (
                            <>
                                Ajukan Reset <i className="fa-solid fa-paper-plane"></i>
                            </>
                        )}
                    </button>
                </form>
            )}

            <p className={`${styles.formFooter} animate-fade-in-up delay-4`}>
                Ingat password Anda? <Link to="/">Masuk kembali</Link>
            </p>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;
