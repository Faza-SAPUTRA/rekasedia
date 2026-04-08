import styles from '../styles/auth.module.css';
import BrandLogo from './BrandLogo';

interface AuthLayoutProps {
    /** Content for the right panel (form) */
    children: React.ReactNode;
    /** Whether to show the brand ABOVE the illustration (register) or BELOW (login) */
    brandPosition?: 'above' | 'below';
    /** Illustration image source */
    illustrationSrc: string;
    illustrationAlt: string;
    /** Optional heading below illustration */
    leftHeading?: string;
    /** Tagline text */
    tagline: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
    children,
    brandPosition = 'below',
    illustrationSrc,
    illustrationAlt,
    leftHeading,
    tagline,
}) => {
    return (
        <div className={styles.container}>
            {/* Left Panel */}
            <div className={styles.left}>
                {brandPosition === 'above' && <BrandLogo />}

                <div className={styles.illustration}>
                    <img src={illustrationSrc} alt={illustrationAlt} />
                </div>

                {brandPosition === 'below' && <BrandLogo />}

                {leftHeading && <h2 className={styles.leftHeading}>{leftHeading}</h2>}

                <p className={styles.tagline}>{tagline}</p>
            </div>

            {/* Right Panel */}
            <div className={styles.right}>
                <div className={styles.formWrapper}>{children}</div>
            </div>
        </div>
    );
};

export default AuthLayout;
