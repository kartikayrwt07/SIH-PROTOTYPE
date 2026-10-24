import time
import urllib.request
import json

endpoints = [
    ("Dashboard Metrics", "http://127.0.0.1:8005/api/v1/dashboard/metrics"),
    ("Trust Scores (limit 20)", "http://127.0.0.1:8005/api/v1/institutions/trust-scores?limit=20"),
    ("Trust Score Summary", "http://127.0.0.1:8005/api/v1/institutions/trust-scores/summary"),
    ("SLA Radar", "http://127.0.0.1:8005/api/v1/cases/sla/radar"),
    ("Master Tickets", "http://127.0.0.1:8005/api/v1/ai/master-tickets"),
    ("Cases List", "http://127.0.0.1:8005/api/v1/cases?limit=10"),
]

print("--- FIRST CALL (Cold / Database Fetch) ---")
for name, url in endpoints:
    t0 = time.perf_counter()
    req = urllib.request.Request(url, headers={"User-Agent": "Benchmark"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            duration_ms = (time.perf_counter() - t0) * 1000
            print(f"[{resp.status}] {name:25} -> {duration_ms:8.2f} ms ({len(data)} bytes)")
    except Exception as e:
        print(f"[ERR] {name:25} -> {e}")

print("\n--- SECOND CALL (Cached Fetch) ---")
for name, url in endpoints:
    t0 = time.perf_counter()
    req = urllib.request.Request(url, headers={"User-Agent": "Benchmark"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            duration_ms = (time.perf_counter() - t0) * 1000
            print(f"[{resp.status}] {name:25} -> {duration_ms:8.2f} ms ({len(data)} bytes)")
    except Exception as e:
        print(f"[ERR] {name:25} -> {e}")
