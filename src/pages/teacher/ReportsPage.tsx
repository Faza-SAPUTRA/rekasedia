import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
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

  const reportRows = reports.map((report) => ({
    bulan: report.month_name,
    permintaan: Math.floor(report.total_items_ordered / 5),
    peminjaman: Math.floor(report.total_assets_borrowed / 3),
    status: 'Tervalidasi'
  }));
  const totalRequests = reportRows.reduce((sum, row) => sum + row.permintaan, 0);
  const totalLoans = reportRows.reduce((sum, row) => sum + row.peminjaman, 0);

  const handleExportCSV = () => {
    const header = ['Bulan', 'Jumlah Permintaan (ATK)', 'Peminjaman Aset', 'Status'];
    const rows = reportRows.map(row => [row.bulan, row.permintaan, row.peminjaman, row.status]);
    const csvContent = [header, ...rows, ['TOTAL', totalRequests, totalLoans, '']]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Laporan_Penggunaan_Guru_RekaSedia.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXLSX = () => {
    const wsData = [
      ['Bulan', 'Jumlah Permintaan (ATK)', 'Peminjaman Aset', 'Status'],
      ...reportRows.map(row => [row.bulan, row.permintaan, row.peminjaman, row.status]),
      ['TOTAL', totalRequests, totalLoans, '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Guru');
    XLSX.writeFile(wb, 'Laporan_Penggunaan_Guru_RekaSedia.xlsx');
  };

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
      <div className={styles.reportSectionHeader}>
        <div>
          <h3 className={styles.sectionTitle}>
            <i className="fas fa-calendar-alt"></i>
            Rekapitulasi Bulanan
          </h3>
          <p className={styles.sectionSubtitle}>Ringkasan penggunaan barang dan aset selama semester berjalan.</p>
        </div>
        <div className={styles.exportActions}>
          <button className={styles.exportBtn} onClick={handleExportXLSX}>
            <i className="fas fa-file-excel"></i>
            Excel
          </button>
          <button className={styles.exportBtnSecondary} onClick={handleExportCSV}>
            <i className="fas fa-file-csv"></i>
            CSV
          </button>
        </div>
      </div>
      
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
            {reportRows.map((report) => (
              <tr key={report.bulan}>
                <td className={styles.monthName}>{report.bulan}</td>
                <td><span className={styles.metricValue}>{report.permintaan}</span> Transaksi</td>
                <td><span className={styles.metricValue}>{report.peminjaman}</span> Aset</td>
                <td>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>
                    {report.status}
                  </span>
                </td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td>Total Semester</td>
              <td>{totalRequests} Transaksi</td>
              <td>{totalLoans} Aset</td>
              <td></td>
            </tr>
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
