import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger("scamradar.predict")

#config and constant

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')
MODEL_COLUMNS_PATH = os.path.join(os.path.dirname(__file__), 'feature_columns.pkl')
MODEL_EXPLAINER = os.path.join(os.path.dirname(__file__), 'shap_explainer.pkl')
DEFAULT_FEATURE_VALUES = {
    'account_age_days': 365,
    'is_fb_verified': 0,
    'friends_count': 150.0,
    'location_matches_listing': 1,
    'num_products_listed': 0,
    'avg_listing_price': 50.0,
    'price_vs_category_median': 1.0,
    'listings_created_last_7d': 1,
    'num_photos_per_listing': 3,
    'description_length': 150,
    'pct_stock_photos': 0.1,
    'has_watermark_image': 0,
    'copy_paste_listing_ratio': 0.05,
    'cross_city_posting': 0,
    'num_categories': 2,
    'num_reviews': 5,
    'avg_rating': 4.5,
    'pct_5_star': 0.7,
    'review_velocity_per_day': 0.2,
    'avg_review_length_chars': 100.0,
    'avg_response_time_hours': 2.0,
    'response_rate': 0.9,
}

FEATURE_DISPLAY_MAP = {
    'account_age_days':              {'title': 'New Account',              'icon': 'clock'},
    'is_fb_verified':                {'title': 'Facebook Verified',        'icon': 'shield-check'},
    'friends_count':                 {'title': 'Low Friend Count',         'icon': 'users'},
    'location_matches_listing':      {'title': 'Location Mismatch',        'icon': 'map-pin'},
    'num_products_listed':           {'title': 'Listing Volume',           'icon': 'package'},
    'avg_listing_price':             {'title': 'Suspicious Pricing',       'icon': 'dollar-sign'},
    'price_vs_category_median':      {'title': 'Unusual Price',            'icon': 'tag'},
    'listings_created_last_7d':      {'title': 'Listing Spike',            'icon': 'calendar'},
    'num_photos_per_listing':        {'title': 'Few Listing Photos',       'icon': 'image'},
    'description_length':            {'title': 'Short Description',        'icon': 'align-left'},
    'pct_stock_photos':              {'title': 'Stock Photos Used',        'icon': 'copy'},
    'has_watermark_image':           {'title': 'Watermark Present',        'icon': 'droplet'},
    'copy_paste_listing_ratio':      {'title': 'Duplicate Description',    'icon': 'copy'},
    'cross_city_posting':            {'title': 'Cross-City Posting',       'icon': 'globe'},
    'num_categories':                {'title': 'Category Spread',          'icon': 'grid'},
    'num_reviews':                   {'title': 'Few Reviews',              'icon': 'message-square'},
    'avg_rating':                    {'title': 'Low Seller Rating',        'icon': 'star'},
    'pct_5_star':                    {'title': 'Suspicious Ratings',       'icon': 'star'},
    'review_velocity_per_day':       {'title': 'Review Spam',              'icon': 'activity'},
    'avg_review_length_chars':       {'title': 'Short Reviews',            'icon': 'type'},
    'avg_response_time_hours':       {'title': 'Slow Response Time',       'icon': 'clock'},
    'response_rate':                 {'title': 'Low Response Rate',        'icon': 'percent'},
}



#loading the model 
def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at '{MODEL_PATH}'"
        )
    logger.info("Loading ML fraud model from %s", MODEL_PATH)
    return joblib.load(MODEL_PATH)
#loading the explainer shap
def load_explainer():
    if not os.path.exists(MODEL_EXPLAINER):
        raise FileNotFoundError(
            f"Explainer Model not found at '{MODEL_EXPLAINER}'"
        )
    logger.info("Loading SHAP explainer from %s", MODEL_EXPLAINER)
    return joblib.load(MODEL_EXPLAINER)

#loading the feature columns
def load_columns():
    if not os.path.exists(MODEL_COLUMNS_PATH):
        raise FileNotFoundError(
            f"Columns files doesn't exists at '{MODEL_COLUMNS_PATH}'"
        )
    logger.info("Loading model feature columns list from %s", MODEL_COLUMNS_PATH)
    return joblib.load(MODEL_COLUMNS_PATH)

clf = load_model()
explainer = load_explainer()
MODEL_COLUMNS = load_columns()
#preprocess_input
def preprocess_input(frontend_data):
    # work on a copy to avoid mutating the caller's dict
    data = frontend_data.copy()
    features = DEFAULT_FEATURE_VALUES.copy()

    # map legacy frontend 'seller_verified' to the new 'is_fb_verified' if needed
    if 'seller_verified' in data and 'is_fb_verified' not in data:
        features['is_fb_verified'] = data['seller_verified']

    # overwrite defaults with remaining frontend values if they are not None
    for key, val in data.items():
        if key in features and val is not None:
            features[key] = val

    df = pd.DataFrame([features])
    df = df.reindex(columns=MODEL_COLUMNS, fill_value=0)

    return df


#predict
def predict(df):
    """Run the fraud model and return the prediction result.

    Args:
        df: Preprocessed single-row DataFrame aligned to MODEL_COLUMNS.

    Returns:
        Dict with fraud_probability, risk_score (0-100), and risk_level.
    """
    probabilities = clf.predict_proba(df)
    fraud_probability = probabilities[0][1]  # first sample, fraud class
 
    risk_score = round(fraud_probability * 100)

    if fraud_probability >= 0.75:
        risk_level = 'high'
    elif fraud_probability >= 0.40:
        risk_level = 'medium'
    else:
        risk_level = 'low'

    return {
        'fraud_probability': round(fraud_probability, 4),
        'risk_score': risk_score,
        'risk_level': risk_level,
    }

def generate_description(feature, value):
    """Generate a human-readable description for a risk factor based on its actual value."""
    descriptions = {
        'account_age_days':              f"Account is only {int(value)} days old",
        'is_fb_verified':                "Seller does not have Facebook verification",
        'friends_count':                 f"Seller has only {int(value)} friends",
        'location_matches_listing':      "Seller location does not match listing location",
        'num_products_listed':           f"{int(value)} products listed",
        'avg_listing_price':             f"Average listing price is ${value:.2f}",
        'price_vs_category_median':      f"Price is {value:.1%} of category median",
        'listings_created_last_7d':      f"{int(value)} new listings in the last 7 days",
        'num_photos_per_listing':        f"Average of only {int(value)} photos per listing",
        'description_length':            f"Average listing description is only {int(value)} characters",
        'pct_stock_photos':              f"{value:.0%} of photos are stock images",
        'has_watermark_image':           "Watermarked images detected on listings",
        'copy_paste_listing_ratio':      f"{value:.0%} of descriptions appear copy-pasted",
        'cross_city_posting':            "Seller is posting listings across multiple cities",
        'num_categories':                f"Selling across {int(value)} categories",
        'num_reviews':                   f"Only {int(value)} reviews",
        'avg_rating':                    f"Rating is {value:.1f}/5",
        'pct_5_star':                    f"{value:.0%} of reviews are 5-star",
        'review_velocity_per_day':       f"{value:.1f} reviews per day",
        'avg_review_length_chars':       f"Average review is {int(value)} characters",
        'avg_response_time_hours':       f"Average response time is {value:.1f} hours",
        'response_rate':                 f"Response rate is {value:.0%}",
    }
    return descriptions.get(feature, f"{feature}: {value}")


def scale_shap_to_points(shap_values):
    """Convert raw SHAP values to user-friendly integer point scores.
    Points correspond directly to the percentage contribution to fraud probability (1 point = 1% risk increase)."""
    return [max(1, round(sv * 100)) for sv in shap_values]


def get_risk_factors(df, top_n=5):
    """Use SHAP to explain the prediction and return top risk factors.

    Args:
        df: Preprocessed single-row DataFrame aligned to MODEL_COLUMNS.
        top_n: Number of top risk factors to return.

    Returns:
        List of dicts with keys: title, description, score, icon, feature.
    """
    # get SHAP values
    shap_values = explainer.shap_values(df)
    shap_arr = np.array(shap_values)
    
    if len(shap_arr.shape) == 3:
        if shap_arr.shape[0] == 1:
            fraud_shap = shap_arr[0, :, 1]
        else:
            fraud_shap = shap_arr[1, 0, :]
    elif len(shap_arr.shape) == 2:
        fraud_shap = shap_arr[0, :]
    else:
        fraud_shap = shap_arr.flatten()

    # build feature-shap pairs
    # only include features that increase fraud probability by at least 1% (sv >= 0.01)
    feature_shap_pairs = []
    for idx, (col, sv) in enumerate(zip(MODEL_COLUMNS, fraud_shap)):
        if sv >= 0.01:
            feature_shap_pairs.append((col, sv, df.iloc[0][col]))

    # sort by SHAP value descending and take top N
    feature_shap_pairs.sort(key=lambda x: x[1], reverse=True)
    top_factors = feature_shap_pairs[:top_n]

    if not top_factors:
        return []

    # scale SHAP values to point scores
    raw_shap = [f[1] for f in top_factors]
    point_scores = scale_shap_to_points(raw_shap)

    # build the response
    risk_factors = []
    for (feature, shap_val, actual_val), points in zip(top_factors, point_scores):
        display = FEATURE_DISPLAY_MAP.get(feature, {'title': feature, 'icon': 'info'})
        description = generate_description(feature, actual_val)

        risk_factors.append({
            'title': display['title'],
            'description': description,
            'score': points,
            'icon': display['icon'],
            'feature': feature,
        })

    return risk_factors


#analyze seller
def analyze_seller(frontend_data):
    """Main entry point: takes raw frontend data and returns the full analysis.

    Args:
        frontend_data: Dict of seller attributes from the frontend.

    Returns:
        Dict with prediction results and top risk factors, ready for JSON response.
    """
    df = preprocess_input(frontend_data)
    prediction = predict(df)
    risk_factors = get_risk_factors(df)

    return {
        'fraud_probability': prediction['fraud_probability'],
        'risk_score': prediction['risk_score'],
        'risk_level': prediction['risk_level'],
        'risk_factors': risk_factors,
    }


# CLI entry point — reads JSON from stdin, writes result to stdout
if __name__ == '__main__':
    input_data = json.loads(sys.stdin.read())
    result = analyze_seller(input_data)
    print(json.dumps(result, default=str))