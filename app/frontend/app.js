const API_BASE_URL = (window.location.origin && window.location.origin.startsWith("http"))
    ? window.location.origin
    : "http://127.0.0.1:8002";

let selectedService = "";
let quantity = 0;
let bestSlotValue = "";
let scrollLocked = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const checkTrafficBtn = document.getElementById("checkTrafficBtn");
const bookingAssistant = document.getElementById("bookingAssistant");

const serviceCards = document.querySelectorAll(".service-card");

const selectedServiceMessage =
    document.getElementById("selectedService");

const decreaseQuantity =
    document.getElementById("decreaseQuantity");

const increaseQuantity =
    document.getElementById("increaseQuantity");

const confirmQuantity =
    document.getElementById("confirmQuantity");

const quantityDisplay =
    document.getElementById("quantity");

const bookingDate =
    document.getElementById("bookingDate");

const predictBtn =
    document.getElementById("predictBtn");

const predictSection =
    document.getElementById("predictSection");

const aiResult =
    document.getElementById("aiResult");

const bestSlot =
    document.getElementById("bestSlot");

const bestTraffic =
    document.getElementById("bestTraffic");

const resultService =
    document.getElementById("resultService");

const resultQuantity =
    document.getElementById("resultQuantity");

const predictionDate =
    document.getElementById("predictionDate");

const bookNowBtn =
    document.getElementById("bookNowBtn");

const bookingMessage =
    document.getElementById("bookingMessage");

const trafficValue =
    document.getElementById("trafficValue");

const trafficStatus =
    document.getElementById("trafficStatus");

const recommendation =
    document.getElementById("recommendation");

const lastUpdated =
    document.getElementById("lastUpdated");


/* =========================================================
   CHECK REQUIRED ELEMENTS
========================================================= */

function checkElements() {
    const requiredElements = {
        checkTrafficBtn,
        selectedServiceMessage,
        decreaseQuantity,
        increaseQuantity,
        quantityDisplay,
        bookingDate,
        predictBtn,
        predictSection,
        aiResult,
        bestSlot,
        bestTraffic,
        resultService,
        resultQuantity,
        predictionDate,
        bookNowBtn,
        bookingMessage
    };

    for (const [name, element] of Object.entries(requiredElements)) {
        if (!element) {
            console.error(
                `BookFlow AI: HTML element "${name}" was not found.`
            );
        }
    }
}

checkElements();


/* =========================================================
   SCROLL CONTROL
========================================================= */

function lockScroll() {
    scrollLocked = false;
}

function unlockScroll() {
    scrollLocked = false;
}

/* User scrolling is preserved naturally without hijacking */


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function scrollToElement(element, lockAfterScroll = true) {
    if (!element) {
        return;
    }

    unlockScroll();

    element.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    if (lockAfterScroll) {
        setTimeout(function () {
            lockScroll();
        }, 900);
    }
}


/* =========================================================
   BOOKING MESSAGE
========================================================= */

function clearBookingMessage() {
    if (!bookingMessage) {
        return;
    }

    bookingMessage.className = "booking-message";
    bookingMessage.innerHTML = "";
    bookingMessage.style.display = "none";
}


/* Convert any backend error into readable text */

function getBookingErrorMessage(error, data) {

    /* Backend returned a string */

    if (
        data &&
        typeof data.detail === "string" &&
        data.detail.trim() !== ""
    ) {
        return data.detail;
    }


    /* Backend returned detail as an object */

    if (
        data &&
        data.detail &&
        typeof data.detail === "object"
    ) {
        if (
            typeof data.detail.message === "string" &&
            data.detail.message.trim() !== ""
        ) {
            return data.detail.message;
        }

        if (
            typeof data.detail.error === "string" &&
            data.detail.error.trim() !== ""
        ) {
            return data.detail.error;
        }

        try {
            return JSON.stringify(data.detail);
        } catch (jsonError) {
            return "Booking failed.";
        }
    }


    /* Backend returned message */

    if (
        data &&
        typeof data.message === "string" &&
        data.message.trim() !== ""
    ) {
        return data.message;
    }


    /* JavaScript error */

    if (
        error &&
        typeof error.message === "string" &&
        error.message.trim() !== ""
    ) {
        return error.message;
    }


    return "We couldn't complete your booking. Please try again.";
}


/* =========================================================
   RESET PREDICTION
========================================================= */

function resetPrediction() {

    bestSlotValue = "";

    if (aiResult) {
        aiResult.style.display = "none";
    }

    if (bestSlot) {
        bestSlot.textContent = "--";
    }

    if (bestTraffic) {
        bestTraffic.textContent = "--";
    }

    if (resultService) {
        resultService.textContent = "--";
    }

    if (resultQuantity) {
        resultQuantity.textContent = "--";
    }

    if (predictionDate) {
        predictionDate.textContent = "--";
    }

    if (trafficValue) {
        trafficValue.textContent = "--";
    }

    if (trafficStatus) {
        trafficStatus.textContent = "--";
    }

    if (recommendation) {
        recommendation.textContent = "--";
    }

    if (lastUpdated) {
        lastUpdated.textContent = "--";
    }

    clearBookingMessage();
}


/* =========================================================
   SERVICE SELECTION
========================================================= */

serviceCards.forEach(function (card) {

    card.addEventListener("click", function () {

        /* Remove selected state */

        serviceCards.forEach(function (item) {
            item.classList.remove("selected");
        });


        /* Select current service */

        card.classList.add("selected");


        selectedService =
            card.dataset.service || "";


        /* Quantity resets whenever service changes */

        quantity = 0;

        updateQuantity();


        /* Remove previous prediction */

        resetPrediction();


        if (selectedServiceMessage) {
            selectedServiceMessage.textContent =
                `✓ ${selectedService} selected`;

            selectedServiceMessage.style.color =
                "#3b82f6";
        }


        /* Find quantity step */

        if (!quantityDisplay) {
            return;
        }

        const quantityStep =
            quantityDisplay.closest(".booking-step");


        /* Move to quantity */

        setTimeout(function () {

            scrollToElement(
                quantityStep,
                true
            );

        }, 300);

    });

});


/* =========================================================
   QUANTITY
========================================================= */

function updateQuantity() {

    if (!quantityDisplay) {
        return;
    }

    quantityDisplay.textContent = quantity;
}


/* =========================================================
   INCREASE QUANTITY
========================================================= */

if (increaseQuantity) {

    increaseQuantity.addEventListener(
        "click",
        function () {

            if (!selectedService) {

                if (selectedServiceMessage) {
                    selectedServiceMessage.textContent =
                        "Please select a booking type first.";

                    selectedServiceMessage.style.color =
                        "#ef4444";
                }

                return;
            }


            quantity++;

            updateQuantity();

            resetPrediction();


            /*
               IMPORTANT:
               Do not move to the next section.
            */

            lockScroll();

        }
    );

}


/* =========================================================
   DECREASE QUANTITY
========================================================= */

if (decreaseQuantity) {

    decreaseQuantity.addEventListener(
        "click",
        function () {

            if (quantity > 0) {

                quantity--;

                updateQuantity();

                resetPrediction();

                /*
                   Stay on quantity section.
                */

                lockScroll();

            }

        }
    );

}


/* =========================================================
   CONFIRM QUANTITY ✓
========================================================= */

if (confirmQuantity) {

    confirmQuantity.addEventListener(
        "click",
        function () {

            /* Service validation */

            if (!selectedService) {

                if (selectedServiceMessage) {
                    selectedServiceMessage.textContent =
                        "Please select a booking type first.";

                    selectedServiceMessage.style.color =
                        "#ef4444";
                }

                return;
            }


            /* Quantity validation */

            if (quantity <= 0) {

                if (selectedServiceMessage) {
                    selectedServiceMessage.textContent =
                        "Please enter a quantity first.";

                    selectedServiceMessage.style.color =
                        "#ef4444";
                }

                return;
            }


            if (selectedServiceMessage) {
                selectedServiceMessage.textContent =
                    `✓ ${selectedService} selected`;

                selectedServiceMessage.style.color =
                    "#3b82f6";
            }


            /* Find date section */

            if (!bookingDate) {
                return;
            }

            const dateStep =
                bookingDate.closest(".booking-step");


            /*
               Move to date only after
               quantity confirmation.
            */

            setTimeout(function () {

                scrollToElement(
                    dateStep,
                    true
                );

            }, 200);

        }
    );

}


/* =========================================================
   DATE SELECTION
========================================================= */

if (bookingDate) {

    bookingDate.addEventListener(
        "change",
        function () {

            if (!selectedService) {
                return;
            }


            if (quantity <= 0) {
                return;
            }


            if (!bookingDate.value) {
                return;
            }


            resetPrediction();


            /*
               Move to Predict Best Time.
            */

            setTimeout(function () {

                scrollToElement(
                    predictSection,
                    true
                );

            }, 300);

        }
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "--";
    }


    const date =
        new Date(dateString + "T00:00:00");


    if (Number.isNaN(date.getTime())) {
        return "--";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   GET PREDICTED TIME
========================================================= */

function getPredictedTime(data) {

    if (!data || typeof data !== "object") {
        return "--";
    }


    return (
        data.best_time ||
        data.bestTime ||
        data.best_slot ||
        data.bestSlot ||
        data.recommended_time ||
        data.recommendedTime ||
        data.recommended_slot ||
        data.recommendedSlot ||
        data.time ||
        data.slot ||
        data.prediction?.best_time ||
        data.prediction?.best_slot ||
        data.prediction?.time ||
        data.result?.best_time ||
        data.result?.best_slot ||
        data.result?.time ||
        "--"
    );
}


/* =========================================================
   GET TRAFFIC LEVEL
========================================================= */

function getTrafficLevel(data) {

    if (!data || typeof data !== "object") {
        return "LOW";
    }


    return (
        data.traffic_level ||
        data.trafficLevel ||
        data.traffic ||
        data.level ||
        "LOW"
    );
}


/* =========================================================
   PREDICT BEST TIME
========================================================= */

async function predictBestTime() {

    /* Validate service */

    if (!selectedService) {

        alert(
            "Please select a booking type first."
        );

        return;
    }


    /* Validate quantity */

    if (quantity <= 0) {

        alert(
            "Please enter a quantity first."
        );

        return;
    }


    /* Validate date */

    if (!bookingDate || !bookingDate.value) {

        alert(
            "Please select a booking date."
        );

        return;
    }


    clearBookingMessage();


    if (predictBtn) {
        predictBtn.disabled = true;
        predictBtn.textContent =
            "🤖 Analyzing Traffic...";
    }


    /*
       Unlock while API request is running.
    */

    unlockScroll();


    try {

        const date =
            bookingDate.value;


        const url =
            `${API_BASE_URL}/api/predict-best-time` +
            `?date=${encodeURIComponent(date)}` +
            `&service=${encodeURIComponent(selectedService)}`;


        console.log(
            "Sending prediction request:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            let errorMessage =
                "Prediction request failed.";

            try {

                const errorData =
                    await response.json();

                errorMessage =
                    getBookingErrorMessage(
                        null,
                        errorData
                    );

            } catch (jsonError) {
                /* Keep default error */
            }

            throw new Error(errorMessage);
        }


        const data =
            await response.json();


        console.log(
            "Prediction response:",
            data
        );


        /* Get prediction */

        const predictedTime =
            getPredictedTime(data);


        const trafficLevel =
            getTrafficLevel(data);


        bestSlotValue =
            predictedTime;


        /* Display result */

        if (bestSlot) {
            bestSlot.textContent =
                predictedTime;
        }


        if (bestTraffic) {
            bestTraffic.textContent = trafficLevel;
            const level = String(trafficLevel).toLowerCase();
            if (level.includes("high") || level.includes("heavy")) {
                bestTraffic.style.background = "#3b0a0a";
                bestTraffic.style.color = "#fca5a5";
            } else if (level.includes("medium") || level.includes("moderate")) {
                bestTraffic.style.background = "#422006";
                bestTraffic.style.color = "#fcd34d";
            } else {
                bestTraffic.style.background = "#052e16";
                bestTraffic.style.color = "#86efac";
            }
        }


        if (resultService) {
            resultService.textContent =
                selectedService;
        }


        if (resultQuantity) {
            resultQuantity.textContent =
                quantity;
        }


        if (predictionDate) {
            predictionDate.textContent =
                formatDate(date);
        }


        if (aiResult) {
            aiResult.style.display =
                "block";
        }


        /* Dashboard */

        if (trafficStatus) {
            trafficStatus.textContent =
                trafficLevel;
        }


        if (recommendation) {
            recommendation.textContent =
                predictedTime;
        }


        /* Traffic score */

        if (
            trafficValue &&
            data.traffic_score !== undefined
        ) {

            trafficValue.textContent =
                data.traffic_score;

        } else if (
            trafficValue &&
            data.score !== undefined
        ) {

            trafficValue.textContent =
                data.score;

        } else if (trafficValue) {

            trafficValue.textContent =
                "--";
        }


        /* Last updated */

        if (lastUpdated) {

            lastUpdated.textContent =
                new Date().toLocaleTimeString(
                    "en-IN"
                );

        }

        /* Render slot grid forecast */
        if (Array.isArray(data.all_predictions)) {
            renderSlotGrid(data.all_predictions, data.recommended_hour || bestSlotValue);
        }


        /*
           Prediction succeeded.

           Unlock scrolling permanently so
           user can move to AI result / booking.
        */

        unlockScroll();


        setTimeout(function () {

            scrollToElement(
                aiResult,
                false
            );

        }, 300);

    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );


        alert(
            error.message ||
            "Unable to get AI prediction. Please make sure the backend is running."
        );


        lockScroll();

    } finally {

        if (predictBtn) {

            predictBtn.disabled =
                false;

            predictBtn.textContent =
                "🤖 Predict Best Time";
        }

    }

}


/* =========================================================
   PREDICT BUTTON
========================================================= */

if (predictBtn) {

    predictBtn.addEventListener(
        "click",
        predictBestTime
    );

}


/* =========================================================
   BOOK NOW
========================================================= */

if (bookNowBtn) {

    bookNowBtn.addEventListener(
        "click",
        async function () {

            /* Validate service */

            if (!selectedService) {

                alert(
                    "Please select a booking type first."
                );

                return;
            }


            /* Validate quantity */

            if (quantity <= 0) {

                alert(
                    "Please enter a quantity first."
                );

                return;
            }


            /* Validate prediction */

            if (!bestSlotValue) {

                alert(
                    "Please predict the best booking time first."
                );

                return;
            }


            clearBookingMessage();


            bookNowBtn.disabled =
                true;

            bookNowBtn.textContent =
                "⏳ Confirming Booking...";


            unlockScroll();


            /*
               Keep response data outside try
               so catch can safely access it.
            */

            let data = {};


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/book`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                service:
                                    selectedService,

                                slot:
                                    bestSlotValue,

                                quantity:
                                    quantity
                            })
                        }
                    );


                /*
                   Try to read backend JSON.
                */

                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    data = {};

                }


                console.log(
                    "Booking response:",
                    data
                );


                /*
                   Backend returned an error.
                */

                if (!response.ok) {

                    const backendMessage =
                        getBookingErrorMessage(
                            null,
                            data
                        );

                    throw new Error(
                        backendMessage
                    );
                }


                /* =================================================
                   BOOKING SUCCESS
                ================================================= */

                if (bookingMessage) {

                    bookingMessage.className =
                        "booking-message success";


                    bookingMessage.innerHTML = `
                        <div class="message-icon">
                            ✓
                        </div>

                        <div class="message-content">

                            <span class="message-title">
                                Booking Confirmed
                            </span>

                            <span class="message-text">
                                Your ${selectedService.toLowerCase()}
                                booking for ${quantity}
                                ${
                                    quantity === 1
                                        ? "person/item"
                                        : "persons/items"
                                }
                                has been successfully completed.
                            </span>

                        </div>
                    `;


                    bookingMessage.style.display =
                        "flex";


                    unlockScroll();


                    setTimeout(function () {

                        scrollToElement(
                            bookingMessage,
                            false
                        );

                    }, 200);

                }

            } catch (error) {

                console.error(
                    "Booking error:",
                    error
                );


                const readableError =
                    getBookingErrorMessage(
                        error,
                        data
                    );


                /* =================================================
                   BOOKING ERROR
                ================================================= */

                if (bookingMessage) {

                    bookingMessage.className =
                        "booking-message error";


                    bookingMessage.innerHTML = `
                        <div class="message-icon">
                            !
                        </div>

                        <div class="message-content">

                            <span class="message-title">
                                Booking Unsuccessful
                            </span>

                            <span class="message-text">
                                ${readableError}
                            </span>

                        </div>
                    `;


                    bookingMessage.style.display =
                        "flex";


                    unlockScroll();


                    setTimeout(function () {

                        scrollToElement(
                            bookingMessage,
                            false
                        );

                    }, 200);

                }

            } finally {

                bookNowBtn.disabled =
                    false;

                bookNowBtn.textContent =
                    "🎫 BOOK NOW";
            }

        }
    );

}


/* =========================================================
   HERO BUTTON
========================================================= */

if (checkTrafficBtn) {

    checkTrafficBtn.addEventListener(
        "click",
        function () {

            unlockScroll();


            /*
               Always go to FIRST booking step,
               which is SERVICE selection.
            */

            const serviceStep =
                document.querySelector(
                    ".booking-step"
                );


            scrollToElement(
                serviceStep,
                true
            );

        }
    );

}


/* =========================================================
   INITIALIZE PAGE
========================================================= */

function initializePage() {

    /* Quantity */

    quantity = 0;

    updateQuantity();


    /* Service */

    selectedService = "";


    /* Date */

    if (bookingDate) {
        const todayStr = new Date().toISOString().split("T")[0];
        bookingDate.value = todayStr;
        bookingDate.min = todayStr;
    }


    /* AI result */

    if (aiResult) {
        aiResult.style.display =
            "none";
    }


    /* Prediction */

    bestSlotValue = "";


    /* Load Live Dashboard Metrics */
    loadLiveTraffic();


    /* Booking message */

    clearBookingMessage();
}

/* =========================================================
   SLOT GRID RENDERING
========================================================= */

function renderSlotGrid(predictions, recommendedHour) {
    const slotGrid = document.getElementById("slotGrid");
    if (!slotGrid) return;
    slotGrid.innerHTML = "";

    if (!Array.isArray(predictions) || predictions.length === 0) {
        slotGrid.innerHTML = '<div style="color: #7892b3; text-align: center; grid-column: 1 / -1; padding: 20px;">No slot predictions available.</div>';
        return;
    }

    predictions.forEach(item => {
        const card = document.createElement("div");
        card.className = "slot-card";
        const isRec = item.slot === bestSlotValue || item.hour === recommendedHour;
        
        let badgeColor = "#86efac";
        let badgeBg = "#052e16";
        const lvl = String(item.traffic_level || "LOW").toUpperCase();
        if (lvl.includes("HIGH") || lvl.includes("VERY")) {
            badgeColor = "#fca5a5";
            badgeBg = "#3b0a0a";
        } else if (lvl.includes("MODERATE") || lvl.includes("MEDIUM")) {
            badgeColor = "#fcd34d";
            badgeBg = "#422006";
        }

        if (isRec) {
            card.style.borderColor = "#3b82f6";
            card.style.background = "#0c1e38";
            card.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.3)";
        }

        card.innerHTML = `
            <div class="slot-time">${item.slot}</div>
            <div class="slot-traffic">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; color: ${badgeColor}; background: ${badgeBg};">
                    ${lvl}
                </span>
            </div>
            ${isRec ? '<div style="margin-top: 8px; font-size: 11px; font-weight: 800; color: #60a5fa;">⭐ BEST TIME</div>' : ''}
        `;

        card.style.cursor = "pointer";
        card.title = `Click to choose ${item.slot}`;
        card.addEventListener("click", () => {
            document.querySelectorAll(".slot-card").forEach(c => {
                c.style.borderColor = "#17345f";
                c.style.background = "#070d19";
                c.style.boxShadow = "none";
            });
            card.style.borderColor = "#3b82f6";
            card.style.background = "#0c1e38";
            card.style.boxShadow = "0 0 15px rgba(59, 130, 246, 0.3)";
            bestSlotValue = item.slot;
            if (bestSlot) bestSlot.textContent = item.slot;
            if (bestTraffic) {
                bestTraffic.textContent = item.traffic_level;
                bestTraffic.style.color = badgeColor;
                bestTraffic.style.background = badgeBg;
            }
        });

        slotGrid.appendChild(card);
    });
}

/* =========================================================
   LOAD LIVE TRAFFIC DASHBOARD
========================================================= */

async function loadLiveTraffic() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/traffic/live`);
        if (res.ok) {
            const data = await res.json();
            if (trafficValue && data.traffic_score !== undefined) trafficValue.textContent = data.traffic_score;
            if (trafficStatus && data.traffic_level) trafficStatus.textContent = data.traffic_level;
            if (recommendation && data.recommendation) recommendation.textContent = data.recommendation;
            if (lastUpdated && data.last_updated) lastUpdated.textContent = data.last_updated;
        }
    } catch (e) {
        if (trafficValue) trafficValue.textContent = "15";
        if (trafficStatus) trafficStatus.textContent = "LOW";
        if (recommendation) recommendation.textContent = "Ready for bookings";
        if (lastUpdated) lastUpdated.textContent = new Date().toLocaleTimeString("en-IN");
    }
}


/* =========================================================
   START BOOKFLOW AI
========================================================= */

initializePage();