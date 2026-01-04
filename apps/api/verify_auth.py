import httpx
import time

BASE_URL = "http://127.0.0.1:8005"

def verify():
    print(f"Testing against {BASE_URL}")
    
    # 1. Signup
    print("\n1. Testing Signup...")
    signup_data = {
        "email": "test_pg_verification@example.com",
        "password": "password123456",
        "name": "Test PG Verification User"
    }
    try:
        r = httpx.post(f"{BASE_URL}/auth/signup", json=signup_data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        
    except Exception as e:
        print(f"Signup failed: {e}")
        return

    # 2. Login
    print("\n2. Testing Login...")
    login_data = {
        "email": "test_pg_verification@example.com",
        "password": "password123456"
    }
    try:
        r = httpx.post(f"{BASE_URL}/auth/login", json=login_data)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        
        if r.status_code != 200:
            print("Login failed!")
            return
            
        data = r.json()
        token = data.get("access_token")
        if not token:
            print("No access token found!")
            return
        
        print(f"Got access token: {token[:20]}...")
        
        # 3. Get Me
        print("\n3. Testing Get Me...")
        headers = {"Authorization": f"Bearer {token}"}
        r = httpx.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
        
        if r.status_code == 200:
            user = r.json()
            if user["email"] == "test_pg_verification@example.com":
                print("SUCCESS: Retrieved correct user!")
            else:
                print("FAILURE: User email mismatch")
        else:
            print("FAILURE: Could not get user info")

    except Exception as e:
        print(f"Login/Me failed: {e}")

if __name__ == "__main__":
    verify()
