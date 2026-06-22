import { useState, useEffect } from 'react';
import CustomSelect from '../../components/CustomSelect';
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
import { fetchItems, fetchReports, fetchRequests } from '../../services/api';
import styles from '../../styles/reports.module.css';
import Modal from '../../components/Modal';
import PageSkeleton from '../../components/PageSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const SCHOOL_NAME = 'UPTD SDN Kademangan 01';
const HEADMASTER_NAME = 'Ismaryanah, S.Pd';
const HEADMASTER_NIP = '19680908 199307 2002';
const HEADMASTER_SK = '800.1.11.1/5491-PK';
const HEADMASTER_SK_DATE = '1 Januari 2026';
const INVENTORY_OFFICER_NAME = 'Adit Nugroho';
const INVENTORY_OFFICER_NIP = '199006032025211029';
const INVENTORY_OFFICER_SK = '421.2/002/SDN.KDM01/I/2026';
const INVENTORY_OFFICER_SK_DATE = '5 Januari 2026';
const REPORT_YEAR = new Date().getFullYear();
const WORKBOOK_COLUMNS = 20;

function normalizeDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatReportDate(value?: string | Date | null) {
  const date = normalizeDate(value);
  if (!date) return '';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getMonthCode(value?: string | Date | null) {
  const date = normalizeDate(value);
  if (!date) return '';
  return String(date.getMonth() + 1).padStart(2, '0');
}

function getUnitPrice(item: any) {
  return Number(item?.unit_price ?? item?.harga_satuan ?? item?.price ?? 0) || 0;
}

function getItemCode(item: any, fallbackId?: number | string) {
  return item?.sku || item?.code || item?.item_code || `BRG-${String(item?.id ?? fallbackId ?? '').padStart(4, '0')}`;
}

function padRow(row: any[]) {
  return [...row, ...Array(Math.max(0, WORKBOOK_COLUMNS - row.length)).fill('')].slice(0, WORKBOOK_COLUMNS);
}

function createBookRows(title: string, summaryLabels: [string, string, string, string], summaryValues: [number, number, number, number], detailRows: any[][]) {
  const empty = Array(WORKBOOK_COLUMNS).fill('');

  return [
    empty,
    padRow(['', title, '', '', '', '', '', '', '', '', summaryLabels[0], summaryValues[0]]),
    padRow(['', `TAHUN ${REPORT_YEAR}`, '', '', '', '', '', '', '', '', summaryLabels[1], summaryValues[1]]),
    padRow(['', 'NAMA SEKOLAH', '', SCHOOL_NAME, 'NIP', 'No SK', 'Tanggal SK', '', '', '', summaryLabels[2], summaryValues[2]]),
    padRow(['', 'Kuasa Pengguna Barang/Kepsek', '', HEADMASTER_NAME, HEADMASTER_NIP, HEADMASTER_SK, HEADMASTER_SK_DATE, '', '', '', summaryLabels[3], summaryValues[3]]),
    padRow(['', 'Pengurus Barang', '', INVENTORY_OFFICER_NAME, INVENTORY_OFFICER_NIP, INVENTORY_OFFICER_SK, INVENTORY_OFFICER_SK_DATE]),
    padRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'subtotal', summaryValues[3]]),
    padRow([
      '', 'No.', 'Dokumen', '', 'Jenis Transaksi', 'Kode Rekening Belanja', 'Kode Barang', 'Nama Barang',
      'Regis', 'Kode Penerimaan', 'Kode Gabung', 'Nama Umum', 'Spesifikasi Barang', '', 'Jumlah',
      'Satuan Barang', 'Harga Satuan Rp', 'Nilai Total Rp', 'Keterangan', '',
    ]),
    padRow([
      '', '', 'Tanggal', 'Dok Transaksi', '', '', '', '', '', '', '', '', 'NUSP', 'Spesifikasi Nama Barang',
      '', '', '', '', 'Sumber', 'Periode',
    ]),
    padRow(['', '(1)', '(2)', '(3)', '(4)', '5', '6', '', '0', '', '', '7', '8', '9', '10', '11', '12', '13', '14', '']),
    ...detailRows.map(padRow),
  ];
}

function applyWorkbookLayout(ws: XLSX.WorkSheet) {
  ws['!cols'] = [
    { wch: 22 }, { wch: 6 }, { wch: 12 }, { wch: 26 }, { wch: 14 },
    { wch: 20 }, { wch: 22 }, { wch: 26 }, { wch: 8 }, { wch: 16 },
    { wch: 22 }, { wch: 32 }, { wch: 12 }, { wch: 34 }, { wch: 10 },
    { wch: 15 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 10 },
  ];
  ws['!merges'] = [
    { s: { r: 1, c: 1 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 9 } },
    { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } },
    { s: { r: 7, c: 12 }, e: { r: 7, c: 13 } },
    { s: { r: 7, c: 18 }, e: { r: 7, c: 19 } },
  ];
}

function buildReceiptRows(items: any[]) {
  return items
    .filter((item) => !Boolean(item.is_loanable))
    .map((item, index) => {
      const date = item.created_at || item.updated_at;
      const unitPrice = getUnitPrice(item);
      const quantity = Number(item.stock) || 0;

      return [
        SCHOOL_NAME,
        index + 1,
        formatReportDate(date),
        `P-RKS/${REPORT_YEAR}/${String(index + 1).padStart(3, '0')}`,
        'IN',
        item.account_code || item.kode_rekening || '-',
        getItemCode(item),
        item.category_name || item.name,
        item.regis ?? 0,
        item.receipt_code || '111',
        item.combined_code || '-',
        item.name,
        item.nusp || '',
        item.description || item.name,
        quantity,
        item.unit || 'Unit',
        unitPrice,
        quantity * unitPrice,
        'RekaSedia',
        getMonthCode(date),
      ];
    });
}

function buildExpenditureRows(requests: any[]) {
  return requests
    .filter((request) => ['APPROVED', 'COMPLETED'].includes(request.status))
    .map((request, index) => {
      const date = request.completed_at || request.reviewed_at || request.request_date || request.created_at;
      const unitPrice = getUnitPrice(request);
      const quantity = Number(request.quantity) || 0;

      return [
        SCHOOL_NAME,
        index + 1,
        formatReportDate(date),
        request.req_code || `K-RKS/${REPORT_YEAR}/${String(index + 1).padStart(3, '0')}`,
        'OUT',
        request.account_code || request.kode_rekening || '-',
        getItemCode(request, request.item_id),
        request.category_name || request.item_name,
        request.regis ?? 0,
        request.issue_code || '211',
        request.combined_code || '-',
        request.item_name,
        request.nusp || '',
        request.notes || request.item_description || `Pengeluaran untuk ${request.requester_name || 'guru'}`,
        quantity,
        request.unit || 'Unit',
        unitPrice,
        quantity * unitPrice,
        request.requester_name || 'Guru',
        getMonthCode(date),
      ];
    });
}

function toCsv(rows: any[][]) {
  return rows
    .map((row) => row.map((value) => {
      const cell = value === null || value === undefined ? '' : String(value);
      return /[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
    }).join(','))
    .join('\n');
}

function downloadTextFile(filename: string, content: string, type = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modal State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('ganjil-2025');

  const closeExportModal = () => {
    setIsExportOpen(false);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [reportsData, itemsData, requestsData] = await Promise.all([
          fetchReports(),
          fetchItems(),
          fetchRequests(),
        ]);
        setReports(reportsData);
        setItems(itemsData);
        setRequests(requestsData);
        setLoadError('');
      } catch (err) {
        console.error('Gagal mengambil laporan', err);
        setLoadError(err instanceof Error ? err.message : 'Gagal mengambil laporan.');
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

  const receiptRows = buildReceiptRows(items);
  const expenditureRows = buildExpenditureRows(requests);
  const receiptTotalValue = receiptRows.reduce((sum, row) => sum + (Number(row[17]) || 0), 0);
  const expenditureTotalValue = expenditureRows.reduce((sum, row) => sum + (Number(row[17]) || 0), 0);
  const receiptTotalQuantity = receiptRows.reduce((sum, row) => sum + (Number(row[14]) || 0), 0);
  const expenditureTotalQuantity = expenditureRows.reduce((sum, row) => sum + (Number(row[14]) || 0), 0);
  const receiptSummaryValue = receiptTotalValue || receiptTotalQuantity;
  const expenditureSummaryValue = expenditureTotalValue || expenditureTotalQuantity;

  const handleExportCSV = () => {
    const receiptBook = createBookRows(
      'BUKU PENERIMAAN PERSEDIAAN',
      ['Saldo Awal', 'Pengadaan', 'Penerimaan/Mutasi', 'Total Penerimaan'],
      [0, receiptSummaryValue, 0, receiptSummaryValue],
      receiptRows
    );
    const expenditureBook = createBookRows(
      'BUKU PENGELUARAN PERSEDIAAN',
      ['Saldo Awal', 'Pengeluaran', 'Pengeluaran/Mutasi', 'Total Pengeluaran'],
      [0, expenditureSummaryValue, 0, expenditureSummaryValue],
      expenditureRows
    );

    downloadTextFile(`Buku_Penerimaan_RekaSedia_${REPORT_YEAR}.csv`, toCsv(receiptBook));
    downloadTextFile(`Buku_Pengeluaran_RekaSedia_${REPORT_YEAR}.csv`, toCsv(expenditureBook));
    closeExportModal();
  };

  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();
    const receiptBook = createBookRows(
      'BUKU PENERIMAAN PERSEDIAAN',
      ['Saldo Awal', 'Pengadaan', 'Penerimaan/Mutasi', 'Total Penerimaan'],
      [0, receiptSummaryValue, 0, receiptSummaryValue],
      receiptRows
    );
    const expenditureBook = createBookRows(
      'BUKU PENGELUARAN PERSEDIAAN',
      ['Saldo Awal', 'Pengeluaran', 'Pengeluaran/Mutasi', 'Total Pengeluaran'],
      [0, expenditureSummaryValue, 0, expenditureSummaryValue],
      expenditureRows
    );
    const receiptSheet = XLSX.utils.aoa_to_sheet(receiptBook);
    const expenditureSheet = XLSX.utils.aoa_to_sheet(expenditureBook);

    applyWorkbookLayout(receiptSheet);
    applyWorkbookLayout(expenditureSheet);

    XLSX.utils.book_append_sheet(wb, receiptSheet, 'Buku Penerimaan');
    XLSX.utils.book_append_sheet(wb, expenditureSheet, 'Buku Pengeluaran');
    XLSX.writeFile(wb, `Laporan_Persediaan_RekaSedia_${REPORT_YEAR}.xlsx`);
    closeExportModal();
  };

  if (isLoading) {
      return <PageSkeleton variant="reports" rows={6} />;
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
        <CustomSelect 
          options={[
            { value: 'ganjil-2025', label: 'Semester Ganjil 2025/2026' },
            { value: 'genap-2024', label: 'Semester Genap 2024/2025' }
          ]}
          value={selectedSemester}
          onChange={setSelectedSemester}
          className={styles.semesterSelect}
        />
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
            {reports.length === 0 && (
              <tr className={styles.emptyRow}>
                <td colSpan={3}>
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <i className="fas fa-database"></i>
                    </div>
                    <div>
                      <strong>Data laporan belum tersedia</strong>
                      <span>{loadError || 'Backend akan mengisi data contoh otomatis saat endpoint laporan tersambung ke Supabase.'}</span>
                    </div>
                  </div>
                </td>
              </tr>
            )}
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

      {/* Export Modal - Using Portal */}
      <Modal isOpen={isExportOpen} onClose={closeExportModal}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <button className="globalModalClose" onClick={closeExportModal} title="Tutup">
              <i className="fas fa-times"></i>
          </button>
          <div className="globalModalIcon">
            <i className="fas fa-file-export"></i>
          </div>
          <h3>Export Laporan Semester</h3>
          <p>
            Unduh buku persediaan dengan format Buku Penerimaan dan Buku Pengeluaran.
          </p>
          <div className="globalModalBtns" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="globalModalBtnConfirm" 
              onClick={handleExportXLSX}
              style={{ backgroundColor: '#1d6f42', borderColor: '#1d6f42' }}
            >
              <i className="fas fa-file-excel" style={{ marginRight: '8px' }}></i>
              Unduh Excel 2 Sheet (.xlsx)
            </button>
            <button 
              className="globalModalBtnConfirm" 
              onClick={handleExportCSV}
              style={{ backgroundColor: '#2196F3', borderColor: '#2196F3' }}
            >
              <i className="fas fa-file-csv" style={{ marginRight: '8px' }}></i>
              Unduh CSV Penerimaan & Pengeluaran
            </button>
            <button 
              className="globalModalBtnCancel" 
              onClick={closeExportModal}
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
