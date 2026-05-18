import styles from '../styles/auth.module.css';

const BrandLogo: React.FC = () => {
    return (
        <div className={styles.brand}>
            <img className={styles.brandIcon} src="/logorekasedia.png" alt="Logo RekaSedia" />
            <span className={styles.brandName}>RekaSedia</span>
        </div>
    );
};

export default BrandLogo;
