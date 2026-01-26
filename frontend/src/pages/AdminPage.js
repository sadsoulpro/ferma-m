import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Grid3X3, ChevronRight, Plus, Pencil, Trash2, LogOut, X, Upload, Settings, ChevronUp, ChevronDown, Users, Tag, Percent } from "lucide-react";

const ADMIN_PASSWORD = "secretboost1";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promocodes, setPromocodes] = useState([]);
  const [currentView, setCurrentView] = useState("dashboard");
  
  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [promocodeModalOpen, setPromocodeModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    category_id: "",
    image: "",
    base_price: "",
    weight_prices: []
  });
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [promocodeForm, setPromocodeForm] = useState({
    code: "",
    discount_type: "percent",
    discount_value: "",
    max_uses: ""
  });
  const [weightInput, setWeightInput] = useState({ weight: "", price: "" });

  const authHeader = {
    auth: {
      username: "armanuha",
      password: ADMIN_PASSWORD
    }
  };

  useEffect(() => {
    const session = localStorage.getItem("admin_session");
    if (session === "authenticated") {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("admin_session", "authenticated");
      toast.success("Вход выполнен успешно");
      fetchData();
    } else {
      toast.error("Неверный пароль");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("admin_session");
    setCurrentView("dashboard");
  };

  const fetchData = async () => {
    try {
      const [catRes, prodRes, ordersRes, promoRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`, authHeader),
        axios.get(`${API}/promocodes`, authHeader)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
      setOrders(ordersRes.data);
      setPromocodes(promoRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Product CRUD
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        category_id: product.category_id,
        image: product.image,
        base_price: String(product.base_price),
        weight_prices: product.weight_prices?.map(wp => ({
          weight: wp.weight,
          price: String(wp.price)
        })) || []
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        category_id: categories[0]?.id || "",
        image: "",
        base_price: "",
        weight_prices: []
      });
    }
    setProductModalOpen(true);
  };

  const saveProduct = async () => {
    const dataToSave = {
      ...productForm,
      base_price: parseFloat(productForm.base_price) || 0,
      weight_prices: productForm.weight_prices.map(wp => ({
        weight: wp.weight,
        price: parseFloat(wp.price) || 0
      }))
    };
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, dataToSave, authHeader);
        toast.success("Товар обновлен");
      } else {
        await axios.post(`${API}/products`, dataToSave, authHeader);
        toast.success("Товар создан");
      }
      setProductModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Ошибка сохранения товара");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Удалить товар?")) return;
    try {
      await axios.delete(`${API}/products/${id}`, authHeader);
      toast.success("Товар удален");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления товара");
    }
  };

  // Category CRUD
  const openCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, slug: category.slug });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", slug: "" });
    }
    setCategoryModalOpen(true);
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, categoryForm, authHeader);
        toast.success("Категория обновлена");
      } else {
        await axios.post(`${API}/categories`, categoryForm, authHeader);
        toast.success("Категория создана");
      }
      setCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Ошибка сохранения категории");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Удалить категорию?")) return;
    try {
      await axios.delete(`${API}/categories/${id}`, authHeader);
      toast.success("Категория удалена");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления категории");
    }
  };

  // Promocode CRUD
  const openPromocodeModal = () => {
    setPromocodeForm({
      code: "",
      discount_type: "percent",
      discount_value: "",
      max_uses: "100"
    });
    setPromocodeModalOpen(true);
  };

  const savePromocode = async () => {
    const dataToSave = {
      ...promocodeForm,
      discount_value: parseFloat(promocodeForm.discount_value) || 0,
      max_uses: parseInt(promocodeForm.max_uses) || 1
    };
    try {
      await axios.post(`${API}/promocodes`, dataToSave, authHeader);
      toast.success("Промокод создан");
      setPromocodeModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Ошибка создания промокода");
    }
  };

  const deletePromocode = async (id) => {
    if (!window.confirm("Удалить промокод?")) return;
    try {
      await axios.delete(`${API}/promocodes/${id}`, authHeader);
      toast.success("Промокод удален");
      fetchData();
    } catch (error) {
      toast.error("Ошибка удаления промокода");
    }
  };

  const addWeightPrice = () => {
    if (weightInput.weight && weightInput.price) {
      setProductForm(prev => ({
        ...prev,
        weight_prices: [...prev.weight_prices, { weight: weightInput.weight, price: weightInput.price }]
      }));
      setWeightInput({ weight: "", price: "" });
    }
  };

  const removeWeightPrice = (index) => {
    setProductForm(prev => ({
      ...prev,
      weight_prices: prev.weight_prices.filter((_, i) => i !== index)
    }));
  };

  const updateWeightPrice = (index, field, value) => {
    setProductForm(prev => ({
      ...prev,
      weight_prices: prev.weight_prices.map((wp, i) => 
        i === index ? { ...wp, [field]: value } : wp
      )
    }));
  };

  const moveWeightPrice = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= productForm.weight_prices.length) return;
    
    setProductForm(prev => {
      const newWeights = [...prev.weight_prices];
      [newWeights[index], newWeights[newIndex]] = [newWeights[newIndex], newWeights[index]];
      return { ...prev, weight_prices: newWeights };
    });
  };

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || "-";
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Админ-панель
            </h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-gray-600">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="Введите пароль"
                data-testid="admin-password"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" data-testid="admin-login-btn">
              Войти
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (currentView === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-800">Админ-панель</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-700 text-sm">
                На сайт
              </button>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Добро пожаловать!
          </h2>
          <p className="text-gray-500 mb-8">Выберите раздел для управления</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setCurrentView("products")}
              className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
              data-testid="products-card"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Товары</h3>
                <p className="text-sm text-gray-500">{products.length} позиций в каталоге</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => setCurrentView("categories")}
              className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
              data-testid="categories-card"
            >
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Grid3X3 className="w-7 h-7 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Категории</h3>
                <p className="text-sm text-gray-500">{categories.length} категорий товаров</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => setCurrentView("orders")}
              className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
              data-testid="orders-card"
            >
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Данные</h3>
                <p className="text-sm text-gray-500">{orders.length} заказов от клиентов</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button
              onClick={() => setCurrentView("promocodes")}
              className="bg-white rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow text-left"
              data-testid="promocodes-card"
            >
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                <Tag className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">Промокоды</h3>
                <p className="text-sm text-gray-500">{promocodes.length} активных промокодов</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* Instructions Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>
              📋 Инструкции
            </h3>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🛒 Управление товарами</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Добавить товар:</strong> Товары → Добавить → заполните форму</li>
                  <li><strong>Редактировать:</strong> нажмите "Изменить" на карточке товара</li>
                  <li><strong>Удалить:</strong> нажмите иконку корзины на карточке</li>
                  <li><strong>Фото:</strong> вставьте URL или загрузите файл (кнопка ↑)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">⚖️ Граммовки и цены</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Добавить:</strong> введите вес (250гр) и цену → нажмите +</li>
                  <li><strong>Редактировать:</strong> измените значения прямо в полях</li>
                  <li><strong>Порядок:</strong> используйте стрелки ↑↓ для сортировки</li>
                  <li><strong>Удалить:</strong> нажмите ✕ справа от граммовки</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">🏷️ Промокоды</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Создать:</strong> Промокоды → Добавить промокод</li>
                  <li><strong>Тип скидки:</strong> проценты или фиксированная сумма в ₸</li>
                  <li><strong>Лимит:</strong> укажите максимальное количество использований</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">📱 Заказы клиентов</h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Заказы приходят в <strong>WhatsApp:</strong> +7 708 321 45 71</li>
                  <li>Или в <strong>Telegram:</strong> @fermamedovik</li>
                  <li>Все заказы сохраняются в разделе <strong>Данные</strong></li>
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  💡 Сессия сохраняется — при повторном входе пароль вводить не нужно
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Products View
  if (currentView === "products") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </button>
              <span className="font-semibold text-gray-800">Товары</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="text-primary hover:text-primary/80 text-sm font-medium">
                Админ
              </button>
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-700 text-sm">
                На сайт
              </button>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-800">Список товаров</h2>
              </div>
              <button 
                onClick={() => setCurrentView("categories")}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Перейти к Категориям →
              </button>
            </div>
            <Button onClick={() => openProductModal()} className="bg-primary hover:bg-primary/90" data-testid="add-product-btn">
              <Plus className="w-4 h-4 mr-2" />
              Добавить
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex gap-4 mb-3">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                    <p className="text-xs text-primary uppercase tracking-wider">{getCategoryName(product.category_id)}</p>
                    <p className="font-bold text-gray-800 mt-1">{product.base_price} ₸</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-sm"
                    onClick={() => openProductModal(product)}
                    data-testid={`edit-product-${product.id}`}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Изменить
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => deleteProduct(product.id)}
                    className="text-gray-400 hover:text-red-500"
                    data-testid={`delete-product-${product.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Product Modal */}
        <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Редактировать товар" : "Добавить товар"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="product-name-input"
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  data-testid="product-description-input"
                />
              </div>
              <div>
                <Label>Категория</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(value) => setProductForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger data-testid="product-category-select">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Изображение</Label>
                <div className="flex gap-2">
                  <Input
                    value={productForm.image}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="URL изображения"
                    data-testid="product-image-input"
                  />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" variant="outline" asChild>
                      <span><Upload className="w-4 h-4" /></span>
                    </Button>
                  </label>
                </div>
                {productForm.image && (
                  <img src={productForm.image} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-xl" />
                )}
              </div>
              <div>
                <Label>Базовая цена (₸)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={productForm.base_price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, base_price: e.target.value.replace(/[^\d.]/g, '') }))}
                  placeholder="0"
                  data-testid="product-price-input"
                />
              </div>
              <div>
                <Label>Граммовки и цены</Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Вес (напр. 250гр)"
                    value={weightInput.weight}
                    onChange={(e) => setWeightInput(prev => ({ ...prev, weight: e.target.value }))}
                  />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Цена"
                    value={weightInput.price}
                    onChange={(e) => setWeightInput(prev => ({ ...prev, price: e.target.value.replace(/[^\d.]/g, '') }))}
                  />
                  <Button type="button" variant="outline" onClick={addWeightPrice}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {productForm.weight_prices.map((wp, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                      <div className="flex flex-col">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => moveWeightPrice(index, -1)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => moveWeightPrice(index, 1)}
                          disabled={index === productForm.weight_prices.length - 1}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <Input
                        value={wp.weight}
                        onChange={(e) => updateWeightPrice(index, 'weight', e.target.value)}
                        className="w-24 h-8 text-sm"
                        placeholder="Вес"
                      />
                      <span className="text-gray-400">—</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={wp.price}
                        onChange={(e) => updateWeightPrice(index, 'price', e.target.value.replace(/[^\d.]/g, ''))}
                        className="w-24 h-8 text-sm"
                        placeholder="Цена"
                      />
                      <span className="text-sm text-gray-500">₸</span>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto" onClick={() => removeWeightPrice(index)}>
                        <X className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setProductModalOpen(false)}>Отмена</Button>
                <Button onClick={saveProduct} className="bg-primary hover:bg-primary/90" data-testid="save-product-btn">
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Categories View
  if (currentView === "categories") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-4 h-4 text-white" />
              </button>
              <span className="font-semibold text-gray-800">Категории</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="text-primary hover:text-primary/80 text-sm font-medium">
                Админ
              </button>
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-700 text-sm">
                На сайт
              </button>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Список категорий</h2>
            <button 
              onClick={() => setCurrentView("products")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Перейти к Товарам →
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="space-y-3">
              {categories.map((category, index) => (
                <div 
                  key={category.id} 
                  className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <span className="w-8 h-8 flex items-center justify-center text-sm text-primary/60 font-medium">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-gray-700">{category.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteCategory(category.id)}
                    className="text-gray-300 hover:text-red-500"
                    data-testid={`delete-category-${category.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <button
              onClick={() => openCategoryModal()}
              className="w-full mt-4 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
              data-testid="add-category-btn"
            >
              <Plus className="w-4 h-4" />
              Добавить категорию
            </button>
          </div>
        </main>

        <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Редактировать категорию" : "Добавить категорию"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Название</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="category-name-input"
                />
              </div>
              <div>
                <Label>Slug (для URL)</Label>
                <Input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                  data-testid="category-slug-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>Отмена</Button>
                <Button onClick={saveCategory} className="bg-primary hover:bg-primary/90" data-testid="save-category-btn">
                  Сохранить
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Orders/Data View
  if (currentView === "orders") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </button>
              <span className="font-semibold text-gray-800">Данные</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="text-primary hover:text-primary/80 text-sm font-medium">
                Админ
              </button>
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-700 text-sm">
                На сайт
              </button>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Заказы клиентов</h2>
            <button 
              onClick={() => setCurrentView("promocodes")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Перейти к Промокодам →
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">Заказов пока нет</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Имя</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Телефон</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Сумма</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Промокод</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800">{order.customer_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{order.customer_phone}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-800">{order.total} ₸</td>
                        <td className="py-3 px-4 text-sm">
                          {order.promocode ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                              <Tag className="w-3 h-3" />
                              {order.promocode}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Promocodes View
  if (currentView === "promocodes") {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Tag className="w-4 h-4 text-white" />
              </button>
              <span className="font-semibold text-gray-800">Промокоды</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView("dashboard")} className="text-primary hover:text-primary/80 text-sm font-medium">
                Админ
              </button>
              <button onClick={() => navigate("/")} className="text-gray-500 hover:text-gray-700 text-sm">
                На сайт
              </button>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 text-sm">
                Выйти
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Список промокодов</h2>
            <button 
              onClick={() => setCurrentView("orders")}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Перейти к Данным →
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="space-y-3">
              {promocodes.map((promo) => (
                <div 
                  key={promo.id} 
                  className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    {promo.discount_type === "percent" ? (
                      <Percent className="w-5 h-5 text-orange-500" />
                    ) : (
                      <span className="text-orange-500 font-bold text-xs">₸</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{promo.code}</p>
                    <p className="text-xs text-gray-500">
                      {promo.discount_type === "percent" 
                        ? `${promo.discount_value}% скидка`
                        : `${promo.discount_value} ₸ скидка`
                      } • Использовано: {promo.current_uses}/{promo.max_uses}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deletePromocode(promo.id)}
                    className="text-gray-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <button
              onClick={() => openPromocodeModal()}
              className="w-full mt-4 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2"
              data-testid="add-promocode-btn"
            >
              <Plus className="w-4 h-4" />
              Добавить промокод
            </button>
          </div>
        </main>

        <Dialog open={promocodeModalOpen} onOpenChange={setPromocodeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать промокод</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Код промокода</Label>
                <Input
                  value={promocodeForm.code}
                  onChange={(e) => setPromocodeForm(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Например: HONEY20 или СКИДКА"
                  data-testid="promocode-code-input"
                />
              </div>
              <div>
                <Label>Тип скидки</Label>
                <Select
                  value={promocodeForm.discount_type}
                  onValueChange={(value) => setPromocodeForm(prev => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Проценты (%)</SelectItem>
                    <SelectItem value="fixed">Фиксированная сумма (₸)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {promocodeForm.discount_type === "percent" ? "Процент скидки" : "Сумма скидки (₸)"}
                </Label>
                <Input
                  type="number"
                  value={promocodeForm.discount_value}
                  onChange={(e) => setPromocodeForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                  placeholder={promocodeForm.discount_type === "percent" ? "10" : "500"}
                  data-testid="promocode-value-input"
                />
              </div>
              <div>
                <Label>Максимальное количество использований</Label>
                <Input
                  type="number"
                  value={promocodeForm.max_uses}
                  onChange={(e) => setPromocodeForm(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  data-testid="promocode-uses-input"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setPromocodeModalOpen(false)}>Отмена</Button>
                <Button onClick={savePromocode} className="bg-primary hover:bg-primary/90" data-testid="save-promocode-btn">
                  Создать
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
};

export default AdminPage;
