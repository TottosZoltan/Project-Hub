/* Project Hub 1.5 — Áttekintés statisztikák */
(function () {
    "use strict";

    const BACKEND_URL = "https://project-hub-backend-1.onrender.com";
    const TOKEN_KEY = "projectHubAuthToken";

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
        if (el) el.textContent = Number.isFinite(value) ? String(value) : "0";
    }

    async function loadOverviewStats() {
        const status = document.getElementById("overviewStatsStatus");
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) return;

        try {
            const results = await Promise.allSettled([
                getJson("/api/tasks"),
                getJson("/api/notes"),
                getJson("/api/steam/games"),
                getJson("/api/library/games")
            ]);

            const tasks = results[0].status === "fulfilled" && Array.isArray(results[0].value.tasks)
                ? results[0].value.tasks.length : 0;
            const notes = results[1].status === "fulfilled" && Array.isArray(results[1].value.notes)
                ? results[1].value.notes.length : 0;
            const steamGames = results[2].status === "fulfilled" && Array.isArray(results[2].value.games)
                ? results[2].value.games.length : 0;
            const customGames = results[3].status === "fulfilled" && Array.isArray(results[3].value.games)
                ? results[3].value.games.length : 0;

            setCount("taskCount", tasks);
            setCount("noteCount", notes);
            setCount("gameCount", steamGames + customGames);

            if (status) status.textContent = "Frissítve";
        } catch (error) {
            console.warn("Project Hub overview stats:", error);
            if (status) status.textContent = "Nem sikerült frissíteni";
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadOverviewStats, { once: true });
    } else {
        loadOverviewStats();
    }
})();
