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
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🐝</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Ферма Медовик
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">онлайн магазин</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-secondary rounded-full transition-colors"
            data-testid="cart-button"
          >
            <ShoppingCart className="w-6 h-6 text-primary" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 px-4 md:px-8 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Здоровье на крыльях пчелы
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-6">
          Натуральный мёд и пчелопродукты с пасеки прямо к вам
        </p>
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-border/50">
          <span className="text-red-500">❤️</span>
          <span className="text-sm font-medium text-foreground">100% Натурально</span>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 md:px-8 pb-8">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </section>

      {/* Products Grid */}
      <section className="px-4 md:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
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
            <div className="text-center py-16">
              <p className="text-muted-foreground">Товары не найдены</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/30 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © 2026 Ферма Медовик. Все права защищены.
        </p>
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
