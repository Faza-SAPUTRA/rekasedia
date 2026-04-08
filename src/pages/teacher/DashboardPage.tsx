import { Link } from 'react-router-dom';
import styles from '../../styles/teacherDashboard.module.css';
import { items } from '../../data/mockData';

export default function TeacherDashboardPage() {
  // Ambil beberapa item contoh (Sering Dibutuhkan)
  // Kita ambil 3 item, campurkan sedikit consumable & aset
  const frequentItems = [
    items.find((i) => i.name.includes('Spidol Marker')) || items[0],
    items.find((i) => i.name.includes('Kertas A4')) || items[1],
    items.find((i) => i.name.includes('Proyektor')) || items[8],
  ];

  return (
    <div>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        {/* AKTIF */}
        <div className={`${styles.statCard} ${styles.aktif}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Sedang Dipinjam</span>
            <span className={`${styles.badge} ${styles.aktif}`}>AKTIF</span>
          </div>
          <div className={styles.statValue}>12</div>
        </div>

        {/* PROSES */}
        <div className={`${styles.statCard} ${styles.proses}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Permintaan Diproses</span>
            <span className={`${styles.badge} ${styles.proses}`}>PROSES</span>
          </div>
          <div className={styles.statValue}>05</div>
        </div>

        {/* TOTAL */}
        <div className={`${styles.statCard} ${styles.total}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Riwayat Ambil</span>
            <span className={`${styles.badge} ${styles.total}`}>TOTAL</span>
          </div>
          <div className={styles.statValue}>28</div>
        </div>
      </div>

      {/* Sering Dibutuhkan Section */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Sering Dibutuhkan</h3>
        <Link to="/teacher/inventory" className={styles.sectionLink}>
          Lihat Semua Katalog
        </Link>
      </div>

      <div className={styles.frequentGrid}>
        {frequentItems.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className={styles.itemCard}>
            <div className={styles.itemImage}>
              <i className="fas fa-box-open"></i>
            </div>
            <div className={styles.itemName}>{item.name}</div>
            <div className={styles.itemCategory}>{item.category_name}</div>
            
            {item.is_loanable ? (
              <button className={`${styles.actionBtn} ${styles.btnBorrow}`}>
                <i className="fas fa-arrow-circle-down"></i>
                Pinjam Barang
              </button>
            ) : (
              <button className={`${styles.actionBtn} ${styles.btnRequest}`}>
                <i className="fas fa-plus"></i>
                Minta Barang
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
