import { useState, useEffect } from "react";
import { useCart } from "@/App";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart } from "lucide-react";

const ProductModal = ({ product, category, isOpen, onClose, onAddToCart }) => {
  const { addToCart } = useCart();
  const [selectedWeight, setSelectedWeight] = useState(null);

  useEffect(() => {
    if (product?.weight_prices?.length > 0) {
      setSelectedWeight(product.weight_prices[0]);
    } else {
      setSelectedWeight(null);
    }
  }, [product]);

  if (!product) return null;

  const hasWeights = product.weight_prices && product.weight_prices.length > 0;
  const currentPrice = selectedWeight?.price || product.base_price;

  const handleAddToCart = () => {
    addToCart(product, selectedWeight);
    if (onAddToCart) onAddToCart();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-2xl max-h-[95vh] md:max-h-[90vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>{product?.name || "Товар"}</DialogTitle>
          <DialogDescription>{product?.description || "Описание товара"}</DialogDescription>
        </VisuallyHidden>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
          data-testid="close-modal-btn"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Mobile Layout - Compact */}
          <div className="md:hidden p-4">
            {/* Compact Header with Image */}
            <div className="flex gap-3 mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                {category && (
                  <span className="text-primary text-xs font-black uppercase tracking-wider">
                    {category.name}
                  </span>
                )}
                <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {product.name}
                </h2>
              </div>
            </div>

            {/* Description - Collapsed */}
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 font-bold">
                {product.description}
              </p>
            )}

            {/* Weight Selection */}
            {hasWeights && (
              <div className="mb-4">
                <p className="text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                  Выберите вес:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {product.weight_prices.map((wp, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedWeight(wp)}
                      className={`weight-btn py-2.5 px-2 rounded-lg border-2 text-xs font-black transition-all ${
                        selectedWeight?.weight === wp.weight
                          ? "border-primary bg-primary text-white"
                          : "border-amber-200 bg-amber-50 text-foreground hover:border-primary"
                      }`}
                      data-testid={`weight-option-${wp.weight}`}
                    >
                      {wp.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between mb-4 py-3 px-4 bg-amber-50 rounded-xl">
              <span className="text-sm font-black text-foreground">Цена:</span>
              <span className="text-2xl font-black text-primary" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {currentPrice} ₸
              </span>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-xl text-base btn-primary"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              В корзину
            </Button>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden md:grid md:grid-cols-2">
            {/* Image Section */}
            <div className="relative aspect-square md:aspect-auto md:min-h-[400px] bg-amber-50 flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content Section */}
            <div className="p-6 lg:p-8 flex flex-col">
              {category && (
                <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                  {category.name}
                </span>
              )}

              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {product.name}
              </h2>

              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {product.description}
                </p>
              )}

              {hasWeights && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                    Выберите вес:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {product.weight_prices.map((wp, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedWeight(wp)}
                        className={`weight-btn py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedWeight?.weight === wp.weight
                            ? "border-primary bg-primary text-white"
                            : "border-amber-200 bg-amber-50 text-foreground hover:border-primary"
                        }`}
                        data-testid={`weight-option-${wp.weight}`}
                      >
                        {wp.weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Цена</span>
                <p className="text-3xl font-bold text-foreground mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {currentPrice} ₸
                </p>
              </div>

              <div className="mt-auto pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl text-lg btn-primary"
                  data-testid="add-to-cart-btn-desktop"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  В корзину
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
