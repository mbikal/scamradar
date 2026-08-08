import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env at startup
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from ml.predict import analyze_seller
from datetime import datetime
import logging

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("scamradar")

app = FastAPI(
    title="ScamRadar API",
    description="Fraud detection API for online sellers",
    version="1.0.0",
)

# CORS — allow browser extension to connect
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection removed


@app.middleware("http")
async def add_private_network_header(request: Request, call_next):
    response = await call_next(request)
    if request.headers.get("Access-Control-Request-Private-Network") == "true":
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


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
    seller_profile_url: Optional[str] = None
    # Facebook Marketplace specific features
    is_fb_verified: Optional[int] = None
    friends_count: Optional[float] = None
    location_matches_listing: Optional[int] = None
    num_photos_per_listing: Optional[int] = None
    description_length: Optional[int] = None
    has_watermark_image: Optional[int] = None
    copy_paste_listing_ratio: Optional[float] = None
    cross_city_posting: Optional[int] = None
    product_title: Optional[str] = None
    product_description: Optional[str] = None


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Server is healthy"}


@app.post("/api/analyze")
def analyze(data: SellerData):
    """Run fraud analysis on seller data and return risk factors."""
    logger.info("Received seller analysis request: %s", data.seller_profile_url or "unknown URL")
    if data.product_title:
        logger.info("Product name extracted: '%s'", data.product_title)
    if data.product_description:
        desc_excerpt = (data.product_description[:60] + "...") if len(data.product_description) > 60 else data.product_description
        logger.info("Product description: '%s' (Length: %s chars)", desc_excerpt, len(data.product_description))
    # Telemetry logging: identify missing scraper features
    core_keys = ["account_age_days", "is_fb_verified", "friends_count", "num_photos_per_listing", "description_length", "location_matches_listing"]
    missing_keys = [k for k in core_keys if getattr(data, k) is None]
    if missing_keys:
        logger.warning("Scraper telemetry notice: missing fields %s in client request (using backend defaults)", missing_keys)

    # convert to dict, dropping None values so predict.py uses defaults
    seller_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not seller_data:
        logger.warning("Empty seller analysis request received")
        raise HTTPException(status_code=400, detail="Request body is empty")

    try:
        result = analyze_seller(seller_data)
        logger.info("Analysis completed successfully. Risk Level: %s, Score: %s", result["risk_level"], result["risk_score"])
        return {
            "success": True,
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "fraud_probability": result["fraud_probability"],
            "risk_factors": result["risk_factors"],
        }
    except Exception as e:
        logger.error("Analysis failed: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class ReportData(BaseModel):
    seller_profile_url: str
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None


@app.post("/api/report")
def report_seller(data: ReportData):
    """Log reported seller details locally."""
    report_doc = {
        "seller_profile_url": data.seller_profile_url,
        "risk_score": data.risk_score,
        "risk_level": data.risk_level,
        "notes": data.notes,
        "reported_at": datetime.utcnow()
    }
    logger.info("Report logged locally: %s", report_doc)
    return {"success": True, "message": "Report logged locally"}
