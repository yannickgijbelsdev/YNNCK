#!/usr/bin/env python3
"""
Backend API Testing Script
Tests the /api/news and /api/popup-logo endpoints
"""

import requests
import json
import sys

# Load backend URL from frontend/.env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading .env file: {e}")
        return None

def test_news_endpoint():
    """Test GET /api/news endpoint"""
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ FAILED: Could not read REACT_APP_BACKEND_URL from frontend/.env")
        return False
    
    endpoint = f"{backend_url}/api/news"
    print(f"\n{'='*60}")
    print(f"Testing: GET {endpoint}")
    print(f"{'='*60}\n")
    
    try:
        # Make the request
        response = requests.get(endpoint, timeout=30)
        
        # Test 1: HTTP Status Code
        print(f"1. HTTP Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ FAILED: Expected 200, got {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
        print(f"   ✅ PASSED: Returns HTTP 200")
        
        # Test 2: Content-Type
        content_type = response.headers.get('content-type', '')
        print(f"\n2. Content-Type: {content_type}")
        if 'application/json' not in content_type.lower():
            print(f"   ❌ FAILED: Expected JSON content-type, got {content_type}")
            return False
        print(f"   ✅ PASSED: Content-Type is JSON")
        
        # Test 3: Parse JSON
        try:
            data = response.json()
            print(f"\n3. JSON Parsing: Success")
            print(f"   ✅ PASSED: Response is valid JSON")
        except json.JSONDecodeError as e:
            print(f"\n3. JSON Parsing: Failed")
            print(f"   ❌ FAILED: Could not parse JSON: {e}")
            print(f"   Response text: {response.text[:500]}")
            return False
        
        # Test 4: Response structure - 'items' key
        print(f"\n4. Response Structure - 'items' key:")
        if 'items' not in data:
            print(f"   ❌ FAILED: Response missing 'items' key")
            print(f"   Keys found: {list(data.keys())}")
            return False
        print(f"   ✅ PASSED: 'items' key present")
        
        # Test 5: 'items' is a list
        print(f"\n5. 'items' type:")
        if not isinstance(data['items'], list):
            print(f"   ❌ FAILED: 'items' is not a list, got {type(data['items'])}")
            return False
        print(f"   ✅ PASSED: 'items' is a list")
        
        # Test 6: Response structure - 'count' key
        print(f"\n6. Response Structure - 'count' key:")
        if 'count' not in data:
            print(f"   ❌ FAILED: Response missing 'count' key")
            print(f"   Keys found: {list(data.keys())}")
            return False
        print(f"   ✅ PASSED: 'count' key present")
        
        # Test 7: 'count' is an integer
        print(f"\n7. 'count' type:")
        if not isinstance(data['count'], int):
            print(f"   ❌ FAILED: 'count' is not an integer, got {type(data['count'])}")
            return False
        print(f"   ✅ PASSED: 'count' is an integer")
        
        # Test 8: Expected values (upstream has 0 articles)
        print(f"\n8. Expected values (upstream currently has 0 articles):")
        print(f"   items length: {len(data['items'])}")
        print(f"   count value: {data['count']}")
        
        if len(data['items']) != 0:
            print(f"   ⚠️  WARNING: Expected empty items list, got {len(data['items'])} items")
            print(f"   Note: Upstream may have added articles")
        else:
            print(f"   ✅ PASSED: items is empty list as expected")
        
        if data['count'] != 0:
            print(f"   ⚠️  WARNING: Expected count=0, got count={data['count']}")
            print(f"   Note: Upstream may have added articles")
        else:
            print(f"   ✅ PASSED: count is 0 as expected")
        
        # Test 9: Error handling (check if error field exists when there are issues)
        print(f"\n9. Error handling:")
        if 'error' in data:
            print(f"   ⚠️  INFO: Error field present: {data['error']}")
            print(f"   ✅ PASSED: Endpoint handles errors gracefully (returns error field instead of 500)")
        else:
            print(f"   ✅ PASSED: No errors, endpoint working normally")
        
        # Summary
        print(f"\n{'='*60}")
        print(f"FULL RESPONSE:")
        print(f"{'='*60}")
        print(json.dumps(data, indent=2))
        
        print(f"\n{'='*60}")
        print(f"✅ ALL TESTS PASSED")
        print(f"{'='*60}\n")
        return True
        
    except requests.exceptions.Timeout:
        print(f"❌ FAILED: Request timed out after 30 seconds")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ FAILED: Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_popup_logo_endpoint():
    """Test GET /api/popup-logo endpoint"""
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ FAILED: Could not read REACT_APP_BACKEND_URL from frontend/.env")
        return False
    
    endpoint = f"{backend_url}/api/popup-logo"
    print(f"\n{'='*60}")
    print(f"Testing: GET {endpoint}")
    print(f"{'='*60}\n")
    
    try:
        # Make the request
        response = requests.get(endpoint, timeout=30)
        
        # Test 1: HTTP Status Code
        print(f"1. HTTP Status Code: {response.status_code}")
        if response.status_code != 200:
            print(f"   ❌ FAILED: Expected 200, got {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            return False
        print(f"   ✅ PASSED: Returns HTTP 200")
        
        # Test 2: Content-Type
        content_type = response.headers.get('content-type', '')
        print(f"\n2. Content-Type: {content_type}")
        if 'application/json' not in content_type.lower():
            print(f"   ❌ FAILED: Expected JSON content-type, got {content_type}")
            return False
        print(f"   ✅ PASSED: Content-Type is JSON")
        
        # Test 3: Parse JSON
        try:
            data = response.json()
            print(f"\n3. JSON Parsing: Success")
            print(f"   ✅ PASSED: Response is valid JSON")
        except json.JSONDecodeError as e:
            print(f"\n3. JSON Parsing: Failed")
            print(f"   ❌ FAILED: Could not parse JSON: {e}")
            print(f"   Response text: {response.text[:500]}")
            return False
        
        # Test 4: Response structure - 'items' key
        print(f"\n4. Response Structure - 'items' key:")
        if 'items' not in data:
            print(f"   ❌ FAILED: Response missing 'items' key")
            print(f"   Keys found: {list(data.keys())}")
            return False
        print(f"   ✅ PASSED: 'items' key present")
        
        # Test 5: 'items' is a list
        print(f"\n5. 'items' type:")
        if not isinstance(data['items'], list):
            print(f"   ❌ FAILED: 'items' is not a list, got {type(data['items'])}")
            return False
        print(f"   ✅ PASSED: 'items' is a list")
        
        # Test 6: Response structure - 'count' key
        print(f"\n6. Response Structure - 'count' key:")
        if 'count' not in data:
            print(f"   ❌ FAILED: Response missing 'count' key")
            print(f"   Keys found: {list(data.keys())}")
            return False
        print(f"   ✅ PASSED: 'count' key present")
        
        # Test 7: 'count' is an integer
        print(f"\n7. 'count' type:")
        if not isinstance(data['count'], int):
            print(f"   ❌ FAILED: 'count' is not an integer, got {type(data['count'])}")
            return False
        print(f"   ✅ PASSED: 'count' is an integer")
        
        # Test 8: Verify items are normalized with 'title' and 'image' fields
        print(f"\n8. Item normalization (title and image fields):")
        print(f"   Total items: {len(data['items'])}")
        
        if len(data['items']) > 0:
            # Check first few items for normalization
            for i, item in enumerate(data['items'][:3]):  # Check first 3 items
                print(f"\n   Item {i+1}:")
                if 'title' not in item:
                    print(f"      ❌ FAILED: Item missing 'title' field")
                    print(f"      Item keys: {list(item.keys())}")
                    return False
                print(f"      ✅ 'title' field present: {item['title'][:50] if item['title'] else '(empty)'}")
                
                if 'image' not in item:
                    print(f"      ❌ FAILED: Item missing 'image' field")
                    print(f"      Item keys: {list(item.keys())}")
                    return False
                print(f"      ✅ 'image' field present: {item['image'][:50] if item['image'] else '(empty)'}")
            
            print(f"\n   ✅ PASSED: Items are normalized with 'title' and 'image' fields")
        else:
            print(f"   ℹ️  INFO: No items to check (upstream returned 0 items)")
            print(f"   ✅ PASSED: Empty items list is valid")
        
        # Test 9: Error handling (check if error field exists when there are issues)
        print(f"\n9. Error handling:")
        if 'error' in data:
            print(f"   ⚠️  INFO: Error field present: {data['error']}")
            print(f"   ✅ PASSED: Endpoint handles errors gracefully (returns error field instead of 500)")
        else:
            print(f"   ✅ PASSED: No errors, endpoint working normally")
        
        # Test 10: Verify NOT returning 500 error
        print(f"\n10. No 500 error:")
        if response.status_code == 500:
            print(f"   ❌ FAILED: Endpoint returned 500 error")
            return False
        print(f"   ✅ PASSED: Endpoint does not return 500 error")
        
        # Summary
        print(f"\n{'='*60}")
        print(f"FULL RESPONSE:")
        print(f"{'='*60}")
        print(json.dumps(data, indent=2)[:1000])  # Limit output
        if len(json.dumps(data, indent=2)) > 1000:
            print(f"... (truncated, total {len(data['items'])} items)")
        
        print(f"\n{'='*60}")
        print(f"✅ ALL TESTS PASSED FOR /api/popup-logo")
        print(f"{'='*60}\n")
        return True
        
    except requests.exceptions.Timeout:
        print(f"❌ FAILED: Request timed out after 30 seconds")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"❌ FAILED: Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED: Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def quick_reconfirm_news_endpoint():
    """Quick re-confirmation test for GET /api/news endpoint"""
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ FAILED: Could not read REACT_APP_BACKEND_URL from frontend/.env")
        return False
    
    endpoint = f"{backend_url}/api/news"
    print(f"\n{'='*60}")
    print(f"Quick Re-confirmation: GET {endpoint}")
    print(f"{'='*60}\n")
    
    try:
        response = requests.get(endpoint, timeout=30)
        
        # Quick checks
        if response.status_code != 200:
            print(f"❌ FAILED: Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if 'items' not in data or not isinstance(data['items'], list):
            print(f"❌ FAILED: Missing 'items' key or not a list")
            return False
        
        if 'count' not in data or not isinstance(data['count'], int):
            print(f"❌ FAILED: Missing 'count' key or not an integer")
            return False
        
        print(f"✅ PASSED: Returns HTTP 200")
        print(f"✅ PASSED: 'items' key present (list with {len(data['items'])} items)")
        print(f"✅ PASSED: 'count' key present (value: {data['count']})")
        
        print(f"\n{'='*60}")
        print(f"✅ /api/news RE-CONFIRMED WORKING")
        print(f"{'='*60}\n")
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


if __name__ == "__main__":
    print("\n" + "="*60)
    print("BACKEND API TESTING")
    print("="*60)
    
    # Test 1: Quick re-confirm /api/news
    print("\n[TEST 1/2] Quick re-confirmation of /api/news endpoint")
    news_success = quick_reconfirm_news_endpoint()
    
    # Test 2: Full test of /api/popup-logo
    print("\n[TEST 2/2] Full test of /api/popup-logo endpoint")
    popup_success = test_popup_logo_endpoint()
    
    # Final summary
    print("\n" + "="*60)
    print("FINAL TEST SUMMARY")
    print("="*60)
    print(f"GET /api/news (re-confirmation): {'✅ PASSED' if news_success else '❌ FAILED'}")
    print(f"GET /api/popup-logo (full test): {'✅ PASSED' if popup_success else '❌ FAILED'}")
    print("="*60 + "\n")
    
    sys.exit(0 if (news_success and popup_success) else 1)
