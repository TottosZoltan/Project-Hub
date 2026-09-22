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