import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { requests as initialRequests, getLowStockItems, getCriticalStockItems } from '../../data/mockData';
import type { Request } from '../../data/mockData';
import styles from '../../styles/adminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function DashboardPage() {
  const [reqs, setReqs] = useState<Request[]>(initialRequests);
  const lowStockItems = getLowStockItems();
  const criticalItems = getCriticalStockItems();

  const handleApprove = (id: number) => {
    setReqs(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'APPROVED' as const } : r))
    );
  };

  const handleReject = (id: number) => {
    setReqs(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'REJECTED' as const } : r))
    );
  };

  const pendingCount = reqs.filter(r => r.status === 'PENDING').length;

  // Weekly activity chart data
  const chartData = {
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum'],
    datasets: [
      {
        data: [18, 25, 15, 30, 22],
        backgroundColor: ['#B8C9B8', '#8A9E8A', '#B8C9B8', '#6B8F71', '#8A9E8A'],
        borderRadius: 6,
        barThickness: 32,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' }, color: '#7A7A7A' },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className={styles.statsRow}>
        {/* Card 1: Total Permintaan Hari Ini */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span>Total Permintaan Hari Ini</span>
            <div className={`${styles.statCardIcon} ${styles.default}`}>
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
          <div className={styles.statValue}>24</div>
          <div className={styles.statTrend}>↗ +12% dari kemarin</div>
        </div>

        {/* Card 2: Stok Menipis */}
        <div className={`${styles.statCard} ${styles.alert}`}>
          <div className={styles.statCardHeader}>
            <span>Stok Menipis</span>
            <div className={`${styles.statCardIcon} ${styles.warning}`}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
          </div>
          <div className={`${styles.statValue} ${styles.alertValue}`}>
            {lowStockItems.length} Item
          </div>
          <div className={`${styles.statSubtitle} ${styles.alertSubtitle}`}>
            Tindakan segera diperlukan
          </div>
        </div>

        {/* Card 3: Menunggu Validasi */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span>Menunggu Validasi</span>
            <div className={`${styles.statCardIcon} ${styles.info}`}>
              <i className="fas fa-clipboard-list"></i>
            </div>
          </div>
          <div className={styles.statValue}>{pendingCount + 8}</div>
          <div className={styles.statSubtitle}>Pemeriksaan dokumen</div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Permintaan Terbaru</h3>
        <a href="#" className={styles.sectionLink}>Lihat Semua</a>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID REQ</th>
              <th>NAMA BARANG</th>
              <th>PEMOHON</th>
              <th>TANGGAL</th>
              <th>STATUS</th>
              <th>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((req) => (
              <tr key={req.id}>
                <td>
                  <span className={styles.reqCode}>{req.req_code}</span>
                </td>
                <td>
                  <span className={styles.itemName}>{req.item_name}</span>
                </td>
                <td>
                  <div className={styles.requesterInfo}>
                    <span>{req.requester_name}</span>
                    <span>({req.requester_role})</span>
                  </div>
                </td>
                <td>{req.request_date}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      req.priority === 'URGENT' ? styles.urgent : styles.reguler
                    }`}
                  >
                    {req.priority}
                  </span>
                </td>
                <td>
                  {req.status === 'PENDING' ? (
                    <div className={styles.actionBtns}>
                      <button
                        className={styles.btnApprove}
                        onClick={() => handleApprove(req.id)}
                      >
                        Setujui
                      </button>
                      <button
                        className={styles.btnReject}
                        onClick={() => handleReject(req.id)}
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`${styles.badge} ${
                        req.status === 'APPROVED' ? styles.reguler : styles.urgent
                      }`}
                    >
                      {req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Grid */}
      <div className={styles.bottomGrid}>
        {/* Critical Stock */}
        <div className={styles.criticalCard}>
          <div className={styles.criticalHeader}>
            <i className="fas fa-exclamation-circle"></i>
            <h3>Stok Kritis</h3>
          </div>
          <div className={styles.criticalList}>
            {criticalItems.map((item) => (
              <div key={item.id} className={styles.criticalItem}>
                <span className={styles.criticalItemName}>{item.name}</span>
                <span className={styles.criticalBadge}>Sisa {item.stock}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <h3>Ringkasan Aktivitas</h3>
            <p>Penggunaan inventaris minggu ini</p>
          </div>
          <div className={styles.chartContainer}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
