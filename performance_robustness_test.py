import os
import time
import warnings
import joblib
import numpy as np
import pandas as pd

# Suppress version warning from scikit-learn
from sklearn.exceptions import InconsistentVersionWarning
warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Target configuration paths
MODEL_PATH = 'ml_model/fraud_model.pkl'
COLUMNS_PATH = 'ml_model/feature_columns.pkl'
DATA_PATH = 'ml_model/fake_sellers.csv'

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

def load_resources():
    print("Loading model binaries...")
    clf = joblib.load(MODEL_PATH)
    cols = joblib.load(COLUMNS_PATH)
    return clf, cols

def preprocess_dict(data, cols):
    features = DEFAULT_FEATURE_VALUES.copy()
    if 'seller_verified' in data and 'is_fb_verified' not in data:
        features['is_fb_verified'] = data['seller_verified']
    for key, val in data.items():
        if key in features and val is not None and not (isinstance(val, float) and np.isnan(val)):
            features[key] = val
    df = pd.DataFrame([features])
    df = df.reindex(columns=cols, fill_value=0)
    return df

def test_inference_latency(clf, cols, test_df, num_runs=500):
    print(f"\n--- 1. Inference Latency Benchmark (N = {num_runs} single-row runs) ---")
    
    # Warm up interpreter
    warmup_row = test_df.iloc[0].to_dict()
    for _ in range(10):
        df_processed = preprocess_dict(warmup_row, cols)
        _ = clf.predict_proba(df_processed)

    latencies = []
    for i in range(num_runs):
        row = test_df.iloc[i % len(test_df)].to_dict()
        
        start_time = time.perf_counter()
        df_processed = preprocess_dict(row, cols)
        _ = clf.predict_proba(df_processed)
        end_time = time.perf_counter()
        
        latencies.append((end_time - start_time) * 1000) # Convert to milliseconds

    latencies = np.array(latencies)
    mean_lat = np.mean(latencies)
    med_lat = np.percentile(latencies, 50)
    p95_lat = np.percentile(latencies, 95)
    p99_lat = np.percentile(latencies, 99)
    min_lat = np.min(latencies)
    max_lat = np.max(latencies)

    print(f"Mean Latency: {mean_lat:.3f} ms")
    print(f"Median Latency: {med_lat:.3f} ms")
    print(f"95th Percentile: {p95_lat:.3f} ms")
    print(f"99th Percentile: {p99_lat:.3f} ms")
    print(f"Minimum Latency: {min_lat:.3f} ms")
    print(f"Maximum Latency: {max_lat:.3f} ms")
    
    return {
        'mean': mean_lat,
        'median': med_lat,
        'p95': p95_lat,
        'p99': p99_lat
    }

def test_robustness_missing_data(clf, cols, test_df, labels):
    print("\n--- 2. Robustness to Missing / Dropped Features ---")
    missing_rates = [0.0, 0.1, 0.25, 0.5]
    
    for rate in missing_rates:
        correct_predictions = 0
        total = min(1000, len(test_df))
        
        for idx in range(total):
            row = test_df.iloc[idx].to_dict()
            actual_label = labels[idx]
            
            # Simulate missing features randomly
            corrupted_row = row.copy()
            if rate > 0:
                features_to_drop = np.random.choice(list(row.keys()), int(len(row) * rate), replace=False)
                for f in features_to_drop:
                    corrupted_row[f] = None
                    
            df_processed = preprocess_dict(corrupted_row, cols)
            prob = clf.predict_proba(df_processed)[0][1]
            pred_label = 1 if prob >= 0.50 else 0
            
            if pred_label == actual_label:
                correct_predictions += 1
                
        accuracy = (correct_predictions / total) * 100
        print(f"Feature Missingness Rate {rate * 100:.0f}% -> Accuracy: {accuracy:.2f}% (Sample Size: {total})")

def test_adversarial_robustness(clf, cols, test_df):
    print("\n--- 3. Adversarial Perturbation / Evasion Analysis ---")
    
    # Identify high-risk fraud cases to perturb
    high_risk_candidates = []
    for idx in range(min(2000, len(test_df))):
        row = test_df.iloc[idx].to_dict()
        df_processed = preprocess_dict(row, cols)
        prob = clf.predict_proba(df_processed)[0][1]
        
        # We target actual fraud patterns that are detected as high risk
        if prob >= 0.85:
            high_risk_candidates.append((row, prob))
            if len(high_risk_candidates) >= 100:
                break
                
    if not high_risk_candidates:
        print("No high-risk candidates found for adversarial analysis.")
        return

    print(f"Selected {len(high_risk_candidates)} detected fraud profiles for evasion testing.")
    
    # Scenario A: Scammer manipulates account age to appear older (e.g. inflate by 2 years)
    prob_drops_age = []
    # Scenario B: Scammer inflates social graph (friends count to 1000)
    prob_drops_friends = []
    # Scenario C: Combined evasion (Age + Friends + Verified status)
    prob_drops_combined = []

    for row, orig_prob in high_risk_candidates:
        # Age perturbation
        row_age = row.copy()
        row_age['account_age_days'] = row_age.get('account_age_days', 0) + 730
        df_age = preprocess_dict(row_age, cols)
        prob_age = clf.predict_proba(df_age)[0][1]
        prob_drops_age.append(orig_prob - prob_age)

        # Friends count perturbation
        row_friends = row.copy()
        row_friends['friends_count'] = 1000.0
        df_friends = preprocess_dict(row_friends, cols)
        prob_friends = clf.predict_proba(df_friends)[0][1]
        prob_drops_friends.append(orig_prob - prob_friends)

        # Combined evasion
        row_comb = row.copy()
        row_comb['account_age_days'] = row_comb.get('account_age_days', 0) + 730
        row_comb['friends_count'] = 1000.0
        row_comb['is_fb_verified'] = 1
        df_comb = preprocess_dict(row_comb, cols)
        prob_comb = clf.predict_proba(df_comb)[0][1]
        prob_drops_combined.append(orig_prob - prob_comb)

    mean_drop_age = np.mean(prob_drops_age)
    mean_drop_friends = np.mean(prob_drops_friends)
    mean_drop_comb = np.mean(prob_drops_combined)

    print(f"Inflation of Account Age by 2 Years -> Mean Fraud Probability Drop: {mean_drop_age * 100:.2f}%")
    print(f"Inflation of Friends Count to 1000 -> Mean Fraud Probability Drop: {mean_drop_friends * 100:.2f}%")
    print(f"Combined Evasion (Age + Friends + Verification) -> Mean Fraud Probability Drop: {mean_drop_comb * 100:.2f}%")

def main():
    if not os.path.exists(DATA_PATH):
        print(f"Dataset file not found at '{DATA_PATH}'")
        return

    print("Loading test dataset records...")
    # Load 5000 records to perform efficient runtime analysis
    df = pd.read_csv(DATA_PATH, nrows=5000)
    
    if 'is_fake' not in df.columns:
        print("Label column 'is_fake' not found in dataset.")
        return
        
    labels = df['is_fake'].values
    test_df = df.drop(columns=['is_fake', 'seller_id', 'fraud_risk_score', 'seller_country'], errors='ignore')
    
    clf, cols = load_resources()
    
    # Run tests
    test_inference_latency(clf, cols, test_df, num_runs=500)
    test_robustness_missing_data(clf, cols, test_df, labels)
    test_adversarial_robustness(clf, cols, test_df)

if __name__ == "__main__":
    main()
