// =============================================================================
// TalentPulse AI — Frontend Application Logic
// =============================================================================

let globalCharts = {};
let allDeptData = [];
let currentPage = 1;
let searchDebounceTimeout = null;

// Tab Titles and Subtitles
const tabMeta = {
    overview: {
        title: "Executive Overview & Insights",
        subtitle: "Cross-department recruitment performance, funnel health, and key metrics"
    },
    funnel: {
        title: "Recruitment Funnel & Department Benchmarks",
        subtitle: "Conversion velocity, stage-by-stage drop-offs, and departmental turnaround days"
    },
    compensation: {
        title: "Compensation Benchmarking & Salary Gap Analysis",
        subtitle: "Offered vs expected remuneration by seniority, experience, and attrition correlation"
    },
    "ml-simulator": {
        title: "Offer Acceptance Machine Learning Simulator",
        subtitle: "Real-time What-If scenario modeling powered by trained Gradient Boosting & Random Forest models"
    },
    "sql-studio": {
        title: "Interactive SQLite Recruitment Console",
        subtitle: "Execute custom SQL analytics queries directly against candidate database"
    },
    candidates: {
        title: "Candidate Cohort Explorer",
        subtitle: "Granular candidate records, stages, interview scores, and salary data"
    }
};

document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    initDashboard();
});

// Setup sidebar tab switching
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Update active nav item
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add("active");

    // Update active pane
    document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) targetPane.classList.add("active");

    // Update Header
    if (tabMeta[tabId]) {
        document.getElementById("page-title").innerText = tabMeta[tabId].title;
        document.getElementById("page-subtitle").innerText = tabMeta[tabId].subtitle;
    }

    // Trigger chart resize if needed
    window.dispatchEvent(new Event('resize'));

    // Lazy load tab data
    if (tabId === "candidates") {
        loadCandidates(currentPage);
    }
}

// Master Dashboard Initializer
async function initDashboard() {
    try {
        await loadMetadata();
        await Promise.all([
            loadKPIs(),
            loadFunnelChart(),
            loadDepartmentData(),
            loadSourceData(),
            loadMonthlyTrend(),
            loadSalaryData(),
            loadDiversityData(),
            loadExperienceData()
        ]);
        updateSalaryRatioPreview();
        runPrediction(); // Initial simulation run
        executeSqlQuery(); // Initial SQL run
    } catch (err) {
        console.warn("API load error, falling back to cached baseline:", err);
    }
}

// Load metadata & populate select dropdowns
async function loadMetadata() {
    try {
        const res = await fetch("/api/meta");
        const meta = await res.json();
        
        // Populate options in simulator and filters
        const deptSelects = [document.getElementById("dept-select"), document.getElementById("cand-dept-filter"), document.getElementById("sim-dept")];
        meta.options.departments.forEach(dept => {
            deptSelects.forEach(sel => {
                if (!sel) return;
                const opt = document.createElement("option");
                opt.value = dept;
                opt.innerText = dept;
                sel.appendChild(opt);
            });
        });

        const roleSelect = document.getElementById("sim-role");
        meta.options.roles.forEach(role => {
            const opt = document.createElement("option");
            opt.value = role;
            opt.innerText = role;
            roleSelect.appendChild(opt);
        });

        const sourceSelect = document.getElementById("sim-source");
        meta.options.sources.forEach(src => {
            const opt = document.createElement("option");
            opt.value = src;
            opt.innerText = src;
            sourceSelect.appendChild(opt);
        });

        const eduSelect = document.getElementById("sim-edu");
        meta.options.educations.forEach(edu => {
            const opt = document.createElement("option");
            opt.value = edu;
            opt.innerText = edu;
            eduSelect.appendChild(opt);
        });

        // Set defaults
        roleSelect.value = "Senior";
        sourceSelect.value = "Employee Referral";
        eduSelect.value = "B.Tech";

        document.getElementById("res-model-badge").innerText = 
            `GB AUC ${meta.models.gb.auc} | RF AUC ${meta.models.rf.auc}`;
    } catch (e) {
        console.error("Meta load failed:", e);
    }
}

// Load Top KPIs
async function loadKPIs() {
    const res = await fetch("/api/kpis");
    const d = await res.json();

    document.getElementById("kpi-apps").innerText = d.total_applications.toLocaleString();
    document.getElementById("kpi-screen-rate").innerText = d.screen_rate + "%";
    document.getElementById("kpi-screened-count").innerText = d.screened.toLocaleString();
    document.getElementById("kpi-offer-rate").innerText = d.offer_rate + "%";
    document.getElementById("kpi-offered-count").innerText = d.offered.toLocaleString();
    document.getElementById("kpi-accept-rate").innerText = d.acceptance_rate + "%";
    document.getElementById("kpi-accepted-count").innerText = d.accepted.toLocaleString();
    document.getElementById("kpi-hire-rate").innerText = d.hire_rate + "%";
    document.getElementById("kpi-joined-count").innerText = d.joined.toLocaleString();
    document.getElementById("kpi-time-hire").innerText = d.avg_days_to_hire + " Days";
}

// Load Funnel Chart
async function loadFunnelChart() {
    const res = await fetch("/api/funnel");
    const data = await res.json();

    const labels = data.map(d => d.stage);
    const counts = data.map(d => d.count);
    const pcts = data.map(d => d.overall_conversion);

    const ctx = document.getElementById("chart-funnel").getContext("2d");
    if (globalCharts.funnel) globalCharts.funnel.destroy();

    globalCharts.funnel = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Candidates",
                data: counts,
                backgroundColor: [
                    "rgba(56, 189, 248, 0.8)",
                    "rgba(129, 140, 248, 0.8)",
                    "rgba(168, 85, 247, 0.8)",
                    "rgba(245, 158, 11, 0.8)",
                    "rgba(244, 63, 94, 0.8)",
                    "rgba(16, 185, 129, 0.8)"
                ],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const item = data[ctx.dataIndex];
                            return ` ${item.count.toLocaleString()} (${item.overall_conversion}% of apps | Stage conversion: ${item.stage_conversion}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: "#f8fafc", font: { weight: 600 } }
                }
            }
        }
    });
}

// Load Department Performance
async function loadDepartmentData() {
    const res = await fetch("/api/departments");
    allDeptData = await res.json();

    // Render Department Overview Chart
    const labels = allDeptData.map(d => d.department);
    const apps = allDeptData.map(d => d.applications);
    const hires = allDeptData.map(d => d.joined);

    const ctx = document.getElementById("chart-depts").getContext("2d");
    if (globalCharts.depts) globalCharts.depts.destroy();

    globalCharts.depts = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Applications",
                    data: apps,
                    backgroundColor: "rgba(56, 189, 248, 0.6)",
                    borderRadius: 4
                },
                {
                    label: "Hires Joined",
                    data: hires,
                    backgroundColor: "rgba(16, 185, 129, 0.9)",
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#cbd5e1", maxRotation: 30 }
                },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" }
                }
            }
        }
    });

    // Populate Department Table in Tab 2
    renderDeptTable(allDeptData);

    // Render Time to hire chart
    const ctxTime = document.getElementById("chart-time-dept").getContext("2d");
    if (globalCharts.timeDept) globalCharts.timeDept.destroy();

    globalCharts.timeDept = new Chart(ctxTime, {
        type: "bar",
        data: {
            labels: allDeptData.map(d => d.department),
            datasets: [{
                label: "Avg Days to Hire",
                data: allDeptData.map(d => d.avg_days),
                backgroundColor: "rgba(245, 158, 11, 0.75)",
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.raw} days avg` } }
            },
            scales: {
                x: { ticks: { color: "#cbd5e1", maxRotation: 30 } },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" },
                    title: { display: true, text: "Days", color: "#94a3b8" }
                }
            }
        }
    });
}

function renderDeptTable(deptData) {
    const tbody = document.getElementById("tbody-depts");
    tbody.innerHTML = "";

    deptData.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${d.department}</strong></td>
            <td>${d.applications.toLocaleString()}</td>
            <td>${d.screened.toLocaleString()} <span style="color:#64748b">(${d.screen_rate}%)</span></td>
            <td>${d.interviewed.toLocaleString()}</td>
            <td>${d.offered.toLocaleString()}</td>
            <td>${d.accepted.toLocaleString()}</td>
            <td><strong style="color:#10b981">${d.joined.toLocaleString()}</strong></td>
            <td><span class="badge-joined">${d.hire_rate}%</span></td>
            <td>${d.offer_accept_rate}%</td>
            <td>${d.avg_days} days</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterDeptData(dept) {
    if (dept === "all") {
        renderDeptTable(allDeptData);
    } else {
        const filtered = allDeptData.filter(d => d.department === dept);
        renderDeptTable(filtered);
    }
}

// Load Sourcing Channel Effectiveness
async function loadSourceData() {
    const res = await fetch("/api/sources");
    const data = await res.json();

    const labels = data.map(d => d.source);
    const hireRates = data.map(d => d.hire_rate);
    const apps = data.map(d => d.applications);

    const ctx = document.getElementById("chart-sources").getContext("2d");
    if (globalCharts.sources) globalCharts.sources.destroy();

    globalCharts.sources = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Hire Rate (%)",
                    data: hireRates,
                    backgroundColor: "rgba(16, 185, 129, 0.8)",
                    borderRadius: 4,
                    yAxisID: "y"
                },
                {
                    type: "line",
                    label: "Application Volume",
                    data: apps,
                    borderColor: "#38bdf8",
                    backgroundColor: "#38bdf8",
                    pointRadius: 4,
                    yAxisID: "y1"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            },
            scales: {
                x: { ticks: { color: "#cbd5e1", maxRotation: 25 } },
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    ticks: { color: "#10b981" },
                    title: { display: true, text: "Hire Rate (%)", color: "#10b981" },
                    grid: { color: "rgba(255, 255, 255, 0.05)" }
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    ticks: { color: "#38bdf8" },
                    title: { display: true, text: "Applications", color: "#38bdf8" },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

// Monthly Application Trend
async function loadMonthlyTrend() {
    const res = await fetch("/api/monthly_trend");
    const data = await res.json();

    const labels = data.map(d => d.month);
    const apps = data.map(d => d.applications);
    const hires = data.map(d => d.joined);

    const ctx = document.getElementById("chart-timeline").getContext("2d");
    if (globalCharts.timeline) globalCharts.timeline.destroy();

    globalCharts.timeline = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Applications",
                    data: apps,
                    borderColor: "#38bdf8",
                    backgroundColor: "rgba(56, 189, 248, 0.1)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                },
                {
                    label: "Hires",
                    data: hires,
                    borderColor: "#10b981",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            },
            scales: {
                x: {
                    ticks: {
                        color: "#94a3b8",
                        callback: function(val, index) {
                            return index % 3 === 0 ? this.getLabelForValue(val) : "";
                        }
                    }
                },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" }
                }
            }
        }
    });
}

// Salary Benchmarking & Gap Analysis
async function loadSalaryData() {
    const res = await fetch("/api/salary_stats");
    const data = await res.json();

    const labels = data.map(d => d.role_level);
    const offeredLakhs = data.map(d => d.avg_offered_lakhs);
    const expectedLakhs = data.map(d => d.avg_expected_lakhs);

    const ctx = document.getElementById("chart-salary-comp").getContext("2d");
    if (globalCharts.salary) globalCharts.salary.destroy();

    globalCharts.salary = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Avg Offered (₹ Lakhs)",
                    data: offeredLakhs,
                    backgroundColor: "rgba(56, 189, 248, 0.8)",
                    borderRadius: 5
                },
                {
                    label: "Avg Expected (₹ Lakhs)",
                    data: expectedLakhs,
                    backgroundColor: "rgba(244, 63, 94, 0.75)",
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            },
            scales: {
                x: { ticks: { color: "#cbd5e1" } },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" },
                    title: { display: true, text: "₹ Lakhs", color: "#94a3b8" }
                }
            }
        }
    });

    // Populate Salary Gap Table
    const tbody = document.getElementById("tbody-salary-gap");
    tbody.innerHTML = "";
    data.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${d.role_level}</strong></td>
            <td>${d.offers.toLocaleString()}</td>
            <td>₹${Number(d.avg_offered).toLocaleString()}</td>
            <td>₹${Number(d.avg_expected).toLocaleString()}</td>
            <td style="color:#f43f5e; font-weight:600">-₹${Math.abs(d.gap).toLocaleString()} (${d.gap_pct}%)</td>
            <td><strong>${d.ratio}</strong></td>
            <td><span class="badge-rejected">High Driver of Decline</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Diversity Breakdown
async function loadDiversityData() {
    const res = await fetch("/api/diversity");
    const data = await res.json();

    const labels = data.map(d => d.department);
    const female = data.map(d => d.Female_pct);
    const male = data.map(d => d.Male_pct);
    const other = data.map(d => d.Other_pct);

    const ctx = document.getElementById("chart-diversity").getContext("2d");
    if (globalCharts.diversity) globalCharts.diversity.destroy();

    globalCharts.diversity = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Female (%)",
                    data: female,
                    backgroundColor: "#ec4899",
                    borderRadius: 3
                },
                {
                    label: "Male (%)",
                    data: male,
                    backgroundColor: "#38bdf8",
                    borderRadius: 3
                },
                {
                    label: "Other (%)",
                    data: other,
                    backgroundColor: "#10b981",
                    borderRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, ticks: { color: "#cbd5e1", maxRotation: 30 } },
                y: {
                    stacked: true,
                    max: 100,
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" }
                }
            },
            plugins: {
                legend: { labels: { color: "#94a3b8" } }
            }
        }
    });
}

// Experience Bracket vs Hire Rate
async function loadExperienceData() {
    const res = await fetch("/api/experience_stats");
    const data = await res.json();

    const labels = data.map(d => d.experience_years);
    const hireRates = data.map(d => d.hire_rate);

    const ctx = document.getElementById("chart-experience").getContext("2d");
    if (globalCharts.exp) globalCharts.exp.destroy();

    globalCharts.exp = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Hire Rate (%)",
                data: hireRates,
                backgroundColor: "#8b5cf6",
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: "#cbd5e1" } },
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.05)" },
                    ticks: { color: "#94a3b8" },
                    title: { display: true, text: "Hire Rate (%)", color: "#94a3b8" }
                }
            }
        }
    });
}

// =============================================================================
// ML WHAT-IF SIMULATOR LOGIC
// =============================================================================

function updateSalaryRatioPreview() {
    const offered = parseFloat(document.getElementById("sim-offered-sal").value) || 0;
    const expected = parseFloat(document.getElementById("sim-expected-sal").value) || 1;
    const ratio = (offered / expected).toFixed(3);
    
    document.getElementById("preview-ratio").innerText = ratio;
    const pct = Math.min(100, Math.max(0, ratio * 100));
    document.getElementById("ratio-fill").style.width = pct + "%";
}

async function runPrediction() {
    const payload = {
        department: document.getElementById("sim-dept").value,
        role_level: document.getElementById("sim-role").value,
        source: document.getElementById("sim-source").value,
        education: document.getElementById("sim-edu").value,
        gender: document.getElementById("sim-gender").value,
        experience_years: parseFloat(document.getElementById("sim-exp").value),
        interview_score: parseFloat(document.getElementById("sim-score").value),
        offered_salary: parseFloat(document.getElementById("sim-offered-sal").value),
        expected_salary: parseFloat(document.getElementById("sim-expected-sal").value)
    };

    try {
        const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const pred = await res.json();

        // Update UI Probability Circle
        const prob = pred.probability;
        document.getElementById("res-probability").innerText = prob + "%";
        document.getElementById("res-gb-prob").innerText = pred.gb_probability + "%";
        document.getElementById("res-rf-prob").innerText = pred.rf_probability + "%";
        document.getElementById("res-recommendation").innerText = pred.recommendation;

        const circle = document.getElementById("prob-circle");
        const riskTag = document.getElementById("res-risk-tag");
        const title = document.getElementById("res-outcome-title");

        riskTag.className = "risk-tag";
        if (pred.risk_level === "LOW") {
            circle.style.borderColor = "var(--accent-green)";
            circle.style.boxShadow = "0 0 25px rgba(16, 185, 129, 0.4)";
            riskTag.classList.add("risk-low");
            riskTag.innerText = "LOW ATTRITION RISK";
            title.innerText = "Candidate Highly Likely to Accept Offer";
        } else if (pred.risk_level === "MODERATE") {
            circle.style.borderColor = "var(--accent-amber)";
            circle.style.boxShadow = "0 0 25px rgba(245, 158, 11, 0.4)";
            riskTag.classList.add("risk-moderate");
            riskTag.innerText = "MODERATE ATTRITION RISK";
            title.innerText = "Borderline Decision — Action Required";
        } else {
            circle.style.borderColor = "var(--accent-rose)";
            circle.style.boxShadow = "0 0 25px rgba(244, 63, 94, 0.4)";
            riskTag.classList.add("risk-high");
            riskTag.innerText = "HIGH ATTRITION RISK";
            title.innerText = "Offer Likely to be Rejected";
        }
    } catch (e) {
        console.error("Prediction error:", e);
    }
}

// =============================================================================
// SQL STUDIO LOGIC
// =============================================================================

const sqlPresets = {
    funnel: `SELECT 
    COUNT(*) AS total_applications,
    SUM(CASE WHEN screened=1 THEN 1 ELSE 0 END) AS screened,
    SUM(CASE WHEN interviewed=1 THEN 1 ELSE 0 END) AS interviewed,
    SUM(CASE WHEN offered=1 THEN 1 ELSE 0 END) AS offered,
    SUM(CASE WHEN accepted=1 THEN 1 ELSE 0 END) AS accepted,
    SUM(CASE WHEN joined=1 THEN 1 ELSE 0 END) AS joined
FROM hiring;`,

    sources: `SELECT source, 
    COUNT(*) AS applications, 
    SUM(CASE WHEN joined=1 THEN 1 ELSE 0 END) AS hires,
    ROUND(SUM(CASE WHEN joined=1 THEN 1.0 ELSE 0 END)*100/COUNT(*), 1) AS hire_rate_pct,
    ROUND(AVG(days_to_hire), 1) AS avg_turnaround_days
FROM hiring 
GROUP BY source 
ORDER BY hires DESC;`,

    salary: `SELECT role_level, 
    COUNT(*) AS offers_extended,
    ROUND(AVG(offered_salary), 0) AS avg_offered,
    ROUND(AVG(expected_salary), 0) AS avg_expected,
    ROUND(AVG(offered_salary) - AVG(expected_salary), 0) AS avg_deficit
FROM hiring 
WHERE offered=1 
GROUP BY role_level 
ORDER BY avg_offered DESC;`,

    dept_velocity: `SELECT department,
    COUNT(*) AS applications,
    SUM(CASE WHEN joined=1 THEN 1 ELSE 0 END) AS hires,
    ROUND(AVG(days_to_hire), 1) AS avg_days_to_hire
FROM hiring
WHERE joined=1
GROUP BY department
ORDER BY avg_days_to_hire ASC;`,

    rejections: `SELECT candidate_id, department, role_level, source, interview_score, offered_salary, expected_salary,
    ROUND(CAST(offered_salary AS FLOAT) / expected_salary, 2) AS salary_ratio
FROM hiring 
WHERE offered=1 AND accepted=0 AND interview_score >= 8.5
ORDER BY interview_score DESC
LIMIT 15;`
};

function loadSqlPreset(key) {
    if (sqlPresets[key]) {
        document.getElementById("sql-query-input").value = sqlPresets[key];
        executeSqlQuery();
    }
}

async function executeSqlQuery() {
    const query = document.getElementById("sql-query-input").value.trim();
    const statusBar = document.getElementById("sql-status");
    const thead = document.getElementById("sql-thead");
    const tbody = document.getElementById("sql-tbody");

    statusBar.className = "sql-status-bar";
    statusBar.style.display = "none";
    thead.innerHTML = "";
    tbody.innerHTML = "";

    try {
        const res = await fetch("/api/sql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: query })
        });
        const data = await res.json();

        if (data.error) {
            statusBar.innerText = "SQL Error: " + data.error;
            statusBar.classList.add("sql-status-error");
            return;
        }

        statusBar.innerText = `Query succeeded! Returned ${data.returned_count} rows (Total matching: ${data.total_count}).`;
        statusBar.classList.add("sql-status-success");

        // Headers
        const trHead = document.createElement("tr");
        data.columns.forEach(col => {
            const th = document.createElement("th");
            th.innerText = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Rows
        data.rows.forEach(row => {
            const tr = document.createElement("tr");
            data.columns.forEach(col => {
                const td = document.createElement("td");
                const val = row[col];
                td.innerText = (val !== null && val !== undefined) ? val : "-";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
    } catch (e) {
        statusBar.innerText = "Network / execution error: " + e.message;
        statusBar.classList.add("sql-status-error");
    }
}

// =============================================================================
// CANDIDATE EXPLORER LOGIC
// =============================================================================

function debounceCandidateSearch() {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        loadCandidates(1);
    }, 300);
}

function changeCandidatePage(delta) {
    loadCandidates(currentPage + delta);
}

async function loadCandidates(page = 1) {
    if (page < 1) return;
    currentPage = page;

    const search = document.getElementById("candidate-search").value.trim();
    const dept = document.getElementById("cand-dept-filter").value;
    const status = document.getElementById("cand-status-filter").value;

    const params = new URLSearchParams({
        page: currentPage,
        per_page: 15,
        search: search,
        department: dept,
        status: status
    });

    try {
        const res = await fetch(`/api/candidates?${params.toString()}`);
        const result = await res.json();

        document.getElementById("cand-current-page").innerText = result.page;
        document.getElementById("cand-page-info").innerText = 
            `Showing page ${result.page} of ${result.total_pages} (${result.total.toLocaleString()} total candidates)`;

        document.getElementById("btn-prev-page").disabled = (result.page <= 1);
        document.getElementById("btn-next-page").disabled = (result.page >= result.total_pages);

        const tbody = document.getElementById("candidates-tbody");
        tbody.innerHTML = "";

        result.data.forEach(c => {
            const tr = document.createElement("tr");

            // Status Badge
            let statusBadge = '<span class="status-badge badge-screened">Applied</span>';
            if (c.joined) {
                statusBadge = '<span class="status-badge badge-joined">Joined</span>';
            } else if (c.accepted) {
                statusBadge = '<span class="status-badge badge-accepted">Accepted</span>';
            } else if (c.offered) {
                statusBadge = '<span class="status-badge badge-rejected">Offer Declined</span>';
            } else if (c.screened) {
                statusBadge = '<span class="status-badge badge-screened">Screened</span>';
            }

            tr.innerHTML = `
                <td><code>${c.candidate_id}</code></td>
                <td>${c.application_date}</td>
                <td>${c.department}</td>
                <td>${c.role_level}</td>
                <td>${c.source}</td>
                <td>${c.city}</td>
                <td>${c.experience_years}</td>
                <td>${c.interview_score !== '-' ? `<strong>${c.interview_score}</strong>` : '-'}</td>
                <td>${c.offered_salary !== '-' ? `₹${Number(c.offered_salary).toLocaleString()}` : '-'}</td>
                <td>${c.expected_salary !== '-' ? `₹${Number(c.expected_salary).toLocaleString()}` : '-'}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Failed to load candidates:", e);
    }
}

// Data Export Function
function exportData(dataset) {
    window.location.href = `/api/export/${dataset}`;
}
