import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import loginIllustration from '../assets/login-illustration.png';
import styles from '../styles/auth.module.css';
import cStyles from '../styles/components.module.css';
import { login as apiLogin, saveSession } from '../services/api';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [nipEmail, setNipEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidNip = (value: string) => /^\d{8,20}$/.test(value);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        const trimmedLogin = nipEmail.trim();

        if (!trimmedLogin) {
            newErrors.nipEmail = 'NIP atau Email wajib diisi.';
        } else if (!isValidEmail(trimmedLogin) && !isValidNip(trimmedLogin)) {
            newErrors.nipEmail = 'Masukkan email valid atau NIP angka 8-20 digit.';
        }
        if (!password.trim()) {
            newErrors.password = 'Password wajib diisi.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const data = await apiLogin(nipEmail, password);
            saveSession(data.token, data.user);
            setIsSuccess(true);

            setTimeout(() => {
                // Redirect berdasarkan role
                if (data.user.role === 'admin') {
                    navigate('/admin');
                } else {
                    navigate('/teacher');
                }
            }, 1000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login gagal';
            setErrors({ nipEmail: message });
            setIsSubmitting(false);
        }
    };

    const getButtonContent = () => {
        if (isSuccess) {
            return (
                <>
                    <i className="fa-solid fa-check"></i> Berhasil!
                </>
            );
        }
        if (isSubmitting) {
            return (
                <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Memproses...
                </>
            );
        }
        return (
            <>
                Masuk <i className="fa-solid fa-arrow-right-to-bracket"></i>
            </>
        );
    };

    return (
        <AuthLayout
            brandPosition="below"
            illustrationSrc={loginIllustration}
            illustrationAlt="Alat tulis sekolah — buku dan pensil warna-warni"
            tagline="Kelola inventaris sekolah dengan lebih mudah, efisien, dan transparan dalam satu platform terpadu."
        >
            {/* Heading */}
            <h1 className={`${styles.formHeading} animate-fade-in-up`}>
                Selamat Datang di
                <br />
                RekaSedia
            </h1>
            <p className={`${styles.formSubtitle} animate-fade-in-up delay-1`}>
                Silakan masuk ke akun inventaris sekolah Anda untuk melanjutkan pekerjaan.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                <div className="animate-fade-in-up delay-2">
                    <InputField
                        id="nipEmail"
                        label="NIP / Email"
                        placeholder="admin@rekasedia.sch.id atau NIP angka"
                        icon="fa-regular fa-user"
                        autoComplete="username"
                        inputMode="email"
                        pattern="(^[^\s@]+@[^\s@]+\.[^\s@]+$)|(^\d{8,20}$)"
                        required
                        value={nipEmail}
                        onChange={(val) => {
                            setNipEmail(val.replace(/[^\w.@+-]/g, ''));
                            if (errors.nipEmail) setErrors((prev) => ({ ...prev, nipEmail: '' }));
                        }}
                        error={errors.nipEmail}
                    />
                </div>

                <div className="animate-fade-in-up delay-3">
                    <InputField
                        id="password"
                        label="Password"
                        placeholder="Masukkan kata sandi Anda"
                        autoComplete="current-password"
                        required
                        isPassword
                        value={password}
                        onChange={(val) => {
                            setPassword(val);
                            if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        error={errors.password}
                    />
                </div>

                {/* Options Row */}
                <div className={`${styles.formOptions} animate-fade-in-up delay-4`}>
                    <div className={styles.checkboxWrapper}>
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Ingat Saya</label>
                    </div>
                    <Link to="/forgot-password" className={styles.forgotLink}>
                        Lupa Password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className={`${cStyles.btn} ${isSuccess ? cStyles.btnSuccess : cStyles.btnPrimary} animate-fade-in-up delay-5`}
                    disabled={isSubmitting}
                >
                    {getButtonContent()}
                </button>
            </form>

            {/* Footer */}
            <p className={`${styles.formFooter} animate-fade-in-up delay-6`}>
                Belum punya akun? <Link to="/register">Buat akun di sini</Link>
            </p>
        </AuthLayout>
    );
};

export default LoginPage;
