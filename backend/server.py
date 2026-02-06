from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBasic()

ADMIN_USERNAME = "armanuha"
ADMIN_PASSWORD = "secretboost1"

# Models
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

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    image: Optional[str] = None
    base_price: Optional[float] = None
    weight_prices: Optional[List[WeightPrice]] = None

class Product(ProductBase):
    id: str
    created_at: str

class CategoryBase(BaseModel):
    name: str
    slug: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str

class AdminLogin(BaseModel):
    username: str
    password: str

# Promocode models
class PromocodeBase(BaseModel):
    code: str
    discount_type: str  # "percent" or "fixed"
    discount_value: float
    max_uses: int
    current_uses: int = 0
    is_active: bool = True

class PromocodeCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    max_uses: int

class Promocode(PromocodeBase):
    id: str

# Order models
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

class Order(BaseModel):
    id: str
    customer_name: str
    customer_phone: str
    items: List[OrderItem]
    subtotal: float
    discount: float
    total: float
    promocode: Optional[str]
    created_at: str

# About Us model
class AboutUsUpdate(BaseModel):
    title: str
    description: str
    features: List[str]

class AboutUs(BaseModel):
    id: str
    title: str
    description: str
    features: List[str]

# Helper functions
def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    return credentials.username

# Routes
@api_router.get("/")
async def root():
    return {"message": "Ferma Medovik API"}

@api_router.post("/admin/login")
async def admin_login(data: AdminLogin):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Logged in"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# Categories
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, admin: str = Depends(verify_admin)):
    cat_dict = category.model_dump()
    cat_dict["id"] = str(uuid.uuid4())
    await db.categories.insert_one(cat_dict)
    return Category(**cat_dict)

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate, admin: str = Depends(verify_admin)):
    result = await db.categories.update_one(
        {"id": category_id},
        {"$set": category.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return Category(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, admin: str = Depends(verify_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}

# Promocodes
@api_router.get("/promocodes", response_model=List[Promocode])
async def get_promocodes(admin: str = Depends(verify_admin)):
    promocodes = await db.promocodes.find({}, {"_id": 0}).to_list(100)
    return [Promocode(**p) for p in promocodes]

@api_router.post("/promocodes", response_model=Promocode)
async def create_promocode(promo: PromocodeCreate, admin: str = Depends(verify_admin)):
    promo_dict = promo.model_dump()
    promo_dict["id"] = str(uuid.uuid4())
    promo_dict["current_uses"] = 0
    promo_dict["is_active"] = True
    await db.promocodes.insert_one(promo_dict)
    return Promocode(**promo_dict)

@api_router.delete("/promocodes/{promo_id}")
async def delete_promocode(promo_id: str, admin: str = Depends(verify_admin)):
    result = await db.promocodes.delete_one({"id": promo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promocode not found")
    return {"success": True}

@api_router.post("/promocodes/validate")
async def validate_promocode(data: dict):
    code = data.get("code", "").strip().upper()
    subtotal = data.get("subtotal", 0)
    
    promo = await db.promocodes.find_one({"code": code.upper()}, {"_id": 0})
    if not promo:
        # Try lowercase
        promo = await db.promocodes.find_one({"code": code.lower()}, {"_id": 0})
    if not promo:
        # Try original case
        promo = await db.promocodes.find_one({"code": data.get("code", "").strip()}, {"_id": 0})
    
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не найден")
    
    if not promo.get("is_active", True):
        raise HTTPException(status_code=400, detail="Промокод неактивен")
    
    if promo.get("current_uses", 0) >= promo.get("max_uses", 0):
        raise HTTPException(status_code=400, detail="Промокод исчерпан")
    
    discount = 0
    if promo["discount_type"] == "percent":
        discount = subtotal * promo["discount_value"] / 100
    else:
        discount = min(promo["discount_value"], subtotal)
    
    return {
        "valid": True,
        "code": promo["code"],
        "discount_type": promo["discount_type"],
        "discount_value": promo["discount_value"],
        "discount": round(discount, 2)
    }

# Orders
@api_router.get("/orders", response_model=List[Order])
async def get_orders(admin: str = Depends(verify_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Order(**o) for o in orders]

@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_dict = order.model_dump()
    order_dict["id"] = str(uuid.uuid4())
    order_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update promocode usage if used
    if order.promocode:
        await db.promocodes.update_one(
            {"code": order.promocode},
            {"$inc": {"current_uses": 1}}
        )
    
    await db.orders.insert_one(order_dict)
    return Order(**order_dict)

# About Us
@api_router.get("/about")
async def get_about():
    about = await db.about.find_one({"id": "about-us"}, {"_id": 0})
    if not about:
        # Default content
        default_about = {
            "id": "about-us",
            "title": "О нас",
            "description": "Ферма Медовик — это семейная пасека, расположенная в экологически чистом районе. Мы занимаемся пчеловодством более 15 лет и гордимся качеством нашей продукции. Каждый наш продукт — это результат любви к природе и заботы о здоровье наших покупателей.",
            "features": [
                "100% натуральная продукция",
                "Экологически чистый район",
                "Более 15 лет опыта",
                "Доставка по всему Казахстану"
            ]
        }
        await db.about.insert_one(default_about)
        return default_about
    return about

@api_router.put("/about")
async def update_about(data: AboutUsUpdate, admin: str = Depends(verify_admin)):
    update_data = data.model_dump()
    update_data["id"] = "about-us"
    await db.about.update_one(
        {"id": "about-us"},
        {"$set": update_data},
        upsert=True
    )
    return {"success": True, "message": "About Us updated"}

# Products
@api_router.get("/products", response_model=List[Product])
async def get_products(category_id: Optional[str] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, admin: str = Depends(verify_admin)):
    prod_dict = product.model_dump()
    prod_dict["id"] = str(uuid.uuid4())
    prod_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    weight_prices = prod_dict.get("weight_prices", [])
    prod_dict["weight_prices"] = [wp if isinstance(wp, dict) else wp.model_dump() for wp in weight_prices]
    await db.products.insert_one(prod_dict)
    return Product(**prod_dict)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductUpdate, admin: str = Depends(verify_admin)):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if "weight_prices" in update_data:
        update_data["weight_prices"] = [wp if isinstance(wp, dict) else wp.model_dump() for wp in update_data["weight_prices"]]
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: str = Depends(verify_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True}

# Seed data
@api_router.post("/seed")
async def seed_data():
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Data already seeded"}
    
    categories = [
        {"id": "cat-honey", "name": "Мёд", "slug": "honey"},
        {"id": "cat-bee", "name": "Пчелопродукты", "slug": "bee-products"},
        {"id": "cat-tincture", "name": "Настойки", "slug": "tinctures"},
        {"id": "cat-cream", "name": "Крема", "slug": "creams"},
        {"id": "cat-candle", "name": "Свечи", "slug": "candles"},
        {"id": "cat-accessory", "name": "Аксессуары", "slug": "accessories"},
    ]
    await db.categories.insert_many(categories)
    
    honey_weights = [
        {"weight": "250гр", "price": 1201},
        {"weight": "340гр", "price": 1500},
        {"weight": "550гр", "price": 2200},
        {"weight": "750гр", "price": 2800},
        {"weight": "1кг", "price": 3500},
        {"weight": "1.5кг", "price": 5000},
    ]
    
    products = [
        # Мёд
        {"id": str(uuid.uuid4()), "name": "Мёд Разнотравье", "description": "Наш мёд \"Разнотравье\" собран в экологически чистых районах с десятков видов луговых цветов. Он обладает неповторимым многогранным ароматом и мягким, обволакивающим вкусом. Этот сорт считается универсальным помощником для укрепления иммунитета и общего тонуса организма.", "category_id": "cat-honey", "image": "https://images.unsplash.com/photo-1761416351532-ede97c29fab8?w=800", "base_price": 1201, "weight_prices": honey_weights, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Мёд Подсолнух", "description": "Мёд из подсолнечника - один из самых популярных сортов. Отличается ярко-жёлтым цветом и приятным ароматом. Быстро кристаллизуется, образуя мелкозернистую структуру.", "category_id": "cat-honey", "image": "https://images.pexels.com/photos/7990484/pexels-photo-7990484.jpeg?w=800", "base_price": 1200, "weight_prices": honey_weights, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Мёд Царский Бархат", "description": "Элитный сорт мёда с нежнейшей кремовой текстурой. Обладает изысканным вкусом с легкими нотками ванили и карамели.", "category_id": "cat-honey", "image": "https://images.unsplash.com/photo-1722718465036-64e3eacef09b?w=800", "base_price": 1800, "weight_prices": honey_weights, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Мёд Цветочный", "description": "Классический цветочный мёд, собранный с разнообразных медоносов. Обладает гармоничным вкусом и богатым ароматом летних цветов.", "category_id": "cat-honey", "image": "https://images.pexels.com/photos/8500508/pexels-photo-8500508.jpeg?w=800", "base_price": 1200, "weight_prices": honey_weights, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Мёд Гречишный", "description": "Тёмный мёд с насыщенным вкусом и характерным терпким послевкусием. Богат железом и антиоксидантами.", "category_id": "cat-honey", "image": "https://images.unsplash.com/photo-1759442727303-4c08421317d6?w=800", "base_price": 1200, "weight_prices": honey_weights, "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Пчелопродукты
        {"id": str(uuid.uuid4()), "name": "Пыльца цветочная", "description": "Натуральная цветочная пыльца - кладезь витаминов и микроэлементов. Укрепляет иммунитет и повышает работоспособность.", "category_id": "cat-bee", "image": "https://images.pexels.com/photos/7176847/pexels-photo-7176847.jpeg?w=800", "base_price": 1500, "weight_prices": [{"weight": "100гр", "price": 1500}, {"weight": "250гр", "price": 3000}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Перга пчелиная", "description": "\"Пчелиный хлеб\" - ферментированная пыльца с уникальным составом. Природный биостимулятор.", "category_id": "cat-bee", "image": "https://images.pexels.com/photos/971355/pexels-photo-971355.jpeg?w=800", "base_price": 2500, "weight_prices": [{"weight": "100гр", "price": 2500}, {"weight": "250гр", "price": 5500}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Прополис натуральный", "description": "Природный антибиотик с мощными антисептическими свойствами. Используется для укрепления иммунитета.", "category_id": "cat-bee", "image": "https://images.unsplash.com/photo-1570723968319-d8db6a35dbeb?w=800", "base_price": 1200, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Маточное молочко", "description": "Королевское желе - самый ценный продукт пчеловодства. Мощный иммуномодулятор и адаптоген.", "category_id": "cat-bee", "image": "https://images.unsplash.com/photo-1620032599268-c822dd1c3076?w=800", "base_price": 8500, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Настойки
        {"id": str(uuid.uuid4()), "name": "Настойка прополиса", "description": "Спиртовая настойка прополиса для укрепления иммунитета и профилактики простудных заболеваний.", "category_id": "cat-tincture", "image": "https://images.unsplash.com/photo-1623870605527-fe47e6b24193?w=800", "base_price": 2500, "weight_prices": [{"weight": "200мл", "price": 2500}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Настойка подмора", "description": "Настойка пчелиного подмора - традиционное средство народной медицины.", "category_id": "cat-tincture", "image": "https://images.pexels.com/photos/8450512/pexels-photo-8450512.jpeg?w=800", "base_price": 2800, "weight_prices": [{"weight": "200мл", "price": 2800}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Яблочный уксус", "description": "Натуральный яблочный уксус с мёдом. Полезен для пищеварения и обмена веществ.", "category_id": "cat-tincture", "image": "https://images.unsplash.com/photo-1564473530128-2a52ee4d6ea8?w=800", "base_price": 1800, "weight_prices": [{"weight": "200мл", "price": 1800}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Настойка 3 в 1", "description": "Комплексная настойка на основе прополиса, подмора и восковой моли.", "category_id": "cat-tincture", "image": "https://images.pexels.com/photos/12895079/pexels-photo-12895079.jpeg?w=800", "base_price": 4500, "weight_prices": [{"weight": "200мл", "price": 4500}], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Огнёвка", "description": "Настойка восковой моли - уникальный продукт для поддержки дыхательной системы.", "category_id": "cat-tincture", "image": "https://images.unsplash.com/photo-1687472238829-59855ebda1f8?w=800", "base_price": 3500, "weight_prices": [{"weight": "200мл", "price": 3500}], "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Крема
        {"id": str(uuid.uuid4()), "name": "Нежные пяточки", "description": "Крем для ног на основе пчелиного воска. Смягчает и увлажняет кожу стоп.", "category_id": "cat-cream", "image": "https://images.unsplash.com/photo-1763503836825-97f5450d155a?w=800", "base_price": 2200, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Чудомазь", "description": "Универсальная мазь с прополисом для заживления и ухода за кожей.", "category_id": "cat-cream", "image": "https://images.pexels.com/photos/6645252/pexels-photo-6645252.jpeg?w=800", "base_price": 3500, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Прополисная мазь", "description": "Лечебная мазь на основе прополиса с антисептическим действием.", "category_id": "cat-cream", "image": "https://images.pexels.com/photos/6815653/pexels-photo-6815653.jpeg?w=800", "base_price": 2800, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Свечи
        {"id": str(uuid.uuid4()), "name": "Свечи восковые", "description": "Натуральные свечи из пчелиного воска. Горят ровно и долго, очищают воздух.", "category_id": "cat-candle", "image": "https://images.unsplash.com/photo-1575833949203-ade5a03eb82c?w=800", "base_price": 1500, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Свечи ароматические", "description": "Восковые свечи с добавлением натуральных эфирных масел.", "category_id": "cat-candle", "image": "https://images.pexels.com/photos/18921271/pexels-photo-18921271.jpeg?w=800", "base_price": 2000, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        
        # Аксессуары
        {"id": str(uuid.uuid4()), "name": "Деревянная ложка для мёда", "description": "Традиционная деревянная ложка для мёда ручной работы.", "category_id": "cat-accessory", "image": "https://images.unsplash.com/photo-1762926627703-63d2dc088d04?w=800", "base_price": 500, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Подарочный набор", "description": "Красивая подарочная упаковка для мёда и пчелопродуктов.", "category_id": "cat-accessory", "image": "https://images.unsplash.com/photo-1722718465036-64e3eacef09b?w=800", "base_price": 1000, "weight_prices": [], "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.products.insert_many(products)
    return {"message": "Data seeded successfully", "categories": len(categories), "products": len(products)}

# Fix duplicate categories
@api_router.post("/fix-categories")
async def fix_categories():
    # Delete all categories
    await db.categories.delete_many({})
    
    # Insert unique categories
    categories = [
        {"id": "cat-honey", "name": "Мёд", "slug": "honey"},
        {"id": "cat-bee", "name": "Пчелопродукты", "slug": "bee-products"},
        {"id": "cat-tincture", "name": "Настойки", "slug": "tinctures"},
        {"id": "cat-cream", "name": "Крема", "slug": "creams"},
        {"id": "cat-candle", "name": "Свечи", "slug": "candles"},
        {"id": "cat-accessory", "name": "Аксессуары", "slug": "accessories"},
    ]
    await db.categories.insert_many(categories)
    
    return {"message": "Categories fixed", "count": len(categories)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
