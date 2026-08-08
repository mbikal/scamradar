import sys
import os
from fastapi.testclient import TestClient

# Adjust path so test runner finds backend folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_analyze_valid():
    payload = {
        "account_age_days": 10,
        "is_fb_verified": 0,
        "friends_count": 5.0,
        "num_products_listed": 3,
        "avg_listing_price": 500.0,
        "price_vs_category_median": 2.5
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "risk_score" in data
    assert "risk_level" in data
    assert "risk_factors" in data

def test_analyze_invalid_types():
    # Sending string instead of expected int
    payload = {
        "account_age_days": "not-an-int"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422  # validation error

def test_report_seller():
    payload = {
        "seller_profile_url": "https://www.facebook.com/marketplace/profile/test",
        "risk_score": 50,
        "risk_level": "medium"
    }
    response = client.post("/api/report", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data
