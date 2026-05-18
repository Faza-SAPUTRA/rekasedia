import { useState, useMemo, useEffect, type ChangeEvent, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/adminInventory.module.css';
import { fetchItems, fetchCategories, addItem, updateItem, deleteItem } from '../../services/api';
import Modal from '../../components/Modal';
import CustomSelect from '../../components/CustomSelect';
import LoadingButton from '../../components/LoadingButton';
import { getItemImage } from '../../utils/itemImages';
import PageSkeleton from '../../components/PageSkeleton';

const ITEMS_PER_PAGE = 10;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type ModalType = 'add' | 'edit' | 'delete' | 'filter' | null;
type InventoryFormData = {
  name: string;
  sku: string;
  category_id: number;
  category_name: string;
  stock: number;
  unit: string;
  description: string;
  image_url: string | null;
  is_loanable: boolean;
};

const emptyFormData = (): InventoryFormData => ({
  name: '',
  sku: `SKU-${new Date().getFullYear()}-${Math.floor(Math.random()*900)+100}`,
  category_id: 1,
  category_name: 'ATK',
  stock: 0,
  unit: 'Unit',
  description: '',
  image_url: null,
  is_loanable: false
});

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
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (for Add/Edit)
  const [formData, setFormData] = useState<InventoryFormData>(emptyFormData);

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


  const sortOptions = [
    { value: 'Nama A-Z', label: 'Nama A-Z' },
    { value: 'Nama Z-A', label: 'Nama Z-A' },
    { value: 'Stok Terbanyak', label: 'Stok Terbanyak' },
    { value: 'Stok Sedikit', label: 'Stok Sedikit' }
  ];

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

  const categoryOptions = ['Semua Kategori', ...categories.map((c) => c.name)].map(name => ({ value: name, label: name }));
  const statusOptions = ['Semua Status', 'Stok Tersedia', 'Stok Tipis', 'Habis'].map(status => ({ value: status, label: status }));

  if (isLoading) {
    return <PageSkeleton variant="table" rows={8} />;
  }

  // --- Handlers ---
  const openAddModal = () => {
    setFormData(emptyFormData());
    setImageError('');
    setActiveModal('add');
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      category_id: item.category_id || 1,
      category_name: item.category_name || 'ATK',
      stock: item.stock || 0,
      unit: item.unit || 'Unit',
      description: item.description || '',
      image_url: item.image_url || null,
      is_loanable: Boolean(item.is_loanable),
    });
    setImageError('');
    setActiveModal('edit');
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setActiveModal('delete');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setActiveModal(null);
    setSelectedItem(null);
    setImageError('');
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleImageFile = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('File harus berupa gambar.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Ukuran gambar maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, image_url: String(reader.result) }));
      setImageError('');
    };
    reader.readAsDataURL(file);
  };

  const handleImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    handleImageFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleImageFile(event.dataTransfer.files?.[0]);
  };

  const handleStockChange = (value: string) => {
    setFormData({...formData, stock: Math.max(0, parseInt(value) || 0)});
  };

  const handleCategoryChange = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    setFormData({
      ...formData,
      category_name: categoryName,
      category_id: category?.id || formData.category_id
    });
  };

  const handleSaveItem = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (activeModal === 'add') {
        const newItem = await addItem(formData);
        setItems([newItem, ...items]);
        triggerSuccess('Barang berhasil ditambahkan ke sistem.');
      } else if (activeModal === 'edit') {
        const updatedItem = await updateItem(selectedItem.id, formData);
        setItems(items.map(i => i.id === selectedItem.id ? updatedItem : i));
        triggerSuccess('Data barang berhasil diperbarui.');
      }
      setActiveModal(null);
      setSelectedItem(null);
      setImageError('');
    } catch (err) {
      console.error('Gagal menyimpan barang', err);
      alert('Gagal menyimpan barang: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (isSubmitting || !selectedItem) return;
    setIsSubmitting(true);
    try {
      await deleteItem(selectedItem.id);
      setItems(items.filter(i => i.id !== selectedItem.id));
      triggerSuccess(`Barang "${selectedItem.name}" berhasil dihapus.`);
      setActiveModal(null);
      setSelectedItem(null);
      setImageError('');
    } catch (err) {
      console.error('Gagal menghapus barang', err);
      alert('Gagal menghapus barang: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Modal Renderer ---
  const renderModals = () => {
    return (
      <Modal
        isOpen={activeModal !== null}
        onClose={closeModal}
        className={activeModal === 'add' || activeModal === 'edit' ? styles.inventoryModal : ''}
      >
        <div className={activeModal === 'add' || activeModal === 'edit' ? styles.itemModalShell : styles.smallModalShell}>
          <button className="globalModalClose" onClick={closeModal} title="Tutup">
            <i className="fas fa-times"></i>
          </button>
          
          {/* Add / Edit Modal */}
          {(activeModal === 'add' || activeModal === 'edit') && (
            <div className={styles.modalForm}>
              <div className={styles.modalScrollArea}>
                <div className="globalModalIcon" style={{ margin: '0 0 16px 0', width: '48px', height: '48px', fontSize: '20px' }}>
                  <i className={`fas fa-${activeModal === 'add' ? 'plus' : 'edit'}`}></i>
                </div>
                <h3>{activeModal === 'add' ? 'Tambah Barang Baru' : 'Edit Data Barang'}</h3>
                <p>Pastikan informasi barang yang dimasukkan sudah sesuai dengan fisik inventaris.</p>
                
                <div className={styles.modalFormGrid}>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 12' }}>
                    <label>Nama Barang</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Kertas HVS A4" />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 6' }}>
                    <label>SKU Barang</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="SKU-2023-XXX" />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 6' }}>
                    <label>Kategori</label>
                    <CustomSelect
                      value={formData.category_name}
                      onChange={handleCategoryChange}
                      options={categories.map(c => ({ value: c.name, label: c.name }))}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                    <label>Stok Awal</label>
                    <input type="number" min="0" value={formData.stock} onChange={e => handleStockChange(e.target.value)} />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                    <label>Satuan</label>
                    <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Pcs, Rim, dsb." />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 12' }}>
                    <label>Dapat Dipinjam?</label>
                    <CustomSelect
                      value={String(formData.is_loanable)}
                      onChange={val => setFormData({...formData, is_loanable: val === 'true'})}
                      className={styles.loanableSelect}
                      options={[
                        { value: 'false', label: 'Tidak (Habis Pakai)' },
                        { value: 'true', label: 'Ya (Aset/Pinjaman)' }
                      ]}
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: 'span 12' }}>
                    <label>Foto Barang</label>
                    <label
                      className={`${styles.imageDropzone} ${formData.image_url ? styles.hasImage : ''}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImageDrop}
                    >
                      {formData.image_url ? (
                        <>
                          <img src={formData.image_url} alt="Preview foto barang" className={styles.imagePreview} />
                          <span className={styles.imageUploadText}>Klik atau drop gambar lain untuk mengganti foto.</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt"></i>
                          <span className={styles.imageUploadText}>Drag and drop gambar ke sini, atau klik untuk pilih file.</span>
                          <span className={styles.imageUploadHint}>Format gambar, maksimal 2MB.</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageInput} />
                    </label>
                    {formData.image_url && (
                      <button
                        type="button"
                        className={styles.removeImageBtn}
                        onClick={() => setFormData({...formData, image_url: null})}
                      >
                        Hapus gambar
                      </button>
                    )}
                    {imageError && <div className={styles.imageError}>{imageError}</div>}
                  </div>
                </div>
              </div>
              
              <div className={`globalModalBtns ${styles.modalActionBar}`}>
                <button className="globalModalBtnCancel" onClick={closeModal} disabled={isSubmitting}>Batal</button>
                <LoadingButton
                  className="globalModalBtnConfirm"
                  onClick={handleSaveItem}
                  isLoading={isSubmitting}
                  loadingText={activeModal === 'add' ? 'Menambahkan...' : 'Menyimpan...'}
                >
                  {activeModal === 'add' ? 'Tambah Barang' : 'Simpan Perubahan'}
                </LoadingButton>
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
                <button className="globalModalBtnCancel" onClick={closeModal} disabled={isSubmitting}>Batal</button>
                <LoadingButton
                  className="globalModalBtnConfirm"
                  style={{ background: 'var(--error-red)', borderColor: 'var(--error-red)' }}
                  onClick={handleDeleteItem}
                  isLoading={isSubmitting}
                  loadingText="Menghapus..."
                >
                  Ya, Hapus Barang
                </LoadingButton>
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
                  <CustomSelect 
                    value={sortOrder} 
                    onChange={setSortOrder} 
                    options={sortOptions} 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Status Ketersediaan</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {statusOptions.map(opt => (
                        <button 
                            key={opt.value} 
                            onClick={() => setStatusFilter(opt.value)}
                            className={styles.pageBtn} 
                            style={{ width: 'auto', padding: '0 12px', borderColor: statusFilter === opt.value ? 'var(--sage-green)' : 'var(--border-color)', color: statusFilter === opt.value ? 'var(--sage-green)' : 'var(--medium-text)' }}
                        >
                            {opt.label}
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
      </Modal>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumbs & Header */}
      <div className={styles.inventoryHeader}>
        <div>
            <div className={styles.breadcrumb}>
                <Link to="/admin">Dashboard</Link>
                <span aria-hidden="true">&rsaquo;</span>
                <span>Manajemen Inventaris</span>
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
            <CustomSelect
              value={activeCategory}
              onChange={(val) => {
                setActiveCategory(val);
                setCurrentPage(1);
              }}
              options={categoryOptions}
            />

            <CustomSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={statusOptions}
            />
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
                      <img src={getItemImage(item)} alt={item.name} />
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

      {/* Render Modals via Portal */}
      {renderModals()}

      {/* Success Feedback Modal via Portal */}
      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)}>
        <button className="globalModalClose" onClick={() => setShowSuccess(false)}>
          <i className="fas fa-times"></i>
        </button>
        <div className="globalModalIcon success">
          <i className="fas fa-check"></i>
        </div>
        <h3>Berhasil!</h3>
        <p>{successMessage}</p>
      </Modal>
    </div>
  );
}
