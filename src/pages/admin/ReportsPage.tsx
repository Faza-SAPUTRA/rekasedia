import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { monthlyReports } from '../../data/mockData';
import styles from '../../styles/reports.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ReportsPage() {
  const totalItems = monthlyReports.reduce((sum, r) => sum + r.total_items_ordered, 0);
  const totalAssets = monthlyReports.reduce(
    (sum, r) => sum + r.total_assets_borrowed,
    0
  );

  // Chart data
  const chartData = {
    labels: monthlyReports.map((r) => r.month_name.substring(0, 3).toUpperCase()),
    datasets: [
      {
        label: 'Total Item (ATK)',
        data: monthlyReports.map((r) => r.total_items_ordered),
        backgroundColor: '#8A9E8A',
        borderRadius: 6,
        barThickness: 24,
      },
      {
        label: 'Total Peminjaman Aset',
        data: monthlyReports.map((r) => r.total_assets_borrowed),
        backgroundColor: '#2D2D2D',
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' }, color: '#7A7A7A' },
      },
      y: {
        grid: { color: '#F0EDE8' },
        ticks: { display: false },
      },
    },
  };

  return (
    <div>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1>Rekapitulasi Penggunaan Inventaris</h1>
          <p>
            Pantau ringkasan penggunaan alat tulis kantor dan riwayat peminjaman aset
            sekolah secara berkala.
          </p>
        </div>
        <button className={styles.exportBtn}>
          <i className="fas fa-download"></i>
          Export ke PDF/Excel
        </button>
      </div>

      {/* Semester Selector */}
      <div className={styles.semesterSection}>
        <div className={styles.semesterLabel}>Pilih Semester</div>
        <select className={styles.semesterSelect} defaultValue="ganjil-2025">
          <option value="ganjil-2025">Semester Ganjil 2025/2026</option>
          <option value="genap-2024">Semester Genap 2024/2025</option>
        </select>
      </div>

      {/* Data Table */}
      <div className={styles.reportTable}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>BULAN</th>
              <th>TOTAL ITEM PESANAN (ATK)</th>
              <th>TOTAL PEMINJAMAN ASET</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReports.map((report) => (
              <tr key={report.id}>
                <td className={styles.monthCell}>{report.month_name}</td>
                <td>
                  <span className={styles.dotIndicator}>
                    <span className={styles.dot}></span>
                    {report.total_items_ordered} Items
                  </span>
                </td>
                <td>{report.total_assets_borrowed} Aset</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className={styles.totalRow}>
              <td className={styles.totalLabel}>TOTAL SEMESTER</td>
              <td className={styles.totalValue}>{totalItems} Items</td>
              <td className={styles.totalValue}>{totalAssets} Aset</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trend Section */}
      <div className={styles.trendSection}>
        {/* Chart */}
        <div className={styles.trendChart}>
          <div className={styles.trendChartHeader}>
            <h3>Tren Penggunaan</h3>
            <div className={styles.legends}>
              <div className={styles.legend}>
                <span className={`${styles.legendDot} ${styles.green}`}></span>
                Total Item (ATK)
              </div>
              <div className={styles.legend}>
                <span className={`${styles.legendDot} ${styles.dark}`}></span>
                Total Peminjaman Aset
              </div>
            </div>
          </div>
          <div className={styles.chartArea}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.analysisIcon}>
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>Analisis Tren</h3>
          <p>
            Puncak penggunaan inventaris terjadi pada bulan <strong>Maret</strong>. Hal
            ini dikarenakan tingginya permintaan ATK untuk persiapan{' '}
            <u>Ujian Sekolah</u> dan administrasi semesteran.
          </p>
          <p className={styles.analysisMeta}>
            Data diperbarui secara otomatis berdasarkan laporan bulanan yang masuk.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <i className="fas fa-chart-line"></i>
          </div>
          <div className={styles.summaryContent}>
            <h4>Tren Penggunaan</h4>
            <p>
              Puncak penggunaan inventaris terjadi pada bulan Maret untuk persiapan ujian
              sekolah.
            </p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <i className="fas fa-star"></i>
          </div>
          <div className={styles.summaryContent}>
            <h4>Aset Terpopuler</h4>
            <p>
              Proyektor dan Speaker portable menjadi aset yang paling sering dipinjam
              periode ini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
