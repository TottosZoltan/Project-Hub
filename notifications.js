/* Project Hub — notification helpers (1.7) */
(function () {
    "use strict";

    const SETTINGS_KEY = "projectHubNotificationSettings";

    const DEFAULTS = {
        enabled: false,
        taskReminders: true,
        reminderMinutes: 30
    };

    function getSettings() {
        try {
            return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
        } catch (_) {
            return Object.assign({}, DEFAULTS);
        }
    }

    function saveSettings(patch) {
        const next = Object.assign({}, getSettings(), patch || {});
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
        return next;
    }

    async function requestPermission() {
        if (!("Notification" in window)) {
            throw new Error("Ez a böngésző nem támogatja az értesítéseket.");
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            saveSettings({ enabled: false });
            throw new Error("Az értesítések engedélyezése szükséges.");
        }
        saveSettings({ enabled: true });
        return permission;
    }

    function notify(title, options) {
        const settings = getSettings();
        if (!settings.enabled || !("Notification" in window) || Notification.permission !== "granted") {
            return false;
        }
        try {
            const n = new Notification(title, Object.assign({
                icon: "/Project-Hub/icons/icon-192.png",
                badge: "/Project-Hub/icons/icon-192.png"
            }, options || {}));
            n.onclick = function () {
                window.focus();
                n.close();
            };
            return true;
        } catch (_) {
            return false;
        }
    }

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return null;
        try {
            return await navigator.serviceWorker.register("./sw.js", { scope: "./" });
        } catch (error) {
            console.warn("Service worker regisztráció sikertelen:", error);
            return null;
        }
    }

    window.ProjectHubNotifications = {
        DEFAULTS,
        getSettings,
        saveSettings,
        requestPermission,
        notify,
        registerServiceWorker
    };

    document.addEventListener("DOMContentLoaded", function () {
        registerServiceWorker();
    });
})();