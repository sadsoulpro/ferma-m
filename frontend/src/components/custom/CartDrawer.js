import { useState } from "react";
import { useCart } from "@/App";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, X, Plus, Minus, MessageCircle, Send, Tag, Check } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [promocode, setPromocode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const discount = appliedPromo?.discount || 0;
  const finalTotal = Math.max(0, cartTotal - discount);

  const applyPromocode = async () => {
    if (!promocode.trim()) return;
    
    setPromoLoading(true);
    try {
      const response = await axios.post(`${API}/promocodes/validate`, {
        code: promocode.trim(),
        subtotal: cartTotal
      });
      setAppliedPromo(response.data);
      toast.success(`Промокод применён! Скидка: ${response.data.discount} ₸`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Промокод не найден");
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromocode = () => {
    setAppliedPromo(null);
    setPromocode("");
  };

  const formatOrderMessage = () => {
    let message = `🐝 Новый заказ от Ферма Медовик!\n\n`;
    message += `👤 Имя: ${customerName}\n`;
    message += `📞 Телефон: ${customerPhone}\n\n`;
    message += `📦 Заказ:\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name}`;
      if (item.weight) message += ` (${item.weight})`;
      message += ` - ${item.quantity} шт. x ${item.price} ₸ = ${item.quantity * item.price} ₸\n`;
    });
    
    message += `\n💵 Сумма: ${cartTotal} ₸`;
    if (appliedPromo) {
      message += `\n🏷️ Промокод: ${appliedPromo.code} (-${discount} ₸)`;
    }
    message += `\n💰 Итого: ${finalTotal} ₸`;
    return message;
  };

  const validateOrder = () => {
    if (!customerName.trim()) {
      toast.error("Введите ваше имя");
      return false;
    }
    if (!customerPhone.trim()) {
      toast.error("Введите номер телефона");
      return false;
    }
    if (cart.length === 0) {
      toast.error("Корзина пуста");
      return false;
    }
    return true;
  };

  const saveOrder = async () => {
    try {
      await axios.post(`${API}/orders`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map(item => ({
          name: item.name,
          weight: item.weight,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: cartTotal,
        discount: discount,
        total: finalTotal,
        promocode: appliedPromo?.code || null
      });
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const orderViaWhatsApp = async () => {
    if (!validateOrder()) return;
    
    await saveOrder();
    const message = encodeURIComponent(formatOrderMessage());
    const whatsappUrl = `https://wa.me/77083214571?text=${message}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Перенаправляем в WhatsApp...");
  };

  const orderViaTelegram = async () => {
    if (!validateOrder()) return;
    
    await saveOrder();
    const message = encodeURIComponent(formatOrderMessage());
    const telegramUrl = `https://t.me/fermamedovik?text=${message}`;
    window.open(telegramUrl, "_blank");
    toast.success("Перенаправляем в Telegram...");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-white max-h-screen">
        <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <ShoppingCart className="w-5 h-5 text-primary" />
            Корзина
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto cart-scroll overscroll-contain min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center min-h-[200px]">
              <ShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Ваши товары тут</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Добавьте товары в корзину</p>
            </div>
          ) : (
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="cart-item flex gap-2 md:gap-3 p-2 md:p-3 bg-secondary/30 rounded-lg"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs md:text-sm text-foreground line-clamp-1">
                      {item.name}
                      {item.weight && <span className="text-primary ml-1">({item.weight})</span>}
                    </h4>
                    <p className="text-primary font-bold text-xs md:text-sm mt-0.5 md:mt-1">
                      {item.price} ₸
                    </p>
                    <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        data-testid={`decrease-qty-${item.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-xs md:text-sm w-5 md:w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        data-testid={`increase-qty-${item.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    data-testid={`remove-item-${item.id}`}
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        {cart.length > 0 && (
          <div className="border-t border-border/50 p-3 md:p-4 space-y-3 md:space-y-4 bg-white flex-shrink-0">
            {/* Subtotal & Discount */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Сумма:</span>
                <span className="text-foreground">{cartTotal} ₸</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Скидка ({appliedPromo.code}):
                  </span>
                  <span className="text-green-600">-{discount} ₸</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <span className="font-semibold text-foreground text-sm md:text-base">Итого:</span>
                <span className="text-lg md:text-xl font-bold text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {finalTotal} ₸
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2 md:space-y-3">
              <Input
                placeholder="Ваше имя"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11"
                data-testid="customer-name-input"
              />
              <Input
                placeholder="Телефон"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11"
                data-testid="customer-phone-input"
              />
              
              {/* Promocode */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Введите промокод"
                    value={promocode}
                    onChange={(e) => {
                      setPromocode(e.target.value);
                      if (appliedPromo) setAppliedPromo(null);
                    }}
                    disabled={!!appliedPromo}
                    className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11 pl-8"
                    data-testid="promocode-input"
                  />
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {appliedPromo ? (
                  <Button
                    variant="outline"
                    onClick={removePromocode}
                    className="h-10 md:h-11 px-3 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={applyPromocode}
                    disabled={promoLoading || !promocode.trim()}
                    className="h-10 md:h-11 px-3"
                  >
                    {promoLoading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Order Buttons */}
            <div className="space-y-2">
              <Button
                onClick={orderViaWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 md:py-5 text-sm md:text-base"
                data-testid="order-whatsapp-btn"
              >
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Заказать через WhatsApp
              </Button>
              <Button
                onClick={orderViaTelegram}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 md:py-5 text-sm md:text-base"
                data-testid="order-telegram-btn"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Заказать через Telegram
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
