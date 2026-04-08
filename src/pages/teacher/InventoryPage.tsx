import { useState, useMemo } from 'react';
import { items, categories } from '../../data/mockData';
import styles from '../../styles/inventory.module.css';
import CartDrawer, { type CartItem } from '../../components/CartDrawer';
import type { Item } from '../../data/mockData';

const ITEMS_PER_PAGE = 6;

export default function TeacherInventoryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'Semua' || item.category_name === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  // Cart Functions
  const handleAddToCart = (item: Item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, category: item.category_name, quantity: 1 }];
    });
    // Buka keranjang tiap tambah item biar terasa responsif
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, increment: boolean) => {
    setCartItems(prev => 
      prev.map(i => {
        if (i.id === id) {
          const newQty = increment ? i.quantity + 1 : Math.max(1, i.quantity - 1);
          return { ...i, quantity: newQty };
        }
        return i;
      })
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSubmitCart = () => {
    setIsCartOpen(false);
    setConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    setCartItems([]);
    setConfirmModal(false);
    setSuccessModal(true);
    setTimeout(() => setSuccessModal(false), 3000);
  };

  const categoryList = ['Semua', ...categories.map((c) => c.name)];
  const cartTotalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    for (let i = 1; i <= Math.min(3, totalPages); i++) pages.push(i);
    if (totalPages > 4) pages.push('...');
    if (totalPages > 3) pages.push(totalPages);

    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageNavBtn}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i> Sebelumnya
        </button>
        {pages.map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={idx}
              className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className={styles.pageEllipsis}>
              {page}
            </span>
          )
        )}
        <button
          className={styles.pageNavBtn}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Berikutnya <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Cari barang inventaris (misal: Kertas A4, Spidol)..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Filters Row */}
      <div className={styles.filtersRow}>
        <div className={styles.categoryPills}>
          {categoryList.map((cat) => (
            <button
              key={cat}
              className={`${styles.pill} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => handleCategoryChange(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className={styles.sortDropdown}>
          <i className="fas fa-sliders-h"></i>
          Urutkan: Terpopuler
        </div>
      </div>

      {/* Product Grid */}
      <div className={styles.productGrid}>
        {paginatedItems.map((item, index) => {
          const isLow = item.stock <= 5;
          const bgColors = [
            styles.bgPink,
            styles.bgMint,
            styles.bgBeige,
            styles.bgCream,
            styles.bgSage,
            styles.bgPeach,
          ];
          const bgClass = bgColors[index % bgColors.length];

          return (
            <div
              key={item.id}
              className={`${styles.productCard} ${isLow ? styles.lowStock : ''}`}
            >
              <div className={`${styles.productImage} ${bgClass}`}>
                {isLow && <span className={styles.lowStockBadge}>STOK TIPIS</span>}
                <div className={styles.imagePlaceholder}>
                  <i className="fas fa-box-open"></i>
                  <span>{item.category_name}</span>
                </div>
              </div>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{item.name}</div>
                <div className={`${styles.stockInfo} ${isLow ? styles.low : ''}`}>
                  Sisa Stok: {item.stock}
                </div>
              </div>
              <button 
                className={styles.addToCartBtn} 
                onClick={() => handleAddToCart(item)}
              >
                <i className={item.is_loanable ? "fas fa-arrow-circle-down" : "fas fa-cart-plus"}></i>
                {item.is_loanable ? 'Pinjam Barang' : 'Tambah ke Keranjang'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && renderPagination()}

      {/* Floating Cart Button */}
      <button className={styles.floatingCart} onClick={() => setIsCartOpen(true)}>
        <i className="fas fa-shopping-basket"></i>
        {cartTotalQty > 0 && <span className={styles.cartBadge}>{cartTotalQty}</span>}
      </button>

      {/* Cart Drawer Overlay */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onSubmit={handleSubmitCart}
      />

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="globalModalOverlay">
          <div className="globalModal" style={{ backgroundColor: '#FDFBF7', maxWidth: '420px', padding: '32px' }}>
            <div className="globalModalIcon" style={{ background: '#E2EBE5', color: '#6A9276', marginBottom: '20px', width: '60px', height: '60px', fontSize: '24px' }}>
              <i className="fas fa-clipboard-check"></i>
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '24px', color: '#2B342C' }}>Tinjau Permintaan Anda</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left', maxHeight: '250px', overflowY: 'auto' }}>
              {cartItems.map((item, i) => (
                <div key={i} style={{ 
                  background: 'var(--white)', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <i className={item.category === 'ATK' ? "fas fa-pen" : "fas fa-file-alt"} style={{ color: '#6A9276', fontSize: '18px' }}></i>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: '#2B342C' }}>
                    {item.quantity}x {item.name}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderTop: '2px solid rgba(0,0,0,0.03)', paddingTop: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#8A9E8A', textTransform: 'uppercase' }}>RINGKASAN</span>
              <span style={{ fontWeight: 700, color: '#2B342C', fontSize: '15px' }}>Total Barang: {cartTotalQty} Item</span>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => setConfirmModal(false)}
                style={{ flex: 1, padding: '14px', background: 'transparent', border: '2px solid #DD8A71', color: '#DD8A71', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Batal
              </button>
              <button 
                onClick={handleConfirmSubmit}
                style={{ flex: 1, padding: '14px', background: '#8A9E8A', border: 'none', color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(138,158,138,0.2)' }}
              >
                Ya, Ajukan!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal && (
        <div className="globalModalOverlay">
          <div className="globalModal">
            <div className="globalModalIcon success">
              <i className="fas fa-check"></i>
            </div>
            <h3>Permintaan Berhasil!</h3>
            <p>
              Permintaan perlengkapan Anda telah diteruskan ke Admin Sarpras dan sedang menunggu validasi. 
              Anda bisa memantau statusnya di menu <strong>Pesanan</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
