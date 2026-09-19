/* Project Hub 1.5.0.0 — Áttekintés élő statisztikák */
(function () {
    "use strict";

    const BACKEND_URL = "https://project-hub-backend-1.onrender.com";
    const TOKEN_KEY = "projectHubAuthToken";
    const REFRESH_MS = 30000;
    let refreshTimer = null;

    function authHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        return token ? { Authorization: "Bearer " + token } : {};
    }

    async function getJson(path) {
        const response = await fetch(BACKEND_URL + path, {
            method: "GET",
            headers: authHeaders(),
            credentials: "include"
        });
        if (!response.ok) throw new Error("API " + response.status);
        return response.json();
    }

    function setCount(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(Number.isFinite(value) ? value : 0);
    }

    function updateProgress(total, completed) {
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const percentEl = document.getElementById("overviewProgressPercent");
        const textEl = document.getElementById("overviewProgressText");
        const barEl = document.getElementById("overviewProgressBar");
        const track = barEl ? barEl.parentElement : null;

        if (percentEl) percentEl.textContent = percent + "%";
        if (textEl) textEl.textContent = total > 0
            ? `${completed} / ${total} feladat kész`
            : "Még nincs feladat a készültség méréséhez.";
        if (barEl) barEl.style.width = percent + "%";
        if (track) track.setAttribute("aria-valuenow", String(percent));
    }

    async function loadOverviewStats() {
        const status = document.getElementById("overviewStatsStatus");
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            if (status) status.textContent = "Bejelentkezés szükséges";
            return;
        }

        try {
            const results = await Promise.allSettled([
                getJson("/api/tasks"),
                getJson("/api/notes"),
                getJson("/api/steam/games"),
                getJson("/api/library/games"),
                getJson("/api/places")
            ]);

            const data = results.map((result) => result.status === "fulfilled" ? result.value : null);
            const tasks = Array.isArray(data[0]?.tasks) ? data[0].tasks : [];
            const notes = Array.isArray(data[1]?.notes) ? data[1].notes : [];
            const steamGames = Array.isArray(data[2]?.games) ? data[2].games : [];
            const customGames = Array.isArray(data[3]?.games) ? data[3].games : [];
            const places = Array.isArray(data[4]?.places) ? data[4].places : [];

            const completedTasks = tasks.filter((task) => task && task.completed === true).length;
            const activeTasks = Math.max(tasks.length - completedTasks, 0);

            setCount("taskCount", activeTasks);
            setCount("noteCount", notes.length);
            setCount("gameCount", steamGames.length + customGames.length);
            setCount("placeCount", places.length);
            updateProgress(tasks.length, completedTasks);

            const failed = results.filter((result) => result.status === "rejected").length;
            if (status) status.textContent = failed ? "Részben frissítve" : "Élő adatok · frissítve";
        } catch (error) {
            console.warn("Project Hub overview stats:", error);
            if (status) status.textContent = "Nem sikerült frissíteni";
        }
    }

    function scheduleRefresh() {
        if (refreshTimer) clearInterval(refreshTimer);
        refreshTimer = setInterval(() => {
            if (!document.hidden) loadOverviewStats();
        }, REFRESH_MS);
    }

    function init() {
        loadOverviewStats();
        scheduleRefresh();
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) loadOverviewStats();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
