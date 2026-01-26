"""
Ферма Медовик - Backend для MariaDB/MySQL
Версия для Shared Hosting
"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import secrets
import uuid
from datetime import datetime
import os
import pymysql
from contextlib import contextmanager

# ============================================
# КОНФИГУРАЦИЯ - ИЗМЕНИТЕ ПОД СВОЙ ХОСТИНГ
# ============================================
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'your_db_user'),
    'password': os.environ.get('DB_PASSWORD', 'your_db_password'),
    'database': os.environ.get('DB_NAME', 'fermamedovik'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

ADMIN_USERNAME = "armanuha"
ADMIN_PASSWORD = "secretboost1"

# ============================================
# ИНИЦИАЛИЗАЦИЯ
# ============================================
app = FastAPI(title="Ферма Медовик API")
api_router = APIRouter(prefix="/api")
security = HTTPBasic()

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Замените на ваш домен: ["https://fermamedovik.kz"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ПОДКЛЮЧЕНИЕ К БД
# ============================================
@contextmanager
def get_db():
    connection = pymysql.connect(**DB_CONFIG)
    try:
        yield connection
    finally:
        connection.close()

def init_database():
    """Создание таблиц при первом запуске"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Таблица категорий
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Таблица товаров
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                category_id VARCHAR(36),
                image TEXT,
                base_price DECIMAL(10,2) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Таблица граммовок
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS weight_prices (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                weight VARCHAR(50) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                sort_order INT DEFAULT 0,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Таблица промокодов
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS promocodes (
                id VARCHAR(36) PRIMARY KEY,
                code VARCHAR(100) NOT NULL UNIQUE,
                discount_type ENUM('percent', 'fixed') NOT NULL,
                discount_value DECIMAL(10,2) NOT NULL,
                max_uses INT NOT NULL,
                current_uses INT DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Таблица заказов
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(36) PRIMARY KEY,
                customer_name VARCHAR(255) NOT NULL,
                customer_phone VARCHAR(50) NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                discount DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                promocode VARCHAR(100),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Таблица позиций заказа
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                weight VARCHAR(50),
                price DECIMAL(10,2) NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        conn.commit()
        print("✅ База данных инициализирована")

# ============================================
# МОДЕЛИ PYDANTIC
# ============================================
class WeightPrice(BaseModel):
    weight: str
    price: float

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = ""
    category_id: str
    image: str = ""
    base_price: float
    weight_prices: List[WeightPrice] = []

class Product(ProductBase):
    id: str
    created_at: Optional[str] = None

class CategoryBase(BaseModel):
    name: str
    slug: str

class Category(CategoryBase):
    id: str

class PromocodeCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    max_uses: int

class Promocode(PromocodeCreate):
    id: str
    current_uses: int = 0
    is_active: bool = True

class OrderItem(BaseModel):
    name: str
    weight: Optional[str] = None
    price: float
    quantity: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    subtotal: float
    discount: float = 0
    total: float
    promocode: Optional[str] = None

class Order(OrderCreate):
    id: str
    created_at: str

# ============================================
# АВТОРИЗАЦИЯ
# ============================================
def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    return credentials.username

# ============================================
# API ЭНДПОИНТЫ
# ============================================

@api_router.get("/")
async def root():
    return {"message": "Ферма Медовик API", "status": "working"}

@api_router.post("/admin/login")
async def admin_login(data: dict):
    if data.get("username") == ADMIN_USERNAME and data.get("password") == ADMIN_PASSWORD:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Неверные учетные данные")

# --- Категории ---
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, slug FROM categories ORDER BY name")
        return cursor.fetchall()

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryBase, admin: str = Depends(verify_admin)):
    cat_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO categories (id, name, slug) VALUES (%s, %s, %s)",
            (cat_id, category.name, category.slug)
        )
        conn.commit()
    return {"id": cat_id, **category.model_dump()}

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryBase, admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE categories SET name=%s, slug=%s WHERE id=%s",
            (category.name, category.slug, category_id)
        )
        conn.commit()
    return {"id": category_id, **category.model_dump()}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM categories WHERE id=%s", (category_id,))
        conn.commit()
    return {"success": True}

# --- Товары ---
@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        
        if category_id:
            cursor.execute(
                "SELECT * FROM products WHERE category_id=%s ORDER BY created_at DESC",
                (category_id,)
            )
        else:
            cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
        
        products = cursor.fetchall()
        
        # Получаем граммовки для каждого товара
        for product in products:
            cursor.execute(
                "SELECT weight, price FROM weight_prices WHERE product_id=%s ORDER BY sort_order",
                (product['id'],)
            )
            product['weight_prices'] = cursor.fetchall()
            if product['created_at']:
                product['created_at'] = product['created_at'].isoformat()
        
        return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM products WHERE id=%s", (product_id,))
        product = cursor.fetchone()
        
        if not product:
            raise HTTPException(status_code=404, detail="Товар не найден")
        
        cursor.execute(
            "SELECT weight, price FROM weight_prices WHERE product_id=%s ORDER BY sort_order",
            (product_id,)
        )
        product['weight_prices'] = cursor.fetchall()
        if product['created_at']:
            product['created_at'] = product['created_at'].isoformat()
        
        return product

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductBase, admin: str = Depends(verify_admin)):
    prod_id = str(uuid.uuid4())
    now = datetime.now()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO products (id, name, description, category_id, image, base_price, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (prod_id, product.name, product.description, product.category_id, 
             product.image, product.base_price, now)
        )
        
        # Добавляем граммовки
        for i, wp in enumerate(product.weight_prices):
            cursor.execute(
                "INSERT INTO weight_prices (product_id, weight, price, sort_order) VALUES (%s, %s, %s, %s)",
                (prod_id, wp.weight, wp.price, i)
            )
        
        conn.commit()
    
    return {"id": prod_id, "created_at": now.isoformat(), **product.model_dump()}

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductBase, admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """UPDATE products SET name=%s, description=%s, category_id=%s, image=%s, base_price=%s
               WHERE id=%s""",
            (product.name, product.description, product.category_id, 
             product.image, product.base_price, product_id)
        )
        
        # Обновляем граммовки
        cursor.execute("DELETE FROM weight_prices WHERE product_id=%s", (product_id,))
        for i, wp in enumerate(product.weight_prices):
            cursor.execute(
                "INSERT INTO weight_prices (product_id, weight, price, sort_order) VALUES (%s, %s, %s, %s)",
                (product_id, wp.weight, wp.price, i)
            )
        
        conn.commit()
    
    return {"id": product_id, **product.model_dump()}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))
        conn.commit()
    return {"success": True}

# --- Промокоды ---
@api_router.get("/promocodes", response_model=List[Promocode])
async def get_promocodes(admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM promocodes ORDER BY code")
        return cursor.fetchall()

@api_router.post("/promocodes", response_model=Promocode)
async def create_promocode(promo: PromocodeCreate, admin: str = Depends(verify_admin)):
    promo_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO promocodes (id, code, discount_type, discount_value, max_uses)
               VALUES (%s, %s, %s, %s, %s)""",
            (promo_id, promo.code, promo.discount_type, promo.discount_value, promo.max_uses)
        )
        conn.commit()
    return {"id": promo_id, "current_uses": 0, "is_active": True, **promo.model_dump()}

@api_router.delete("/promocodes/{promo_id}")
async def delete_promocode(promo_id: str, admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM promocodes WHERE id=%s", (promo_id,))
        conn.commit()
    return {"success": True}

@api_router.post("/promocodes/validate")
async def validate_promocode(data: dict):
    code = data.get("code", "").strip()
    subtotal = data.get("subtotal", 0)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM promocodes WHERE (code=%s OR code=%s OR code=%s) AND is_active=1",
            (code, code.upper(), code.lower())
        )
        promo = cursor.fetchone()
    
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    
    if promo['current_uses'] >= promo['max_uses']:
        raise HTTPException(status_code=400, detail="Промокод исчерпан")
    
    discount = 0
    if promo['discount_type'] == 'percent':
        discount = float(subtotal) * float(promo['discount_value']) / 100
    else:
        discount = min(float(promo['discount_value']), float(subtotal))
    
    return {
        "valid": True,
        "code": promo['code'],
        "discount_type": promo['discount_type'],
        "discount_value": float(promo['discount_value']),
        "discount": round(discount, 2)
    }

# --- Заказы ---
@api_router.get("/orders", response_model=List[Order])
async def get_orders(admin: str = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
        orders = cursor.fetchall()
        
        for order in orders:
            cursor.execute("SELECT * FROM order_items WHERE order_id=%s", (order['id'],))
            order['items'] = cursor.fetchall()
            if order['created_at']:
                order['created_at'] = order['created_at'].isoformat()
        
        return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_id = str(uuid.uuid4())
    now = datetime.now()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO orders (id, customer_name, customer_phone, subtotal, discount, total, promocode, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (order_id, order.customer_name, order.customer_phone, 
             order.subtotal, order.discount, order.total, order.promocode, now)
        )
        
        for item in order.items:
            cursor.execute(
                "INSERT INTO order_items (order_id, name, weight, price, quantity) VALUES (%s, %s, %s, %s, %s)",
                (order_id, item.name, item.weight, item.price, item.quantity)
            )
        
        # Увеличиваем счётчик использования промокода
        if order.promocode:
            cursor.execute(
                "UPDATE promocodes SET current_uses = current_uses + 1 WHERE code=%s",
                (order.promocode,)
            )
        
        conn.commit()
    
    return {"id": order_id, "created_at": now.isoformat(), **order.model_dump()}

# --- Seed данные ---
@api_router.post("/seed")
async def seed_data():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM categories")
        if cursor.fetchone()['count'] > 0:
            return {"message": "Данные уже загружены"}
        
        # Категории
        categories = [
            ("cat-honey", "Мёд", "honey"),
            ("cat-bee", "Пчелопродукты", "bee-products"),
            ("cat-tincture", "Настойки", "tinctures"),
            ("cat-cream", "Крема", "creams"),
            ("cat-candle", "Свечи", "candles"),
            ("cat-accessory", "Аксессуары", "accessories"),
        ]
        cursor.executemany("INSERT INTO categories (id, name, slug) VALUES (%s, %s, %s)", categories)
        
        # Товары мёда
        honey_products = [
            ("Мёд Разнотравье", "Наш мёд собран в экологически чистых районах.", "cat-honey", 1201),
            ("Мёд Подсолнух", "Мёд из подсолнечника - популярный сорт.", "cat-honey", 1200),
            ("Мёд Царский Бархат", "Элитный сорт мёда с кремовой текстурой.", "cat-honey", 1800),
            ("Мёд Цветочный", "Классический цветочный мёд.", "cat-honey", 1200),
            ("Мёд Гречишный", "Тёмный мёд с насыщенным вкусом.", "cat-honey", 1200),
        ]
        
        honey_weights = [
            ("250гр", 1201), ("340гр", 1500), ("550гр", 2200),
            ("750гр", 2800), ("1кг", 3500), ("1.5кг", 5000)
        ]
        
        for name, desc, cat, price in honey_products:
            prod_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO products (id, name, description, category_id, image, base_price) VALUES (%s, %s, %s, %s, %s, %s)",
                (prod_id, name, desc, cat, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800", price)
            )
            for i, (w, p) in enumerate(honey_weights):
                cursor.execute(
                    "INSERT INTO weight_prices (product_id, weight, price, sort_order) VALUES (%s, %s, %s, %s)",
                    (prod_id, w, p, i)
                )
        
        conn.commit()
        return {"message": "Данные загружены"}

# Подключаем роутер
app.include_router(api_router)

# Инициализация БД при старте
@app.on_event("startup")
async def startup():
    init_database()

# ============================================
# ЗАПУСК (для локального тестирования)
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
