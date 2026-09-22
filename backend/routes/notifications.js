const express = require("express");
const { pool } = require("../database");
const { getAuthenticatedTasksUser } = require("../middleware/auth");
const { isPushConfigured, sendPushToUser, VAPID_PUBLIC_KEY } = require("../services/push");

const router = express.Router();

router.get("/api/notifications/vapid-public-key", function (req, res) {
    if (!isPushConfigured()) {
        return res.status(503).json({ success: false, configured: false, message: "A háttérértesítések még nincsenek konfigurálva." });
    }
    return res.json({ success: true, configured: true, publicKey: VAPID_PUBLIC_KEY });
});

router.post("/api/notifications/subscribe", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        if (!isPushConfigured()) return res.status(503).json({ success: false, message: "A háttérértesítések még nincsenek konfigurálva." });

        const subscription = req.body?.subscription;
        const endpoint = subscription?.endpoint;
        const p256dh = subscription?.keys?.p256dh;
        const auth = subscription?.keys?.auth;
        if (!endpoint || !p256dh || !auth) return res.status(400).json({ success: false, message: "Érvénytelen push subscription." });

        await pool.query(`
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (endpoint) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                p256dh = EXCLUDED.p256dh,
                auth = EXCLUDED.auth,
                updated_at = CURRENT_TIMESTAMP
        `, [user.id, endpoint, p256dh, auth]);

        return res.json({ success: true });
    } catch (error) {
        console.error("PUSH SUBSCRIBE HIBA:", error);
        return res.status(500).json({ success: false, message: "Nem sikerült menteni az értesítési kapcsolatot." });
    }
});

router.delete("/api/notifications/subscribe", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        const endpoint = String(req.body?.endpoint || "").trim();
        if (!endpoint) return res.status(400).json({ success: false, message: "Hiányzó subscription endpoint." });
        await pool.query("DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2", [user.id, endpoint]);
        return res.json({ success: true });
    } catch (error) {
        console.error("PUSH UNSUBSCRIBE HIBA:", error);
        return res.status(500).json({ success: false, message: "Nem sikerült törölni az értesítési kapcsolatot." });
    }
});

router.post("/api/notifications/test-push", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        const result = await sendPushToUser(user.id, {
            title: "Project Hub — teszt",
            body: "A háttérben futó értesítések működnek.",
            url: "/Project-Hub/pages/notifications/notifications.html",
            tag: "project-hub-test-" + Date.now()
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error("PUSH TEST HIBA:", error);
        return res.status(500).json({ success: false, message: "A push teszt sikertelen." });
    }
});

router.post("/api/notifications/test-push-delayed", async function (req, res) {
    try {
        const user = await getAuthenticatedTasksUser(req);
        if (!user) return res.status(401).json({ success: false, message: "Érvényes bejelentkezés szükséges." });
        if (!isPushConfigured()) return res.status(503).json({ success: false, message: "A háttérértesítések még nincsenek konfigurálva." });

        const result = await pool.query(`
            UPDATE push_subscriptions
            SET test_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '1 minute',
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            RETURNING id
        `, [user.id]);

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Előbb engedélyezd az értesítéseket." });
        }

        return res.json({ success: true, delaySeconds: 60 });
    } catch (error) {
        console.error("KÉSLELTETETT PUSH TESZT HIBA:", error);
        return res.status(500).json({ success: false, message: "A késleltetett teszt beállítása sikertelen." });
    }
});

module.exports = router;
