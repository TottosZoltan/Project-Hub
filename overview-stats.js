/* Project Hub 1.5.1 — élő áttekintés statisztikák */
(function () {
    "use strict";

    const BACKEND_URL = "https://project-hub-backend-1.onrender.com";
    const TOKEN_KEY = "projectHubAuthToken";
    const REFRESH_MS = 30000;

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

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    }

    function setProgress(percent) {
        const value = Math.max(0, Math.min(100, Math.round(percent)));
        setText("taskProgress", value + "%");
        const bar = document.getElementById("taskProgressBar");
        if (bar) bar.style.width = value + "%";
    }

    async function loadOverviewStats() {
        const status = document.getElementById("overviewStatsStatus");
        if (!localStorage.getItem(TOKEN_KEY)) return;

        try {
            const results = await Promise.allSettled([
                getJson("/api/tasks"),
                getJson("/api/notes"),
                getJson("/api/steam/games"),
                getJson("/api/library/games"),
                getJson("/api/places")
            ]);

            const tasks = results[0].status === "fulfilled" && Array.isArray(results[0].value.tasks) ? results[0].value.tasks : [];
            const notes = results[1].status === "fulfilled" && Array.isArray(results[1].value.notes) ? results[1].value.notes : [];
            const steamGames = results[2].status === "fulfilled" && Array.isArray(results[2].value.games) ? results[2].value.games : [];
            const customGames = results[3].status === "fulfilled" && Array.isArray(results[3].value.games) ? results[3].value.games : [];
            const places = results[4].status === "fulfilled" && Array.isArray(results[4].value.places) ? results[4].value.places : [];

            const completed = tasks.filter(task => task.completed === true || task.completed === 1 || task.completed === "true").length;
            const progress = tasks.length ? (completed / tasks.length) * 100 : 0;

            setText("taskCount", tasks.length);
            setText("noteCount", notes.length);
            setText("gameCount", steamGames.length + customGames.length);
            setText("placeCount", places.length);
            setProgress(progress);
            if (status) status.textContent = "Élő adatok · frissítve";
        } catch (error) {
            console.warn("Project Hub overview stats:", error);
            if (status) status.textContent = "Részleges adatok";
        }
    }

    function start() {
        loadOverviewStats();
        window.setInterval(loadOverviewStats, REFRESH_MS);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
})();
