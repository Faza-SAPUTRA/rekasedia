import { useState, useRef } from 'react';
import styles from '../styles/components.module.css';

interface InputFieldProps {
    id: string;
    label: string;
    type?: string;
    placeholder: string;
    icon?: string;
    autoComplete?: string;
    minLength?: number;
    required?: boolean;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    isPassword?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    pattern?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    id,
    label,
    type = 'text',
    placeholder,
    icon,
    autoComplete,
    minLength,
    required,
    value,
    onChange,
    error,
    isPassword = false,
    inputMode,
    pattern,
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [shaking, setShaking] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    // Trigger shake when error appears
    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 400);
    };

    // If error changes and is non-empty, shake
    if (error && !shaking && wrapperRef.current) {
        triggerShake();
    }

    return (
        <div className={styles.formGroup}>
            <label htmlFor={id}>{label}</label>
            <div
                ref={wrapperRef}
                className={`${styles.inputWrapper} ${shaking ? styles.shaking : ''}`}
            >
                <input
                    type={inputType}
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    minLength={minLength}
                    required={required}
                    inputMode={inputMode}
                    pattern={pattern}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={error ? styles.inputError : ''}
                />

                {isPassword ? (
                    <button
                        type="button"
                        className={styles.inputIconClickable}
                        onClick={handleTogglePassword}
                        title="Tampilkan/Sembunyikan Password"
                    >
                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                ) : icon ? (
                    <span className={styles.inputIcon}>
                        <i className={icon}></i>
                    </span>
                ) : null}
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default InputField;
