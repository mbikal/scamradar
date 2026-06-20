import sys
import os

# add ml_model to path so we can import predict
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml_model'))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from predict import analyze_seller

app = FastAPI(
    title="ScamRadar API",
    description="Fraud detection API for online sellers",
    version="1.0.0",
)

# CORS — allow browser extension to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SellerData(BaseModel):
    """Input schema for seller analysis."""
    url: Optional[str] = None
    account_age_days: Optional[int] = None
    seller_verified: Optional[int] = None
    has_business_license: Optional[int] = None
    num_products_listed: Optional[int] = None
    avg_listing_price: Optional[float] = None
    price_vs_category_median: Optional[float] = None
    listings_created_last_7d: Optional[int] = None
    pct_stock_photos: Optional[float] = None
    num_categories: Optional[int] = None
    total_orders: Optional[int] = None
    num_reviews: Optional[int] = None
    avg_rating: Optional[float] = None
    pct_5_star: Optional[float] = None
    pct_verified_purchase_reviews: Optional[float] = None
    review_velocity_per_day: Optional[float] = None
    avg_review_length_chars: Optional[float] = None
    avg_shipping_days: Optional[float] = None
    cancellation_rate: Optional[float] = None
    refund_rate: Optional[float] = None
    chargeback_rate: Optional[float] = None
    dispute_rate: Optional[float] = None
    complaint_count: Optional[int] = None
    avg_response_time_hours: Optional[float] = None
    response_rate: Optional[float] = None
    shared_ip_flag: Optional[int] = None
    address_mismatch_flag: Optional[int] = None
    payment_method_changes: Optional[int] = None
    seller_country: Optional[str] = None


@app.get("/health")
def health_check():
    return {"message": "Server is healthy"}


@app.post("/api/analyze")
def analyze(data: SellerData):
    """Run fraud analysis on seller data and return risk factors."""
    # convert to dict, dropping None values so predict.py uses defaults
    seller_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not seller_data:
        raise HTTPException(status_code=400, detail="Request body is empty")

    try:
        result = analyze_seller(seller_data)
        return {
            "success": True,
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "fraud_probability": result["fraud_probability"],
            "risk_factors": result["risk_factors"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
