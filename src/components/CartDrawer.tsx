import { useEffect, useState } from 'react';
import styles from '../styles/cartDrawer.module.css';

export interface CartItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: number, increment: boolean) => void;
  onRemoveItem: (id: number) => void;
  onSubmit: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
}: CartDrawerProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 400); // Matches animation duration
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`${styles.overlay} ${!isVisible ? styles.closingOverlay : ''}`} onClick={onClose}>
      <div className={`${styles.drawer} ${!isVisible ? styles.closingDrawer : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <h3>Keranjang Permintaan</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-shopping-basket"></i>
              <p>Keranjang Anda masih kosong</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemImage}>
                  <i className="fas fa-box-open"></i>
                </div>
                <div className={styles.itemDetails}>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemCategory}>{item.category}</div>
                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button 
                        className={styles.qtyBtn} 
                        onClick={() => onUpdateQuantity(item.id, false)}
                      >
                        <i className="fas fa-minus" style={{fontSize: '10px'}}></i>
                      </button>
                      <div className={styles.qtyValue}>{item.quantity}</div>
                      <button 
                        className={styles.qtyBtn} 
                        onClick={() => onUpdateQuantity(item.id, true)}
                      >
                        <i className="fas fa-plus" style={{fontSize: '10px'}}></i>
                      </button>
                    </div>
                    <button className={styles.deleteBtn} onClick={() => onRemoveItem(item.id)}>
                      <i className="far fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Total Barang</span>
            <span className={styles.summaryValue}>{totalItems} Item</span>
          </div>
          <button 
            className={styles.checkoutBtn} 
            disabled={items.length === 0}
            onClick={onSubmit}
          >
            Ajukan Permintaan
          </button>
          <span className={styles.disclaimer}>
            Permintaan akan ditinjau oleh Admin (Sarpras)
          </span>
        </div>

      </div>
    </div>
  );
}
