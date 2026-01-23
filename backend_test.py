#!/usr/bin/env python3
"""
HomeDeco Backend API Testing Suite
Tests all API endpoints for the AI-powered home products e-commerce platform
"""

import requests
import json
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, List

class HomeDecoAPITester:
    def __init__(self, base_url="https://homedeco.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []
        
        # Test data storage
        self.test_order_id = None
        self.test_session_id = str(uuid.uuid4())
        
    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append(name)
            print(f"❌ {name}: {details}")
            
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text[:200]}
                
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}
    
    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n🔍 Testing Basic Endpoints...")
        
        # Root endpoint
        success, data = self.make_request('GET', '')
        self.log_test("Root API endpoint", success, 
                     "" if success else f"Failed to get root: {data}")
        
        # Health check
        success, data = self.make_request('GET', 'health')
        self.log_test("Health check endpoint", success,
                     "" if success else f"Health check failed: {data}")
    
    def test_categories_api(self):
        """Test categories API"""
        print("\n🔍 Testing Categories API...")
        
        success, data = self.make_request('GET', 'categories')
        
        if success and isinstance(data, list) and len(data) > 0:
            # Check if categories have required fields
            first_cat = data[0]
            required_fields = ['id', 'name', 'description', 'image_url', 'slug']
            has_all_fields = all(field in first_cat for field in required_fields)
            
            # Check multilingual support
            has_multilingual = isinstance(first_cat.get('name'), dict) and 'en' in first_cat['name']
            
            self.log_test("Categories API - Structure", has_all_fields and has_multilingual,
                         "" if has_all_fields and has_multilingual else "Missing required fields or multilingual support",
                         {"categories_count": len(data), "sample": first_cat})
        else:
            self.log_test("Categories API", False, f"Invalid response: {data}")
    
    def test_materials_api(self):
        """Test materials API"""
        print("\n🔍 Testing Materials API...")
        
        # Get all materials
        success, data = self.make_request('GET', 'materials')
        
        if success and isinstance(data, list) and len(data) > 0:
            first_material = data[0]
            required_fields = ['id', 'name', 'price_per_unit', 'unit', 'category']
            has_all_fields = all(field in first_material for field in required_fields)
            
            self.log_test("Materials API - All materials", has_all_fields,
                         "" if has_all_fields else f"Missing required fields: {first_material}",
                         {"materials_count": len(data)})
            
            # Test category filter
            success, filtered_data = self.make_request('GET', 'materials?category=wood')
            self.log_test("Materials API - Category filter", success,
                         "" if success else f"Category filter failed: {filtered_data}")
        else:
            self.log_test("Materials API", False, f"Invalid response: {data}")
    
    def test_shipping_options_api(self):
        """Test shipping options API"""
        print("\n🔍 Testing Shipping Options API...")
        
        success, data = self.make_request('GET', 'shipping-options')
        
        if success and isinstance(data, list) and len(data) > 0:
            first_option = data[0]
            required_fields = ['id', 'name', 'base_price', 'estimated_days']
            has_all_fields = all(field in first_option for field in required_fields)
            
            self.log_test("Shipping Options API", has_all_fields,
                         "" if has_all_fields else f"Missing required fields: {first_option}",
                         {"shipping_options_count": len(data)})
        else:
            self.log_test("Shipping Options API", False, f"Invalid response: {data}")
    
    def test_price_calculation_api(self):
        """Test price calculation API"""
        print("\n🔍 Testing Price Calculation API...")
        
        # Test price calculation with valid data
        price_request = {
            "category_id": "cabinets",
            "dimensions": {"width": 100, "height": 200, "depth": 60},
            "material_id": "mdf_white",
            "additional_options": {
                "soft_close": True,
                "led_lighting": False
            }
        }
        
        success, data = self.make_request('POST', 'calculate-price', price_request)
        
        if success and isinstance(data, dict):
            required_fields = ['base_price', 'material_cost', 'subtotal', 'shipping_options', 'estimated_production_days']
            has_all_fields = all(field in data for field in required_fields)
            
            # Check if prices are reasonable numbers
            prices_valid = (
                isinstance(data.get('base_price'), (int, float)) and data.get('base_price') > 0 and
                isinstance(data.get('material_cost'), (int, float)) and data.get('material_cost') > 0 and
                isinstance(data.get('subtotal'), (int, float)) and data.get('subtotal') > 0
            )
            
            self.log_test("Price Calculation API", has_all_fields and prices_valid,
                         "" if has_all_fields and prices_valid else f"Invalid price structure: {data}",
                         {"calculated_price": data.get('subtotal')})
        else:
            self.log_test("Price Calculation API", False, f"Price calculation failed: {data}")
        
        # Test with invalid material
        invalid_request = {
            "category_id": "cabinets",
            "dimensions": {"width": 100, "height": 200, "depth": 60},
            "material_id": "invalid_material"
        }
        
        success, data = self.make_request('POST', 'calculate-price', invalid_request, expected_status=404)
        self.log_test("Price Calculation API - Invalid material", success,
                     "" if success else f"Should return 404 for invalid material: {data}")
    
    def test_ai_chat_api(self):
        """Test AI chat API"""
        print("\n🔍 Testing AI Chat API...")
        
        # Test chat message
        chat_request = {
            "session_id": self.test_session_id,
            "message": "Hello, I need help designing a kitchen cabinet.",
            "language": "en"
        }
        
        success, data = self.make_request('POST', 'chat', chat_request)
        
        if success and isinstance(data, dict):
            has_response = 'response' in data and isinstance(data['response'], str) and len(data['response']) > 0
            has_session_id = 'session_id' in data and data['session_id'] == self.test_session_id
            
            self.log_test("AI Chat API - Send message", has_response and has_session_id,
                         "" if has_response and has_session_id else f"Invalid chat response: {data}",
                         {"response_length": len(data.get('response', ''))})
        else:
            self.log_test("AI Chat API - Send message", False, f"Chat failed: {data}")
        
        # Test get chat history
        success, data = self.make_request('GET', f'chat/{self.test_session_id}')
        
        if success and isinstance(data, dict):
            has_messages = 'messages' in data and isinstance(data['messages'], list)
            self.log_test("AI Chat API - Get history", has_messages,
                         "" if has_messages else f"Invalid chat history: {data}")
        else:
            self.log_test("AI Chat API - Get history", False, f"Chat history failed: {data}")
    
    def test_orders_api(self):
        """Test orders API"""
        print("\n🔍 Testing Orders API...")
        
        # Create test order
        order_request = {
            "customer_email": "test@example.com",
            "customer_name": "Test Customer",
            "customer_phone": "+1234567890",
            "customer_address": {
                "street": "123 Test Street",
                "city": "Test City",
                "postal_code": "12345",
                "country": "Germany"
            },
            "products": [{
                "category": "cabinets",
                "material": "mdf_white",
                "dimensions": {"width": 100, "height": 200, "depth": 60},
                "subtotal": 450.00
            }],
            "shipping_method": "container",
            "currency": "EUR"
        }
        
        success, data = self.make_request('POST', 'orders', order_request, expected_status=200)
        
        if success and isinstance(data, dict) and 'order_id' in data:
            self.test_order_id = data['order_id']
            self.log_test("Orders API - Create order", True,
                         response_data={"order_id": self.test_order_id, "total": data.get('total_amount')})
            
            # Test get order
            success, order_data = self.make_request('GET', f'orders/{self.test_order_id}')
            self.log_test("Orders API - Get order", success,
                         "" if success else f"Failed to get order: {order_data}")
            
        else:
            self.log_test("Orders API - Create order", False, f"Order creation failed: {data}")
        
        # Test list orders
        success, data = self.make_request('GET', 'orders')
        
        if success and isinstance(data, list):
            self.log_test("Orders API - List orders", True,
                         response_data={"orders_count": len(data)})
        else:
            self.log_test("Orders API - List orders", False, f"List orders failed: {data}")
    
    def test_admin_api(self):
        """Test admin API endpoints"""
        print("\n🔍 Testing Admin API...")
        
        # Test admin dashboard
        success, data = self.make_request('GET', 'admin/dashboard')
        
        if success and isinstance(data, dict):
            required_fields = ['total_orders', 'pending_orders', 'paid_orders', 'total_revenue']
            has_all_fields = all(field in data for field in required_fields)
            
            self.log_test("Admin API - Dashboard", has_all_fields,
                         "" if has_all_fields else f"Missing dashboard fields: {data}",
                         {"dashboard_stats": data})
        else:
            self.log_test("Admin API - Dashboard", False, f"Dashboard failed: {data}")
        
        # Test admin materials
        success, data = self.make_request('GET', 'admin/materials')
        self.log_test("Admin API - Materials", success,
                     "" if success else f"Admin materials failed: {data}")
        
        # Test update order status (if we have a test order)
        if self.test_order_id:
            update_request = {"status": "paid", "production_status": "in_progress"}
            success, data = self.make_request('PUT', f'admin/orders/{self.test_order_id}', update_request)
            self.log_test("Admin API - Update order", success,
                         "" if success else f"Order update failed: {data}")
    
    def test_payment_api(self):
        """Test payment API endpoints"""
        print("\n🔍 Testing Payment API...")
        
        if not self.test_order_id:
            self.log_test("Payment API - Skipped", False, "No test order available")
            return
        
        # Test create checkout session
        payment_request = {
            "order_id": self.test_order_id,
            "origin_url": "https://homedeco.preview.emergentagent.com"
        }
        
        success, data = self.make_request('POST', 'payments/checkout', payment_request)
        
        if success and isinstance(data, dict) and 'checkout_url' in data:
            session_id = data.get('session_id')
            self.log_test("Payment API - Create checkout", True,
                         response_data={"has_checkout_url": True, "session_id": session_id})
            
            # Test payment status (will be unpaid)
            if session_id:
                success, status_data = self.make_request('GET', f'payments/status/{session_id}')
                self.log_test("Payment API - Get status", success,
                             "" if success else f"Payment status failed: {status_data}")
        else:
            self.log_test("Payment API - Create checkout", False, f"Checkout creation failed: {data}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting HomeDeco Backend API Tests...")
        print(f"Testing API at: {self.base_url}")
        
        try:
            self.test_basic_endpoints()
            self.test_categories_api()
            self.test_materials_api()
            self.test_shipping_options_api()
            self.test_price_calculation_api()
            self.test_ai_chat_api()
            self.test_orders_api()
            self.test_admin_api()
            self.test_payment_api()
            
        except Exception as e:
            print(f"❌ Critical error during testing: {str(e)}")
            self.failed_tests.append(f"Critical error: {str(e)}")
        
        # Print summary
        print(f"\n📊 Test Results Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {len(self.failed_tests)}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        return {
            "tests_run": self.tests_run,
            "tests_passed": self.tests_passed,
            "tests_failed": len(self.failed_tests),
            "failed_tests": self.failed_tests,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0,
            "detailed_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = HomeDecoAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if results["tests_failed"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())