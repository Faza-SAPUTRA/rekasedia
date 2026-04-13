import { useState, useMemo, useEffect } from 'react';
import styles from '../../styles/inventory.module.css';
import { fetchItems, fetchCategories } from '../../services/api';

const ITEMS_PER_PAGE = 10;

type ModalType = 'add' | 'edit' | 'delete' | 'filter' | null;

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Table Filters State
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [sortOrder, setSortOrder] = useState('Nama A-Z');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form State (for Add/Edit)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: 1,
    category_name: 'ATK',
    stock: 0,
    unit: 'Unit',
    description: ''
  });

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

  // --- Handlers ---
  const openAddModal = () => {
    setFormData({ name: '', sku: `SKU-${new Date().getFullYear()}-${Math.floor(Math.random()*900)+100}`, category_id: 1, category_name: 'ATK', stock: 0, unit: 'Unit', description: '' });
    setActiveModal('add');
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setFormData({ ...item });
    setActiveModal('edit');
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setActiveModal('delete');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleSaveItem = () => {
    // Mock Save
    if (activeModal === 'add') {
        const newItem = { id: Date.now(), ...formData };
        setItems([newItem, ...items]);
        triggerSuccess('Barang berhasil ditambahkan ke sistem.');
    } else if (activeModal === 'edit') {
        setItems(items.map(i => i.id === selectedItem.id ? { ...formData } : i));
        triggerSuccess('Data barang berhasil diperbarui.');
    }
    closeModal();
  };

  const handleDeleteItem = () => {
    // Mock Delete
    setItems(items.filter(i => i.id !== selectedItem.id));
    triggerSuccess(`Barang "${selectedItem.name}" berhasil dihapus.`);
    closeModal();
  };

  // --- Modal Renderer ---
  const renderModals = () => {
    if (!activeModal) return null;

    return (
      <div className="globalModalOverlay animate-fade-in">
        <div className="globalModal" style={{ maxWidth: activeModal === 'add' || activeModal === 'edit' ? '600px' : '420px' }}>
          
          {/* Add / Edit Modal */}
          {(activeModal === 'add' || activeModal === 'edit') && (
            <div className={styles.modalForm}>
              <div className="globalModalIcon" style={{ margin: '0 0 16px 0', width: '48px', height: '48px', fontSize: '20px' }}>
                <i className={`fas fa-${activeModal === 'add' ? 'plus' : 'edit'}`}></i>
              </div>
              <h3>{activeModal === 'add' ? 'Tambah Barang Baru' : 'Edit Data Barang'}</h3>
              <p>Pastikan informasi barang yang dimasukkan sudah sesuai dengan fisik inventaris.</p>
              
              <div className={styles.modalFormGrid}>
                <div className={styles.formGroup}>
                  <label>Nama Barang</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Kertas HVS A4" />
                </div>
                <div className={styles.formGroup}>
                  <label>SKU Barang</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-2023-XXX" />
                </div>
                <div className={styles.formGroup}>
                  <label>Kategori</label>
                  <select value={formData.category_name} onChange={e => setFormData({...formData, category_name: e.target.value})}>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Satuan</label>
                  <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Pcs, Rim, Set, dsb." />
                </div>
                <div className={styles.formGroup}>
                  <label>Stok Awal</label>
                  <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
                </div>
                <div className={styles.formGroup}>
                  <label>Dapat Dipinjam?</label>
                  <select>
                    <option value="false">Tidak (Habis Pakai)</option>
                    <option value="true">Ya (Aset/Pinjaman)</option>
                  </select>
                </div>
              </div>
              
              <div className="globalModalBtns" style={{ marginTop: '32px' }}>
                <button className="globalModalBtnCancel" onClick={closeModal}>Batal</button>
                <button className="globalModalBtnConfirm" onClick={handleSaveItem}>Simpan Perubahan</button>
              </div>
            </div>
          )}

          {/* Delete Modal */}
          {activeModal === 'delete' && (
            <div>
              <div className="globalModalIcon" style={{ background: 'var(--badge-red-bg)', color: 'var(--error-red)' }}>
                <i className="fas fa-trash-alt"></i>
              </div>
              <h3>Hapus Barang?</h3>
              <div className={styles.deleteConfirmText}>
                Apakah Anda yakin ingin menghapus <span className={styles.deleteItemName}>{selectedItem?.name}</span> dari daftar inventaris? Tindakan ini tidak dapat dibatalkan.
              </div>
              <div className="globalModalBtns">
                <button className="globalModalBtnCancel" onClick={closeModal}>Batal</button>
                <button className="globalModalBtnConfirm" style={{ background: 'var(--error-red)', borderColor: 'var(--error-red)' }} onClick={handleDeleteItem}>Ya, Hapus Barang</button>
              </div>
            </div>
          )}

          {/* Filter Modal */}
          {activeModal === 'filter' && (
            <div className={styles.modalForm}>
              <div className="globalModalIcon" style={{ margin: '0 0 16px 0', width: '48px', height: '48px', fontSize: '20px' }}>
                <i className="fas fa-sliders-h"></i>
              </div>
              <h3>Filter Lanjutan</h3>
              <p>Gunakan filter ini untuk pencarian data yang lebih spesifik.</p>
              
              <div className={styles.filterModalGrid}>
                <div className={styles.formGroup}>
                  <label>Urutkan Berdasarkan</label>
                  <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                    {sortOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Status Ketersediaan</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {statusOptions.map(opt => (
                        <button 
                            key={opt} 
                            onClick={() => setStatusFilter(opt)}
                            className={styles.pageBtn} 
                            style={{ width: 'auto', padding: '0 12px', borderColor: statusFilter === opt ? 'var(--sage-green)' : 'var(--border-color)', color: statusFilter === opt ? 'var(--sage-green)' : 'var(--medium-text)' }}
                        >
                            {opt}
                        </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="globalModalBtns" style={{ marginTop: '24px' }}>
                <button className="globalModalBtnConfirm" style={{ width: '100%' }} onClick={closeModal}>Terapkan Filter</button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

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
        <button className={styles.addBtn} onClick={openAddModal}>
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
          </div>

          <div className={styles.advancedFilter} onClick={() => setActiveModal('filter')}>
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
                      <button className={`${styles.actionBtn} ${styles.editBtn}`} title="Edit" onClick={() => openEditModal(item)}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Hapus" onClick={() => openDeleteModal(item)}>
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

      {/* Render Modals */}
      {renderModals()}

      {/* Success Feedback Modal */}
      {showSuccess && (
        <div className="globalModalOverlay animate-fade-in">
          <div className="globalModal">
            <div className="globalModalIcon success">
              <i className="fas fa-check"></i>
            </div>
            <h3>Berhasil!</h3>
            <p>{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
