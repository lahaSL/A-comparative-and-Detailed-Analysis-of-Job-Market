# 🎯 Hiring Process Analysis & Decision Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-black.svg?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.8.0-orange.svg?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![SQLite](https://img.shields.io/badge/SQLite-In--Memory-003B57.svg?logo=sqlite&logoColor=white)](https://sqlite.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.2-FF6384.svg?logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![Power BI](https://img.shields.io/badge/Power_BI-Ready_CSVs-F2C811.svg?logo=powerbi&logoColor=black)](https://powerbi.microsoft.com/)

An end-to-end Talent Analytics & Recruitment Decision Intelligence Platform analyzing **5,000 candidate records** across 8 enterprise business units (2022–2024). Features exploratory data analysis, SQLite-driven funnel analytics, salary discrepancy modeling, predictive machine learning (Gradient Boosting & Random Forest) for offer acceptance, and an interactive **Obsidian Glass Web GUI Dashboard**.

---

## 📑 Table of Contents
- [Executive Summary](#-executive-summary)
- [Key Business Insights & Metrics](#-key-business-insights--metrics)
- [Recruitment Funnel Breakdown](#-recruitment-funnel-breakdown)
- [Interactive Web GUI Dashboard](#-interactive-web-gui-dashboard)
- [Machine Learning — Offer Acceptance Prediction](#-machine-learning--offer-acceptance-prediction)
- [SQL Analytics & Schema](#-sql-analytics--schema)
- [Visualizations & Power BI Integration](#-visualizations--power-bi-integration)
- [Installation & Quickstart](#-installation--quickstart)
- [Project Architecture & Directory Layout](#-project-architecture--directory-layout)
- [Author & Connect](#-author--connect)

---

## 💼 Executive Summary

Recruitment pipelines often leak qualified talent at critical inflection points. By analyzing 5,000 multi-stage recruitment records over a 3-year timeline, this project maps the exact candidate journey:
- **Application ➔ Screening ➔ Technical & HR Interviews ➔ Offer Extended ➔ Offer Accepted ➔ Onboarding**.
- Identifies the organizational bottleneck: **51.1% of all job offers are rejected**.
- Isolates the root cause using machine learning: **Salary Discrepancy (Offered vs. Expected)** accounts for **72.3%** of the decision variance.
- Provides a real-time **What-If Offer Acceptance Simulator** and **SQL Studio** allowing recruiters and HR executives to stress-test compensation packages before extending formal offers.

---

## 📊 Key Business Insights & Metrics

| Strategic Metric | Value | Business Impact / Interpretation |
|:---|:---:|:---|
| **Total Cohort Size** | **5,000** | Full recruitment lifecycle records across 2022–2024 |
| **Overall Hire Rate** | **10.8%** | 539 candidates successfully joined out of 5,000 applicants |
| **Screening Pass Rate** | **63.9%** | 3,194 candidates met preliminary qualification criteria |
| **Offer Acceptance Rate** | **48.9%** | Only 617 accepted out of 1,263 extended job offers (Critical Bottleneck) |
| **Average Time-to-Hire** | **43 Days** | Fastest: Product (40.7d) \| Longest: HR (47.0d) & Campus (46.4d) |
| **Top Sourcing Channel (ROI)**| **Employee Referral** | **12.62%** hire rate & **80.3%** screening pass rate |
| **Highest Volume Source** | **LinkedIn** | 1,471 applications (29.4% share) with 11.22% hire rate |
| **Average Salary Deficit** | **~2.5% below expected** | Uniform deficit across all levels driving candidate drop-offs |
| **Best Predictive Model** | **Gradient Boosting** | **69.17% Accuracy \| 0.7747 AUC-ROC** |
| **Primary Acceptance Driver**| **Salary Ratio (72.3%)** | Ratio of offered to expected salary dominates acceptance decisions |

---

## 🔻 Recruitment Funnel Breakdown

```
[Applications: 5,000] (100%)
        │   Drop-off: 36.1%
        ▼
[Screened:     3,194] (63.9%)
        │   Drop-off: 28.4%
        ▼
[Interviewed:  2,288] (45.8%)
        │   Drop-off: 44.8%
        ▼
[Offered:      1,263] (25.3%)
        │   Drop-off: 51.1%  ⚠️ CRITICAL BOTTLENECK
        ▼
[Accepted:       617] (12.3%)
        │   Drop-off: 12.6% (renege / drop before start date)
        ▼
[Joined:         539] (10.8%)
```

### Department Conversion Breakdown

| Department | Applications | Screened | Interviewed | Offers | Hires | Hire Rate | Offer Accept % | Avg Days |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Operations** | 420 | 256 | 177 | 104 | 50 | **11.90%** | **53.85%** | 43.3d |
| **Marketing** | 506 | 343 | 237 | 127 | 58 | **11.46%** | **51.97%** | 45.9d |
| **Engineering**| 1,209 | 790 | 584 | 329 | 133 | **11.00%** | **48.02%** | 42.5d |
| **Data Science**| 967 | 608 | 440 | 231 | 104 | **10.75%** | **51.95%** | 42.7d |
| **Finance** | 423 | 267 | 195 | 106 | 45 | **10.64%** | **48.11%** | 44.7d |
| **HR** | 358 | 232 | 167 | 88 | 38 | **10.61%** | **48.86%** | 47.0d |
| **Product** | 347 | 210 | 144 | 82 | 35 | **10.09%** | **46.34%** | **40.7d** |
| **Sales** | 770 | 488 | 344 | 196 | 76 | **9.87%** | **43.37%** | **40.4d** |

---

## 🖥️ Interactive Web GUI Dashboard

A dedicated, responsive web GUI built with **Flask**, **Vanilla CSS (Obsidian Glassmorphism)**, and **Chart.js**.

### Key Modules:
1. **Executive Overview**: Real-time KPI tiles with glowing indicator bars, hiring funnel drop-off visualization, departmental volume vs hires comparison, sourcing channel yield, and monthly application trend.
2. **Funnel & Department Analytics**: Interactive departmental selector, turnaround benchmark chart, and gender diversity stacked representation.
3. **Compensation & Benchmarking**: Seniority-level salary gap comparisons (Junior to Manager in ₹ Lakhs) and experience-band hire correlations.
4. **Machine Learning What-If Simulator**:
   - Live interactive inputs: Department, Role Level, Source, Education, Gender, Experience slider, Interview score slider, Expected Salary, and Offered Salary.
   - Calculates dynamic **Salary Ratio gauge**.
   - Dual-model consensus (Gradient Boosting + Random Forest).
   - Real-time probability circle (0–100%), attrition risk classification (`LOW`, `MODERATE`, `HIGH`), and prescriptive AI salary counter-offer recommendations!
5. **Interactive SQL Studio**:
   - In-memory SQLite terminal connected to candidate records.
   - 1-click preset queries (Full Funnel, Source ROI, Compensation Gap, Department Velocity, High-Score Rejections).
   - Real-time tabular result viewer with query performance metrics.
6. **Candidate Explorer**:
   - Searchable, filterable candidate data grid with live status badges (`Joined`, `Accepted`, `Offer Declined`, `Screened`), pagination, and export tools.

---

## 🤖 Machine Learning — Offer Acceptance Prediction

Predicts candidate likelihood to accept a formal job offer given compensation alignment, qualifications, and interview ratings.

### Models & Performance Comparison

| Metric / Attribute | Random Forest (200 Trees) | Gradient Boosting (200 Estimators) | Winner |
|:---|:---:|:---:|:---:|
| **Test Accuracy** | 67.98% | **69.17%** | 🏆 **Gradient Boosting** |
| **AUC-ROC Score** | 0.7588 | **0.7747** | 🏆 **Gradient Boosting** |
| **Learning Rate** | — | 0.05 | Stable convergence |
| **Ensemble Role** | Robust baseline | Primary probability estimator | Dual consensus |

### Feature Importances (Gradient Boosting)

```
Salary Ratio (Offered / Expected)  ████████████████████████████████  72.27%
Experience (Years)                 ████                               8.70%
Interview Score                    ████                               8.01%
Education Level                    █                                  3.10%
Department                         █                                  3.06%
Gender                             █                                  2.24%
Sourcing Channel                   █                                  1.93%
Role Level                                                            0.68%
```

> **Takeaway:** Candidate decision-making is heavily economic. While qualifications dictate whether an offer is made, the **ratio between offered and expected salary** single-handedly dictates whether the candidate accepts.

---

## ⚡ SQL Analytics & Schema

The dataset is ingested into an in-memory SQLite database (`table: hiring`) for fast analytical querying.

### Core Schema (`hiring` table)
- `candidate_id` *(TEXT)*: Unique identifier (e.g. `CAND00001`)
- `application_date` *(DATE)*: Application submission date (2022–2024)
- `department` *(TEXT)*: 8 departments (Engineering, Data Science, etc.)
- `role_level` *(TEXT)*: Junior, Mid-Level, Senior, Lead, Manager
- `source` *(TEXT)*: Recruitment channel
- `gender` *(TEXT)*: Male, Female, Other
- `education` *(TEXT)*: B.Tech, MBA, MCA, M.Tech, B.Sc, BBA, PhD
- `city` *(TEXT)*: 8 Tier-1/2 Indian tech hubs
- `experience_years` *(REAL)*: 0.0 to 15.0 years
- `screened`, `interviewed`, `offered`, `accepted`, `joined` *(INTEGER 0/1)*: Funnel stage gates
- `interview_score` *(REAL)*: Interview rating (4.0 – 10.0)
- `offered_salary`, `expected_salary` *(REAL)*: Remuneration in ₹ INR
- `days_to_hire` *(REAL)*: End-to-end turnaround time in days

### Sample Executive Query (Recruitment Source ROI)
```sql
SELECT 
    source,
    COUNT(*) AS total_applications,
    SUM(CASE WHEN joined = 1 THEN 1 ELSE 0 END) AS total_hires,
    ROUND(SUM(CASE WHEN joined = 1 THEN 1.0 ELSE 0 END) * 100 / COUNT(*), 1) AS hire_rate_pct,
    ROUND(AVG(days_to_hire), 1) AS avg_turnaround_days
FROM hiring
GROUP BY source
ORDER BY hire_rate_pct DESC;
```

---

## 📈 Visualizations & Power BI Integration

The analytical script automatically generates **10 high-resolution charts** in `outputs/` alongside **4 Power BI-ready data exports**:

1. `01_hiring_funnel.png`: Horizontal funnel visualization with retention percentages.
2. `02_hire_rate_by_dept.png`: Departmental hire conversion vs organizational average.
3. `03_source_effectiveness.png`: Application volume paired with hire rate.
4. `04_time_to_hire.png`: Departmental turnaround velocity.
5. `05_salary_analysis.png`: Role-level offered vs. expected remuneration comparison.
6. `06_gender_diversity.png`: Gender proportions across departments.
7. `07_interview_scores.png`: Score distributions and offer correlation.
8. `08_monthly_applications.png`: 36-month recruitment seasonality trajectory.
9. `09_ml_feature_importance.png`: Feature weight ranking from Random Forest & Gradient Boosting.
10. `10_experience_vs_hire_rate.png`: Conversion rates across 5 career experience bands.

### Power BI Data Feeds:
- `outputs/powerbi_funnel.csv`
- `outputs/powerbi_dept_stats.csv`
- `outputs/powerbi_source_stats.csv`
- `outputs/powerbi_salary_analysis.csv`

---

## 🚀 Installation & Quickstart

### Prerequisites
- Python 3.10+
- Required libraries:
  ```bash
  pip install pandas numpy matplotlib seaborn scikit-learn flask flask-cors
  ```

### Option A: Launch Interactive Web GUI (Recommended)
You can launch the GUI using the Python runner or by double-clicking the Windows batch file:

```bash
# Method 1: Using Python runner (starts server and opens browser automatically)
python run_gui.py

# Method 2: Direct Flask app launch
python app.py

# Method 3: Windows 1-Click Batch file
double-click run_gui.bat
```
Navigate to `http://127.0.0.1:5000` to interact with the dashboard.

### Option B: Run Headless Analysis & Chart Generation
To regenerate all 10 PNG charts, terminal summaries, and Power BI CSVs:

```bash
python hiring_analysis.py
```

### Option C: Re-simulate Dataset
To regenerate the 5,000 synthetic recruitment records with custom seeds or rules:

```bash
python generate_data.py
```

### Option D: Run with Docker (Containerized)

You can build and run the entire application using Docker without needing a local Python environment.

#### 1. Quick Launch with Docker Compose (Recommended)
```bash
docker compose up --build
```
The dashboard will be live at `http://localhost:5000`. To run in the background, add `-d`:
```bash
docker compose up -d --build
```
To stop the container:
```bash
docker compose down
```

#### 2. Manual Docker Build & Run
```bash
# Build the Docker image
docker build -t hiring-analytics-dashboard:latest .

# Run the container (maps port 5000)
docker run -d -p 5000:5000 --name hiring_analytics_app hiring-analytics-dashboard:latest

# Check container status
docker ps

# View container logs
docker logs -f hiring_analytics_app

# Stop and remove the container
docker stop hiring_analytics_app && docker rm hiring_analytics_app
```

---

## 📂 Project Architecture & Directory Layout

```
Hiring Data Analysis/
├── Dockerfile                  # Production container definition (Python 3.11 slim, non-root user)
├── docker-compose.yml          # Single-command container orchestration
├── .dockerignore               # Optimized Docker build context exclusions
├── requirements.txt            # Python dependencies (Flask, Scikit-learn, Pandas, Gunicorn)
├── app.py                      # Flask REST API server, ML inference & SQLite query engine
├── run_gui.py                  # CLI/desktop launcher with automated browser opener
├── run_gui.bat                 # Windows one-click desktop batch launcher
├── hiring_analysis.py          # End-to-end data processing, SQL, chart generation & ML training
├── generate_data.py            # Reproducible 5,000-record synthetic dataset generator
├── hiring_data.csv             # Primary dataset (5,000 candidate records, 18 features)
├── README.md                   # Comprehensive technical documentation
├── templates/
│   └── index.html              # Multi-view interactive dashboard template
├── static/
│   ├── css/
│   │   └── style.css           # Obsidian Glass design system with dark mode styling
│   └── js/
│       └── app.js              # Chart.js renderers, ML simulator & SQL studio logic
└── outputs/                    # Automated exports directory
    ├── 01_hiring_funnel.png
    ├── 02_hire_rate_by_dept.png
    ├── 03_source_effectiveness.png
    ├── 04_time_to_hire.png
    ├── 05_salary_analysis.png
    ├── 06_gender_diversity.png
    ├── 07_interview_scores.png
    ├── 08_monthly_applications.png
    ├── 09_ml_feature_importance.png
    ├── 10_experience_vs_hire_rate.png
    ├── powerbi_funnel.csv
    ├── powerbi_dept_stats.csv
    ├── powerbi_source_stats.csv
    └── powerbi_salary_analysis.csv
```

---

## 👤 Author & Connect

**Sharat Laha**  
*M.Tech in Data Science & Analytics, Lovely Professional University (LPU)*  
- 💼 **LinkedIn:** [linkedin.com/in/sharatsl](https://www.linkedin.com/in/sharatsl/)  
- 🐙 **GitHub:** [github.com/lahaSL](https://github.com/lahaSL/)  
- 📧 **Domain Focus:** People Analytics, Decision Intelligence, Predictive Modeling, Machine Learning
