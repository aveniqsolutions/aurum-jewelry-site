from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from bson import ObjectId
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ PYDANTIC MODELS ============

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    category: str  # rings, bracelets, necklaces, luxury_sets
    material: str
    image_url: str
    stock: int = 10
    is_featured: bool = False
    is_bestseller: bool = False

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    material: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

class CartResponse(BaseModel):
    id: str
    items: List[dict]
    total: float

class OrderCreate(BaseModel):
    items: List[dict]
    total: float
    customer_email: str
    customer_name: str
    shipping_address: str

class OrderResponse(BaseModel):
    id: str
    items: List[dict]
    total: float
    status: str
    customer_email: str
    customer_name: str
    shipping_address: str
    created_at: str

class NewsletterSubscribe(BaseModel):
    email: str

class CheckoutRequest(BaseModel):
    items: List[dict]
    origin_url: str

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response):
    email = request.email.lower().strip()
    user = await db.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "id": user_id,
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

# ============ PRODUCTS ENDPOINTS ============

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None, bestseller: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["is_featured"] = featured
    if bestseller is not None:
        query["is_bestseller"] = bestseller
    
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product_dict = product.model_dump()
    product_dict["id"] = str(uuid.uuid4())
    product_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_dict)
    return product_dict

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductUpdate, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ============ INVENTORY ENDPOINTS ============

@api_router.get("/inventory")
async def get_inventory(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    products = await db.products.find({}, {"_id": 0, "id": 1, "name": 1, "category": 1, "stock": 1, "price": 1}).to_list(100)
    low_stock = [p for p in products if p.get("stock", 0) < 5]
    
    return {
        "products": products,
        "low_stock_count": len(low_stock),
        "low_stock_products": low_stock
    }

@api_router.put("/inventory/{product_id}")
async def update_inventory(product_id: str, stock: int, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.update_one({"id": product_id}, {"$set": {"stock": stock}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Stock updated"}

# ============ ORDERS ENDPOINTS ============

@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# ============ ANALYTICS ENDPOINTS ============

@api_router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Total revenue from completed orders
    orders = await db.orders.find({"status": {"$in": ["confirmed", "processing", "shipped", "delivered"]}}, {"_id": 0}).to_list(1000)
    total_revenue = sum(order.get("total", 0) for order in orders)
    
    # Order counts by status
    all_orders = await db.orders.find({}, {"_id": 0, "status": 1, "total": 1, "created_at": 1}).to_list(1000)
    status_counts = {}
    for order in all_orders:
        status = order.get("status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Revenue by day (last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    recent_orders = [o for o in orders if o.get("created_at", "") >= thirty_days_ago]
    revenue_by_day = {}
    for order in recent_orders:
        day = order.get("created_at", "")[:10]
        revenue_by_day[day] = revenue_by_day.get(day, 0) + order.get("total", 0)
    
    # Top products by order count
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id", "")
            product_sales[pid] = product_sales.get(pid, 0) + item.get("quantity", 1)
    
    top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    top_product_details = []
    for pid, count in top_products:
        product = await db.products.find_one({"id": pid}, {"_id": 0, "name": 1, "price": 1, "category": 1})
        if product:
            top_product_details.append({**product, "sales_count": count})
    
    # Product count
    product_count = await db.products.count_documents({})
    
    return {
        "total_revenue": total_revenue,
        "total_orders": len(all_orders),
        "order_status_counts": status_counts,
        "revenue_by_day": [{"date": k, "revenue": v} for k, v in sorted(revenue_by_day.items())],
        "top_products": top_product_details,
        "product_count": product_count,
        "recent_orders_count": len(recent_orders)
    }

# ============ CART ENDPOINTS ============

@api_router.post("/cart")
async def add_to_cart(item: CartItem, request: Request):
    session_id = request.cookies.get("cart_session") or str(uuid.uuid4())
    
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        cart = {"session_id": session_id, "items": [], "created_at": datetime.now(timezone.utc).isoformat()}
        await db.carts.insert_one(cart)
    
    # Check if product exists
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Update or add item
    items = cart.get("items", [])
    found = False
    for i, cart_item in enumerate(items):
        if cart_item.get("product_id") == item.product_id:
            items[i]["quantity"] += item.quantity
            found = True
            break
    
    if not found:
        items.append({"product_id": item.product_id, "quantity": item.quantity, "name": product["name"], "price": product["price"], "image_url": product["image_url"]})
    
    await db.carts.update_one({"session_id": session_id}, {"$set": {"items": items}})
    
    total = sum(i["price"] * i["quantity"] for i in items)
    return {"session_id": session_id, "items": items, "total": total}

@api_router.get("/cart")
async def get_cart(request: Request):
    session_id = request.cookies.get("cart_session")
    if not session_id:
        return {"items": [], "total": 0}
    
    cart = await db.carts.find_one({"session_id": session_id}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    items = cart.get("items", [])
    total = sum(i["price"] * i["quantity"] for i in items)
    return {"session_id": session_id, "items": items, "total": total}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    session_id = request.cookies.get("cart_session")
    if not session_id:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = [i for i in cart.get("items", []) if i.get("product_id") != product_id]
    await db.carts.update_one({"session_id": session_id}, {"$set": {"items": items}})
    
    total = sum(i["price"] * i["quantity"] for i in items)
    return {"items": items, "total": total}

@api_router.put("/cart/{product_id}")
async def update_cart_quantity(product_id: str, quantity: int, request: Request):
    session_id = request.cookies.get("cart_session")
    if not session_id:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart = await db.carts.find_one({"session_id": session_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    for i, item in enumerate(items):
        if item.get("product_id") == product_id:
            if quantity <= 0:
                items.pop(i)
            else:
                items[i]["quantity"] = quantity
            break
    
    await db.carts.update_one({"session_id": session_id}, {"$set": {"items": items}})
    total = sum(i["price"] * i["quantity"] for i in items)
    return {"items": items, "total": total}

# ============ WISHLIST ENDPOINTS ============

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, request: Request):
    session_id = request.cookies.get("wishlist_session") or str(uuid.uuid4())
    
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wishlist = await db.wishlists.find_one({"session_id": session_id})
    if not wishlist:
        wishlist = {"session_id": session_id, "items": []}
        await db.wishlists.insert_one(wishlist)
    
    items = wishlist.get("items", [])
    if product_id not in items:
        items.append(product_id)
        await db.wishlists.update_one({"session_id": session_id}, {"$set": {"items": items}})
    
    return {"session_id": session_id, "items": items}

@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    session_id = request.cookies.get("wishlist_session")
    if not session_id:
        return {"items": []}
    
    wishlist = await db.wishlists.find_one({"session_id": session_id}, {"_id": 0})
    if not wishlist:
        return {"items": []}
    
    return {"items": wishlist.get("items", [])}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, request: Request):
    session_id = request.cookies.get("wishlist_session")
    if not session_id:
        return {"items": []}
    
    wishlist = await db.wishlists.find_one({"session_id": session_id})
    if not wishlist:
        return {"items": []}
    
    items = [i for i in wishlist.get("items", []) if i != product_id]
    await db.wishlists.update_one({"session_id": session_id}, {"$set": {"items": items}})
    return {"items": items}

# ============ NEWSLETTER ENDPOINTS ============

@api_router.post("/newsletter")
async def subscribe_newsletter(data: NewsletterSubscribe):
    email = data.email.lower().strip()
    
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        return {"message": "Already subscribed"}
    
    await db.newsletter.insert_one({
        "email": email,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Subscribed successfully"}

# ============ STRIPE CHECKOUT ENDPOINTS ============

@api_router.post("/checkout")
async def create_checkout(data: CheckoutRequest, request: Request):
    if not data.items or len(data.items) == 0:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total from backend products (security)
    total = 0.0
    validated_items = []
    for item in data.items:
        product = await db.products.find_one({"id": item.get("product_id")}, {"_id": 0})
        if product:
            quantity = item.get("quantity", 1)
            total += product["price"] * quantity
            validated_items.append({
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": quantity
            })
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid cart")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = data.origin_url.rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    session_id_param = "{CHECKOUT_SESSION_ID}"
    success_url = f"{host_url}?success=true&session_id={session_id_param}"
    cancel_url = f"{host_url}?cancelled=true"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"items": str(validated_items)}
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "amount": total,
        "currency": "usd",
        "items": validated_items,
        "status": "pending",
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        if transaction and transaction.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"status": "complete", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Create order from transaction
            order = {
                "id": str(uuid.uuid4()),
                "items": transaction.get("items", []),
                "total": transaction.get("amount", 0),
                "status": "confirmed",
                "customer_email": status.metadata.get("email", ""),
                "customer_name": status.metadata.get("name", ""),
                "shipping_address": "",
                "payment_session_id": session_id,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.orders.insert_one(order)
            
            # Update inventory
            for item in transaction.get("items", []):
                await db.products.update_one(
                    {"id": item.get("product_id")},
                    {"$inc": {"stock": -item.get("quantity", 1)}}
                )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"status": "complete", "payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        return {"status": "error"}

# ============ ROOT ENDPOINT ============

@api_router.get("/")
async def root():
    return {"message": "Aurum API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Seed admin and sample products on startup
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("id", unique=True)
    await db.orders.create_index("id", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@aurum.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "AurumAdmin123!")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")
    
    # Seed sample products if none exist
    product_count = await db.products.count_documents({})
    if product_count == 0:
        sample_products = [
            # Rings
            {"id": str(uuid.uuid4()), "name": "Lumière Diamond Ring", "description": "Exquisite pure silver ring with 18K gold plating, adorned with ethically sourced diamonds.", "price": 1250.00, "category": "rings", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1598560917807-1bae44bd2be8", "stock": 15, "is_featured": True, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Éternel Band", "description": "Timeless elegance in pure silver with lustrous 18K gold plating. Perfect for any occasion.", "price": 890.00, "category": "rings", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.pexels.com/photos/5737277/pexels-photo-5737277.jpeg", "stock": 20, "is_featured": False, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Solstice Signet", "description": "Bold statement piece crafted from pure silver with luxurious 18K gold overlay.", "price": 750.00, "category": "rings", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1622398925373-3f91b1e275f5", "stock": 12, "is_featured": True, "is_bestseller": False, "created_at": datetime.now(timezone.utc).isoformat()},
            # Bracelets
            {"id": str(uuid.uuid4()), "name": "Cascade Bracelet", "description": "Flowing links of pure silver kissed with 18K gold. Handcrafted by Italian artisans.", "price": 1100.00, "category": "bracelets", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1767249622437-dd837fc5ff3b", "stock": 10, "is_featured": True, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Whisper Cuff", "description": "Delicate cuff bracelet in pure silver with warm 18K gold accents.", "price": 680.00, "category": "bracelets", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1761420570875-b8ca70228e64", "stock": 18, "is_featured": False, "is_bestseller": False, "created_at": datetime.now(timezone.utc).isoformat()},
            # Necklaces
            {"id": str(uuid.uuid4()), "name": "Aurelia Pendant", "description": "Signature pendant in pure silver with 18K gold plating. A piece that tells your story.", "price": 620.00, "category": "necklaces", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.pexels.com/photos/26570970/pexels-photo-26570970.jpeg", "stock": 25, "is_featured": True, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Layered Gold Chain", "description": "Three-tier layered necklace in pure silver with radiant 18K gold finish.", "price": 890.00, "category": "necklaces", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.pexels.com/photos/9489731/pexels-photo-9489731.jpeg", "stock": 14, "is_featured": False, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Classic Ball Studs", "description": "Minimalist elegance meets luxury in these pure silver studs with 18K gold plating.", "price": 450.00, "category": "necklaces", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1773929345739-94db8a4ccd0c", "stock": 30, "is_featured": False, "is_bestseller": False, "created_at": datetime.now(timezone.utc).isoformat()},
            # Luxury Sets
            {"id": str(uuid.uuid4()), "name": "The Empress Collection", "description": "Complete luxury set featuring matching ring, bracelet, and necklace in pure silver with 18K gold.", "price": 2850.00, "category": "luxury_sets", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1608112169461-48616144c894", "stock": 5, "is_featured": True, "is_bestseller": True, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "name": "Bridal Elegance Set", "description": "Timeless bridal collection with tiara, necklace, and earrings in pure silver with 18K gold overlay.", "price": 3500.00, "category": "luxury_sets", "material": "Pure Silver with 18K Gold Plating", "image_url": "https://images.unsplash.com/photo-1771695828792-112e299755bc", "stock": 3, "is_featured": True, "is_bestseller": False, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        
        await db.products.insert_many(sample_products)
        logger.info(f"Seeded {len(sample_products)} sample products")
    
    # Write test credentials
    memory_dir = Path("/app/memory")
    memory_dir.mkdir(exist_ok=True)
    credentials_file = memory_dir / "test_credentials.md"
    credentials_file.write_text(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
""")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
