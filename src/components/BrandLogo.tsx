import styles from '../styles/auth.module.css';

const BrandLogo: React.FC = () => {
    return (
        <div className={styles.brand}>
            <div className={styles.brandIcon}>
                <i className="fa-solid fa-box-archive"></i>
            </div>
            <span className={styles.brandName}>RekaSedia</span>
        </div>
    );
};

export default BrandLogo;
