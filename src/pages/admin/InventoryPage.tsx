import { useState, useMemo } from 'react';
import { items, categories } from '../../data/mockData';
import styles from '../../styles/inventory.module.css';
import CartDrawer, { type CartItem } from '../../components/CartDrawer';
import type { Item } from '../../data/mockData';

const ITEMS_PER_PAGE = 6;

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
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
    setCartItems([]);
    setIsCartOpen(false);
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
                <i className="fas fa-cart-plus"></i>
                Tambah ke Keranjang
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

      {/* Success Modal */}
      {successModal && (
        <div className="globalModalOverlay">
          <div className="globalModal">
            <div className="globalModalIcon success">
              <i className="fas fa-check"></i>
            </div>
            <h3>Permintaan Berhasil!</h3>
            <p>
              Permintaan perlengkapan Anda telah dikirim dan menunggu validasi Admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
