const API_URL = "http://127.0.0.1:8002";

const serviceSelect = document.getElementById("service");
const slotSelect = document.getElementById("slot");
const quantityInput = document.getElementById("quantity");
const bookingDate = document.getElementById("bookingDate");

const result = document.getElementById("result");

const aiButton = document.getElementById("findBestTimeBtn");
const aiSection = document.getElementById("aiSection");

const bestSlot = document.getElementById("bestSlot");
const bestTraffic = document.getElementById("bestTraffic");
const recommendation = document.getElementById("recommendation");
const slotGrid = document.getElementById("slotGrid");

const today = new Date().toISOString().split("T")[0];

if (bookingDate) {
    bookingDate.value = today;
    bookingDate.min = today;
}

async function loadServices() {
    if (!serviceSelect) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/services`);

        if (!response.ok) {
            throw new Error(`Service API error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.services)) {
            throw new Error("Invalid services response");
        }

        serviceSelect.innerHTML = "";

        data.services.forEach(service => {
            const option = document.createElement("option");

            option.value = service.name;
            option.textContent = service.name;

            serviceSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Service loading error:", error);

        serviceSelect.innerHTML = `
            <option value="">
                Unable to load services
            </option>
        `;
    }
}

async function loadSlots() {
    if (!slotSelect) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/slots`);

        if (!response.ok) {
            throw new Error(`Slot API error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.slots)) {
            throw new Error("Invalid slots response");
        }

        slotSelect.innerHTML = "";

        data.slots.forEach(slot => {
            const option = document.createElement("option");

            option.value = slot;
            option.textContent = slot;

            slotSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Slot loading error:", error);

        slotSelect.innerHTML = `
            <option value="">
                Unable to load slots
            </option>
        `;
    }
}

function selectService(serviceName) {

    if (serviceSelect) {
        serviceSelect.value = serviceName;
    }

    if (aiSection) {

        aiSection.classList.add("active");

        aiSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    setTimeout(() => {

        if (bookingDate) {
            bookingDate.focus();
        }

    }, 700);

    if (bookingDate && bookingDate.value) {
        predictBestTime();
    }
}

if (aiButton) {

    aiButton.addEventListener("click", () => {

        if (!aiSection) {
            return;
        }

        aiSection.classList.add("active");

        aiSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        setTimeout(() => {

            if (bookingDate) {
                bookingDate.focus();
            }

        }, 700);
    });
}

if (serviceSelect) {

    serviceSelect.addEventListener("change", () => {

        if (bookingDate && bookingDate.value) {
            predictBestTime();
        }

    });
}

if (bookingDate) {

    bookingDate.addEventListener("change", () => {

        if (bookingDate.value) {
            predictBestTime();
        }

    });
}

async function predictBestTime() {

    if (!bookingDate || !serviceSelect) {
        return;
    }

    const date = bookingDate.value;
    const service = serviceSelect.value;

    if (!date) {

        bestSlot.textContent =
            "Select a booking date";

        return;
    }

    if (!service) {

        bestSlot.textContent =
            "Select a booking service";

        return;
    }

    bestSlot.textContent =
        "🤖 AI analyzing...";

    bestTraffic.textContent =
        `Analyzing booking traffic for ${service}`;

    recommendation.textContent =
        "Please wait while BookFlow AI analyzes the booking system.";

    slotGrid.innerHTML = `
        <div class="loading-box">
            🤖 Analyzing booking traffic...
        </div>
    `;

    try {

        const apiUrl =
            `${API_URL}/api/predict-best-time` +
            `?date=${encodeURIComponent(date)}` +
            `&service=${encodeURIComponent(service)}`;

        console.log("Prediction API:", apiUrl);

        const response = await fetch(apiUrl);

        if (!response.ok) {

            throw new Error(
                `Prediction failed: ${response.status}`
            );

        }

        const data = await response.json();

        console.log("Prediction response:", data);

        if (!data.recommended_slot) {

            throw new Error(
                "No recommended slot returned"
            );

        }

        bestSlot.textContent =
            `⭐ ${data.recommended_slot}`;

        bestTraffic.textContent =
            `Predicted traffic: ${data.recommended_traffic}`;

        recommendation.innerHTML =
            `🤖 For <strong>${service}</strong>, ` +
            `BookFlow AI recommends ` +
            `<strong>${data.recommended_slot}</strong> ` +
            `because predicted traffic is ` +
            `<strong>${data.recommended_traffic}</strong>.`;

        slotGrid.innerHTML = "";

        if (
            Array.isArray(data.all_predictions) &&
            data.all_predictions.length > 0
        ) {

            data.all_predictions.forEach(prediction => {

                const card =
                    document.createElement("div");

                card.className =
                    "prediction-card";

                const traffic =
                    String(
                        prediction.traffic_level || "UNKNOWN"
                    ).toUpperCase();

                if (
                    Number(prediction.hour) ===
                    Number(data.recommended_hour)
                ) {

                    card.classList.add("recommended");

                }

                card.innerHTML = `
                    <div class="prediction-time">
                        ${prediction.slot || "Unknown"}
                    </div>

                    <div class="prediction-traffic">
                        ${getTrafficIcon(traffic)}
                        ${traffic}
                    </div>

                    ${
                        Number(prediction.hour) ===
                        Number(data.recommended_hour)
                            ? `
                                <div class="recommended-text">
                                    ⭐ AI RECOMMENDED
                                </div>
                            `
                            : ""
                    }
                `;

                slotGrid.appendChild(card);

            });

        } else {

            slotGrid.innerHTML = `
                <div class="loading-box">
                    No slot predictions available.
                </div>
            `;

        }

    } catch (error) {

        console.error("Prediction error:", error);

        bestSlot.textContent =
            "Prediction failed";

        bestTraffic.textContent =
            "Unable to connect to BookFlow AI";

        recommendation.innerHTML =
            `❌ Make sure the FastAPI server is running ` +
            `on port <strong>8002</strong>.`;

        slotGrid.innerHTML = `
            <div class="error-box">
                ❌ AI prediction unavailable.
                <br><br>
                Check that your backend is running on port 8002.
            </div>
        `;
    }
}

function getTrafficIcon(level) {

    if (level === "LOW") {
        return "🟢";
    }

    if (level === "MODERATE") {
        return "🟡";
    }

    if (level === "HIGH") {
        return "🔴";
    }

    if (
        level === "VERY HIGH" ||
        level === "VERY-HIGH"
    ) {
        return "⚫";
    }

    return "⚪";
}

async function bookNow() {

    if (
        !serviceSelect ||
        !slotSelect ||
        !quantityInput ||
        !result
    ) {
        return;
    }

    const service = serviceSelect.value;
    const slot = slotSelect.value;
    const quantity = quantityInput.value;

    if (!service) {

        result.innerHTML =
            "❌ Please select a booking service.";

        return;
    }

    if (!slot) {

        result.innerHTML =
            "❌ Please select a booking time.";

        return;
    }

    if (!quantity || Number(quantity) < 1) {

        result.innerHTML =
            "❌ Please enter a valid quantity.";

        return;
    }

    result.textContent =
        "🤖 Processing booking...";

    try {

        const url =
            `${API_URL}/api/book` +
            `?service=${encodeURIComponent(service)}` +
            `&slot=${encodeURIComponent(slot)}` +
            `&quantity=${encodeURIComponent(quantity)}`;

        const response = await fetch(url, {
            method: "POST"
        });

        if (!response.ok) {

            throw new Error(
                `Booking failed: ${response.status}`
            );

        }

        const data = await response.json();

        if (data.success) {

            result.innerHTML =
                `🟢 ${data.message}` +
                `<br>` +
                `Response time: ${data.response_time}s`;

        } else {

            result.innerHTML =
                `🔴 ${data.message}` +
                `<br>` +
                `Response time: ${data.response_time}s`;

        }

    } catch (error) {

        console.error("Booking error:", error);

        result.innerHTML =
            `❌ Booking failed.` +
            `<br><br>` +
            `Make sure the backend is running on port 8002.`;
    }
}

loadServices();
loadSlots();