import os
import sys
import json
import sqlite3
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.preprocessing import LabelEncoder

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Initialize Flask
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__,
            static_folder=os.path.join(BASE_DIR, "static"),
            template_folder=os.path.join(BASE_DIR, "templates"))
CORS(app)

# Locate dataset
csv_candidates = [
    os.path.join(BASE_DIR, "hiring_data.csv"),
    os.path.join(BASE_DIR, "Hiring Data Analysis", "hiring_data.csv"),
    "hiring_data.csv"
]
csv_path = next((f for f in csv_candidates if os.path.exists(f)), None)
if not csv_path:
    raise FileNotFoundError("Could not locate hiring_data.csv in workspace.")

print(f"[*] Loading hiring dataset from: {csv_path}")
df_raw = pd.read_csv(csv_path)
df_raw["application_date"] = pd.to_datetime(df_raw["application_date"])

# Initialize SQLite In-Memory Database
sqlite_conn = sqlite3.connect(":memory:", check_same_thread=False)
# Save copy for SQL queries
df_raw.to_sql("hiring", sqlite_conn, index=False, if_exists="replace")

# Prepare and train ML models
print("[*] Training Offer Acceptance Machine Learning models...")
ml_df = df_raw[df_raw["offered"] == True].copy()
ml_df["salary_ratio"] = ml_df["offered_salary"] / ml_df["expected_salary"].replace(0, np.nan)
ml_df = ml_df.dropna(subset=["salary_ratio", "interview_score"]).copy()

encoders = {}
cat_cols = ["department", "role_level", "source", "gender", "education"]
for col in cat_cols:
    le = LabelEncoder()
    ml_df[col + "_enc"] = le.fit_transform(ml_df[col].astype(str))
    encoders[col] = le

feature_cols = [
    "department_enc", "role_level_enc", "source_enc", "gender_enc",
    "education_enc", "experience_years", "interview_score", "salary_ratio"
]
feature_labels = [
    "Department", "Role Level", "Source", "Gender",
    "Education", "Experience (Years)", "Interview Score", "Salary Ratio"
]

X = ml_df[feature_cols]
y = ml_df["accepted"].astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestClassifier(n_estimators=200, random_state=42)
rf_model.fit(X_train, y_train)
rf_acc = accuracy_score(y_test, rf_model.predict(X_test))
rf_auc = roc_auc_score(y_test, rf_model.predict_proba(X_test)[:, 1])

gb_model = GradientBoostingClassifier(n_estimators=200, learning_rate=0.05, random_state=42)
gb_model.fit(X_train, y_train)
gb_acc = accuracy_score(y_test, gb_model.predict(X_test))
gb_auc = roc_auc_score(y_test, gb_model.predict_proba(X_test)[:, 1])

print(f"[*] Random Forest Model -> Accuracy: {rf_acc*100:.2f}%, AUC-ROC: {rf_auc:.4f}")
print(f"[*] Gradient Boosting   -> Accuracy: {gb_acc*100:.2f}%, AUC-ROC: {gb_auc:.4f}")

# Categorical options for UI dropdowns
CATEGORICAL_OPTIONS = {
    "departments": sorted(df_raw["department"].unique().tolist()),
    "roles": ["Junior", "Mid-Level", "Senior", "Lead", "Manager"],
    "sources": sorted(df_raw["source"].unique().tolist()),
    "genders": sorted(df_raw["gender"].unique().tolist()),
    "educations": sorted(df_raw["education"].unique().tolist()),
    "cities": sorted(df_raw["city"].unique().tolist())
}

# ── ROUTES ──────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/meta")
def get_meta():
    return jsonify({
        "total_records": len(df_raw),
        "date_range": {
            "start": df_raw["application_date"].min().strftime("%Y-%m-%d"),
            "end": df_raw["application_date"].max().strftime("%Y-%m-%d")
        },
        "options": CATEGORICAL_OPTIONS,
        "models": {
            "rf": {"accuracy": round(rf_acc * 100, 2), "auc": round(rf_auc, 4)},
            "gb": {"accuracy": round(gb_acc * 100, 2), "auc": round(gb_auc, 4)}
        }
    })

@app.route("/api/kpis")
def get_kpis():
    total_apps = len(df_raw)
    screened = int(df_raw["screened"].sum())
    interviewed = int(df_raw["interviewed"].sum())
    offered = int(df_raw["offered"].sum())
    accepted = int(df_raw["accepted"].sum())
    joined = int(df_raw["joined"].sum())
    
    avg_days_to_hire = round(float(df_raw["days_to_hire"].dropna().mean()), 1)
    avg_score = round(float(df_raw["interview_score"].dropna().mean()), 2)
    avg_offered_sal = round(float(df_raw["offered_salary"].dropna().mean()), 0)
    avg_expected_sal = round(float(df_raw["expected_salary"].dropna().mean()), 0)

    return jsonify({
        "total_applications": total_apps,
        "screened": screened,
        "screen_rate": round(screened / total_apps * 100, 2),
        "interviewed": interviewed,
        "interview_rate": round(interviewed / total_apps * 100, 2),
        "offered": offered,
        "offer_rate": round(offered / total_apps * 100, 2),
        "accepted": accepted,
        "acceptance_rate": round(accepted / offered * 100, 2) if offered else 0,
        "joined": joined,
        "hire_rate": round(joined / total_apps * 100, 2),
        "avg_days_to_hire": avg_days_to_hire,
        "avg_interview_score": avg_score,
        "avg_offered_salary": avg_offered_sal,
        "avg_expected_salary": avg_expected_sal,
        "salary_gap": round(avg_offered_sal - avg_expected_sal, 0)
    })

@app.route("/api/funnel")
def get_funnel():
    stages = [
        {"stage": "Applications", "count": int(len(df_raw))},
        {"stage": "Screened", "count": int(df_raw["screened"].sum())},
        {"stage": "Interviewed", "count": int(df_raw["interviewed"].sum())},
        {"stage": "Offered", "count": int(df_raw["offered"].sum())},
        {"stage": "Accepted", "count": int(df_raw["accepted"].sum())},
        {"stage": "Joined", "count": int(df_raw["joined"].sum())}
    ]
    base = stages[0]["count"]
    for i, item in enumerate(stages):
        item["overall_conversion"] = round(item["count"] / base * 100, 2)
        if i > 0:
            prev_cnt = stages[i-1]["count"]
            item["stage_conversion"] = round(item["count"] / prev_cnt * 100, 2) if prev_cnt else 0
            item["drop_off_pct"] = round((prev_cnt - item["count"]) / prev_cnt * 100, 2) if prev_cnt else 0
        else:
            item["stage_conversion"] = 100.0
            item["drop_off_pct"] = 0.0
    return jsonify(stages)

@app.route("/api/departments")
def get_departments():
    grouped = df_raw.groupby("department").agg(
        applications=("candidate_id", "count"),
        screened=("screened", "sum"),
        interviewed=("interviewed", "sum"),
        offered=("offered", "sum"),
        accepted=("accepted", "sum"),
        joined=("joined", "sum"),
        avg_score=("interview_score", "mean"),
        avg_days=("days_to_hire", "mean"),
        avg_offered=("offered_salary", "mean"),
        avg_expected=("expected_salary", "mean")
    ).reset_index()

    grouped["hire_rate"] = (grouped["joined"] / grouped["applications"] * 100).round(2)
    grouped["screen_rate"] = (grouped["screened"] / grouped["applications"] * 100).round(2)
    grouped["offer_accept_rate"] = (grouped["accepted"] / grouped["offered"] * 100).round(2)
    grouped["avg_score"] = grouped["avg_score"].round(2)
    grouped["avg_days"] = grouped["avg_days"].round(1)
    grouped["avg_offered"] = grouped["avg_offered"].round(0)
    grouped["avg_expected"] = grouped["avg_expected"].round(0)
    grouped = grouped.sort_values(by="applications", ascending=False)
    return jsonify(grouped.to_dict(orient="records"))

@app.route("/api/sources")
def get_sources():
    grouped = df_raw.groupby("source").agg(
        applications=("candidate_id", "count"),
        screened=("screened", "sum"),
        interviewed=("interviewed", "sum"),
        offered=("offered", "sum"),
        accepted=("accepted", "sum"),
        joined=("joined", "sum"),
        avg_days=("days_to_hire", "mean"),
        avg_offered=("offered_salary", "mean")
    ).reset_index()

    grouped["screen_rate"] = (grouped["screened"] / grouped["applications"] * 100).round(2)
    grouped["hire_rate"] = (grouped["joined"] / grouped["applications"] * 100).round(2)
    grouped["avg_days"] = grouped["avg_days"].round(1)
    grouped["avg_offered"] = grouped["avg_offered"].round(0)
    grouped = grouped.sort_values(by="hire_rate", ascending=False)
    return jsonify(grouped.to_dict(orient="records"))

@app.route("/api/salary_stats")
def get_salary_stats():
    offered_df = df_raw[df_raw["offered"] == True]
    role_order = ["Junior", "Mid-Level", "Senior", "Lead", "Manager"]
    grouped = offered_df.groupby("role_level").agg(
        offers=("candidate_id", "count"),
        avg_offered=("offered_salary", "mean"),
        avg_expected=("expected_salary", "mean")
    ).reindex(role_order).reset_index()

    grouped["gap"] = (grouped["avg_offered"] - grouped["avg_expected"]).round(0)
    grouped["gap_pct"] = ((grouped["avg_offered"] - grouped["avg_expected"]) / grouped["avg_expected"] * 100).round(2)
    grouped["ratio"] = (grouped["avg_offered"] / grouped["avg_expected"]).round(3)
    grouped["avg_offered_lakhs"] = (grouped["avg_offered"] / 100000).round(2)
    grouped["avg_expected_lakhs"] = (grouped["avg_expected"] / 100000).round(2)
    return jsonify(grouped.to_dict(orient="records"))

@app.route("/api/diversity")
def get_diversity():
    pivot = df_raw.pivot_table(index="department", columns="gender", values="candidate_id", aggfunc="count", fill_value=0)
    pivot_pct = pivot.div(pivot.sum(axis=1), axis=0) * 100
    res = []
    for dept in pivot.index:
        res.append({
            "department": dept,
            "Male": int(pivot.loc[dept].get("Male", 0)),
            "Female": int(pivot.loc[dept].get("Female", 0)),
            "Other": int(pivot.loc[dept].get("Other", 0)),
            "Male_pct": round(float(pivot_pct.loc[dept].get("Male", 0)), 1),
            "Female_pct": round(float(pivot_pct.loc[dept].get("Female", 0)), 1),
            "Other_pct": round(float(pivot_pct.loc[dept].get("Other", 0)), 1)
        })
    return jsonify(res)

@app.route("/api/experience_stats")
def get_experience_stats():
    exp_bins = pd.cut(df_raw["experience_years"], bins=[0, 2, 5, 8, 12, 16],
                      labels=["0-2 yrs", "2-5 yrs", "5-8 yrs", "8-12 yrs", "12+ yrs"], include_lowest=True)
    grouped = df_raw.groupby(exp_bins, observed=False).agg(
        applications=("candidate_id", "count"),
        joined=("joined", "sum")
    ).reset_index()
    grouped["hire_rate"] = (grouped["joined"] / grouped["applications"] * 100).round(2)
    return jsonify(grouped.to_dict(orient="records"))

@app.route("/api/monthly_trend")
def get_monthly_trend():
    df_copy = df_raw.copy()
    df_copy["month"] = df_copy["application_date"].dt.to_period("M").astype(str)
    grouped = df_copy.groupby("month").agg(
        applications=("candidate_id", "count"),
        joined=("joined", "sum")
    ).reset_index()
    return jsonify(grouped.to_dict(orient="records"))

@app.route("/api/ml_info")
def get_ml_info():
    fi_rf = pd.Series(rf_model.feature_importances_, index=feature_labels).sort_values(ascending=False).to_dict()
    fi_gb = pd.Series(gb_model.feature_importances_, index=feature_labels).sort_values(ascending=False).to_dict()
    return jsonify({
        "models": {
            "random_forest": {"accuracy": round(rf_acc * 100, 2), "auc": round(rf_auc, 4)},
            "gradient_boosting": {"accuracy": round(gb_acc * 100, 2), "auc": round(gb_auc, 4)}
        },
        "feature_importances_rf": {k: round(v, 4) for k, v in fi_rf.items()},
        "feature_importances_gb": {k: round(v, 4) for k, v in fi_gb.items()}
    })

@app.route("/api/predict", methods=["POST"])
def predict_acceptance():
    try:
        data = request.json or {}
        dept = data.get("department", "Engineering")
        role = data.get("role_level", "Mid-Level")
        source = data.get("source", "LinkedIn")
        gender = data.get("gender", "Female")
        edu = data.get("education", "B.Tech")
        exp = float(data.get("experience_years", 4.0))
        score = float(data.get("interview_score", 7.5))
        offered_sal = float(data.get("offered_salary", 750000))
        expected_sal = float(data.get("expected_salary", 800000))

        if expected_sal <= 0:
            expected_sal = 1.0
        salary_ratio = offered_sal / expected_sal

        # Encode
        d_enc = encoders["department"].transform([dept])[0] if dept in encoders["department"].classes_ else 0
        r_enc = encoders["role_level"].transform([role])[0] if role in encoders["role_level"].classes_ else 0
        s_enc = encoders["source"].transform([source])[0] if source in encoders["source"].classes_ else 0
        g_enc = encoders["gender"].transform([gender])[0] if gender in encoders["gender"].classes_ else 0
        e_enc = encoders["education"].transform([edu])[0] if edu in encoders["education"].classes_ else 0

        features_input = np.array([[d_enc, r_enc, s_enc, g_enc, e_enc, exp, score, salary_ratio]])

        gb_prob = float(gb_model.predict_proba(features_input)[0, 1])
        rf_prob = float(rf_model.predict_proba(features_input)[0, 1])
        ensemble_prob = round((gb_prob * 0.65 + rf_prob * 0.35) * 100, 1)

        # Actionable insight generator
        recommendation = ""
        risk_level = "LOW"
        if ensemble_prob >= 70:
            risk_level = "LOW"
            recommendation = "Candidate has a strong acceptance profile. Current salary ratio is competitive."
        elif ensemble_prob >= 45:
            risk_level = "MODERATE"
            gap = expected_sal - offered_sal
            if gap > 0:
                bump = round(gap * 0.5)
                recommendation = f"Borderline acceptance risk. Bumping offer by ₹{bump:,} would increase salary ratio to {(offered_sal + bump)/expected_sal:.2f} and elevate probability above 70%."
            else:
                recommendation = "Candidate shows moderate propensity. Highlight career growth and non-monetary benefits."
        else:
            risk_level = "HIGH"
            gap = expected_sal - offered_sal
            if gap > 0:
                recommendation = f"High likelihood of offer rejection. Severe salary discount (Offered is {salary_ratio*100:.1f}% of expected). Recommend aligning offer closer to ₹{expected_sal:,}."
            else:
                recommendation = "High risk of offer rejection. Interview score or experience mismatch indicates hesitation."

        return jsonify({
            "probability": ensemble_prob,
            "gb_probability": round(gb_prob * 100, 1),
            "rf_probability": round(rf_prob * 100, 1),
            "will_accept": ensemble_prob >= 50.0,
            "risk_level": risk_level,
            "salary_ratio": round(salary_ratio, 3),
            "salary_gap": round(offered_sal - expected_sal, 0),
            "recommendation": recommendation
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/sql", methods=["POST"])
def run_sql():
    try:
        data = request.json or {}
        query = data.get("query", "").strip()
        if not query:
            return jsonify({"error": "Query cannot be empty"}), 400
        
        # Security: only allow SELECT queries
        clean_query = query.strip().lower()
        if not (clean_query.startswith("select") or clean_query.startswith("with")):
            return jsonify({"error": "Only SELECT queries are permitted in this console"}), 400

        cursor = sqlite_conn.cursor()
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        
        # Limit rows to 100 for responsive UI
        limited_rows = rows[:100]
        result = [dict(zip(columns, row)) for row in limited_rows]
        return jsonify({
            "columns": columns,
            "rows": result,
            "total_count": len(rows),
            "returned_count": len(result)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/candidates")
def get_candidates():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    search = request.args.get("search", "").strip().lower()
    dept = request.args.get("department", "all")
    status = request.args.get("status", "all")

    filtered = df_raw.copy()
    if dept != "all":
        filtered = filtered[filtered["department"] == dept]
    if status == "joined":
        filtered = filtered[filtered["joined"] == True]
    elif status == "offered":
        filtered = filtered[filtered["offered"] == True]
    elif status == "screened":
        filtered = filtered[filtered["screened"] == True]
    elif status == "rejected_offer":
        filtered = filtered[(filtered["offered"] == True) & (filtered["accepted"] == False)]

    if search:
        mask = (
            filtered["candidate_id"].str.lower().str.contains(search) |
            filtered["department"].str.lower().str.contains(search) |
            filtered["role_level"].str.lower().str.contains(search) |
            filtered["source"].str.lower().str.contains(search) |
            filtered["city"].str.lower().str.contains(search)
        )
        filtered = filtered[mask]

    total_matches = len(filtered)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    sliced = filtered.iloc[start_idx:end_idx].copy()
    
    # Format date
    sliced["application_date"] = sliced["application_date"].dt.strftime("%Y-%m-%d")
    sliced = sliced.fillna({"interview_score": "-", "offered_salary": "-", "expected_salary": "-", "days_to_hire": "-"})

    return jsonify({
        "total": total_matches,
        "page": page,
        "per_page": per_page,
        "total_pages": int(np.ceil(total_matches / per_page)) if per_page else 1,
        "data": sliced.to_dict(orient="records")
    })

@app.route("/api/export/<dataset>")
def export_dataset(dataset):
    outputs_dir = os.path.join(BASE_DIR, "outputs")
    file_map = {
        "funnel": "powerbi_funnel.csv",
        "dept_stats": "powerbi_dept_stats.csv",
        "source_stats": "powerbi_source_stats.csv",
        "salary_analysis": "powerbi_salary_analysis.csv"
    }
    fname = file_map.get(dataset)
    if fname and os.path.exists(os.path.join(outputs_dir, fname)):
        return send_from_directory(outputs_dir, fname, as_attachment=True)
    return jsonify({"error": "Dataset export not found"}), 404

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"\n==================================================================")
    print(f"  HIRING PROCESS ANALYTICS & ML INTELLIGENCE DASHBOARD")
    print(f"  Server running on http://{host}:{port}")
    print(f"==================================================================\n")
    app.run(host=host, port=port, debug=False)
