import { useState, useEffect, useMemo } from 'react';
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

// --- Breadcrumb types ---
type ViewLevel = 'semester' | 'month';

interface BreadcrumbItem {
  label: string;
  level: ViewLevel;
  monthIndex?: number;
}

// --- Status badge helper ---
function getStatusBadge(rate: number) {
  if (rate >= 80) return { label: 'Tinggi', color: '#dc2626', bg: '#fef2f2' };
  if (rate >= 40) return { label: 'Sedang', color: '#d97706', bg: '#fffbeb' };
  return { label: 'Rendah', color: '#16a34a', bg: '#f0fdf4' };
}

// --- Monthly detail from requests ---
function getMonthlyRequestDetails(allRequests: any[], monthOrder: number) {
  return allRequests
    .filter((r) => {
      const d = normalizeDate(r.request_date || r.created_at);
      return d && d.getMonth() + 1 === monthOrder;
    })
    .map((r) => ({
      code: r.req_code || '-',
      item: r.item_name || '-',
      requester: r.requester_name || 'Guru',
      qty: Number(r.quantity) || 0,
      status: r.status,
      date: formatReportDate(r.request_date || r.created_at),
    }));
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

  // Breadcrumb navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('semester');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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
  const totalAssets = reports.reduce((sum, r) => sum + r.total_assets_borrowed, 0);

  const receiptRows = buildReceiptRows(items);
  const expenditureRows = buildExpenditureRows(requests);
  const receiptTotalValue = receiptRows.reduce((sum, row) => sum + (Number(row[17]) || 0), 0);
  const expenditureTotalValue = expenditureRows.reduce((sum, row) => sum + (Number(row[17]) || 0), 0);
  const receiptTotalQuantity = receiptRows.reduce((sum, row) => sum + (Number(row[14]) || 0), 0);
  const expenditureTotalQuantity = expenditureRows.reduce((sum, row) => sum + (Number(row[14]) || 0), 0);
  const receiptSummaryValue = receiptTotalValue || receiptTotalQuantity;
  const expenditureSummaryValue = expenditureTotalValue || expenditureTotalQuantity;

  // Breadcrumb path
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const crumbs: BreadcrumbItem[] = [
      { label: selectedSemester === 'ganjil-2025' ? 'Semester Ganjil 2025/2026' : 'Semester Genap 2024/2025', level: 'semester' },
    ];
    if (viewLevel === 'month' && selectedMonth !== null) {
      const monthReport = reports.find((r) => r.month_order === selectedMonth);
      crumbs.push({
        label: monthReport?.month_name || `Bulan ${selectedMonth}`,
        level: 'month',
        monthIndex: selectedMonth,
      });
    }
    return crumbs;
  }, [viewLevel, selectedMonth, selectedSemester, reports]);

  // Selected month data
  const selectedMonthReport = useMemo(() => {
    if (selectedMonth === null) return null;
    return reports.find((r) => r.month_order === selectedMonth) || null;
  }, [selectedMonth, reports]);

  const monthRequests = useMemo(() => {
    if (selectedMonth === null) return [];
    return getMonthlyRequestDetails(requests, selectedMonth);
  }, [selectedMonth, requests]);

  // Highest month for highlight
  const peakMonth = useMemo(() => {
    if (reports.length === 0) return null;
    return reports.reduce((max, r) =>
      r.total_items_ordered > (max?.total_items_ordered || 0) ? r : max, reports[0]);
  }, [reports]);

  // Navigation functions
  const navigateToMonth = (monthOrder: number) => {
    setSelectedMonth(monthOrder);
    setViewLevel('month');
    setExpandedRows(new Set());
  };

  const navigateToSemester = () => {
    setViewLevel('semester');
    setSelectedMonth(null);
    setExpandedRows(new Set());
  };

  const toggleExpandRow = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // --- Export ---
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
        backgroundColor: reports.map((r) =>
          selectedMonth === r.month_order ? '#5a7a5a' : '#8A9E8A'
        ),
        borderRadius: 6,
        barThickness: 24,
      },
      {
        label: 'Total Peminjaman Aset',
        data: reports.map((r) => r.total_assets_borrowed),
        backgroundColor: reports.map((r) =>
          selectedMonth === r.month_order ? '#1a1a1a' : '#2D2D2D'
        ),
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const month = reports[idx];
        if (month) navigateToMonth(month.month_order);
      }
    },
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

  // --- Status badge for requests ---
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'Menunggu', color: '#d97706', bg: '#fffbeb' },
    APPROVED: { label: 'Disetujui', color: '#16a34a', bg: '#f0fdf4' },
    REJECTED: { label: 'Ditolak', color: '#dc2626', bg: '#fef2f2' },
    COMPLETED: { label: 'Selesai', color: '#2563eb', bg: '#eff6ff' },
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
          onChange={(val) => { setSelectedSemester(val); navigateToSemester(); }}
          className={styles.semesterSelect}
        />
      </div>

      {/* Breadcrumb Navigation */}
      <div className={styles.breadcrumb}>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className={styles.breadcrumbItem}>
            {i > 0 && <i className="fas fa-chevron-right" style={{ fontSize: '10px', margin: '0 10px', color: 'var(--light-text)' }}></i>}
            {i < breadcrumbs.length - 1 ? (
              <button
                className={styles.breadcrumbLink}
                onClick={() => {
                  if (crumb.level === 'semester') navigateToSemester();
                }}
              >
                {crumb.label}
              </button>
            ) : (
              <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* === SEMESTER VIEW === */}
      {viewLevel === 'semester' && (
        <>
          {/* Stats Cards */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <i className="fas fa-box-open"></i>
              </div>
              <div>
                <div className={styles.statValue}>{totalItems}</div>
                <div className={styles.statLabel}>Total Item ATK</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <i className="fas fa-handshake"></i>
              </div>
              <div>
                <div className={styles.statValue}>{totalAssets}</div>
                <div className={styles.statLabel}>Total Peminjaman</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <i className="fas fa-calendar-check"></i>
              </div>
              <div>
                <div className={styles.statValue}>{reports.length}</div>
                <div className={styles.statLabel}>Bulan Tercatat</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fce7f3', color: '#db2777' }}>
                <i className="fas fa-fire"></i>
              </div>
              <div>
                <div className={styles.statValue}>{peakMonth?.month_name || '-'}</div>
                <div className={styles.statLabel}>Bulan Tertinggi</div>
              </div>
            </div>
          </div>

          {/* Advanced Data Table */}
          <div className={styles.reportTable}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>BULAN</th>
                  <th>TOTAL ITEM PESANAN (ATK)</th>
                  <th>TOTAL PEMINJAMAN ASET</th>
                  <th>RATA-RATA / HARI</th>
                  <th>INTENSITAS</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const avgPerDay = (report.total_items_ordered / 30).toFixed(1);
                  const usageRate = totalItems > 0
                    ? Math.round((report.total_items_ordered / totalItems) * 100)
                    : 0;
                  const badge = getStatusBadge(usageRate);
                  const barWidth = totalItems > 0
                    ? Math.max(4, (report.total_items_ordered / Math.max(...reports.map((r: any) => r.total_items_ordered))) * 100)
                    : 0;

                  return (
                    <tr
                      key={report.id}
                      onClick={() => navigateToMonth(report.month_order)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--light-text)', fontSize: '12px' }}>
                        {report.month_order}
                      </td>
                      <td className={styles.monthCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {report.month_name}
                          {peakMonth?.month_order === report.month_order && (
                            <span style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              borderRadius: '99px',
                              background: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 700,
                              letterSpacing: '0.03em',
                            }}>PEAK</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '80px',
                            height: '6px',
                            borderRadius: '99px',
                            background: '#f0ede8',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}>
                            <div style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              borderRadius: '99px',
                              background: 'var(--sage-green)',
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>
                            {report.total_items_ordered}
                          </span>
                          <span style={{ color: 'var(--light-text)', fontSize: '12px' }}>items</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{report.total_assets_borrowed}</span>
                        <span style={{ color: 'var(--light-text)', fontSize: '12px', marginLeft: '4px' }}>aset</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--medium-text)', fontSize: '13px' }}>
                          ~{avgPerDay} item/hari
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '99px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: badge.color,
                          background: badge.bg,
                        }}>
                          {badge.label} ({usageRate}%)
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <i className="fas fa-chevron-right" style={{ fontSize: '11px', color: 'var(--light-text)' }}></i>
                      </td>
                    </tr>
                  );
                })}
                {reports.length === 0 && (
                  <tr className={styles.emptyRow}>
                    <td colSpan={7}>
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
                  <td></td>
                  <td className={styles.totalLabel}>TOTAL SEMESTER</td>
                  <td className={styles.totalValue}>{totalItems} Items</td>
                  <td className={styles.totalValue}>{totalAssets} Aset</td>
                  <td className={styles.totalValue}>~{(totalItems / 180).toFixed(1)} / hari</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* === MONTH DETAIL VIEW === */}
      {viewLevel === 'month' && selectedMonthReport && (
        <>
          {/* Month Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <i className="fas fa-box-open"></i>
              </div>
              <div>
                <div className={styles.statValue}>{selectedMonthReport.total_items_ordered}</div>
                <div className={styles.statLabel}>Item ATK Bulan Ini</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                <i className="fas fa-handshake"></i>
              </div>
              <div>
                <div className={styles.statValue}>{selectedMonthReport.total_assets_borrowed}</div>
                <div className={styles.statLabel}>Peminjaman Aset</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                <i className="fas fa-file-alt"></i>
              </div>
              <div>
                <div className={styles.statValue}>{monthRequests.length}</div>
                <div className={styles.statLabel}>Total Transaksi</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fce7f3', color: '#db2777' }}>
                <i className="fas fa-percentage"></i>
              </div>
              <div>
                <div className={styles.statValue}>
                  {totalItems > 0 ? Math.round((selectedMonthReport.total_items_ordered / totalItems) * 100) : 0}%
                </div>
                <div className={styles.statLabel}>Dari Total Semester</div>
              </div>
            </div>
          </div>

          {/* Detail Transaction Table */}
          <div className={styles.reportTable}>
            <div style={{
              padding: '16px 24px',
              background: '#F7F5F0',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <strong style={{ fontSize: '15px', color: 'var(--dark-text)' }}>
                  Detail Transaksi — {selectedMonthReport.month_name}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--gray-text)', marginLeft: '12px' }}>
                  {monthRequests.length} transaksi ditemukan
                </span>
              </div>
              <button
                onClick={navigateToSemester}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: 'var(--medium-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-arrow-left" style={{ fontSize: '10px' }}></i>
                Kembali
              </button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>KODE</th>
                  <th>BARANG</th>
                  <th>PEMOHON</th>
                  <th>JUMLAH</th>
                  <th>TANGGAL</th>
                  <th>STATUS</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {monthRequests.length === 0 ? (
                  <tr className={styles.emptyRow}>
                    <td colSpan={8}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <i className="fas fa-inbox"></i>
                        </div>
                        <div>
                          <strong>Belum ada transaksi bulan ini</strong>
                          <span>Data transaksi akan muncul setelah ada permintaan ATK yang diproses.</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  monthRequests.map((req, idx) => {
                    const sc = statusConfig[req.status] || statusConfig.PENDING;
                    const isExpanded = expandedRows.has(idx);
                    return (
                      <>
                        <tr
                          key={idx}
                          onClick={() => toggleExpandRow(idx)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', color: 'var(--light-text)', fontSize: '12px' }}>
                            {idx + 1}
                          </td>
                          <td>
                            <span style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              padding: '2px 8px',
                              background: '#f5f5f4',
                              borderRadius: '4px',
                              color: 'var(--dark-text)',
                              fontWeight: 600,
                            }}>{req.code}</span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{req.item}</td>
                          <td style={{ color: 'var(--medium-text)' }}>{req.requester}</td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{req.qty}</span>
                            <span style={{ color: 'var(--light-text)', fontSize: '12px', marginLeft: '4px' }}>unit</span>
                          </td>
                          <td style={{ color: 'var(--gray-text)', fontSize: '13px' }}>{req.date}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '99px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: sc.color,
                              background: sc.bg,
                            }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                              style={{ fontSize: '10px', color: 'var(--light-text)', transition: 'transform 0.2s' }}></i>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`detail-${idx}`} style={{ background: '#FAFAF8' }}>
                            <td colSpan={8} style={{ padding: '0 24px 16px 56px' }}>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '16px',
                                fontSize: '12px',
                                color: 'var(--gray-text)',
                                paddingTop: '8px',
                                borderTop: '1px dashed var(--border-color)',
                              }}>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Kode Permintaan</div>
                                  <div style={{ fontFamily: 'monospace' }}>{req.code}</div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Pemohon</div>
                                  <div>{req.requester}</div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Tanggal Pengajuan</div>
                                  <div>{req.date}</div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Barang</div>
                                  <div>{req.item}</div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Jumlah</div>
                                  <div>{req.qty} unit</div>
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: 'var(--medium-text)', marginBottom: '2px' }}>Status</div>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '99px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: sc.color,
                                    background: sc.bg,
                                  }}>{sc.label}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

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
          {viewLevel === 'semester' && (
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: 'var(--light-text)' }}>
              <i className="fas fa-mouse-pointer" style={{ marginRight: '4px' }}></i>
              Klik bar chart untuk melihat detail bulan
            </div>
          )}
        </div>

        {/* Analysis */}
        <div className={styles.analysisCard}>
          <div className={styles.analysisIcon}>
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>{viewLevel === 'month' ? `Analisis ${selectedMonthReport?.month_name}` : 'Analisis Tren'}</h3>
          {viewLevel === 'month' && selectedMonthReport ? (
            <p>
              Bulan <strong>{selectedMonthReport.month_name}</strong> mencatat{' '}
              <strong>{selectedMonthReport.total_items_ordered} item</strong> pesanan ATK
              dan <strong>{selectedMonthReport.total_assets_borrowed} aset</strong> dipinjam.
              {selectedMonthReport.total_items_ordered === peakMonth?.total_items_ordered && (
                <> Ini adalah <u>bulan puncak</u> penggunaan inventaris semester ini.</>
              )}
            </p>
          ) : (
            <p>
              Puncak penggunaan inventaris terjadi pada bulan <strong>{peakMonth?.month_name || '-'}</strong>. Hal
              ini dikarenakan tingginya permintaan ATK untuk persiapan{' '}
              <u>Ujian Sekolah</u> dan administrasi semesteran.
            </p>
          )}
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
              Puncak penggunaan inventaris terjadi pada bulan {peakMonth?.month_name || 'Maret'} untuk persiapan ujian
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
              Unduh CSV Penerimaan &amp; Pengeluaran
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
