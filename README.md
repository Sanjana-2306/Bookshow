# ⚡ BookFlow AI — Intelligent Booking Traffic Prediction & Reservation Platform

BookFlow AI is a high-performance web platform that analyzes booking traffic and leverages Machine Learning to predict the best time to book tickets and rooms with minimal wait times and lower server congestion.

---

## 🌟 Key Features

* **🤖 ML-Powered Traffic Prediction**: Predicts booking congestion (LOW, MODERATE, HIGH, VERY HIGH) for each time slot from 9:00 AM to 8:00 PM based on historical demand models.
* **⚡ Smart Recommendation**: Identifies and highlights the optimal slot with the lowest expected traffic.
* **📊 Live Traffic Forecast & Dashboard**: Visual interactive slot grid and live system metrics (traffic score, system load, active users).
* **🎫 Seamless Booking Engine**: Supports reservations for Movie Tickets, Hotels, Trains, and Buses with real-time response tracking.
* **🔄 Dual Database Support**: Automatic fallback to SQLite (`bookflow.db`) if MySQL is offline, with automatic table initialization.
* **📈 Background Monitoring Daemon**: Automatically records system traffic and performance metrics every 60 seconds.

---

## 📁 Project Structure

```text
Bookflow/
├── app/
│   ├── frontend/            # Web application UI (HTML, CSS, JS)
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   ├── main.py              # FastAPI server & API endpoints
│   ├── database.py          # SQLAlchemy engine (MySQL / SQLite fallback)
│   ├── models.py            # TrafficRecord ORM models
│   ├── config.py            # Environment configuration
│   └── traffic_monitor.py   # Traffic monitor routines
├── ml/
│   ├── traffic_model.pkl    # Pre-trained Random Forest ML model
│   ├── generate_historical_data.py
│   └── *.csv                # Training datasets
├── requirements.txt         # Dependencies
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Application Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

### 3. Open in Browser
* **Web Application**: [http://127.0.0.1:8002/](http://127.0.0.1:8002/)
* **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8002/docs](http://127.0.0.1:8002/docs)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Web application home page |
| `GET` | `/api/health` | API and ML model health check |
| `GET` | `/api/services` | List of supported booking services |
| `GET` | `/api/slots` | Available reservation time slots |
| `GET` | `/api/predict-best-time?date=YYYY-MM-DD&service=...` | ML traffic prediction and best slot |
| `POST` | `/api/book` | Create a booking reservation (JSON or query params) |
| `GET` | `/api/traffic/live` | Current live traffic & system metrics |

---

## 🛠 Tech Stack

* **Backend**: FastAPI, Uvicorn, Pydantic, Python 3.11
* **Machine Learning**: Scikit-Learn, Joblib, NumPy, Pandas
* **Database & ORM**: SQLAlchemy, PyMySQL, SQLite
* **Frontend**: Modern Vanilla JS, Responsive CSS, Glassmorphic UI
