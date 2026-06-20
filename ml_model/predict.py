import os
import sys
import json
import joblib
import numpy as np
import pandas as pd

#config and constant

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'fraud_model.pkl')
MODEL_COLUMNS_PATH = os.path.join(os.path.dirname(__file__), 'feature_columns.pkl')
MODEL_EXPLAINER = os.path.join(os.path.dirname(__file__), 'shap_explainer.pkl')
DEFAULT_FEATURE_VALUES = {
    'account_age_days': 619,
    'seller_verified': 1,
    'has_business_license': 1,
    'num_products_listed': 67,
    'avg_listing_price': 18.57,
    'price_vs_category_median': 0.971,
    'listings_created_last_7d': 2,
    'pct_stock_photos': 0.268,
    'num_categories': 3,
    'total_orders': 24,
    'num_reviews': 5,
    'avg_rating': 4.29,
    'pct_5_star': 0.648,
    'pct_verified_purchase_reviews': 0.679,
    'review_velocity_per_day': 0.71,
    'avg_review_length_chars': 123,
    'avg_shipping_days': 4.5,
    'cancellation_rate': 0.05,
    'refund_rate': 0.066,
    'chargeback_rate': 0.008,
    'dispute_rate': 0.025,
    'complaint_count': 1,
    'avg_response_time_hours': 7.8,
    'response_rate': 0.768,
    'shared_ip_flag': 0,
    'address_mismatch_flag': 0,
    'payment_method_changes': 0,
    'seller_country_CN': 0,
    'seller_country_DE': 0,
    'seller_country_GB': 0,
    'seller_country_IN': 0,
    'seller_country_NG': 0,
    'seller_country_OTHER': 1,
    'seller_country_RU': 0,
    'seller_country_US': 0,
    'seller_country_VN': 0,
}

FEATURE_DISPLAY_MAP = {
    'account_age_days':              {'title': 'New Account',              'icon': 'clock'},
    'seller_verified':               {'title': 'Unverified Seller',        'icon': 'shield'},
    'has_business_license':          {'title': 'No Business License',      'icon': 'document'},
    'num_products_listed':           {'title': 'Listing Volume',           'icon': 'package'},
    'avg_listing_price':             {'title': 'Suspicious Pricing',       'icon': 'gift'},
    'price_vs_category_median':      {'title': 'Unusual Price',            'icon': 'tag'},
    'listings_created_last_7d':      {'title': 'Listing Spike',            'icon': 'chart'},
    'pct_stock_photos':              {'title': 'Stock Photos Used',        'icon': 'image'},
    'num_categories':                {'title': 'Category Spread',          'icon': 'grid'},
    'total_orders':                  {'title': 'Low Order Count',          'icon': 'shopping-cart'},
    'num_reviews':                   {'title': 'Few Reviews',              'icon': 'chat'},
    'avg_rating':                    {'title': 'Low Seller Rating',        'icon': 'star'},
    'pct_5_star':                    {'title': 'Suspicious Ratings',       'icon': 'star'},
    'pct_verified_purchase_reviews': {'title': 'Unverified Reviews',       'icon': 'check'},
    'review_velocity_per_day':       {'title': 'Review Spam',              'icon': 'zap'},
    'avg_review_length_chars':       {'title': 'Short Reviews',            'icon': 'type'},
    'avg_shipping_days':             {'title': 'Slow Shipping',            'icon': 'truck'},
    'cancellation_rate':             {'title': 'High Cancellations',       'icon': 'x-circle'},
    'refund_rate':                   {'title': 'High Refund Rate',         'icon': 'rotate'},
    'chargeback_rate':               {'title': 'Chargebacks Detected',     'icon': 'alert'},
    'dispute_rate':                  {'title': 'Frequent Disputes',        'icon': 'flag'},
    'complaint_count':               {'title': 'Customer Complaints',      'icon': 'megaphone'},
    'avg_response_time_hours':       {'title': 'Slow Response Time',       'icon': 'hourglass'},
    'response_rate':                 {'title': 'Low Response Rate',        'icon': 'mail'},
    'shared_ip_flag':                {'title': 'Shared IP Detected',       'icon': 'network'},
    'address_mismatch_flag':         {'title': 'Address Mismatch',         'icon': 'pin'},
    'payment_method_changes':        {'title': 'Payment Method Changes',   'icon': 'credit-card'},
}



#loading the model 
def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at '{MODEL_PATH}'"
        )
    return joblib.load(MODEL_PATH)
#loading the explainer shap
def load_explainer():
    if not os.path.exists(MODEL_EXPLAINER):
        raise FileNotFoundError(
            f"Explainer Model not found at '{MODEL_EXPLAINER}'"
        )
    return joblib.load(MODEL_EXPLAINER)

#loading the feature columns
def load_columns():
    if not os.path.exists(MODEL_COLUMNS_PATH):
        raise FileNotFoundError(
            f"Columns files doesn't exists at '{MODEL_COLUMNS_PATH}'"
        )
    return joblib.load(MODEL_COLUMNS_PATH)

clf = load_model()
explainer = load_explainer()
MODEL_COLUMNS = load_columns()
#preprocess_input
def preprocess_input(frontend_data):
    # work on a copy to avoid mutating the caller's dict
    data = frontend_data.copy()
    features = DEFAULT_FEATURE_VALUES.copy()

    # handle seller_country one-hot encoding first
    country_columns = [col for col in MODEL_COLUMNS if col.startswith('seller_country_')]
    if 'seller_country' in data:
        for col in country_columns:
            features[col] = 0
        country = data.pop('seller_country')
        country_key = f'seller_country_{country}'
        if country_key in features:
            features[country_key] = 1
        else:
            features['seller_country_OTHER'] = 1

    # overwrite defaults with remaining frontend values
    for key, val in data.items():
        if key in features:
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
        'seller_verified':               "Seller is not verified",
        'has_business_license':          "No business license on file",
        'num_products_listed':           f"{int(value)} products listed",
        'avg_listing_price':             f"Average listing price is ${value:.2f}",
        'price_vs_category_median':      f"Price is {value:.1%} of category median",
        'listings_created_last_7d':      f"{int(value)} new listings in the last 7 days",
        'pct_stock_photos':              f"{value:.0%} of photos are stock images",
        'num_categories':                f"Selling across {int(value)} categories",
        'total_orders':                  f"Only {int(value)} total orders",
        'num_reviews':                   f"Only {int(value)} reviews",
        'avg_rating':                    f"Rating is {value:.1f}/5",
        'pct_5_star':                    f"{value:.0%} of reviews are 5-star",
        'pct_verified_purchase_reviews': f"Only {value:.0%} of reviews are verified purchases",
        'review_velocity_per_day':       f"{value:.1f} reviews per day",
        'avg_review_length_chars':       f"Average review is {int(value)} characters",
        'avg_shipping_days':             f"Average shipping takes {value:.1f} days",
        'cancellation_rate':             f"Cancellation rate is {value:.0%}",
        'refund_rate':                   f"Refund rate is {value:.0%}",
        'chargeback_rate':               f"Chargeback rate is {value:.0%}",
        'dispute_rate':                  f"Dispute rate is {value:.0%}",
        'complaint_count':               f"{int(value)} customer complaints",
        'avg_response_time_hours':       f"Average response time is {value:.1f} hours",
        'response_rate':                 f"Response rate is {value:.0%}",
        'shared_ip_flag':                "Shared IP address detected",
        'address_mismatch_flag':         "Address does not match registration",
        'payment_method_changes':        f"{int(value)} payment method changes",
    }
    return descriptions.get(feature, f"{feature}: {value}")


def scale_shap_to_points(shap_values, max_points=30):
    """Convert raw SHAP values to user-friendly integer point scores.
    The top factor gets max_points, others scale proportionally."""
    if len(shap_values) == 0:
        return []
    max_shap = max(shap_values)
    if max_shap == 0:
        return [0] * len(shap_values)
    return [max(1, round((sv / max_shap) * max_points)) for sv in shap_values]


def get_risk_factors(df, top_n=5):
    """Use SHAP to explain the prediction and return top risk factors.

    Args:
        df: Preprocessed single-row DataFrame aligned to MODEL_COLUMNS.
        top_n: Number of top risk factors to return.

    Returns:
        List of dicts with keys: title, description, score, icon, feature.
    """
    # get SHAP values — shape is (1, n_features, 2), class 1 = fraud
    shap_values = explainer.shap_values(df)
    shap_arr = np.array(shap_values)
    fraud_shap = shap_arr[0, :, 1]  # first sample, all features, fraud class

    # sum seller_country_* columns into a single "Seller Location" factor
    country_cols = [col for col in MODEL_COLUMNS if col.startswith('seller_country_')]
    country_indices = [list(MODEL_COLUMNS).index(col) for col in country_cols]
    country_shap_sum = sum(fraud_shap[i] for i in country_indices)

    # build feature-shap pairs, excluding individual country columns
    feature_shap_pairs = []
    for idx, (col, sv) in enumerate(zip(MODEL_COLUMNS, fraud_shap)):
        if col.startswith('seller_country_'):
            continue
        if sv > 0:  # only positive contributors (pushing toward fraud)
            feature_shap_pairs.append((col, sv, df.iloc[0][col]))

    # add the grouped country factor if it pushes toward fraud
    if country_shap_sum > 0:
        # find which country is active
        active_country = 'Unknown'
        for col in country_cols:
            if df.iloc[0][col] == 1:
                active_country = col.replace('seller_country_', '')
                break
        feature_shap_pairs.append(('seller_country', country_shap_sum, active_country))

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
        if feature == 'seller_country':
            display = {'title': 'Seller Location', 'icon': 'globe'}
            description = f"Seller is located in {actual_val}"
        else:
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