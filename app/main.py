from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
import random
import threading
import time
from typing import Optional, Dict, Any, List

import psutil
import joblib
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.database import SessionLocal, init_db
from app.models import TrafficRecord

# ============================================================
# TRAFFIC MONITOR SETTINGS & STATE
# ============================================================
MONITOR_INTERVAL = 60

traffic_lock = threading.Lock()
monitor_stop = threading.Event()
monitor_thread: Optional[threading.Thread] = None

# Traffic counters
request_count = 0
successful_count = 0
failed_count = 0
total_response_time = 0.0
active_requests = 0
max_active_requests = 0

# Last calculated metrics for live dashboard
last_metrics: Dict[str, Any] = {
    "traffic_score": 15.0,
    "traffic_level": "LOW",
    "recommendation": "Optimal time to book",
    "requests_per_minute": 0,
    "active_users": 0,
    "cpu_usage": 10.0,
    "memory_usage": 35.0,
    "last_updated": datetime.now().strftime("%I:%M:%S %p"),
}


# ============================================================
# ML MODEL INITIALIZATION
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_SEARCH_PATHS = [
    BASE_DIR / "ml" / "traffic_model.pkl",
    Path("ml/traffic_model.pkl").resolve(),
    Path(__file__).resolve().parent / "traffic_model.pkl",
]

traffic_model = None
for model_path in MODEL_SEARCH_PATHS:
    if model_path.exists():
        try:
            traffic_model = joblib.load(model_path)
            print(f"[ML Model] Loaded traffic model from: {model_path}")
            break
        except Exception as e:
            print(f"[ML Model] Warning: Could not load {model_path}: {e}")

if traffic_model is None:
    print("[ML Model] Notice: Model file not loaded; will use intelligent heuristic prediction.")


# ============================================================
# DATA & SERVICES
# ============================================================
VALID_SERVICES = [
    {"id": 1, "name": "Movie Ticket", "description": "Book movie tickets"},
    {"id": 2, "name": "Hotel", "description": "Book hotel rooms"},
    {"id": 3, "name": "Train", "description": "Book train tickets"},
    {"id": 4, "name": "Bus", "description": "Book bus tickets"},
]

SERVICE_NAME_MAP = {
    "movie ticket": "Movie Ticket",
    "hotel": "Hotel",
    "hotel room": "Hotel",
    "train": "Train",
    "bus": "Bus",
    "event ticket": "Movie Ticket",
    "doctor appointment": "Movie Ticket",
}

BOOKING_SLOTS = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
]

TRAFFIC_PRIORITY = {
    "LOW": 1,
    "MODERATE": 2,
    "HIGH": 3,
    "VERY HIGH": 4
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================
def record_booking(success: bool, response_time: float):
    global request_count, successful_count, failed_count, total_response_time
    with traffic_lock:
        request_count += 1
        total_response_time += response_time
        if success:
            successful_count += 1
        else:
            failed_count += 1


def calculate_traffic_score(
    requests_per_minute: float,
    average_response_time: float,
    failed_requests: float,
    total_requests: float,
    cpu_usage: float
) -> float:
    request_score = min(requests_per_minute / 2, 40)
    response_score = min(average_response_time * 20, 30)
    failure_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0
    failure_score = min(failure_rate * 0.5, 20)
    cpu_score = min(cpu_usage / 5, 10)

    traffic_score = request_score + response_score + failure_score + cpu_score
    return round(min(traffic_score, 100.0), 2)


def get_traffic_level(score: float) -> str:
    if score < 25:
        return "LOW"
    elif score < 50:
        return "MODERATE"
    elif score < 75:
        return "HIGH"
    else:
        return "VERY HIGH"


def save_traffic_data():
    global request_count, successful_count, failed_count
    global total_response_time, max_active_requests, last_metrics

    with traffic_lock:
        rpm = request_count
        succ = successful_count
        fail = failed_count
        total = request_count
        avg_resp = (total_response_time / total) if total > 0 else 0.0
        active_u = max_active_requests

        # Reset counters for the next interval
        request_count = 0
        successful_count = 0
        failed_count = 0
        total_response_time = 0.0
        max_active_requests = 0

    cpu_usage = psutil.cpu_percent(interval=0.2)
    memory_usage = psutil.virtual_memory().percent

    score = calculate_traffic_score(rpm, avg_resp, fail, total, cpu_usage)
    level = get_traffic_level(score)

    last_metrics = {
        "traffic_score": score,
        "traffic_level": level,
        "recommendation": (
            "Great time to book now!" if score < 40
            else "Moderate traffic; bookings processing normally." if score < 70
            else "High traffic alert; delays possible."
        ),
        "requests_per_minute": rpm,
        "active_users": active_u,
        "cpu_usage": cpu_usage,
        "memory_usage": memory_usage,
        "last_updated": datetime.now().strftime("%I:%M:%S %p"),
    }

    db = SessionLocal()
    try:
        record = TrafficRecord(
            timestamp=datetime.now(),
            active_users=active_u,
            requests_per_minute=rpm,
            successful_bookings=succ,
            failed_requests=fail,
            average_response_time=round(avg_resp, 2),
            cpu_usage=cpu_usage,
            memory_usage=memory_usage,
            traffic_score=score,
            traffic_level=level
        )
        db.add(record)
        db.commit()
    except Exception as error:
        db.rollback()
        print(f"[Traffic Monitor] Database record save notice: {error}")
    finally:
        db.close()


def monitor_loop():
    print("[Traffic Monitor] Background loop started...")
    while not monitor_stop.wait(MONITOR_INTERVAL):
        try:
            save_traffic_data()
        except Exception as error:
            print(f"[Traffic Monitor] Loop error: {error}")


# ============================================================
# FASTAPI APPLICATION LIFESPAN
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global monitor_thread

    # Initialize database tables
    init_db()

    # Start background monitor thread
    monitor_stop.clear()
    monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
    monitor_thread.start()

    yield

    # Clean shutdown
    monitor_stop.set()
    if monitor_thread and monitor_thread.is_alive():
        monitor_thread.join(timeout=2)
    print("[Traffic Monitor] Stopped cleanly.")


app = FastAPI(
    title="BookFlow AI Booking Platform",
    description="Intelligent Booking Traffic Prediction & Reservation API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# API ENDPOINTS
# ============================================================
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ml_model_loaded": traffic_model is not None
    }


@app.get("/api/services")
def get_services():
    return {"services": VALID_SERVICES}


@app.get("/api/slots")
def get_slots():
    return {"slots": BOOKING_SLOTS}


@app.get("/api/traffic/live")
@app.get("/api/traffic-status")
def get_traffic_status():
    return last_metrics


@app.get("/api/predict-best-time")
def predict_best_time(
    date: str,
    service: str = "Movie Ticket"
):
    try:
        selected_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD."
        )

    norm_service = SERVICE_NAME_MAP.get(service.strip().lower(), service)
    day_of_week = selected_date.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    booking_hours = list(range(9, 21))  # 9 to 20 (09:00 AM to 08:00 PM)
    predictions = []

    for hour in booking_hours:
        display_time = datetime.strptime(f"{hour}:00", "%H:%M").strftime("%I:%M %p")

        if traffic_model is not None:
            try:
                pred = traffic_model.predict([[hour, day_of_week, is_weekend]])[0]
                traffic_level = str(pred).upper()
            except Exception:
                traffic_level = "MODERATE"
        else:
            # Intelligent fallback heuristic
            if hour in [18, 19, 20]:
                traffic_level = "VERY HIGH" if is_weekend else "HIGH"
            elif hour in [10, 11, 17]:
                traffic_level = "HIGH" if is_weekend else "MODERATE"
            elif hour in [13, 14, 15]:
                traffic_level = "LOW"
            else:
                traffic_level = "MODERATE"

        # Estimated traffic score based on level and hour
        base_score = {
            "LOW": 18.0,
            "MODERATE": 42.0,
            "HIGH": 68.0,
            "VERY HIGH": 89.0
        }.get(traffic_level, 35.0)

        predictions.append({
            "hour": hour,
            "slot": display_time,
            "traffic_level": traffic_level,
            "traffic_score": base_score
        })

    # Find slot with lowest congestion
    best = min(
        predictions,
        key=lambda x: (
            TRAFFIC_PRIORITY.get(x["traffic_level"], 99),
            x["traffic_score"],
            x["hour"]
        )
    )

    return {
        "date": date,
        "service": norm_service,
        "best_time": best["slot"],
        "best_slot": best["slot"],
        "recommended_slot": best["slot"],
        "recommended_hour": best["hour"],
        "traffic_level": best["traffic_level"],
        "recommended_traffic": best["traffic_level"],
        "traffic_score": best["traffic_score"],
        "score": best["traffic_score"],
        "all_predictions": predictions
    }


class BookingBody(BaseModel):
    service: Optional[str] = None
    slot: Optional[str] = None
    quantity: Optional[int] = None


@app.post("/api/book")
async def create_booking(
    request: Request,
    service: Optional[str] = None,
    slot: Optional[str] = None,
    quantity: Optional[int] = None
):
    global active_requests, max_active_requests

    # Extract parameters from JSON body if present, else fallback to query params
    req_service = service
    req_slot = slot
    req_quantity = quantity

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                req_service = body.get("service") or req_service
                req_slot = body.get("slot") or req_slot
                req_quantity = body.get("quantity") or req_quantity
        except Exception:
            pass

    if not req_service:
        raise HTTPException(status_code=400, detail="Booking service is required.")

    # Normalize service name
    normalized_service = SERVICE_NAME_MAP.get(req_service.strip().lower(), req_service)

    if not req_slot:
        raise HTTPException(status_code=400, detail="Booking slot is required.")

    if req_quantity is None or int(req_quantity) <= 0:
        req_quantity = 1

    req_quantity = int(req_quantity)

    start_time = time.perf_counter()
    with traffic_lock:
        active_requests += 1
        max_active_requests = max(max_active_requests, active_requests)

    try:
        # Simulate realistic booking processing time
        processing_delay = random.uniform(0.15, 0.45)
        time.sleep(processing_delay)

        response_time = round(time.perf_counter() - start_time, 2)
        success = True

        record_booking(success, response_time)

        return {
            "success": True,
            "status": "confirmed",
            "message": "Booking confirmed successfully",
            "service": normalized_service,
            "slot": req_slot,
            "quantity": req_quantity,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        response_time = round(time.perf_counter() - start_time, 2)
        record_booking(False, response_time)
        raise HTTPException(
            status_code=500,
            detail=f"Booking failed: {str(e)}"
        )

    finally:
        with traffic_lock:
            active_requests -= 1


# ============================================================
# FRONTEND STATIC FILES & UI
# ============================================================
FRONTEND_DIR = Path(__file__).resolve().parent / "frontend"

@app.get("/")
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"project": "BookFlow AI", "status": "Running"}


@app.get("/style.css")
def serve_css():
    css_file = FRONTEND_DIR / "style.css"
    if css_file.exists():
        return FileResponse(css_file, media_type="text/css")
    raise HTTPException(status_code=404, detail="style.css not found")


@app.get("/app.js")
def serve_js():
    js_file = FRONTEND_DIR / "app.js"
    if js_file.exists():
        return FileResponse(js_file, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="app.js not found")


if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")