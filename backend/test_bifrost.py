import sys
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load environment
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

BIFROST_BASE_URL = os.getenv("BIFROST_BASE_URL", "http://localhost:8080").rstrip("/")
BIFROST_API_KEY = os.getenv("BIFROST_API_KEY", "").strip()
BIFROST_MODEL = os.getenv("BIFROST_MODEL", os.getenv("GROK_MODEL", "llama-3.3-70b-versatile")).strip()

def mask_key(k: str) -> str:
    if not k:
        return "(empty)"
    if len(k) <= 8:
        return "****"
    return f"{k[:4]}...{k[-4:]}"

def test_connection():
    print("=" * 60)
    print("VerityMeet AI - Bifrost Gateway Connection Test")
    print("=" * 60)
    print(f"Bifrost Gateway URL : {BIFROST_BASE_URL}")
    print(f"Virtual Key Status  : {'Configured (' + mask_key(BIFROST_API_KEY) + ')' if BIFROST_API_KEY else 'NOT CONFIGURED'}")
    print(f"Configured Model    : {BIFROST_MODEL}")
    print("-" * 60)

    # Check 1: Virtual Key check
    if not BIFROST_API_KEY or BIFROST_API_KEY.startswith("YOUR_"):
        print("[FAIL] BIFROST_API_KEY is not configured in .env.")
        print("Please create a Virtual Key in Bifrost dashboard (http://localhost:8080) and paste it into .env.")
        return False

    # Check 2: Reachability
    endpoint = f"{BIFROST_BASE_URL}/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {BIFROST_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": BIFROST_MODEL,
        "messages": [
            {"role": "user", "content": "Say hello from VerityMeet AI."}
        ],
        "temperature": 0.2,
        "max_tokens": 50
    }

    print(f"Sending test chat completion request to: {endpoint} ...")
    try:
        response = requests.post(endpoint, headers=headers, json=payload, timeout=20.0)
    except requests.exceptions.ConnectionError as e:
        print("[FAIL] Cannot connect to Bifrost Gateway.")
        print(f"Error: Connection refused at {BIFROST_BASE_URL}.")
        print("Please ensure Bifrost v2.5.0 is running on port 8080.")
        return False
    except requests.exceptions.Timeout:
        print("[FAIL] Request to Bifrost Gateway timed out after 20 seconds.")
        return False
    except Exception as e:
        print(f"[FAIL] Unexpected error connecting to Bifrost: {type(e).__name__}: {str(e)}")
        return False

    # Check 3: Response validation
    if response.status_code == 200:
        try:
            data = response.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                content = choices[0]["message"].get("content", "").strip()
                print("[SUCCESS] Bifrost Gateway connected and returned AI response!")
                print("-" * 60)
                print(f"AI Response: {content}")
                print("-" * 60)
                print("All Phase 5 checks passed:")
                print("  [x] Bifrost is reachable.")
                print("  [x] Virtual Key authentication succeeded.")
                print("  [x] Groq model is available.")
                print("  [x] AI response is returned.")
                return True
            else:
                print(f"[WARN] HTTP 200 returned but unexpected response structure: {data}")
                return False
        except Exception as e:
            print(f"[FAIL] Failed to parse JSON response: {e}")
            return False
    elif response.status_code in (401, 403):
        print(f"[FAIL] Authentication failed (HTTP {response.status_code}).")
        print("Bifrost rejected the Virtual Key. Verify that the key is valid and active in Bifrost Governance -> Virtual Keys.")
        return False
    elif response.status_code == 404:
        print(f"[FAIL] Endpoint or Model not found (HTTP 404).")
        print(f"Check if model '{BIFROST_MODEL}' is enabled in Bifrost for your Virtual Key.")
        print(f"Response: {response.text[:200]}")
        return False
    else:
        print(f"[FAIL] Bifrost Gateway returned HTTP {response.status_code}.")
        print(f"Details: {response.text[:300]}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
