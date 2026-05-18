import { useState, useEffect } from 'react';
import { fetchReports, fetchTeacherStats, getUser, type TeacherStats } from '../../services/api';
import styles from '../../styles/teacherReports.module.css';

export default function TeacherReportsPage() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getUser();
        if (user) {
          const [statsData, reportsData] = await Promise.all([
            fetchTeacherStats(user.id),
            fetchReports()
          ]);
          setStats(statsData);
          setReports(reportsData);
        }
      } catch (err) {
        console.error('Gagal mengambil data laporan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>Memuat laporan pribadi...</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Laporan Penggunaan Anda</h1>
        <p className={styles.subtitle}>
          Pantau ringkasan permintaan barang habis pakai dan riwayat peminjaman aset 
          yang telah Anda lakukan pada semester ini.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-shopping-basket"></i>
          </div>
          <div className={styles.statInfo}>
            <h4>Total ATK Diminta</h4>
            <div className={styles.statValue}>{stats?.totalItemsRequested} Items</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-hand-holding"></i>
          </div>
          <div className={styles.statInfo}>
            <h4>Peminjaman Aktif</h4>
            <div className={styles.statValue}>{stats?.activeLoansCount} Aset</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-history"></i>
          </div>
          <div className={styles.statInfo}>
            <h4>Riwayat Transaksi</h4>
            <div className={styles.statValue}>{stats?.historyCount} Selesai</div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <h3 className={styles.sectionTitle}>
        <i className="fas fa-calendar-alt"></i>
        Rekapitulasi Bulanan
      </h3>
      
      <div className={styles.tableWrapper}>
        <table className={styles.reportTable}>
          <thead>
            <tr>
              <th>BULAN</th>
              <th>JUMLAH PERMINTAAN (ATK)</th>
              <th>PEMINJAMAN ASET</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className={styles.monthName}>{report.month_name}</td>
                <td>{Math.floor(report.total_items_ordered / 5)} Transaksi</td>
                <td>{Math.floor(report.total_assets_borrowed / 3)} Aset</td>
                <td>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>
                    Tervalidasi
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Personal Analysis */}
      <div className={styles.analysisBox}>
        <i className="fas fa-lightbulb"></i>
        <div className={styles.analysisText}>
          <h4>Insight Penggunaan</h4>
          <p>
            Berdasarkan tren semester ini, penggunaan fasilitas Anda paling tinggi pada bulan 
            <strong> Maret</strong> untuk kebutuhan ujian. Pastikan melakukan permintaan 
            minimal 3 hari sebelum jadwal penggunaan agar stok tetap tersedia.
          </p>
        </div>
      </div>
    </div>
  );
}
