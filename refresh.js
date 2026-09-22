// =========================================================
// PROJECT HUB 1.5.1 — APP FRISSÍTÉS / VERZIÓ
// =========================================================

(function () {
    "use strict";

    const APP_VERSION = "1.6.5";
    const PULL_THRESHOLD = 72;
    const EDGE_SWIPE_THRESHOLD = 55;
    const EDGE_ZONE = 28;
    const AXIS_LOCK = 10;

    function handleSteamCallbackRedirect() {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("steam_link")) return;

        const path = window.location.pathname;
        const alreadyProfile = /\/pages\/profile\/profile\.html$/.test(path);
        if (alreadyProfile) return;

        // A Steam callback can arrive at the site root. Always bring it
        // back to the Profile page where the callback is rendered.
        const profilePath = path.endsWith("/index.html") || path.endsWith("/")
            ? "pages/profile/profile.html"
            : "../profile/profile.html";

        window.location.replace(
            new URL(profilePath + window.location.search, window.location.href).href
        );
    }

    function mountVersionFooter() {
        const existing = document.querySelector(".app-version-footer");
        const html = `<span>Project Hub</span><span>v${APP_VERSION}</span><a class="uicons-credit" href="https://www.flaticon.com/uicons" target="_blank" rel="noopener">Uicons by Flaticon</a>`;
        if (existing) {
            existing.innerHTML = html;
            return;
        }

        const footer = document.createElement("footer");
        footer.className = "app-version-footer";
        footer.innerHTML = html;
        document.body.appendChild(footer);
    }

    function compareVersions(a, b) {
        const aa = String(a || "0").split(".").map(Number);
        const bb = String(b || "0").split(".").map(Number);
        for (let i = 0; i < 3; i++) {
            const x = Number.isFinite(aa[i]) ? aa[i] : 0;
            const y = Number.isFinite(bb[i]) ? bb[i] : 0;
            if (x !== y) return x - y;
        }
        return 0;
    }

    async function checkForAppUpdate() {
        try {
            const versionUrl = new URL("./version.json?ts=" + Date.now(), document.baseURI).href;
            const response = await fetch(versionUrl, {
                cache: "no-store",
                headers: { "Cache-Control": "no-cache" }
            });
            if (!response.ok) return;

            const remote = await response.json();
            const latestVersion = String(remote.version || "").trim();
            if (!latestVersion || compareVersions(latestVersion, APP_VERSION) <= 0) return;

            const noticeKey = "projectHubUpdateNotified:" + latestVersion;
            if (localStorage.getItem(noticeKey) === "1") return;

            localStorage.setItem(noticeKey, "1");

            const title = "Új Project Hub frissítés";
            const body = `Elérhető a Project Hub ${latestVersion} verziója. Frissítsd az oldalt az új funkciókhoz.`;
            const url = new URL("./index.html", document.baseURI).href;

            if (window.ProjectHubNotifications) {
                window.ProjectHubNotifications.addInboxNotification({
                    key: noticeKey,
                    type: "update",
                    title,
                    body,
                    detail: "Új alkalmazásverzió érhető el.",
                    url
                });

                if ("Notification" in window) {
                    try {
                        if (Notification.permission === "default") {
                            await window.ProjectHubNotifications.requestPermission();
                        }

                        if (
                            window.ProjectHubNotifications.getSettings().enabled &&
                            Notification.permission === "granted"
                        ) {
                            await window.ProjectHubNotifications.notify(title, {
                                body,
                                tag: "project-hub-update-" + latestVersion,
                                data: { url }
                            });
                        }
                    } catch (_) {
                        // Az Inbox értesítés ettől még megmarad.
                    }
                }
            } else if ("Notification" in window && Notification.permission === "granted") {
                const registration = "serviceWorker" in navigator
                    ? await navigator.serviceWorker.ready
                    : null;

                if (registration?.showNotification) {
                    await registration.showNotification(title, {
                        body,
                        icon: "./icons/icon-192.png",
                        badge: "./icons/icon-192.png",
                        tag: "project-hub-update-" + latestVersion,
                        data: { url }
                    });
                }
            }

            window.dispatchEvent(new CustomEvent("projecthub:update-available", {
                detail: { version: latestVersion, url }
            }));
        } catch (error) {
            console.warn("Automatikus verzióellenőrzés sikertelen:", error);
        }
    }

    function setupPullRefresh() {
        if (document.body.dataset.pullRefresh === "off") return;

        let startX = 0;
        let startY = 0;
        let pullDistance = 0;
        let pulling = false;
        let refreshAxisLocked = false;
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
            indicator.style.transform = "translateX(-50%) translateY(-100%)";
            indicator.style.top = "0";
            icon.innerHTML = '<i class="fi fi-br-arrow-down" aria-hidden="true"></i>';
            text.textContent = "Húzd le a frissítéshez";
            pullDistance = 0;
            pulling = false;
        }

        function updateIndicator(distance) {
            const clamped = Math.min(distance, 110);
            indicator.classList.add("visible");
            indicator.style.transform = "translateX(-50%) translateY(0)";
            indicator.style.top = Math.max(0, clamped - 48) + "px";

            if (distance >= PULL_THRESHOLD) {
                indicator.classList.add("ready");
                icon.innerHTML = '<i class="fi fi-br-arrow-up" aria-hidden="true"></i>';
                text.textContent = "Engedd el a frissítéshez";
            } else {
                indicator.classList.remove("ready");
                icon.innerHTML = '<i class="fi fi-br-arrow-down" aria-hidden="true"></i>';
                text.textContent = "Húzd le a frissítéshez";
            }
        }

        document.addEventListener("touchstart", function (event) {
            if (refreshing || window.scrollY > 0 || event.touches.length !== 1) return;
            if (event.target.closest(".side-menu, [role=dialog], input, textarea, select, button, a")) return;
            const touch = event.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            pullDistance = 0;
            refreshAxisLocked = false;
            pulling = true;
        }, { passive: true });

        document.addEventListener("touchmove", function (event) {
            if (!pulling || refreshing || window.scrollY > 0 || event.touches.length !== 1) return;
            const touch = event.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            if (!refreshAxisLocked && Math.max(Math.abs(dx), Math.abs(dy)) > AXIS_LOCK) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    resetIndicator();
                    return;
                }
                refreshAxisLocked = true;
            }

            if (dy <= 0) {
                resetIndicator();
                return;
            }
            event.preventDefault();
            pullDistance = dy;
            updateIndicator(pullDistance * 0.65);
        }, { passive: false });

        document.addEventListener("touchend", function () {
            if (!pulling || refreshing) return;

            if (pullDistance * 0.65 >= PULL_THRESHOLD) {
                refreshing = true;
                indicator.classList.add("visible", "refreshing");
                indicator.classList.remove("ready");
                indicator.style.transform = "translateX(-50%) translateY(0)";
                indicator.style.top = "0";
                icon.innerHTML = '<i class="fi fi-br-rotate-right" aria-hidden="true"></i>';
                text.textContent = "Frissítés...";
                window.setTimeout(function () { window.location.reload(); }, 250);
            } else {
                resetIndicator();
            }
        }, { passive: true });

        document.addEventListener("touchcancel", resetIndicator, { passive: true });
    }

    function setupMobileGestures() {
        const menuButton = document.getElementById("menuButton");
        const sideMenu = document.getElementById("sideMenu");
        const menuOverlay = document.getElementById("menuOverlay");
        const hasBackNavigation = !!document.querySelector(".games-back, .back-button");

        if (!menuButton && !hasBackNavigation) return;

        let startX = 0;
        let startY = 0;
        let tracking = false;

        document.addEventListener("touchstart", function (event) {
            if (event.touches.length !== 1) return;
            const touch = event.touches[0];
            const width = window.innerWidth;
            const menuOpen = sideMenu && sideMenu.classList.contains("open");
            const menuWidth = sideMenu ? Math.min(width * 0.88, 340) : 0;
            const canOpenMenu = !!menuButton && touch.clientX >= width - EDGE_ZONE;
            const canCloseMenu = menuOpen && touch.clientX >= width - menuWidth - 12;
            const canGoBack = hasBackNavigation && touch.clientX <= EDGE_ZONE && !menuOpen;

            tracking = canOpenMenu || canCloseMenu || canGoBack;
            if (!tracking) return;
            startX = touch.clientX;
            startY = touch.clientY;
        }, { passive: true });

        document.addEventListener("touchend", function (event) {
            if (!tracking || event.changedTouches.length !== 1) return;
            tracking = false;

            const touch = event.changedTouches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            if (Math.abs(dx) < EDGE_SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.15) return;

            const width = window.innerWidth;
            const menuOpen = sideMenu && sideMenu.classList.contains("open");

            if (menuOpen && dx > 0 && startX >= width - Math.min(width * 0.88, 340) - 12) {
                menuOverlay?.click();
                return;
            }

            if (!menuOpen && menuButton && startX >= width - EDGE_ZONE && dx < 0) {
                menuButton.click();
                return;
            }

            if (!menuOpen && hasBackNavigation && startX <= EDGE_ZONE && dx > 0) {
                const back = document.querySelector(".games-back, .back-button");
                if (back) back.click();
            }
        }, { passive: true });

        document.addEventListener("touchcancel", function () {
            tracking = false;
        }, { passive: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            handleSteamCallbackRedirect();
            mountVersionFooter();
            setupPullRefresh();
            setupMobileGestures();
            checkForAppUpdate();
        }, { once: true });
    } else {
        handleSteamCallbackRedirect();
        mountVersionFooter();
        setupPullRefresh();
        setupMobileGestures();
        checkForAppUpdate();
    }
})();
