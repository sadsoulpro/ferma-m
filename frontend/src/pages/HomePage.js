import { useState } from "react";
import { useCart } from "@/App";
import { ShoppingCart } from "lucide-react";
import ProductCard from "@/components/custom/ProductCard";
import ProductModal from "@/components/custom/ProductModal";
import CartDrawer from "@/components/custom/CartDrawer";
import CategoryFilter from "@/components/custom/CategoryFilter";

const HomePage = () => {
  const { categories, products, loading, cart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showCartHint, setShowCartHint] = useState(false);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Show hint when cart changes (item added)
  const handleCartChange = () => {
    setShowCartHint(true);
    setTimeout(() => setShowCartHint(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm md:text-base">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <a href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm md:text-lg">🐝</span>
              </div>
              <div>
                <h1 className="font-bold text-sm md:text-lg text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Ферма Медовик
                </h1>
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">онлайн магазин</p>
              </div>
            </a>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-secondary rounded-full transition-colors"
              data-testid="cart-button"
            >
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] md:text-xs w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center font-semibold">
                  {cartItemsCount}
                </span>
              )}
            </button>
            
            {/* Cart Hint Animation */}
            {showCartHint && (
              <div className="absolute top-full right-0 mt-2 whitespace-nowrap animate-bounce z-50">
                <div className="bg-primary text-white text-[10px] md:text-xs font-medium px-2 py-1 md:px-3 md:py-1.5 rounded-lg shadow-lg relative">
                  <div className="absolute -top-1 right-3 md:right-4 w-2 h-2 bg-primary rotate-45"></div>
                  Ваши товары тут ↑
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 md:py-12 lg:py-16 px-3 md:px-8 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-primary mb-2 md:mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
          ЗДОРОВЬЕ НА КРЫЛЬЯХ ПЧЕЛЫ
        </h2>
        <p className="text-muted-foreground text-sm md:text-base lg:text-lg max-w-xl mx-auto mb-4 md:mb-6 px-4">
          Натуральный мёд и пчелопродукты с пасеки прямо к вам
        </p>
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm border border-border/50">
          <span className="text-red-500 text-sm md:text-base">❤️</span>
          <span className="text-xs md:text-sm font-medium text-foreground">100% Натурально</span>
        </div>
      </section>

      {/* Categories */}
      <section className="px-3 md:px-8 pb-6 md:pb-8">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Products Grid */}
      <section className="px-3 md:px-8 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard
                  product={product}
                  category={categories.find(c => c.id === product.category_id)}
                  onOpenModal={() => openProductModal(product)}
                />
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 md:py-16">
              <p className="text-muted-foreground text-sm md:text-base">Товары не найдены</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/30 py-6 md:py-8 text-center">
        <p className="text-xs md:text-sm text-muted-foreground px-4">
          © 2026 Ферма Медовик. Все права защищены.
        </p>
        <a 
          href="/privacy" 
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          Политика конфиденциальности
        </a>
      </footer>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        category={categories.find(c => c.id === selectedProduct?.category_id)}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleCartChange}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default HomePage;
