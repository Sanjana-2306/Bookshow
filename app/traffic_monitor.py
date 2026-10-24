import time
import psutil
from datetime import datetime

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import TrafficRecord


# Store traffic information temporarily
request_count = 0
successful_count = 0
failed_count = 0
total_response_time = 0.0


def record_booking(
    success: bool,
    response_time: float
):
    """
    Called whenever a booking request is completed.
    """

    global request_count
    global successful_count
    global failed_count
    global total_response_time

    request_count += 1
    total_response_time += response_time

    if success:
        successful_count += 1
    else:
        failed_count += 1


def calculate_traffic_score(
    requests_per_minute,
    average_response_time,
    failed_requests,
    cpu_usage
):
    """
    Calculate a traffic score from 0 to 100.
    Higher score = more congestion.
    """

    request_score = min(requests_per_minute / 2, 40)

    response_score = min(
        average_response_time * 20,
        30
    )

    failure_score = min(
        failed_requests * 5,
        20
    )

    cpu_score = min(
        cpu_usage / 5,
        10
    )

    score = (
        request_score
        + response_score
        + failure_score
        + cpu_score
    )

    return round(min(score, 100), 2)


def get_traffic_level(score):
    """
    Convert traffic score into traffic level.
    """

    if score < 25:
        return "LOW"

    elif score < 50:
        return "MODERATE"

    elif score < 75:
        return "HIGH"

    else:
        return "VERY HIGH"


def save_traffic_data():
    """
    Calculate and save traffic information to MySQL.
    """

    global request_count
    global successful_count
    global failed_count
    global total_response_time

    requests_per_minute = request_count

    if request_count > 0:
        average_response_time = (
            total_response_time / request_count
        )
    else:
        average_response_time = 0

    cpu_usage = psutil.cpu_percent(interval=1)
    memory_usage = psutil.virtual_memory().percent

    traffic_score = calculate_traffic_score(
        requests_per_minute,
        average_response_time,
        failed_count,
        cpu_usage
    )

    traffic_level = get_traffic_level(
        traffic_score
    )

    db: Session = SessionLocal()

    try:

        record = TrafficRecord(
            timestamp=datetime.utcnow(),

            active_users=request_count,

            requests_per_minute=requests_per_minute,

            successful_bookings=successful_count,

            failed_requests=failed_count,

            average_response_time=average_response_time,

            cpu_usage=cpu_usage,

            memory_usage=memory_usage,

            traffic_score=traffic_score,

            traffic_level=traffic_level
        )

        db.add(record)
        db.commit()

        print()
        print("===================================")
        print("TRAFFIC DATA SAVED")
        print("===================================")
        print(f"Requests/minute : {requests_per_minute}")
        print(f"Successful      : {successful_count}")
        print(f"Failed          : {failed_count}")
        print(f"Avg response    : {average_response_time:.2f}s")
        print(f"CPU usage       : {cpu_usage:.2f}%")
        print(f"Memory usage    : {memory_usage:.2f}%")
        print(f"Traffic score   : {traffic_score}")
        print(f"Traffic level   : {traffic_level}")
        print("===================================")
        print()

    finally:
        db.close()

    # Reset counters for next period
    request_count = 0
    successful_count = 0
    failed_count = 0
    total_response_time = 0.0


def monitor():
    """
    Run traffic monitoring continuously.
    """

    print("BookFlow Traffic Monitor Started")
    print("Saving traffic data every 60 seconds.")
    print("Press CTRL+C to stop.")
    print()

    while True:

        time.sleep(60)

        save_traffic_data()


if __name__ == "__main__":
    monitor()