// =========================================
// PROJECT HUB - APP FRISSÍTÉS
// =========================================

(function () {
    "use strict";

    const APP_VERSION = "1.2.6";
    const PULL_THRESHOLD = 72;
    const FEEDBACK_KEY = "projectHubRefreshFeedback";

    // Egységes, kártyás verziójelzés minden oldalon.
    const footer = document.createElement("footer");
    footer.className = "app-version-footer";
    footer.innerHTML = `<span>Project Hub</span><span>v${APP_VERSION}</span>`;
    document.body.appendChild(footer);

    // Sikeres frissítés visszajelzése a reload után is.
    if (sessionStorage.getItem(FEEDBACK_KEY) === "1") {
        sessionStorage.removeItem(FEEDBACK_KEY);
        window.setTimeout(() => showFeedback("Frissítés sikeres · v" + APP_VERSION), 180);
    }

    let startY = 0;
    let pullDistance = 0;
    let pulling = false;
    let refreshing = false;

    const indicator = document.createElement("div");
    indicator.className = "pull-refresh-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = `
        <span class="pull-refresh-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11a8 8 0 0 0-14.9-4M4 5v4h4"></path>
                <path d="M4 13a8 8 0 0 0 14.9 4M20 19v-4h-4"></path>
            </svg>
        </span>
        <span class="pull-refresh-text">Húzd le a frissítéshez</span>
    `;
    document.body.appendChild(indicator);

    const icon = indicator.querySelector(".pull-refresh-icon");
    const text = indicator.querySelector(".pull-refresh-text");

    function resetIndicator() {
        indicator.classList.remove("visible", "ready", "refreshing");
        indicator.style.transform = "translate(-50%, -100%)";
        indicator.style.top = "0";
        pullDistance = 0;
        pulling = false;
    }

    function updateIndicator(distance) {
        const clamped = Math.min(distance, 110);
        indicator.classList.add("visible");
        indicator.style.transform = "translate(-50%, 0)";
        indicator.style.top = Math.max(0, clamped - 48) + "px";

        if (distance >= PULL_THRESHOLD) {
            indicator.classList.add("ready");
            icon.setAttribute("aria-label", "Frissítésre kész");
            text.textContent = "Engedd el a frissítéshez";
        } else {
            indicator.classList.remove("ready");
            icon.setAttribute("aria-label", "Frissítés");
            text.textContent = "Húzd le a frissítéshez";
        }
    }

    function showFeedback(message) {
        const existing = document.querySelector(".refresh-feedback");
        if (existing) existing.remove();

        const feedback = document.createElement("div");
        feedback.className = "refresh-feedback";
        feedback.innerHTML = `
            <span class="refresh-feedback-icon">✓</span>
            <span>${message}</span>
        `;
        document.body.appendChild(feedback);

        requestAnimationFrame(() => feedback.classList.add("visible"));
        window.setTimeout(() => {
            feedback.classList.remove("visible");
            window.setTimeout(() => feedback.remove(), 220);
        }, 2600);
    }

    document.addEventListener("touchstart", function (event) {
        if (refreshing || window.scrollY > 0 || event.touches.length !== 1) return;
        startY = event.touches[0].clientY;
        pullDistance = 0;
        pulling = true;
    }, { passive: true });

    document.addEventListener("touchmove", function (event) {
        if (!pulling || refreshing || window.scrollY > 0 || event.touches.length !== 1) return;

        pullDistance = event.touches[0].clientY - startY;
        if (pullDistance <= 0) {
            resetIndicator();
            return;
        }

        event.preventDefault();
        updateIndicator(pullDistance * 0.65);
    }, { passive: false });

    document.addEventListener("touchend", function () {
        if (!pulling || refreshing) return;

        if (pullDistance * 0.65 >= PULL_THRESHOLD) {
            refreshing = true;
            sessionStorage.setItem(FEEDBACK_KEY, "1");
            indicator.classList.add("visible", "refreshing");
            indicator.classList.remove("ready");
            indicator.style.transform = "translate(-50%, 0)";
            indicator.style.top = "0";
            text.textContent = "Frissítés...";

            window.setTimeout(() => window.location.reload(), 350);
        } else {
            resetIndicator();
        }
    }, { passive: true });

    document.addEventListener("touchcancel", resetIndicator, { passive: true });
})();
