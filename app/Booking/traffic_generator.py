import requests
import random
import time

API_URL = "http://127.0.0.1:8002"

services = [
    "Movie Ticket",
    "Hotel Room",
    "Event Ticket",
    "Doctor Appointment"
]

# Traffic probability for each booking hour
slot_weights = {
    "09:00 AM": 3,
    "10:00 AM": 4,
    "11:00 AM": 6,
    "12:00 PM": 2,
    "01:00 PM": 2,
    "02:00 PM": 2,
    "03:00 PM": 3,
    "04:00 PM": 4,
    "05:00 PM": 7,
    "06:00 PM": 10,
    "07:00 PM": 12,
    "08:00 PM": 9
}

slots = list(slot_weights.keys())
weights = list(slot_weights.values())

print("BookFlow Realistic Traffic Generator Started")
print("Generating traffic based on booking-time demand...")
print("Press CTRL+C to stop")
print()

while True:

    service = random.choice(services)

    # Higher probability during busy booking hours
    slot = random.choices(slots, weights=weights, k=1)[0]

    quantity = random.randint(1, 3)

    try:
        start_time = time.time()

        response = requests.post(
            f"{API_URL}/api/book",
            params={
                "service": service,
                "slot": slot,
                "quantity": quantity
            }
        )

        response_time = time.time() - start_time

        if response.status_code == 200:

            data = response.json()

            if data["success"]:
                print(
                    f"SUCCESS | {service} | {slot} | "
                    f"{response_time:.2f}s"
                )
            else:
                print(
                    f"FAILED  | {service} | {slot} | "
                    f"{response_time:.2f}s"
                )

        else:
            print(f"ERROR | HTTP {response.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"Connection error: {e}")

    # Generate requests continuously
    time.sleep(random.uniform(0.5, 1.5))