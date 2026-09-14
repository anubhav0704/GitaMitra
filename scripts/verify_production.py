#!/usr/bin/env python3
"""
GitaMitra Production Deployment Verification Script
Runs end-to-end sanity checks on live production container services.
"""

import sys
import time
import json
import urllib.request
import urllib.error

BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def log(msg, status="INFO"):
    symbol = "OK" if status == "SUCCESS" else ("FAIL" if status == "ERROR" else "INFO")
    print(f"[{symbol}] {msg}")

def check_url(url, description, expected_status=200):
    log(f"Checking {description} at {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GitaMitra-DeploymentVerifier/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            code = response.getcode()
            if code == expected_status:
                log(f"{description} is ONLINE (HTTP {code})", "SUCCESS")
                return response.read().decode('utf-8')
            else:
                log(f"{description} returned HTTP {code} (expected {expected_status})", "ERROR")
                return None
    except Exception as e:
        log(f"Failed to connect to {description} ({url}): {e}", "ERROR")
        return None

def verify_all():
    print("=" * 65)
    print("      GitaMitra Production Deployment System Verification     ")
    print("=" * 65)
    
    success = True

    # 1. Check Backend Liveness
    live_res = check_url(f"{BACKEND_URL}/api/health/live", "Backend Liveness Probe")
    if not live_res:
        success = False

    # 2. Check Backend Readiness
    ready_res = check_url(f"{BACKEND_URL}/api/health/ready", "Backend Readiness Probe (DB & pgvector)")
    if ready_res:
        try:
            data = json.loads(ready_res)
            log(f"Database Status: {data.get('database', 'unknown')}", "SUCCESS")
            log(f"pgvector Status: {data.get('pgvector', 'unknown')}", "SUCCESS")
        except Exception:
            pass
    else:
        success = False

    # 3. Check Frontend Accessibility
    front_res = check_url(FRONTEND_URL, "Next.js Frontend Application")
    if not front_res:
        success = False

    # 4. Check Gita Explorer Verses API
    verses_res = check_url(f"{BACKEND_URL}/api/gita/chapters", "Bhagavad Gita Chapters API")
    if verses_res:
        try:
            chapters = json.loads(verses_res)
            log(f"Loaded {len(chapters)} Bhagavad Gita chapters successfully", "SUCCESS")
        except Exception:
            pass
    else:
        success = False

    print("=" * 65)
    if success:
        log("ALL PRODUCTION HEALTH CHECKS PASSED SUCCESSFULLY!", "SUCCESS")
        print("GitaMitra is fully deployed, connected, and operating in production!")
    else:
        log("SOME CHECKS FAILED. Please review container logs.", "ERROR")
    print("=" * 65)

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(verify_all())
