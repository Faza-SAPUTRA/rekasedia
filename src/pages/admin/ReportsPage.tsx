import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
import { fetchReports } from '../../services/api';
import styles from '../../styles/reports.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeExportModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsExportOpen(false);
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const reportsData = await fetchReports();
        setReports(reportsData);
      } catch (err) {
        console.error('Gagal mengambil laporan', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const totalItems = reports.reduce((sum, r) => sum + r.total_items_ordered, 0);
  const totalAssets = reports.reduce(
    (sum, r) => sum + r.total_assets_borrowed,
    0
  );

  const handleExportCSV = () => {
    // Generate CSV string
    const header = ['Bulan', 'Total Item (ATK)', 'Total Peminjaman Aset'];
    const rows = reports.map(r => [r.month_name, r.total_items_ordered, r.total_assets_borrowed]);
    const csvContent = [header, ...rows, ['TOTAL SEMESTER', totalItems, totalAssets]]
      .map(e => e.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Laporan_RekaSedia.csv';
    link.click();
    URL.revokeObjectURL(url);
    closeExportModal();
  };

  const handleExportXLSX = () => {
    const wsData = [
      ['Bulan', 'Total Item (ATK)', 'Total Peminjaman Aset'],
      ...reports.map(r => [r.month_name, r.total_items_ordered, r.total_assets_borrowed]),
      ['TOTAL SEMESTER', totalItems, totalAssets]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
    XLSX.writeFile(wb, 'Laporan_RekaSedia.xlsx');
    closeExportModal();
  };

  if (isLoading) {
      return <div style={{ padding: '24px' }}>Memuat laporan...</div>;
  }

  // Chart data
  const chartData = {
    labels: reports.map((r) => r.month_name.substring(0, 3).toUpperCase()),
    datasets: [
      {
        label: 'Total Item (ATK)',
        data: reports.map((r) => r.total_items_ordered),
        backgroundColor: '#8A9E8A',
        borderRadius: 6,
        barThickness: 24,
      },
      {
        label: 'Total Peminjaman Aset',
        data: reports.map((r) => r.total_assets_borrowed),
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
        <button className={styles.exportBtn} onClick={() => setIsExportOpen(true)}>
          <i className="fas fa-download"></i>
          Export Laporan
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
            {reports.map((report) => (
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

      {isExportOpen && (
        <div className={`globalModalOverlay ${isClosing ? 'closing' : ''}`} onClick={closeExportModal}>
          <div className={`globalModal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="globalModalIcon">
              <i className="fas fa-file-export"></i>
            </div>
            <h3>Export Laporan Semester</h3>
            <p>
              Pilih format file untuk mengunduh rekapitulasi inventaris semester ini.
            </p>
            <div className="globalModalBtns" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="globalModalBtnConfirm" 
                onClick={handleExportXLSX}
                style={{ backgroundColor: '#1d6f42', borderColor: '#1d6f42' }}
              >
                <i className="fas fa-file-excel" style={{ marginRight: '8px' }}></i>
                Unduh format Excel (.xlsx)
              </button>
              <button 
                className="globalModalBtnConfirm" 
                onClick={handleExportCSV}
                style={{ backgroundColor: '#2196F3', borderColor: '#2196F3' }}
              >
                <i className="fas fa-file-csv" style={{ marginRight: '8px' }}></i>
                Unduh format CSV (.csv)
              </button>
              <button 
                className="globalModalBtnCancel" 
                onClick={closeExportModal}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
