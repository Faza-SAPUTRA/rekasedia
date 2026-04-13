import { useState, useMemo, useEffect } from 'react';
import styles from '../../styles/inventory.module.css';
import { fetchItems, fetchCategories } from '../../services/api';

const ITEMS_PER_PAGE = 10;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [sortOrder, setSortOrder] = useState('Nama A-Z');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemsData, catsData] = await Promise.all([
          fetchItems(),
          fetchCategories()
        ]);
        setItems(itemsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Gagal memuat inventaris', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.sku.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory =
        activeCategory === 'Semua Kategori' || item.category_name === activeCategory;
      
      const matchesStatus = 
        statusFilter === 'Semua Status' || 
        (statusFilter === 'Stok Tersedia' && item.stock > 0) ||
        (statusFilter === 'Habis' && item.stock === 0) ||
        (statusFilter === 'Stok Tipis' && item.stock > 0 && item.stock <= 5);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (sortOrder === 'Nama A-Z') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'Nama Z-A') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOrder === 'Stok Terbanyak') {
      result.sort((a, b) => b.stock - a.stock);
    } else if (sortOrder === 'Stok Sedikit') {
      result.sort((a, b) => a.stock - b.stock);
    }

    return result;
  }, [items, search, activeCategory, statusFilter, sortOrder]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const categoryOptions = ['Semua Kategori', ...categories.map((c) => c.name)];
  const statusOptions = ['Semua Status', 'Stok Tersedia', 'Stok Tipis', 'Habis'];
  const sortOptions = ['Nama A-Z', 'Nama Z-A', 'Stok Terbanyak', 'Stok Sedikit'];

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-text)' }}>Memuat data inventaris...</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs & Header */}
      <div className={styles.inventoryHeader}>
        <div>
            <div className={styles.breadcrumb}>
                Dashboard &rsaquo; <span>Manajemen Inventaris</span>
            </div>
            <h1 className={styles.inventoryTitle}>Manajemen Inventaris Barang</h1>
        </div>
        <button className={styles.addBtn}>
          <i className="fas fa-plus-circle"></i>
          Tambah Barang Baru
        </button>
      </div>

      {/* Filter Section */}
      <div className={styles.filterContainer}>
        <div className={styles.searchBarWrapper}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau SKU barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className={styles.filterRows}>
          <div className={styles.filterGroup}>
            <div style={{ position: 'relative' }}>
                <select 
                  className={styles.customSelect}
                  value={activeCategory}
                  onChange={(e) => {
                    setActiveCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: 'var(--light-text)' }}></i>
            </div>

            <div style={{ position: 'relative' }}>
                <select 
                  className={styles.customSelect}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: 'var(--light-text)' }}></i>
            </div>

            <div style={{ position: 'relative' }}>
                <select 
                  className={styles.customSelect}
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '10px', color: 'var(--light-text)' }}></i>
            </div>
          </div>

          <div className={styles.advancedFilter}>
            <i className="fas fa-cog"></i>
            Filter Lanjutan
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles.tableWrapper}>
        <table className={styles.adminTable}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>FOTO</th>
              <th>NAMA BARANG</th>
              <th>KATEGORI</th>
              <th>SISA STOK</th>
              <th>SATUAN</th>
              <th style={{ textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => {
              const isLow = item.stock > 0 && item.stock <= 5;
              const isEmpty = item.stock === 0;

              return (
                <tr key={item.id} className={styles.itemRow}>
                  <td>
                    <div className={styles.itemThumb}>
                      <i className="fas fa-box" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '20px' }}></i>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemSku}>{item.sku}</div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.categoryBadge}>{item.category_name}</span>
                  </td>
                  <td>
                    <div className={`${styles.stockWrapper} ${isLow ? styles.stockLow : ''} ${isEmpty ? styles.stockEmpty : ''}`}>
                      {isLow && <i className="fas fa-exclamation-triangle stockIcons"></i>}
                      {isEmpty && <i className="fas fa-times-circle stockIcons"></i>}
                      {item.stock}
                    </div>
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--medium-text)' }}>{item.unit}</td>
                  <td>
                    <div className={styles.actions} style={{ justifyContent: 'center' }}>
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Hapus">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination Row */}
        <div className={styles.paginationRow}>
          <div className={styles.paginationInfo}>
            Menampilkan <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> dari <strong>{filteredItems.length}</strong> barang inventaris
          </div>
          <div className={styles.pagination}>
            <div 
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{ opacity: currentPage === 1 ? 0.3 : 1, cursor: currentPage === 1 ? 'default' : 'pointer' }}
            >
                <i className="fas fa-angle-left"></i>
            </div>
            
            {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  className={`${styles.pageBtn} ${currentPage === i + 1 ? styles.active : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
            ))}

            <div 
                className={styles.pageNavBtn}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{ opacity: currentPage === totalPages ? 0.3 : 1, cursor: currentPage === totalPages ? 'default' : 'pointer' }}
            >
                <i className="fas fa-angle-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
