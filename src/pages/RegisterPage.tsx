import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import InputField from '../components/InputField';
import AccessibilityBadge from '../components/AccessibilityBadge';
import registerIllustration from '../assets/register-illustration.png';
import styles from '../styles/auth.module.css';
import cStyles from '../styles/components.module.css';

const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const RegisterPage: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [nip, setNip] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!fullName.trim()) {
            newErrors.fullName = 'Nama lengkap wajib diisi.';
        }
        if (!nip.trim()) {
            newErrors.nip = 'NIP wajib diisi.';
        }
        if (!email.trim()) {
            newErrors.email = 'Email wajib diisi.';
        } else if (!isValidEmail(email.trim())) {
            newErrors.email = 'Format email tidak valid.';
        }
        if (!password.trim()) {
            newErrors.password = 'Password wajib diisi.';
        } else if (password.trim().length < 8) {
            newErrors.password = 'Password minimal 8 karakter.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!validate() || isSubmitting) return;

        setIsSubmitting(true);

        setTimeout(() => {
            setIsSuccess(true);
            setTimeout(() => {
                setIsSubmitting(false);
                setIsSuccess(false);
            }, 1500);
        }, 1500);
    };

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const getButtonContent = () => {
        if (isSuccess) {
            return (
                <>
                    <i className="fa-solid fa-check"></i> Akun Terdaftar!
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
        return <>Daftar</>;
    };

    return (
        <AuthLayout
            brandPosition="above"
            illustrationSrc={registerIllustration}
            illustrationAlt="Ilustrasi ruang kelas — papan tulis dan meja guru"
            leftHeading="Ruang Kreatif Guru &amp; Siswa"
            tagline="Mulai perjalanan desain instruksional Anda dengan alat yang ramah dan aksesibel."
        >
            {/* Heading */}
            <h1 className={`${styles.formHeading} animate-fade-in-up`}>Daftar Akun RekaSedia</h1>
            <p className={`${styles.formSubtitle} animate-fade-in-up delay-1`}>
                Lengkapi data diri Anda untuk memulai.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
                <div className="animate-fade-in-up delay-1">
                    <InputField
                        id="fullName"
                        label="Nama Lengkap"
                        placeholder="Masukkan nama lengkap Anda"
                        icon="fa-regular fa-user"
                        autoComplete="name"
                        required
                        value={fullName}
                        onChange={(val) => { setFullName(val); clearError('fullName'); }}
                        error={errors.fullName}
                    />
                </div>

                <div className="animate-fade-in-up delay-2">
                    <InputField
                        id="nip"
                        label="NIP"
                        placeholder="Masukkan NIP Anda"
                        icon="fa-regular fa-id-card"
                        autoComplete="off"
                        required
                        value={nip}
                        onChange={(val) => { setNip(val); clearError('nip'); }}
                        error={errors.nip}
                    />
                </div>

                <div className="animate-fade-in-up delay-3">
                    <InputField
                        id="email"
                        label="Email"
                        type="email"
                        placeholder="nama@instansi.sch.id"
                        icon="fa-regular fa-envelope"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(val) => { setEmail(val); clearError('email'); }}
                        error={errors.email}
                    />
                </div>

                <div className="animate-fade-in-up delay-4">
                    <InputField
                        id="regPassword"
                        label="Password"
                        placeholder="Buat kata sandi minimal 8 karakter"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        isPassword
                        value={password}
                        onChange={(val) => { setPassword(val); clearError('password'); }}
                        error={errors.password}
                    />
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
                Sudah punya akun?
                <br />
                <Link to="/">Masuk di sini</Link>
            </p>

            {/* Accessibility Badge */}
            <AccessibilityBadge />
        </AuthLayout>
    );
};

export default RegisterPage;
