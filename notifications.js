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

    async function notify(title, options) {
        const settings = getSettings();
        if (!settings.enabled || !("Notification" in window) || Notification.permission !== "granted") {
            return false;
        }

        const payload = Object.assign({
            icon: "/Project-Hub/icons/icon-192.png",
            badge: "/Project-Hub/icons/icon-192.png"
        }, options || {});

        try {
            if ("serviceWorker" in navigator) {
                const registration = await navigator.serviceWorker.ready;
                if (registration && registration.showNotification) {
                    await registration.showNotification(title, payload);
                    return true;
                }
            }
        } catch (_) {}

        try {
            const n = new Notification(title, payload);
            n.onclick = function () {
                window.focus();
                n.close();
            };
            return true;
        } catch (_) {
            return false;
        }
    }

    function getAuthToken() {
        return localStorage.getItem("projectHubAuthToken");
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
        const rawData = atob(base64);
        return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    }

    async function ensurePushSubscription() {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
            throw new Error("A háttérértesítések nem támogatottak ezen az eszközön.");
        }
        const token = getAuthToken();
        if (!token) throw new Error("Bejelentkezés szükséges.");

        const response = await fetch("https://project-hub-backend-1.onrender.com/api/notifications/vapid-public-key", { cache: "no-store" });
        const config = await response.json();
        if (!response.ok || !config.publicKey) throw new Error(config.message || "A háttérértesítések még nincsenek beállítva.");

        const registration = await registerServiceWorker();
        if (!registration) throw new Error("A service worker nem indítható el.");

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(config.publicKey)
            });
        }

        const saveResponse = await fetch("https://project-hub-backend-1.onrender.com/api/notifications/subscribe", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({ subscription: subscription.toJSON() })
        });
        const result = await saveResponse.json();
        if (!saveResponse.ok || !result.success) throw new Error(result.message || "A push kapcsolat mentése sikertelen.");

        saveSettings({ enabled: true, pushEnabled: true });
        return subscription;
    }

    async function disablePushSubscription() {
        const token = getAuthToken();
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            saveSettings({ enabled: false, pushEnabled: false });
            return;
        }
        try {
            if (token) {
                await fetch("https://project-hub-backend-1.onrender.com/api/notifications/subscribe", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint })
                });
            }
        } finally {
            await subscription.unsubscribe().catch(() => {});
            saveSettings({ enabled: false, pushEnabled: false });
        }
    }

    async function scheduleDelayedPushTest() {
        const token = getAuthToken();
        if (!token) throw new Error("Bejelentkezés szükséges.");
        const response = await fetch("https://project-hub-backend-1.onrender.com/api/notifications/test-push-delayed", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token }
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "A késleltetett teszt sikertelen.");
        return result;
    }

    async function sendServerPushTest() {
        const token = getAuthToken();
        if (!token) throw new Error("Bejelentkezés szükséges.");
        const response = await fetch("https://project-hub-backend-1.onrender.com/api/notifications/test-push", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token }
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "A push teszt sikertelen.");
        return result;
    }

    async function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return null;
        try {
            return await navigator.serviceWorker.register("/Project-Hub/sw.js", { scope: "/Project-Hub/" });
        } catch (error) {
            console.warn("Service worker regisztráció sikertelen:", error);
            return null;
        }
    }

    const INBOX_KEY = "projectHubInboxNotifications";

    function getInbox() {
        try {
            const items = JSON.parse(localStorage.getItem(INBOX_KEY) || "[]");
            return Array.isArray(items) ? items : [];
        } catch (_) {
            return [];
        }
    }

    function saveInbox(items) {
        localStorage.setItem(INBOX_KEY, JSON.stringify(items.slice(0, 100)));
    }

    function addInboxNotification(item) {
        const next = Object.assign({
            id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            createdAt: new Date().toISOString(),
            read: false,
            type: "general"
        }, item || {});
        const items = getInbox();
        if (next.key && items.some(function (item) { return item.key === next.key; })) return items;
        items.unshift(next);
        saveInbox(items);
        return items;
    }

    function markInboxRead(id) {
        saveInbox(getInbox().map(function (item) {
            return item.id === id ? Object.assign({}, item, { read: true }) : item;
        }));
    }

    function markAllInboxRead() {
        saveInbox(getInbox().map(function (item) {
            return Object.assign({}, item, { read: true });
        }));
    }

    function clearInbox() {
        saveInbox([]);
    }

    async function sendTestNotification() {
        const testItem = addInboxNotification({
            key: "test:" + Date.now(),
            type: "test",
            title: "Teszt értesítés",
            body: "Ha ezt látod, az alkalmazáson belüli értesítések működnek.",
            detail: "Project Hub értesítési teszt"
        });
        updateInboxBadges();
        let browserShown = false;
        let browserReason = "";
        try {
            if (Notification.permission !== "granted") {
                await requestPermission();
            }
            browserShown = await notify("Project Hub — teszt", {
                body: "A böngészős értesítés is működik.",
                tag: "project-hub-test",
                requireInteraction: false,
                data: { url: "/Project-Hub/pages/notifications/notifications.html" }
            });
            if (!browserShown) browserReason = "A böngészős értesítést a rendszer nem jelenítette meg, de az Inbox teszt létrejött.";
        } catch (error) {
            browserReason = error?.message || "A böngészős értesítés nem volt engedélyezhető.";
        }
        return { inbox: !!testItem, browser: browserShown, browserReason };
    }

    window.ProjectHubNotifications = {
        DEFAULTS,
        getSettings,
        saveSettings,
        requestPermission,
        notify,
        registerServiceWorker,
        ensurePushSubscription,
        disablePushSubscription,
        sendServerPushTest,
        scheduleDelayedPushTest,
        getInbox,
        addInboxNotification,
        markInboxRead,
        markAllInboxRead,
        clearInbox,
        sendTestNotification
    };

    function updateInboxBadges() {
        const unread = getInbox().filter(function (item) { return !item.read; }).length;
        document.querySelectorAll("#inboxUnreadBadge, #homeInboxUnread").forEach(function (badge) {
            badge.textContent = unread;
            badge.hidden = unread === 0;
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        registerServiceWorker();
        updateInboxBadges();
    });

    window.addEventListener("storage", updateInboxBadges);
})();