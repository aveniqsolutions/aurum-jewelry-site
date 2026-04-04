import requests
import sys
import json
from datetime import datetime

class AurumAPITester:
    def __init__(self, base_url="https://jewelry-showcase-65.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.admin_email = "admin@aurum.com"
        self.admin_password = "AurumAdmin123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth if required
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) <= 5:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            return success, response.json() if response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "api/", 200)

    def test_admin_login(self):
        """Test admin login and get token"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success and 'id' in response:
            # Store cookies for session-based auth
            print(f"   Admin logged in: {response.get('email')} (Role: {response.get('role')})")
            return True
        return False

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test("Get All Products", "GET", "api/products", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            return len(response) > 0
        return False

    def test_get_bestseller_products(self):
        """Test getting bestseller products"""
        success, response = self.run_test("Get Bestseller Products", "GET", "api/products?bestseller=true", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} bestseller products")
            return True
        return False

    def test_get_featured_products(self):
        """Test getting featured products"""
        success, response = self.run_test("Get Featured Products", "GET", "api/products?featured=true", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} featured products")
            return True
        return False

    def test_get_products_by_category(self):
        """Test getting products by category"""
        categories = ['rings', 'bracelets', 'necklaces', 'luxury_sets']
        for category in categories:
            success, response = self.run_test(f"Get {category.title()} Products", "GET", f"api/products?category={category}", 200)
            if success and isinstance(response, list):
                print(f"   Found {len(response)} {category} products")

    def test_create_product(self):
        """Test creating a new product (admin only)"""
        test_product = {
            "name": "Test Ring",
            "description": "A test ring for API testing",
            "price": 299.99,
            "category": "rings",
            "material": "Pure Silver with 18K Gold Plating",
            "image_url": "https://images.unsplash.com/photo-1598560917807-1bae44bd2be8",
            "stock": 5,
            "is_featured": False,
            "is_bestseller": False
        }
        success, response = self.run_test(
            "Create Product",
            "POST",
            "api/products",
            200,
            data=test_product,
            auth_required=True
        )
        if success and 'id' in response:
            self.test_product_id = response['id']
            print(f"   Created product with ID: {self.test_product_id}")
            return True
        return False

    def test_get_single_product(self):
        """Test getting a single product by ID"""
        if hasattr(self, 'test_product_id'):
            success, response = self.run_test(
                "Get Single Product",
                "GET",
                f"api/products/{self.test_product_id}",
                200
            )
            return success and 'id' in response
        return False

    def test_update_product(self):
        """Test updating a product (admin only)"""
        if hasattr(self, 'test_product_id'):
            update_data = {
                "name": "Updated Test Ring",
                "price": 349.99,
                "is_featured": True
            }
            success, response = self.run_test(
                "Update Product",
                "PUT",
                f"api/products/{self.test_product_id}",
                200,
                data=update_data,
                auth_required=True
            )
            return success and response.get('name') == 'Updated Test Ring'
        return False

    def test_cart_operations(self):
        """Test cart operations"""
        if hasattr(self, 'test_product_id'):
            # Add to cart
            cart_item = {"product_id": self.test_product_id, "quantity": 2}
            success, response = self.run_test(
                "Add to Cart",
                "POST",
                "api/cart",
                200,
                data=cart_item
            )
            if success and 'items' in response:
                print(f"   Cart total: ${response.get('total', 0)}")
                
                # Get cart
                success, response = self.run_test("Get Cart", "GET", "api/cart", 200)
                if success and 'items' in response:
                    print(f"   Cart has {len(response['items'])} items")
                    
                    # Update cart quantity
                    success, response = self.run_test(
                        "Update Cart Quantity",
                        "PUT",
                        f"api/cart/{self.test_product_id}?quantity=3",
                        200
                    )
                    
                    # Remove from cart
                    success, response = self.run_test(
                        "Remove from Cart",
                        "DELETE",
                        f"api/cart/{self.test_product_id}",
                        200
                    )
                    return success
        return False

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        if hasattr(self, 'test_product_id'):
            # Add to wishlist
            success, response = self.run_test(
                "Add to Wishlist",
                "POST",
                f"api/wishlist/{self.test_product_id}",
                200
            )
            if success:
                # Get wishlist
                success, response = self.run_test("Get Wishlist", "GET", "api/wishlist", 200)
                if success and 'items' in response:
                    print(f"   Wishlist has {len(response['items'])} items")
                    
                    # Remove from wishlist
                    success, response = self.run_test(
                        "Remove from Wishlist",
                        "DELETE",
                        f"api/wishlist/{self.test_product_id}",
                        200
                    )
                    return success
        return False

    def test_newsletter_subscription(self):
        """Test newsletter subscription"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "Newsletter Subscription",
            "POST",
            "api/newsletter",
            200,
            data={"email": test_email}
        )
        return success and response.get('message') == 'Subscribed successfully'

    def test_admin_endpoints(self):
        """Test admin-only endpoints"""
        # Get orders
        success, response = self.run_test("Get Orders", "GET", "api/orders", 200, auth_required=True)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} orders")
        
        # Get inventory
        success, response = self.run_test("Get Inventory", "GET", "api/inventory", 200, auth_required=True)
        if success and 'products' in response:
            print(f"   Inventory has {len(response['products'])} products")
            print(f"   Low stock count: {response.get('low_stock_count', 0)}")
        
        # Get analytics
        success, response = self.run_test("Get Analytics", "GET", "api/analytics", 200, auth_required=True)
        if success:
            print(f"   Total revenue: ${response.get('total_revenue', 0)}")
            print(f"   Total orders: {response.get('total_orders', 0)}")
            print(f"   Product count: {response.get('product_count', 0)}")
        
        return success

    def test_checkout_creation(self):
        """Test checkout session creation"""
        if hasattr(self, 'test_product_id'):
            checkout_data = {
                "items": [{"product_id": self.test_product_id, "quantity": 1}],
                "origin_url": "https://jewelry-showcase-65.preview.emergentagent.com"
            }
            success, response = self.run_test(
                "Create Checkout Session",
                "POST",
                "api/checkout",
                200,
                data=checkout_data
            )
            if success and 'url' in response:
                print(f"   Checkout URL created: {response['url'][:50]}...")
                return True
        return False

    def cleanup_test_product(self):
        """Clean up test product"""
        if hasattr(self, 'test_product_id'):
            success, response = self.run_test(
                "Delete Test Product",
                "DELETE",
                f"api/products/{self.test_product_id}",
                200,
                auth_required=True
            )
            return success
        return True

def main():
    print("🧪 Starting Aurum API Testing...")
    print("=" * 50)
    
    tester = AurumAPITester()
    
    # Test sequence
    tests = [
        ("API Root", tester.test_root_endpoint),
        ("Admin Login", tester.test_admin_login),
        ("Get Products", tester.test_get_products),
        ("Get Bestsellers", tester.test_get_bestseller_products),
        ("Get Featured", tester.test_get_featured_products),
        ("Get by Category", tester.test_get_products_by_category),
        ("Create Product", tester.test_create_product),
        ("Get Single Product", tester.test_get_single_product),
        ("Update Product", tester.test_update_product),
        ("Cart Operations", tester.test_cart_operations),
        ("Wishlist Operations", tester.test_wishlist_operations),
        ("Newsletter", tester.test_newsletter_subscription),
        ("Admin Endpoints", tester.test_admin_endpoints),
        ("Checkout Creation", tester.test_checkout_creation),
        ("Cleanup", tester.cleanup_test_product),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if not result:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())