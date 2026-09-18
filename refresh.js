// =========================================
// PROJECT HUB - APP FRISSÍTÉS
// =========================================

(function () {
    "use strict";

    const APP_VERSION = "1.2.6";
    const PULL_THRESHOLD = 72;

    // Verziószám az app alján.
    const footer = document.createElement("footer");
    footer.className = "app-version-footer";
    footer.innerHTML = `<span>Project Hub</span><span>v${APP_VERSION}</span>`;
    document.body.appendChild(footer);

    // Mobilos lehúzásos frissítés.
    let startY = 0;
    let pullDistance = 0;
    let pulling = false;
    let refreshing = false;

    const indicator = document.createElement("div");
    indicator.className = "pull-refresh-indicator";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = `
        <span class="pull-refresh-icon">↓</span>
        <span class="pull-refresh-text">Húzd le a frissítéshez</span>
    `;
    document.body.appendChild(indicator);

    const icon = indicator.querySelector(".pull-refresh-icon");
    const text = indicator.querySelector(".pull-refresh-text");

    function resetIndicator() {
        indicator.classList.remove("visible", "ready", "refreshing");
        indicator.style.transform = "translateX(-50%)";
        indicator.style.top = "0";
        icon.textContent = "↓";
        text.textContent = "Húzd le a frissítéshez";
        pullDistance = 0;
        pulling = false;
    }

    function updateIndicator(distance) {
        const clamped = Math.min(distance, 110);
        indicator.classList.add("visible");
        indicator.style.transform = "translateX(-50%)";
        indicator.style.top = Math.max(0, clamped - 48) + "px";

        if (distance >= PULL_THRESHOLD) {
            indicator.classList.add("ready");
            icon.textContent = "↑";
            text.textContent = "Engedd el a frissítéshez";
        } else {
            indicator.classList.remove("ready");
            icon.textContent = "↓";
            text.textContent = "Húzd le a frissítéshez";
        }
    }

    document.addEventListener("touchstart", function (event) {
        if (refreshing || window.scrollY > 0 || event.touches.length !== 1) {
            return;
        }

        startY = event.touches[0].clientY;
        pullDistance = 0;
        pulling = true;
    }, { passive: true });

    document.addEventListener("touchmove", function (event) {
        if (!pulling || refreshing || window.scrollY > 0 || event.touches.length !== 1) {
            return;
        }

        const currentY = event.touches[0].clientY;
        pullDistance = currentY - startY;

        if (pullDistance <= 0) {
            resetIndicator();
            return;
        }

        // Csak a felső lehúzásnál vesszük át a gesztust.
        event.preventDefault();
        updateIndicator(pullDistance * 0.65);
    }, { passive: false });

    document.addEventListener("touchend", function () {
        if (!pulling || refreshing) {
            return;
        }

        if (pullDistance * 0.65 >= PULL_THRESHOLD) {
            refreshing = true;
            indicator.classList.add("visible", "refreshing");
            indicator.classList.remove("ready");
            indicator.style.transform = "translateX(-50%)";
            indicator.style.top = "0";
            icon.textContent = "↻";
            text.textContent = "Frissítés...";

            window.setTimeout(function () {
                window.location.reload();
            }, 250);
        } else {
            resetIndicator();
        }
    }, { passive: true });

    document.addEventListener("touchcancel", resetIndicator, { passive: true });
})();
