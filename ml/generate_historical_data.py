import pandas as pd
import random
from datetime import datetime, timedelta

random.seed(42)

data = []

start_date = datetime(2026, 8, 1)

for day in range(30):

    current_date = start_date + timedelta(days=day)

    for hour in range(24):

        # Realistic booking demand by hour
        if hour in [18, 19, 20, 21]:
            demand = random.randint(70, 120)
        elif hour in [10, 11, 17]:
            demand = random.randint(45, 75)
        elif hour in [9, 12, 13, 14, 15, 16, 22]:
            demand = random.randint(20, 50)
        else:
            demand = random.randint(5, 20)

        # Weekends are usually busier
        if current_date.weekday() >= 5:
            demand = int(demand * 1.25)

        requests_per_minute = demand + random.randint(-5, 5)
        active_users = int(requests_per_minute * random.uniform(0.8, 1.2))

        average_response_time = round(
            0.3 + (requests_per_minute / 150) + random.uniform(0, 0.3),
            2
        )

        failed_requests = random.randint(0, max(1, int(requests_per_minute * 0.08)))

        successful_bookings = max(
            0,
            requests_per_minute - failed_requests
        )

        cpu_usage = round(
            min(95, 20 + requests_per_minute * 0.55 + random.uniform(-5, 5)),
            2
        )

        memory_usage = round(
            min(95, 40 + requests_per_minute * 0.25 + random.uniform(-3, 3)),
            2
        )

        traffic_score = round(
            min(
                100,
                requests_per_minute * 0.45
                + average_response_time * 15
                + failed_requests * 0.5
                + cpu_usage * 0.15
            ),
            2
        )

        if traffic_score < 30:
            traffic_level = "LOW"
        elif traffic_score < 50:
            traffic_level = "MODERATE"
        elif traffic_score < 75:
            traffic_level = "HIGH"
        else:
            traffic_level = "VERY HIGH"

        timestamp = current_date.replace(
            hour=hour,
            minute=0,
            second=0
        )

        data.append([
            timestamp,
            active_users,
            requests_per_minute,
            successful_bookings,
            failed_requests,
            average_response_time,
            cpu_usage,
            memory_usage,
            traffic_score,
            traffic_level
        ])

columns = [
    "timestamp",
    "active_users",
    "requests_per_minute",
    "successful_bookings",
    "failed_requests",
    "average_response_time",
    "cpu_usage",
    "memory_usage",
    "traffic_score",
    "traffic_level"
]

df = pd.DataFrame(data, columns=columns)

df.to_csv("historical_traffic.csv", index=False)

print("Historical dataset created successfully!")
print("Rows:", len(df))
print("Columns:", len(df.columns))
print()
print("Traffic levels:")
print(df["traffic_level"].value_counts())
print()
print(df.head())