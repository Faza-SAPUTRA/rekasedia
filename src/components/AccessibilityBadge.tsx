import styles from '../styles/auth.module.css';

interface AccessibilityBadgeProps {
    className?: string;
}

const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({ className }) => {
    return (
        <div className={`${styles.accessibilityBadge} ${className || ''}`}>
            <i className="fa-regular fa-circle-check"></i>
            Aksesibilitas Tinggi Terjamin
        </div>
    );
};

export default AccessibilityBadge;
