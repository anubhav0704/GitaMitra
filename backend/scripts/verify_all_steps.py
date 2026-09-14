import urllib.request
import urllib.parse
import json
import http.cookiejar
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

def run_tests():
    print("==================================================")
    print("GITAMITRA STEPS 1-4 COMPREHENSIVE VERIFICATION")
    print("==================================================")

    # 1. Health & DB
    print("\n--- STEP 2: Database & Health Check ---")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as res:
        health = json.loads(res.read().decode())
        print(f"Status Code: {res.status}")
        print(f"Health Response: {health}")
        assert health["status"] in ("ok", "healthy"), "Health check failed!"
        assert health["database"] in ("ok", "connected"), "Database connection check failed!"
    print("=> Database & Health Check: PASSED")

    # 2. Gita Knowledge Base (Step 3)
    print("\n--- STEP 3: Bhagavad Gita Knowledge Base ---")
    with urllib.request.urlopen(f"{BASE_URL}/api/gita/status") as res:
        status = json.loads(res.read().decode())
        print(f"Gita DB Status: {status}")
        assert status["chapters"] == 18, f"Expected 18 chapters, got {status['chapters']}"
        assert status["verses"] == 700, f"Expected 700 verses, got {status['verses']}"
        assert status["status"] == "ready", "Gita knowledge base is not marked ready!"

    with urllib.request.urlopen(f"{BASE_URL}/api/gita/chapters") as res:
        chapters = json.loads(res.read().decode())
        print(f"Fetched {len(chapters)} chapters successfully.")
        assert len(chapters) == 18

    with urllib.request.urlopen(f"{BASE_URL}/api/gita/chapters/2/verses/47") as res:
        v47 = json.loads(res.read().decode())
        print(f"Verse 2.47:")
        print(f"  Sanskrit: {v47['sanskrit']}")
        print(f"  Transliteration: {v47['transliteration']}")
        print(f"  Translation EN: {v47['translation_en']}")
        print(f"  Translation HI: {v47['translation_hi'][:50]}...")
        print(f"  Topics: {v47.get('topics')}")
        print(f"  Life Situations: {v47.get('life_situations')}")
        assert "कर्मण्येवाधिकारस्ते" in v47["sanskrit"]
        assert len(v47["translation_en"]) > 20
        assert len(v47["translation_hi"]) > 20
    print("=> Gita Knowledge Base Verification: PASSED")

    # 3. RAG Pipeline (Step 4)
    print("\n--- STEP 4: RAG Pipeline & Retrieval ---")
    rag_payload = json.dumps({
        "query": "I am so anxious about my exams and results, how do I focus on my action?",
        "top_k": 3
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/rag/retrieve",
        data=rag_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        rag_res = json.loads(res.read().decode())
        print(f"RAG Query: '{rag_res['query']}'")
        print(f"Detected Emotions: {rag_res['analysis']['emotions']}")
        print(f"Detected Life Situations: {rag_res['analysis']['life_situations']}")
        print(f"Total retrieved: {len(rag_res['results'])}")
        assert len(rag_res["results"]) > 0, "No verses retrieved!"
        top_verse = rag_res["results"][0]
        print(f"Top Result: Chapter {top_verse['chapter']} Verse {top_verse['verse']} (Score: {top_verse['relevance_score']})")
        print(f"Excerpt: {top_verse['translation_en']}")
        # Expect 2.47 for exam results / duty without attachment
        assert top_verse["chapter"] == 2 and top_verse["verse"] == 47, f"Expected 2.47, got {top_verse['chapter']}.{top_verse['verse']}"
        print(f"LLM Context preview:\n{rag_res.get('llm_context', '')[:120]}...")
    print("=> RAG Pipeline Verification: PASSED")

    # 4. Authentication & User Isolation (Step 1)
    print("\n--- STEP 1: Authentication & User Isolation ---")
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

    test_email = "test_verifier_user@gitamitra.com"
    test_password = "SecurePassword123!"
    test_name = "Verifier User"

    # Register (or login if exists)
    reg_payload = json.dumps({
        "email": test_email,
        "password": test_password,
        "name": test_name
    }).encode("utf-8")
    reg_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=reg_payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with opener.open(reg_req) as res:
            reg_data = json.loads(res.read().decode())
            print(f"User registration successful: {reg_data['email']}")
    except urllib.error.HTTPError as e:
        if e.code in (400, 409):
            print("User already registered, proceeding to login...")
        else:
            raise

    # Login
    login_payload = json.dumps({
        "email": test_email,
        "password": test_password
    }).encode("utf-8")
    login_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    with opener.open(login_req) as res:
        login_data = json.loads(res.read().decode())
        print(f"Login successful. Access token received: {bool(login_data.get('access_token'))}")
        token = login_data.get("access_token")

    # Me endpoint with Bearer token
    me_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(me_req) as res:
        me_data = json.loads(res.read().decode())
        print(f"Current authenticated user (/api/auth/me): {me_data['email']} (ID: {me_data['id']})")
        assert me_data["email"] == test_email
        assert me_data["name"] == test_name

    # Logout
    logout_req = urllib.request.Request(
        f"{BASE_URL}/api/auth/logout",
        data=b"{}",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(logout_req) as res:
        logout_data = json.loads(res.read().decode())
        print(f"Logout successful: {logout_data.get('message')}")

    print("=> Authentication & User Isolation Verification: PASSED")

    # 5. Frontend Check
    print("\n--- FRONTEND (Port 3000) ---")
    with urllib.request.urlopen("http://localhost:3000") as res:
        print(f"Frontend Root HTTP Status: {res.status}")
        html_sample = res.read().decode("utf-8")[:200]
        assert "<!DOCTYPE html>" in html_sample or "<html" in html_sample
    with urllib.request.urlopen("http://localhost:3000/gita") as res:
        print(f"Frontend Gita Explorer HTTP Status: {res.status}")
        html_gita = res.read().decode("utf-8")[:200]
        assert "<!DOCTYPE html>" in html_gita or "<html" in html_gita
    print("=> Frontend Service Verification: PASSED")

    print("\n==================================================")
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY! 100% HEALTHY.")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
